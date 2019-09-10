import { Message, util } from "protobufjs/light";
import shuffle from "shuffle-array";
import { sprintf } from "sprintf-js";
import Log from "../log";
import { Roster } from "./proto";
import { BrowserWebSocketAdapter, WebSocketAdapter } from "./websocket-adapter";

let factory: (path: string) => WebSocketAdapter = (path: string) => new BrowserWebSocketAdapter(path);

/**
 * Set the websocket generator. The default one is compatible
 * with browsers and nodejs.
 * @param generator A function taking a path and creating a websocket adapter instance
 */
export function setFactory(generator: (path: string) => WebSocketAdapter): void {
    factory = generator;
}

/**
 * A connection allows to send a message to one or more distant peer
 */
export interface IConnection {
    /**
     * Send a message to the distant peer
     * @param message   Protobuf compatible message
     * @param reply     Protobuf type of the reply
     * @returns a promise resolving with the reply on success, rejecting otherwise
     */
    send<T extends Message>(message: Message, reply: typeof Message): Promise<T>;

    /**
     * Get the complete distant address
     * @returns the address as a string
     */
    getURL(): string;

    /**
     * Set the timeout value for new connections
     * @param value Timeout in milliseconds
     */
    setTimeout(value: number): void;
}

/**
 * Single peer connection
 */
export class WebSocketConnection implements IConnection {
    private readonly url: string;
    private readonly service: string;
    private timeout: number;

    /**
     * @param addr      Address of the distant peer
     * @param service   Name of the service to reach
     */
    constructor(addr: string, service: string) {
        this.url = addr;
        this.service = service;
        this.timeout = 30 * 1000; // 30s by default
    }

    /** @inheritdoc */
    getURL(): string {
        return this.url;
    }

    /** @inheritdoc */
    setTimeout(value: number): void {
        this.timeout = value;
    }

    /** @inheritdoc */
    async send<T extends Message>(message: Message, reply: typeof Message): Promise<T> {
        if (!message.$type) {
            return Promise.reject(new Error(`message "${message.constructor.name}" is not registered`));
        }

        if (!reply.$type) {
            return Promise.reject(new Error(`message "${reply}" is not registered`));
        }

        return new Promise((resolve, reject) => {
            const path = this.url + "/" + this.service + "/" + message.$type.name.replace(/.*\./, "");
            Log.lvl4(`Socket: new WebSocket(${path})`);
            const ws = factory(path);
            const bytes = Buffer.from(message.$type.encode(message).finish());

            const timer = setTimeout(() => ws.close(1000, "timeout"), this.timeout);

            ws.onOpen(() => ws.send(bytes));

            ws.onMessage((data: Buffer) => {
                clearTimeout(timer);
                const buf = Buffer.from(data);
                Log.lvl4("Getting message with length:", buf.length);

                try {
                    const ret = reply.decode(buf) as T;

                    resolve(ret);
                } catch (err) {
                    if (err instanceof util.ProtocolError) {
                        reject(err);
                    } else {
                        reject(
                            new Error(`Error when trying to decode the message "${reply.$type.name}": ${err.message}`),
                        );
                    }
                }

                ws.close(1000);
            });

            ws.onClose((code: number, reason: string) => {
                // nativescript-websocket on iOS doesn't return error-code 1002 in case of error, but sets the 'reason'
                // to non-null in case of error.
                if (code !== 1000 || reason) {
                    reject(new Error(reason));
                }
            });

            ws.onError((err: Error) => {
                clearTimeout(timer);

                reject(new Error("error in websocket " + path + ": " + err));
            });
        });
    }
}

/**
 * Multi peer connection that tries all nodes one after another. It can send the command to more
 * than one node in parallel and return the first success if 'parallel' i > 1.
 */
export class RosterWSConnection {
    static totalConnNbr = 0;
    private static nodes: Map<string, Nodes> = new Map<string, Nodes>();
    nodes: Nodes;
    private readonly connNbr: number;
    private msgNbr = 0;

    /**
     * @param r         The roster to use
     * @param service   The name of the service to reach
     * @param parallel how many nodes to contact in parallel
     */
    constructor(r: Roster, private service: string, parallel: number = 2) {
        if (parallel < 1) {
            throw new Error("parallel must be >= 1");
        }
        const rID = r.id.toString("hex");
        if (!RosterWSConnection.nodes.has(rID)) {
            RosterWSConnection.nodes.set(rID, new Nodes(r, parallel));
        }
        this.nodes = RosterWSConnection.nodes.get(rID);
        this.connNbr = RosterWSConnection.totalConnNbr;
        RosterWSConnection.totalConnNbr++;
        // Upon failure of a connection, it is pushed to the end of the connectionsPool, and a
        // new connection is taken from the beginning of the connectionsPool.
    }

