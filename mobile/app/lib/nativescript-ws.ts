const WS = require("nativescript-websockets");
import { sprintf } from "sprintf-js";
import Log from "~/lib/cothority/log";
import { WebSocketAdapter } from "~/lib/cothority/network";

/**
 * This adapter basically binds the browser websocket interface. Note that
 * the websocket will try to open right after instantiation.
 */
export class NativescriptWebSocketAdapter extends WebSocketAdapter {
    private ws: any;

    constructor(path: string) {
        Log.lvl2("new ns-ws with path", path);
        super(path);
        this.ws = new WS(path, {timeout: 6000});
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
        })
    }

    /** @inheritdoc */
    onClose(callback: (code: number, reason: string) => void): void {
        this.ws.onclose = (evt: { code: number, reason: string }) => {
            callback(evt.code, evt.reason);
        };
    }

    /** @inheritdoc */
    onError(callback: (err: Error) => void): void {
        this.ws.onerror = (evt: Event) => {
            callback(new Error("something went wrong"));
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
