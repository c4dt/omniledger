import { Log } from "@c4dt/cothority/log";

/**
 * A connection allows to send a message to one or more distant peer
 */
export interface IConnection {
    sendmsg(msg: Uint8Array): Promise<void>;
    recvmsg(): Promise<Uint8Array>;
}

/**
 * IConnection via the WebSocket protocol
 */
export class WebSocketConnection implements IConnection {
    private ws: WebSocket; // underling connection
    private openned: Promise<void>; // guard to wait for connection opening
    private received: Set<Promise<Uint8Array>>; // set of waiting-to-be-read messages

    /**
     * Construct with the given URL
     */
    constructor(url: string) {
        Log.lvl4(`WebSocketConnection: opening for ${url}`);
        this.ws = new WebSocket(url);
        this.ws.binaryType = "arraybuffer";
        this.received = new Set();

        this.ws.onmessage = (msg: MessageEvent) => {
            Log.lvl4(`WebSocketConnection.ws.onmessage: got ${msg.data}`);
            this.received.add(new Promise((resolve, reject) => {
                Log.lvl4(`WebSocketConnection.ws.onmessage: resolving with ${msg.data}`);
                resolve(new Uint8Array(msg.data));
            }))
        }

        this.openned = new Promise((resolve, reject) => {
            this.ws.onopen = (_: any) => resolve();
        })
    }

    async sendmsg(msg: Uint8Array): Promise<void> {
        await this.openned;
        return new Promise<void>((resolve, reject) => {
            Log.lvl4(`WebSocketConnection.sendmsg: sending ${msg} with ws in state ${this.ws.readyState}`);
            this.ws.send(msg);
            resolve();
        })
    }

    async recvmsg(): Promise<Uint8Array> {
        while (this.received.size == 0) {
            // TODO sync by hand, ugly, find a library having async collections
            await new Promise((resolve, reject) => setTimeout(resolve, 30))
        }

        Log.lvl4(`WebSocketConnection.recvmsg: getting from pool of size ${this.received.size}`);
        const ret = Promise.race(this.received);
        this.received.delete(ret);
        Log.lvl4(`WebSocketConnection.recvmsg: got ${await ret}`);
        return await ret;
    }
}

/**
 * Connect to the factory-selected IConnection
 */
export class MultiConnections<T> {
    private connected: Map<T, IConnection>; // already created connections
    private factory: (T) => IConnection; // how to create new instances

    /**
     * Construct with the mean to create new IConnection
     */
    constructor(factory: (T) => IConnection) {
        this.connected = new Map();
        this.factory = factory;
    }

    private getConn(ident: T): IConnection {
        const found = this.connected.get(ident);
        if (found !== undefined) {
            return found;
        }

        const conn = this.factory(ident);
        this.connected.set(ident, conn);
        return conn;
    }

    async sendto(ident: T, msg: Uint8Array): Promise<void> {
        await this.getConn(ident).sendmsg(msg);
    }

    async recvfrom(ident: T): Promise<Uint8Array> {
        return await this.getConn(ident).recvmsg();
    }
}