    /**
     * Sends a message to conodes in parallel. As soon as one of the conodes returns
     * success, the message is returned. If a conode returns an error (or times out),
     * a next conode from this.addresses is contacted. If all conodes return an error,
     * the promise is rejected.
     *
     * @param message the message to send
     * @param reply the type of the message to return
     */
    async send<T extends Message>(message: Message, reply: typeof Message): Promise<T> {
        const errors: string[] = [];
        const msgNbr = this.msgNbr;
        this.msgNbr++;
        const list = this.nodes.newList(this.service);
        const pool = list.active;

        Log.lvl3(sprintf("%d/%d", this.connNbr, msgNbr), "sending", message.constructor.name, "with list:",
            pool.map((conn) => conn.getURL()));

        // Get the first reply - need to take care not to return a reject too soon, else
        // all other promises will be ignored.
        // The promises that never 'resolve' or 'reject' will later be collected by GC:
        // https://stackoverflow.com/questions/36734900/what-happens-if-we-dont-resolve-or-reject-the-promise
        return Promise.race(pool.map((conn) => {
            return new Promise<T>(async (resolve, reject) => {
                do {
                    const idStr = sprintf("%d/%d: %s - ", this.connNbr, msgNbr.toString(), conn.getURL());
                    try {
                        Log.lvl3(idStr, "sending");
                        const sub = await conn.send(message, reply);
                        Log.lvl3(idStr, "received OK");

                        if (list.done(conn) === 0) {
                            Log.lvl3(idStr, "first to receive");
                            resolve(sub as T);
                        }
                        return;
                    } catch (e) {
                        Log.lvl3(idStr, "has error", e);
                        errors.push(e);
                        conn = list.replace(conn);
                        if (errors.length >= list.length / 2) {
                            // It's the last connection that also threw an error, so let's quit
                            reject(errors);
                            conn = undefined;
                        }
                    }
                } while (conn !== undefined);
            });
        }));
    }

    /**
     * To be conform with an IConnection
     */
    getURL(): string {
        return this.nodes.newList(this.service).active[0].getURL();
    }

    /**
     * To be conform with an IConnection - sets the timeout on all connections.
     */
    setTimeout(value: number) {
        this.nodes.setTimeout(value);
    }
}

/**
 * Single peer connection that reaches only the leader of the roster
 */
export class LeaderConnection extends WebSocketConnection {
    /**
     * @param roster    The roster to use
     * @param service   The name of the service
     */
    constructor(roster: Roster, service: string) {
        if (roster.list.length === 0) {
            throw new Error("Roster should have at least one node");
        }

        super(roster.list[0].address, service);
    }
}

/**
 * Nodes holds all nodes for all services in two lists - one active for the number of
 * parallel open connections, and one pool for connections that can take over if the
 * active list fails.
 */
export class Nodes {

    /**
     * Returns the number of nodes currently in the active queue.
     */
    get parallel(): number {
        return this._parallel;
    }

    /**
     * Resets the number of active connections
     * @param p active connections
     */
    set parallel(p: number) {
        if (Nodes.parallel > 0) {
            p = Nodes.parallel;
        }
        if (p > this.addresses.length) {
            this._parallel = this.addresses.length;
        } else if (p > 0) {
            this._parallel = p;
        }
        while (this._parallel > this.active.length) {
            this.active.push(this.reserve.shift());
        }
        while (this._parallel < this.active.length) {
            this.reserve.push(this.active.pop());
        }
    }
    // This can be set from the outside to enforce a number of parallel requests. If it
    // is > 0, it will be enforced.
    static parallel: number = 0;
    private readonly addresses: string[];
    // to the slowest node.
    private readonly active: Node[] = [];
    // is the one that was not used for the longest time.
    private readonly reserve: Node[];
    // Pool of available connections that are not in the active connections. The first node

    // Current number of nodes in the active queue.
    private _parallel;
    // Holds the fastest connections for 'parallel' nodes. They are sorted from the fastest

    constructor(r: Roster, parallel: number = 3) {
        this.addresses = r.list.map((conode) => conode.getWebSocketAddress());
        shuffle(this.addresses);
        // Initialize the pool of connections
        this.reserve = this.addresses.map((addr) => new Node(addr));
        this.parallel = parallel;
    }

