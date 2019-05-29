import WebSocket from "isomorphic-ws";
import Log from "../log";

/**
 * An adapter to use any kind of websocket and interface it with
 * a browser compatible type of websocket
 */
export abstract class WebSocketAdapter {
    readonly path: string;

    constructor(path: string) {
        this.path = path;
    }

    /**
     * Event triggered after the websocket successfully opened
     * @param callback Function called after the event
     */
    abstract onOpen(callback: () => void): void;

    /**
     * Event triggered after a message is received
     * @param callback Function called with the message as a data buffer
     */
    abstract onMessage(callback: (data: Buffer) => void): void;

    /**
     * Event triggered after the websocket has closed
     * @param callback Function called after the closure
     */
    abstract onClose(callback: (code: number, reason: string) => void): void;

    /**
     * Event triggered when an error occured
     * @param callback Function called with the error
     */
    abstract onError(callback: (err: Error) => void): void;

    /**
     * Send a buffer over the websocket connection
     * @param bytes The data to send
     */
    abstract send(bytes: Buffer): void;

    /**
     * Close the websocket connection
     * @param code The code to use when closing
     */
    abstract close(code: number, reason?: string): void;
}

/**
 * This adapter basically binds the browser websocket interface. Note that
 * the websocket will try to open right after instantiation.
 */
export class BrowserWebSocketAdapter extends WebSocketAdapter {
    private ws: WebSocket;

    constructor(path: string) {
        super(path);
        this.ws = new WebSocket(path);
        // to prevent the browser to use blob
        this.ws.binaryType = "arraybuffer";
    }

    /** @inheritdoc */
    onOpen(callback: () => void): void {
        this.ws.onopen = callback;
    }

    /** @inheritdoc */
    onMessage(callback: (data: Buffer) => void): void {
        this.ws.onmessage = (evt: { data: WebSocket.Data }): any => {
            if (evt.data instanceof Buffer || evt.data instanceof ArrayBuffer) {
                callback(Buffer.from(evt.data));
            } else {
                // In theory, any type of data could be sent through but we only
                // allow protobuf encoded messages
                Log.lvl2(`got an unknown websocket message type: ${typeof evt.data}`);
            }
        };
    }

    /** @inheritdoc */
    onClose(callback: (code: number, reason: string) => void): void {
        this.ws.onclose = (evt: { code: number, reason: string }) => {
            callback(evt.code, evt.reason);
        };
    }

    /** @inheritdoc */
    onError(callback: (err: Error) => void): void {
        this.ws.onerror = (evt: { error: Error }) => {
            callback(evt.error);
        };
    }

    /** @inheritdoc */
    send(bytes: Buffer): void {
        this.ws.send(bytes);
    }

    /** @inheritdoc */
    close(code: number, reason = ""): void {
        this.ws.close(code, reason);
    }
}
