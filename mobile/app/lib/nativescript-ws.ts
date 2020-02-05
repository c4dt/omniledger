// tslint:disable-next-line
require("nativescript-nodeify");

// tslint:disable-next-line
const WS = require("nativescript-websockets");

import Log from "@dedis/cothority/log";
import { WebSocketAdapter } from "@dedis/cothority/network";

/**
 * This adapter basically binds the browser websocket interface. Note that
 * the websocket will try to open right after instantiation.
 */
export class NativescriptWebSocketAdapter implements WebSocketAdapter {
    readonly path: string;
    private ws: any;

    constructor(path: string) {
        Log.lvl4("new ns-ws with path", path);
        // this.ws = new WS(path, {debug: true, timeout: 1000});
        this.ws = new WS(path, {timeout: 1000});
        // to prevent the browser to use blob
        this.ws.binaryType = "arraybuffer";
        this.ws.open();
    }

    /** @inheritdoc */
    onOpen(callback: () => void): void {
        this.ws.on("open", () => {
            callback();
        });
    }

    /** @inheritdoc */
    onMessage(callback: (data: Buffer) => void): void {
        this.ws.on("message", (socket, msg) => {
            if (msg instanceof Buffer || msg instanceof ArrayBuffer) {
                callback(Buffer.from(msg));
            } else {
                // In theory, any type of data could be sent through but we only
                // allow protobuf encoded messages
                Log.lvl2(`got an unknown websocket message type: ${typeof msg}`);
            }
        });
    }

    /** @inheritdoc */
    onClose(callback: (code: number, reason: string) => void): void {
        this.ws.on("close", (ws: any, code: number, reason: string) => {
            callback(code, reason);
        });
    }

    /** @inheritdoc */
    onError(callback: (err: Error) => void): void {
        this.ws.on("error", (ws: any, error: any) => {
            callback(new Error("ns-ws error: " + error));
        });
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