    /**
     * Creates a new NodeList for one message.
     * @param service
     */
    newList(service: string): NodeList {
        if (Nodes.parallel > 0) {
            this.parallel = Nodes.parallel;
        }
        return new NodeList(this, service, this.active.slice(), this.reserve.slice());
    }

    /**
     * Marks the node of the given address as having an error. The error must be
     * a websocket-error 1001 or higher. An error in the request itself (refused
     * transaction) should be treated as a passing node.
     * @param address
     */
    gotError(address: string) {
        this.replaceActive(this.index(address));
    }

    /**
     * Marks the node with the given address as having successfully treated the
     * message. It will re-order the nodes to reflect order of arrival. If the
     * node is more than 10x slower than the fastest node, it will be replaced
     * with a node from the reserve queue.
     * @param address node with successful return
     * @param rang order of arrival
     * @param ratio delay in answer between first reply and this reply
     */
    done(address: string, rang: number, ratio: number) {
        const index = this.index(address);
        if (index >= 0) {
            if (ratio >= 10) {
                this.replaceActive(index);
            } else {
                this.swapActive(index, rang);
            }
        }
    }

    /**
     * Sets the timeout on all nodes.
     * @param t
     */
    setTimeout(t: number) {
        this.active.concat(this.reserve).forEach((n) => n.setTimeout(t));
    }

    /**
     * Replaces the given node from the active queue with the first node from
     * the reserve queue.
     * @param index
     */
    private replaceActive(index: number) {
        if (index >= 0) {
            this.reserve.push(this.active.splice(index, 1)[0]);
            this.active.push(this.reserve.shift());
        }
    }

    /**
     * Swaps two nodes in the active queue.
     * @param a
     * @param b
     */
    private swapActive(a: number, b: number) {
        if (a >= 0 && b >= 0 &&
            a < this.active.length && b < this.active.length) {
            [this.active[a], this.active[b]] =
                [this.active[b], this.active[a]];
        } else {
            Log.error("asked to swap", a, b, this.active.length);
        }
    }

    /**
     * Gets the index of a given address.
     * @param address
     */
    private index(address: string): number {
        return this.active.findIndex((c) => {
            return c.address === address;
        });
    }
}

/**
 * A Node holds one WebSocketConnection per service.
 */
export class Node {
    private services: Map<string, WebSocketConnection> = new Map<string, WebSocketConnection>();

    constructor(readonly address) {
    }

    /**
     * Returns a WebSocketConnection for a given service. If the
     * connection doesn't exist yet, it will be created.
     * @param name
     */
    getService(name: string): WebSocketConnection {
        if (this.services.has(name)) {
            return this.services.get(name);
        }
        this.services.set(name, new WebSocketConnection(this.address, name));
        return this.getService(name);
    }

    /**
     * Sets the timeout for all connections of this node.
     */
    setTimeout(t: number) {
        this.services.forEach((conn) => conn.setTimeout(t));
    }
}

/**
 * A NodeList is used to interact with the Nodes-class by allowing
 * the requester to indicate the order of arrival of messages and
 * which nodes didn't reply correctly.
 */
export class NodeList {
    readonly active: WebSocketConnection[];
    private reserve: WebSocketConnection[];
    private readonly start: number;
    private first: number;
    private replied: number = 0;

    constructor(private nodes: Nodes, service: string, active: Node[], reserve: Node[]) {
        this.start = Date.now();
        this.active = active.map((a) => a.getService(service));
        this.reserve = reserve.map((r) => r.getService(service));
    }

    /**
     * Returns the total number of nodes.
     */
    get length(): number {
        return this.active.length + this.reserve.length;
    }

    /**
     * Replaces the given node with a fresh one. Only to be called in case of websocket-error
     * 1001 or higher.
     * @param ws
     */
    replace(ws: WebSocketConnection): WebSocketConnection | undefined {
        this.nodes.gotError(ws.getURL());
        if (this.replied === 0) {
            return this.reserve.pop();
        }
        return undefined;
    }

    /**
     * Indicates that this node has successfully finished its job.
     * @param ws
     */
    done(ws: WebSocketConnection): number {
        const delay = Date.now() - this.start;
        if (this.replied === 0) {
            this.first = delay;
        }
        this.nodes.done(ws.getURL(), this.replied, delay / this.first);
        return this.replied++;
    }
}
