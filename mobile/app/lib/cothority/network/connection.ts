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
    private readonly connNbr: number;
    private msgNbr = 0;
    private readonly addresses: string[];
    private readonly connectionsActive: WebSocketConnection[];
    private connectionsPool: WebSocketConnection[];

    /**
     * @param r         The roster to use
     * @param service   The name of the service to reach
     * @param parallel how many nodes to contact in parallel
     */
    constructor(r: Roster, private service: string, parallel: number = 3) {
        if (parallel < 1) {
            throw new Error("parallel must be >= 1");
        }
        if (parallel > r.list.length) {
            parallel = r.list.length;
        }
        this.addresses = r.list.map((conode) => conode.getWebSocketAddress());
        shuffle(this.addresses);
        // Initialize the pool of connections
        this.connectionsPool = this.addresses.map((addr) => new WebSocketConnection(addr, service));
        // And take the first 'parallel' connections
        this.connectionsActive = this.connectionsPool.splice(0, parallel);
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
        let rotate = this.addresses.length - this.connectionsActive.length;
        const msgNbr = this.msgNbr;
        this.msgNbr++;
        const start = Date.now();
        let first = start;
        let order = 0;

        Log.lvl3(sprintf("%d/%d", this.connNbr, msgNbr), "sending", message.constructor.name, "with list:",
            this.connectionsActive.map((conn) => conn.getURL()));

        // Get the first reply - need to take care not to return a reject too soon, else
        // all other promises will be ignored.
        // The promises that never 'resolve' or 'reject' will later be collected by GC:
        // https://stackoverflow.com/questions/36734900/what-happens-if-we-dont-resolve-or-reject-the-promise
        return Promise.race(this.connectionsActive.map((_, i) => {
            return new Promise<T>(async (resolve, reject) => {
                do {
                    const conn = this.connectionsActive[i];
                    const idStr = sprintf("%d/%d: %s - ", this.connNbr, msgNbr.toString(), conn.getURL());
                    try {
                        Log.lvl3(idStr, "sending");
                        const sub = await conn.send(message, reply);
                        const rcvd = Date.now();
                        Log.lvl3(idStr, "received in position", order, "after:", rcvd - start);

                        // Signal to other connections that have an error that they don't need
                        // to retry.
                        if (rotate >= 0) {
                            first = rcvd;
                            rotate = -1;
                        }
                        this.updateOrder(conn, order, (rcvd - start) / (first - start), idStr);
                        order++;

                        if (order === 1) {
                            Log.lvl3(idStr, "first to receive");
                            resolve(sub as T);
                        }
                    } catch (e) {
                        Log.lvl3(idStr, "has error", e);
                        this.updateOrder(conn, 0, 0, idStr, true);
                        errors.push(e);
                        if (errors.length === this.addresses.length) {
                            // It's the last connection that also threw an error, so let's quit
                            reject(errors);
                        }
                        rotate--;
                        if (rotate >= 0) {
                            // Take the oldest connection that hasn't been used yet
                            this.rotatePool(i);
                        }
                    }
                } while (rotate >= 0);
            });
        }));
    }

    /**
     * To be conform with an IConnection
     */
    getURL(): string {
        return this.connectionsActive[0].getURL();
    }

    /**
     * To be conform with an IConnection - sets the timeout on all connections.
     */
    setTimeout(value: number) {
        this.connectionsPool.forEach((conn) => {
            conn.setTimeout(value);
        });
        this.connectionsActive.forEach((conn) => {
            conn.setTimeout(value);
        });
    }

    /**
     * Updates the order of the nodes, according to the incoming messages. Supposes that the messages
     * are valid.
     *
     * @param conn the connection that received the message
     * @param order the order the message has been received
     * @param diff quotient of the time it took divided by the fastest time
     * @param dbg a debug string to prepend to all outputs
     * @param err if it is an error
     */
    private updateOrder(conn: WebSocketConnection, order: number, diff: number, dbg: string, err?: boolean) {
        // Replace in the connectionsActive array according to the order the message was
        // received
        if (this.connectionsActive.length > 1) {
            const pos = this.connectionsActive.indexOf(conn);
            if (pos === -1) {
                Log.lvl3(dbg, "is not in list anymore");
            } else {
                if (!err) {
                    Log.lvl3(dbg, "switching", pos, "and", order);
                    [this.connectionsActive[pos], this.connectionsActive[order]] =
                        [this.connectionsActive[order], this.connectionsActive[pos]];
                }
                if (diff > 10 || err) {
                    Log.lvl3(dbg, "rotating out: was really late or had error:", err);
                    this.rotatePool(pos);
                }
                Log.lvl3(dbg, "list:", this.connectionsActive.map((c) => c.getURL()));
            }
        }
    }

    /**
     * Puts the given element in the list of active nodes to the end of the pool, and replaces
     * it with the first element of the pool, thus rotating an element of the active list with
     * the pool.
     *
     * @param index
     */
    private rotatePool(index: number) {
        if (this.connectionsPool.length === 0) {
            return;
        }
        Log.lvl3("Replacing", index, this.connectionsActive[index].getURL(), "with",
            this.connectionsPool[0].getURL());
        this.connectionsPool.push(this.connectionsActive[index]);
        this.connectionsActive[index] = this.connectionsPool.shift();
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
