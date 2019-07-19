"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var isomorphic_ws_1 = __importDefault(require("isomorphic-ws"));
var log_1 = __importDefault(require("../log"));
/**
 * An adapter to use any kind of websocket and interface it with
 * a browser compatible type of websocket
 */
var WebSocketAdapter = /** @class */ (function () {
    function WebSocketAdapter(path) {
        this.path = path;
    }
    return WebSocketAdapter;
}());
exports.WebSocketAdapter = WebSocketAdapter;
/**
 * This adapter basically binds the browser websocket interface. Note that
 * the websocket will try to open right after instantiation.
 */
var BrowserWebSocketAdapter = /** @class */ (function (_super) {
    __extends(BrowserWebSocketAdapter, _super);
    function BrowserWebSocketAdapter(path) {
        var _this = _super.call(this, path) || this;
        _this.ws = new isomorphic_ws_1.default(path);
        // to prevent the browser to use blob
        _this.ws.binaryType = "arraybuffer";
        return _this;
    }
    /** @inheritdoc */
    BrowserWebSocketAdapter.prototype.onOpen = function (callback) {
        this.ws.onopen = callback;
    };
    /** @inheritdoc */
    BrowserWebSocketAdapter.prototype.onMessage = function (callback) {
        this.ws.onmessage = function (evt) {
            if (evt.data instanceof Buffer || evt.data instanceof ArrayBuffer) {
                callback(Buffer.from(evt.data));
            }
            else {
                // In theory, any type of data could be sent through but we only
                // allow protobuf encoded messages
                log_1.default.lvl2("got an unknown websocket message type: " + typeof evt.data);
            }
        };
    };
    /** @inheritdoc */
    BrowserWebSocketAdapter.prototype.onClose = function (callback) {
        this.ws.onclose = function (evt) {
            callback(evt.code, evt.reason);
        };
    };
    /** @inheritdoc */
    BrowserWebSocketAdapter.prototype.onError = function (callback) {
        this.ws.onerror = function (evt) {
            callback(evt.error);
        };
    };
    /** @inheritdoc */
    BrowserWebSocketAdapter.prototype.send = function (bytes) {
        this.ws.send(bytes);
    };
    /** @inheritdoc */
    BrowserWebSocketAdapter.prototype.close = function (code, reason) {
        if (reason === void 0) { reason = ""; }
        this.ws.close(code, reason);
    };
    return BrowserWebSocketAdapter;
}(WebSocketAdapter));
exports.BrowserWebSocketAdapter = BrowserWebSocketAdapter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2Vic29ja2V0LWFkYXB0ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ3ZWJzb2NrZXQtYWRhcHRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxnRUFBc0M7QUFDdEMsK0NBQXlCO0FBRXpCOzs7R0FHRztBQUNIO0lBR0ksMEJBQVksSUFBWTtRQUNwQixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztJQUNyQixDQUFDO0lBcUNMLHVCQUFDO0FBQUQsQ0FBQyxBQTFDRCxJQTBDQztBQTFDcUIsNENBQWdCO0FBNEN0Qzs7O0dBR0c7QUFDSDtJQUE2QywyQ0FBZ0I7SUFHekQsaUNBQVksSUFBWTtRQUF4QixZQUNJLGtCQUFNLElBQUksQ0FBQyxTQUlkO1FBSEcsS0FBSSxDQUFDLEVBQUUsR0FBRyxJQUFJLHVCQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDOUIscUNBQXFDO1FBQ3JDLEtBQUksQ0FBQyxFQUFFLENBQUMsVUFBVSxHQUFHLGFBQWEsQ0FBQzs7SUFDdkMsQ0FBQztJQUVELGtCQUFrQjtJQUNsQix3Q0FBTSxHQUFOLFVBQU8sUUFBb0I7UUFDdkIsSUFBSSxDQUFDLEVBQUUsQ0FBQyxNQUFNLEdBQUcsUUFBUSxDQUFDO0lBQzlCLENBQUM7SUFFRCxrQkFBa0I7SUFDbEIsMkNBQVMsR0FBVCxVQUFVLFFBQWdDO1FBQ3RDLElBQUksQ0FBQyxFQUFFLENBQUMsU0FBUyxHQUFHLFVBQUMsR0FBNkI7WUFDOUMsSUFBSSxHQUFHLENBQUMsSUFBSSxZQUFZLE1BQU0sSUFBSSxHQUFHLENBQUMsSUFBSSxZQUFZLFdBQVcsRUFBRTtnQkFDL0QsUUFBUSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7YUFDbkM7aUJBQU07Z0JBQ0gsZ0VBQWdFO2dCQUNoRSxrQ0FBa0M7Z0JBQ2xDLGFBQUcsQ0FBQyxJQUFJLENBQUMsNENBQTBDLE9BQU8sR0FBRyxDQUFDLElBQU0sQ0FBQyxDQUFDO2FBQ3pFO1FBQ0wsQ0FBQyxDQUFDO0lBQ04sQ0FBQztJQUVELGtCQUFrQjtJQUNsQix5Q0FBTyxHQUFQLFVBQVEsUUFBZ0Q7UUFDcEQsSUFBSSxDQUFDLEVBQUUsQ0FBQyxPQUFPLEdBQUcsVUFBQyxHQUFxQztZQUNwRCxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDbkMsQ0FBQyxDQUFDO0lBQ04sQ0FBQztJQUVELGtCQUFrQjtJQUNsQix5Q0FBTyxHQUFQLFVBQVEsUUFBOEI7UUFDbEMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxPQUFPLEdBQUcsVUFBQyxHQUFxQjtZQUNwQyxRQUFRLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3hCLENBQUMsQ0FBQztJQUNOLENBQUM7SUFFRCxrQkFBa0I7SUFDbEIsc0NBQUksR0FBSixVQUFLLEtBQWE7UUFDZCxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUN4QixDQUFDO0lBRUQsa0JBQWtCO0lBQ2xCLHVDQUFLLEdBQUwsVUFBTSxJQUFZLEVBQUUsTUFBVztRQUFYLHVCQUFBLEVBQUEsV0FBVztRQUMzQixJQUFJLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDaEMsQ0FBQztJQUNMLDhCQUFDO0FBQUQsQ0FBQyxBQW5ERCxDQUE2QyxnQkFBZ0IsR0FtRDVEO0FBbkRZLDBEQUF1QiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBXZWJTb2NrZXQgZnJvbSBcImlzb21vcnBoaWMtd3NcIjtcbmltcG9ydCBMb2cgZnJvbSBcIi4uL2xvZ1wiO1xuXG4vKipcbiAqIEFuIGFkYXB0ZXIgdG8gdXNlIGFueSBraW5kIG9mIHdlYnNvY2tldCBhbmQgaW50ZXJmYWNlIGl0IHdpdGhcbiAqIGEgYnJvd3NlciBjb21wYXRpYmxlIHR5cGUgb2Ygd2Vic29ja2V0XG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBXZWJTb2NrZXRBZGFwdGVyIHtcbiAgICByZWFkb25seSBwYXRoOiBzdHJpbmc7XG5cbiAgICBjb25zdHJ1Y3RvcihwYXRoOiBzdHJpbmcpIHtcbiAgICAgICAgdGhpcy5wYXRoID0gcGF0aDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBFdmVudCB0cmlnZ2VyZWQgYWZ0ZXIgdGhlIHdlYnNvY2tldCBzdWNjZXNzZnVsbHkgb3BlbmVkXG4gICAgICogQHBhcmFtIGNhbGxiYWNrIEZ1bmN0aW9uIGNhbGxlZCBhZnRlciB0aGUgZXZlbnRcbiAgICAgKi9cbiAgICBhYnN0cmFjdCBvbk9wZW4oY2FsbGJhY2s6ICgpID0+IHZvaWQpOiB2b2lkO1xuXG4gICAgLyoqXG4gICAgICogRXZlbnQgdHJpZ2dlcmVkIGFmdGVyIGEgbWVzc2FnZSBpcyByZWNlaXZlZFxuICAgICAqIEBwYXJhbSBjYWxsYmFjayBGdW5jdGlvbiBjYWxsZWQgd2l0aCB0aGUgbWVzc2FnZSBhcyBhIGRhdGEgYnVmZmVyXG4gICAgICovXG4gICAgYWJzdHJhY3Qgb25NZXNzYWdlKGNhbGxiYWNrOiAoZGF0YTogQnVmZmVyKSA9PiB2b2lkKTogdm9pZDtcblxuICAgIC8qKlxuICAgICAqIEV2ZW50IHRyaWdnZXJlZCBhZnRlciB0aGUgd2Vic29ja2V0IGhhcyBjbG9zZWRcbiAgICAgKiBAcGFyYW0gY2FsbGJhY2sgRnVuY3Rpb24gY2FsbGVkIGFmdGVyIHRoZSBjbG9zdXJlXG4gICAgICovXG4gICAgYWJzdHJhY3Qgb25DbG9zZShjYWxsYmFjazogKGNvZGU6IG51bWJlciwgcmVhc29uOiBzdHJpbmcpID0+IHZvaWQpOiB2b2lkO1xuXG4gICAgLyoqXG4gICAgICogRXZlbnQgdHJpZ2dlcmVkIHdoZW4gYW4gZXJyb3Igb2NjdXJlZFxuICAgICAqIEBwYXJhbSBjYWxsYmFjayBGdW5jdGlvbiBjYWxsZWQgd2l0aCB0aGUgZXJyb3JcbiAgICAgKi9cbiAgICBhYnN0cmFjdCBvbkVycm9yKGNhbGxiYWNrOiAoZXJyOiBFcnJvcikgPT4gdm9pZCk6IHZvaWQ7XG5cbiAgICAvKipcbiAgICAgKiBTZW5kIGEgYnVmZmVyIG92ZXIgdGhlIHdlYnNvY2tldCBjb25uZWN0aW9uXG4gICAgICogQHBhcmFtIGJ5dGVzIFRoZSBkYXRhIHRvIHNlbmRcbiAgICAgKi9cbiAgICBhYnN0cmFjdCBzZW5kKGJ5dGVzOiBCdWZmZXIpOiB2b2lkO1xuXG4gICAgLyoqXG4gICAgICogQ2xvc2UgdGhlIHdlYnNvY2tldCBjb25uZWN0aW9uXG4gICAgICogQHBhcmFtIGNvZGUgVGhlIGNvZGUgdG8gdXNlIHdoZW4gY2xvc2luZ1xuICAgICAqL1xuICAgIGFic3RyYWN0IGNsb3NlKGNvZGU6IG51bWJlciwgcmVhc29uPzogc3RyaW5nKTogdm9pZDtcbn1cblxuLyoqXG4gKiBUaGlzIGFkYXB0ZXIgYmFzaWNhbGx5IGJpbmRzIHRoZSBicm93c2VyIHdlYnNvY2tldCBpbnRlcmZhY2UuIE5vdGUgdGhhdFxuICogdGhlIHdlYnNvY2tldCB3aWxsIHRyeSB0byBvcGVuIHJpZ2h0IGFmdGVyIGluc3RhbnRpYXRpb24uXG4gKi9cbmV4cG9ydCBjbGFzcyBCcm93c2VyV2ViU29ja2V0QWRhcHRlciBleHRlbmRzIFdlYlNvY2tldEFkYXB0ZXIge1xuICAgIHByaXZhdGUgd3M6IFdlYlNvY2tldDtcblxuICAgIGNvbnN0cnVjdG9yKHBhdGg6IHN0cmluZykge1xuICAgICAgICBzdXBlcihwYXRoKTtcbiAgICAgICAgdGhpcy53cyA9IG5ldyBXZWJTb2NrZXQocGF0aCk7XG4gICAgICAgIC8vIHRvIHByZXZlbnQgdGhlIGJyb3dzZXIgdG8gdXNlIGJsb2JcbiAgICAgICAgdGhpcy53cy5iaW5hcnlUeXBlID0gXCJhcnJheWJ1ZmZlclwiO1xuICAgIH1cblxuICAgIC8qKiBAaW5oZXJpdGRvYyAqL1xuICAgIG9uT3BlbihjYWxsYmFjazogKCkgPT4gdm9pZCk6IHZvaWQge1xuICAgICAgICB0aGlzLndzLm9ub3BlbiA9IGNhbGxiYWNrO1xuICAgIH1cblxuICAgIC8qKiBAaW5oZXJpdGRvYyAqL1xuICAgIG9uTWVzc2FnZShjYWxsYmFjazogKGRhdGE6IEJ1ZmZlcikgPT4gdm9pZCk6IHZvaWQge1xuICAgICAgICB0aGlzLndzLm9ubWVzc2FnZSA9IChldnQ6IHsgZGF0YTogV2ViU29ja2V0LkRhdGEgfSk6IGFueSA9PiB7XG4gICAgICAgICAgICBpZiAoZXZ0LmRhdGEgaW5zdGFuY2VvZiBCdWZmZXIgfHwgZXZ0LmRhdGEgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcikge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKEJ1ZmZlci5mcm9tKGV2dC5kYXRhKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIEluIHRoZW9yeSwgYW55IHR5cGUgb2YgZGF0YSBjb3VsZCBiZSBzZW50IHRocm91Z2ggYnV0IHdlIG9ubHlcbiAgICAgICAgICAgICAgICAvLyBhbGxvdyBwcm90b2J1ZiBlbmNvZGVkIG1lc3NhZ2VzXG4gICAgICAgICAgICAgICAgTG9nLmx2bDIoYGdvdCBhbiB1bmtub3duIHdlYnNvY2tldCBtZXNzYWdlIHR5cGU6ICR7dHlwZW9mIGV2dC5kYXRhfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8qKiBAaW5oZXJpdGRvYyAqL1xuICAgIG9uQ2xvc2UoY2FsbGJhY2s6IChjb2RlOiBudW1iZXIsIHJlYXNvbjogc3RyaW5nKSA9PiB2b2lkKTogdm9pZCB7XG4gICAgICAgIHRoaXMud3Mub25jbG9zZSA9IChldnQ6IHsgY29kZTogbnVtYmVyLCByZWFzb246IHN0cmluZyB9KSA9PiB7XG4gICAgICAgICAgICBjYWxsYmFjayhldnQuY29kZSwgZXZ0LnJlYXNvbik7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLyoqIEBpbmhlcml0ZG9jICovXG4gICAgb25FcnJvcihjYWxsYmFjazogKGVycjogRXJyb3IpID0+IHZvaWQpOiB2b2lkIHtcbiAgICAgICAgdGhpcy53cy5vbmVycm9yID0gKGV2dDogeyBlcnJvcjogRXJyb3IgfSkgPT4ge1xuICAgICAgICAgICAgY2FsbGJhY2soZXZ0LmVycm9yKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvKiogQGluaGVyaXRkb2MgKi9cbiAgICBzZW5kKGJ5dGVzOiBCdWZmZXIpOiB2b2lkIHtcbiAgICAgICAgdGhpcy53cy5zZW5kKGJ5dGVzKTtcbiAgICB9XG5cbiAgICAvKiogQGluaGVyaXRkb2MgKi9cbiAgICBjbG9zZShjb2RlOiBudW1iZXIsIHJlYXNvbiA9IFwiXCIpOiB2b2lkIHtcbiAgICAgICAgdGhpcy53cy5jbG9zZShjb2RlLCByZWFzb24pO1xuICAgIH1cbn1cbiJdfQ==