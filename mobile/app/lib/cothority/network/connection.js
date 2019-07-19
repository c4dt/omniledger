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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var light_1 = require("protobufjs/light");
var shuffle_array_1 = __importDefault(require("shuffle-array"));
var log_1 = __importDefault(require("../log"));
var websocket_adapter_1 = require("./websocket-adapter");
var factory = function (path) { return new websocket_adapter_1.BrowserWebSocketAdapter(path); };
/**
 * Set the websocket generator. The default one is compatible
 * with browsers and nodejs.
 * @param generator A function taking a path and creating a websocket adapter instance
 */
function setFactory(generator) {
    factory = generator;
}
exports.setFactory = setFactory;
/**
 * Single peer connection
 */
var WebSocketConnection = /** @class */ (function () {
    /**
     * @param addr      Address of the distant peer
     * @param service   Name of the service to reach
     */
    function WebSocketConnection(addr, service) {
        this.url = addr;
        this.service = service;
        this.timeout = 30 * 1000; // 30s by default
    }
    /** @inheritdoc */
    WebSocketConnection.prototype.getURL = function () {
        return this.url;
    };
    /** @inheritdoc */
    WebSocketConnection.prototype.setTimeout = function (value) {
        this.timeout = value;
    };
    /** @inheritdoc */
    WebSocketConnection.prototype.send = function (message, reply) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                if (!message.$type) {
                    return [2 /*return*/, Promise.reject(new Error("message \"" + message.constructor.name + "\" is not registered"))];
                }
                if (!reply.$type) {
                    return [2 /*return*/, Promise.reject(new Error("message \"" + reply + "\" is not registered"))];
                }
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        var path = _this.url + "/" + _this.service + "/" + message.$type.name.replace(/.*\./, "");
                        log_1.default.lvl4("Socket: new WebSocket(" + path + ")");
                        var ws = factory(path);
                        var bytes = Buffer.from(message.$type.encode(message).finish());
                        var timer = setTimeout(function () { return ws.close(1002, "timeout"); }, _this.timeout);
                        ws.onOpen(function () { return ws.send(bytes); });
                        ws.onMessage(function (data) {
                            clearTimeout(timer);
                            var buf = Buffer.from(data);
                            log_1.default.lvl4("Getting message with length:", buf.length);
                            try {
                                var ret = reply.decode(buf);
                                resolve(ret);
                            }
                            catch (err) {
                                if (err instanceof light_1.util.ProtocolError) {
                                    reject(err);
                                }
                                else {
                                    reject(new Error("Error when trying to decode the message \"" + reply.$type.name + "\": " + err.message));
                                }
                            }
                            ws.close(1000);
                        });
                        ws.onClose(function (code, reason) {
                            if (code !== 1000) {
                                log_1.default.error("Got close:", code, reason);
                                reject(new Error(reason));
                            }
                        });
                        ws.onError(function (err) {
                            clearTimeout(timer);
                            reject(new Error("error in websocket " + path + ": " + err));
                        });
                    })];
            });
        });
    };
    return WebSocketConnection;
}());
exports.WebSocketConnection = WebSocketConnection;
/**
 * Multi peer connection that tries all nodes one after another. It can send the command to more
 * than one node in parallel and return the first success if 'parallel' i > 1.
 */
var RosterWSConnection = /** @class */ (function () {
    /**
     * @param r         The roster to use
     * @param service   The name of the service to reach
     * @param parallel how many nodes to contact in parallel
     */
    function RosterWSConnection(r, service, parallel) {
        if (parallel === void 0) { parallel = 2; }
        this.service = service;
        if (parallel < 1) {
            throw new Error("parallel must be >= 1");
        }
        this.addresses = r.list.map(function (conode) { return conode.getWebSocketAddress(); });
        shuffle_array_1.default(this.addresses);
        // Initialize the pool of connections
        this.connectionsPool = this.addresses.map(function (addr) { return new WebSocketConnection(addr, service); });
        // And take the first 'parallel' connections
        this.connectionsActive = this.connectionsPool.splice(0, parallel);
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
    RosterWSConnection.prototype.send = function (message, reply) {
        return __awaiter(this, void 0, void 0, function () {
            var errors, rotate;
            var _this = this;
            return __generator(this, function (_a) {
                errors = [];
                rotate = this.addresses.length - this.connectionsActive.length;
                // Get the first reply - need to take care not to return a reject too soon, else
                // all other promises will be ignored.
                // The promises that never 'resolve' or 'reject' will later be collected by GC:
                // https://stackoverflow.com/questions/36734900/what-happens-if-we-dont-resolve-or-reject-the-promise
                return [2 /*return*/, Promise.race(this.connectionsActive.map(function (_, i) {
                        return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                            var sub, e_1;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        _a.trys.push([0, 2, , 3]);
                                        return [4 /*yield*/, this.connectionsActive[i].send(message, reply)];
                                    case 1:
                                        sub = _a.sent();
                                        // Signal to other connections that have an error that they don't need
                                        // to retry.
                                        rotate = -1;
                                        resolve(sub);
                                        return [3 /*break*/, 3];
                                    case 2:
                                        e_1 = _a.sent();
                                        errors.push(e_1);
                                        if (errors.length === this.addresses.length) {
                                            // It's the last connection that also threw an error, so let's quit
                                            reject(errors);
                                        }
                                        rotate--;
                                        if (rotate >= 0) {
                                            // Take the oldest connection that hasn't been used yet
                                            this.connectionsPool.push(this.connectionsActive[i]);
                                            this.connectionsActive[i] = this.connectionsPool.shift();
                                        }
                                        return [3 /*break*/, 3];
                                    case 3:
                                        if (rotate >= 0) return [3 /*break*/, 0];
                                        _a.label = 4;
                                    case 4: return [2 /*return*/];
                                }
                            });
                        }); });
                    }))];
            });
        });
    };
    /**
     * To be conform with an IConnection
     */
    RosterWSConnection.prototype.getURL = function () {
        return this.connectionsActive[0].getURL();
    };
    /**
     * To be conform with an IConnection - sets the timeout on all connections.
     */
    RosterWSConnection.prototype.setTimeout = function (value) {
        this.connectionsPool.forEach(function (conn) {
            conn.setTimeout(value);
        });
        this.connectionsActive.forEach(function (conn) {
            conn.setTimeout(value);
        });
    };
    return RosterWSConnection;
}());
exports.RosterWSConnection = RosterWSConnection;
/**
 * Single peer connection that reaches only the leader of the roster
 */
var LeaderConnection = /** @class */ (function (_super) {
    __extends(LeaderConnection, _super);
    /**
     * @param roster    The roster to use
     * @param service   The name of the service
     */
    function LeaderConnection(roster, service) {
        var _this = this;
        if (roster.list.length === 0) {
            throw new Error("Roster should have at least one node");
        }
        _this = _super.call(this, roster.list[0].address, service) || this;
        return _this;
    }
    return LeaderConnection;
}(WebSocketConnection));
exports.LeaderConnection = LeaderConnection;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29ubmVjdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNvbm5lY3Rpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSwwQ0FBaUQ7QUFDakQsZ0VBQW9DO0FBQ3BDLCtDQUF5QjtBQUV6Qix5REFBZ0Y7QUFFaEYsSUFBSSxPQUFPLEdBQXVDLFVBQUMsSUFBWSxJQUFLLE9BQUEsSUFBSSwyQ0FBdUIsQ0FBQyxJQUFJLENBQUMsRUFBakMsQ0FBaUMsQ0FBQztBQUV0Rzs7OztHQUlHO0FBQ0gsU0FBZ0IsVUFBVSxDQUFDLFNBQTZDO0lBQ3BFLE9BQU8sR0FBRyxTQUFTLENBQUM7QUFDeEIsQ0FBQztBQUZELGdDQUVDO0FBMkJEOztHQUVHO0FBQ0g7SUFLSTs7O09BR0c7SUFDSCw2QkFBWSxJQUFZLEVBQUUsT0FBZTtRQUNyQyxJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQztRQUNoQixJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztRQUN2QixJQUFJLENBQUMsT0FBTyxHQUFHLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQyxpQkFBaUI7SUFDL0MsQ0FBQztJQUVELGtCQUFrQjtJQUNsQixvQ0FBTSxHQUFOO1FBQ0ksT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDO0lBQ3BCLENBQUM7SUFFRCxrQkFBa0I7SUFDbEIsd0NBQVUsR0FBVixVQUFXLEtBQWE7UUFDcEIsSUFBSSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7SUFDekIsQ0FBQztJQUVELGtCQUFrQjtJQUNaLGtDQUFJLEdBQVYsVUFBOEIsT0FBZ0IsRUFBRSxLQUFxQjs7OztnQkFDakUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUU7b0JBQ2hCLHNCQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxLQUFLLENBQUMsZUFBWSxPQUFPLENBQUMsV0FBVyxDQUFDLElB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QUFXLEtBQWE7UUFDcEIsSUFBSSxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMsVUFBQyxJQUFJO1lBQzlCLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDM0IsQ0FBQyxDQUFDLENBQUM7UUFDSCxJQUFJLENBQUMsaUJBQWlCLENBQUMsT0FBTyxDQUFDLFVBQUMsSUFBSTtZQUNoQyxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzNCLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUNMLHlCQUFDO0FBQUQsQ0FBQyxBQXRGRCxJQXNGQztBQXRGWSxnREFBa0I7QUF3Ri9COztHQUVHO0FBQ0g7SUFBc0Msb0NBQW1CO0lBQ3JEOzs7T0FHRztJQUNILDBCQUFZLE1BQWMsRUFBRSxPQUFlO1FBQTNDLGlCQU1DO1FBTEcsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7WUFDMUIsTUFBTSxJQUFJLEtBQUssQ0FBQyxzQ0FBc0MsQ0FBQyxDQUFDO1NBQzNEO1FBRUQsUUFBQSxrQkFBTSxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsU0FBQzs7SUFDM0MsQ0FBQztJQUNMLHVCQUFDO0FBQUQsQ0FBQyxBQVpELENBQXNDLG1CQUFtQixHQVl4RDtBQVpZLDRDQUFnQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE1lc3NhZ2UsIHV0aWwgfSBmcm9tIFwicHJvdG9idWZqcy9saWdodFwiO1xuaW1wb3J0IHNodWZmbGUgZnJvbSBcInNodWZmbGUtYXJyYXlcIjtcbmltcG9ydCBMb2cgZnJvbSBcIi4uL2xvZ1wiO1xuaW1wb3J0IHsgUm9zdGVyIH0gZnJvbSBcIi4vcHJvdG9cIjtcbmltcG9ydCB7IEJyb3dzZXJXZWJTb2NrZXRBZGFwdGVyLCBXZWJTb2NrZXRBZGFwdGVyIH0gZnJvbSBcIi4vd2Vic29ja2V0LWFkYXB0ZXJcIjtcblxubGV0IGZhY3Rvcnk6IChwYXRoOiBzdHJpbmcpID0+IFdlYlNvY2tldEFkYXB0ZXIgPSAocGF0aDogc3RyaW5nKSA9PiBuZXcgQnJvd3NlcldlYlNvY2tldEFkYXB0ZXIocGF0aCk7XG5cbi8qKlxuICogU2V0IHRoZSB3ZWJzb2NrZXQgZ2VuZXJhdG9yLiBUaGUgZGVmYXVsdCBvbmUgaXMgY29tcGF0aWJsZVxuICogd2l0aCBicm93c2VycyBhbmQgbm9kZWpzLlxuICogQHBhcmFtIGdlbmVyYXRvciBBIGZ1bmN0aW9uIHRha2luZyBhIHBhdGggYW5kIGNyZWF0aW5nIGEgd2Vic29ja2V0IGFkYXB0ZXIgaW5zdGFuY2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldEZhY3RvcnkoZ2VuZXJhdG9yOiAocGF0aDogc3RyaW5nKSA9PiBXZWJTb2NrZXRBZGFwdGVyKTogdm9pZCB7XG4gICAgZmFjdG9yeSA9IGdlbmVyYXRvcjtcbn1cblxuLyoqXG4gKiBBIGNvbm5lY3Rpb24gYWxsb3dzIHRvIHNlbmQgYSBtZXNzYWdlIHRvIG9uZSBvciBtb3JlIGRpc3RhbnQgcGVlclxuICovXG5leHBvcnQgaW50ZXJmYWNlIElDb25uZWN0aW9uIHtcbiAgICAvKipcbiAgICAgKiBTZW5kIGEgbWVzc2FnZSB0byB0aGUgZGlzdGFudCBwZWVyXG4gICAgICogQHBhcmFtIG1lc3NhZ2UgICBQcm90b2J1ZiBjb21wYXRpYmxlIG1lc3NhZ2VcbiAgICAgKiBAcGFyYW0gcmVwbHkgICAgIFByb3RvYnVmIHR5cGUgb2YgdGhlIHJlcGx5XG4gICAgICogQHJldHVybnMgYSBwcm9taXNlIHJlc29sdmluZyB3aXRoIHRoZSByZXBseSBvbiBzdWNjZXNzLCByZWplY3Rpbmcgb3RoZXJ3aXNlXG4gICAgICovXG4gICAgc2VuZDxUIGV4dGVuZHMgTWVzc2FnZT4obWVzc2FnZTogTWVzc2FnZSwgcmVwbHk6IHR5cGVvZiBNZXNzYWdlKTogUHJvbWlzZTxUPjtcblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgY29tcGxldGUgZGlzdGFudCBhZGRyZXNzXG4gICAgICogQHJldHVybnMgdGhlIGFkZHJlc3MgYXMgYSBzdHJpbmdcbiAgICAgKi9cbiAgICBnZXRVUkwoKTogc3RyaW5nO1xuXG4gICAgLyoqXG4gICAgICogU2V0IHRoZSB0aW1lb3V0IHZhbHVlIGZvciBuZXcgY29ubmVjdGlvbnNcbiAgICAgKiBAcGFyYW0gdmFsdWUgVGltZW91dCBpbiBtaWxsaXNlY29uZHNcbiAgICAgKi9cbiAgICBzZXRUaW1lb3V0KHZhbHVlOiBudW1iZXIpOiB2b2lkO1xufVxuXG4vKipcbiAqIFNpbmdsZSBwZWVyIGNvbm5lY3Rpb25cbiAqL1xuZXhwb3J0IGNsYXNzIFdlYlNvY2tldENvbm5lY3Rpb24gaW1wbGVtZW50cyBJQ29ubmVjdGlvbiB7XG4gICAgcHJpdmF0ZSB1cmw6IHN0cmluZztcbiAgICBwcml2YXRlIHNlcnZpY2U6IHN0cmluZztcbiAgICBwcml2YXRlIHRpbWVvdXQ6IG51bWJlcjtcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSBhZGRyICAgICAgQWRkcmVzcyBvZiB0aGUgZGlzdGFudCBwZWVyXG4gICAgICogQHBhcmFtIHNlcnZpY2UgICBOYW1lIG9mIHRoZSBzZXJ2aWNlIHRvIHJlYWNoXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoYWRkcjogc3RyaW5nLCBzZXJ2aWNlOiBzdHJpbmcpIHtcbiAgICAgICAgdGhpcy51cmwgPSBhZGRyO1xuICAgICAgICB0aGlzLnNlcnZpY2UgPSBzZXJ2aWNlO1xuICAgICAgICB0aGlzLnRpbWVvdXQgPSAzMCAqIDEwMDA7IC8vIDMwcyBieSBkZWZhdWx0XG4gICAgfVxuXG4gICAgLyoqIEBpbmhlcml0ZG9jICovXG4gICAgZ2V0VVJMKCk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiB0aGlzLnVybDtcbiAgICB9XG5cbiAgICAvKiogQGluaGVyaXRkb2MgKi9cbiAgICBzZXRUaW1lb3V0KHZhbHVlOiBudW1iZXIpOiB2b2lkIHtcbiAgICAgICAgdGhpcy50aW1lb3V0ID0gdmFsdWU7XG4gICAgfVxuXG4gICAgLyoqIEBpbmhlcml0ZG9jICovXG4gICAgYXN5bmMgc2VuZDxUIGV4dGVuZHMgTWVzc2FnZT4obWVzc2FnZTogTWVzc2FnZSwgcmVwbHk6IHR5cGVvZiBNZXNzYWdlKTogUHJvbWlzZTxUPiB7XG4gICAgICAgIGlmICghbWVzc2FnZS4kdHlwZSkge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcihgbWVzc2FnZSBcIiR7bWVzc2FnZS5jb25zdHJ1Y3Rvci5uYW1lfVwiIGlzIG5vdCByZWdpc3RlcmVkYCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFyZXBseS4kdHlwZSkge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcihgbWVzc2FnZSBcIiR7cmVwbHl9XCIgaXMgbm90IHJlZ2lzdGVyZWRgKSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcGF0aCA9IHRoaXMudXJsICsgXCIvXCIgKyB0aGlzLnNlcnZpY2UgKyBcIi9cIiArIG1lc3NhZ2UuJHR5cGUubmFtZS5yZXBsYWNlKC8uKlxcLi8sIFwiXCIpO1xuICAgICAgICAgICAgTG9nLmx2bDQoYFNvY2tldDogbmV3IFdlYlNvY2tldCgke3BhdGh9KWApO1xuICAgICAgICAgICAgY29uc3Qgd3MgPSBmYWN0b3J5KHBhdGgpO1xuICAgICAgICAgICAgY29uc3QgYnl0ZXMgPSBCdWZmZXIuZnJvbShtZXNzYWdlLiR0eXBlLmVuY29kZShtZXNzYWdlKS5maW5pc2goKSk7XG5cbiAgICAgICAgICAgIGNvbnN0IHRpbWVyID0gc2V0VGltZW91dCgoKSA9PiB3cy5jbG9zZSgxMDAyLCBcInRpbWVvdXRcIiksIHRoaXMudGltZW91dCk7XG5cbiAgICAgICAgICAgIHdzLm9uT3BlbigoKSA9PiB3cy5zZW5kKGJ5dGVzKSk7XG5cbiAgICAgICAgICAgIHdzLm9uTWVzc2FnZSgoZGF0YTogQnVmZmVyKSA9PiB7XG4gICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICAgICAgICAgICAgICBjb25zdCBidWYgPSBCdWZmZXIuZnJvbShkYXRhKTtcbiAgICAgICAgICAgICAgICBMb2cubHZsNChcIkdldHRpbmcgbWVzc2FnZSB3aXRoIGxlbmd0aDpcIiwgYnVmLmxlbmd0aCk7XG5cbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCByZXQgPSByZXBseS5kZWNvZGUoYnVmKSBhcyBUO1xuXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUocmV0KTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVyciBpbnN0YW5jZW9mIHV0aWwuUHJvdG9jb2xFcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3IEVycm9yKGBFcnJvciB3aGVuIHRyeWluZyB0byBkZWNvZGUgdGhlIG1lc3NhZ2UgXCIke3JlcGx5LiR0eXBlLm5hbWV9XCI6ICR7ZXJyLm1lc3NhZ2V9YCksXG4gICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgd3MuY2xvc2UoMTAwMCk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgd3Mub25DbG9zZSgoY29kZTogbnVtYmVyLCByZWFzb246IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChjb2RlICE9PSAxMDAwKSB7XG4gICAgICAgICAgICAgICAgICAgIExvZy5lcnJvcihcIkdvdCBjbG9zZTpcIiwgY29kZSwgcmVhc29uKTtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihyZWFzb24pKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgd3Mub25FcnJvcigoZXJyOiBFcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lcik7XG5cbiAgICAgICAgICAgICAgICByZWplY3QobmV3IEVycm9yKFwiZXJyb3IgaW4gd2Vic29ja2V0IFwiICsgcGF0aCArIFwiOiBcIiArIGVycikpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuLyoqXG4gKiBNdWx0aSBwZWVyIGNvbm5lY3Rpb24gdGhhdCB0cmllcyBhbGwgbm9kZXMgb25lIGFmdGVyIGFub3RoZXIuIEl0IGNhbiBzZW5kIHRoZSBjb21tYW5kIHRvIG1vcmVcbiAqIHRoYW4gb25lIG5vZGUgaW4gcGFyYWxsZWwgYW5kIHJldHVybiB0aGUgZmlyc3Qgc3VjY2VzcyBpZiAncGFyYWxsZWwnIGkgPiAxLlxuICovXG5leHBvcnQgY2xhc3MgUm9zdGVyV1NDb25uZWN0aW9uIHtcbiAgICBwcml2YXRlIGFkZHJlc3Nlczogc3RyaW5nW107XG4gICAgcHJpdmF0ZSBjb25uZWN0aW9uc0FjdGl2ZTogV2ViU29ja2V0Q29ubmVjdGlvbltdO1xuICAgIHByaXZhdGUgY29ubmVjdGlvbnNQb29sOiBXZWJTb2NrZXRDb25uZWN0aW9uW107XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0gciAgICAgICAgIFRoZSByb3N0ZXIgdG8gdXNlXG4gICAgICogQHBhcmFtIHNlcnZpY2UgICBUaGUgbmFtZSBvZiB0aGUgc2VydmljZSB0byByZWFjaFxuICAgICAqIEBwYXJhbSBwYXJhbGxlbCBob3cgbWFueSBub2RlcyB0byBjb250YWN0IGluIHBhcmFsbGVsXG4gICAgICovXG4gICAgY29uc3RydWN0b3IocjogUm9zdGVyLCBwcml2YXRlIHNlcnZpY2U6IHN0cmluZywgcGFyYWxsZWw6IG51bWJlciA9IDIpIHtcbiAgICAgICAgaWYgKHBhcmFsbGVsIDwgMSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGFyYWxsZWwgbXVzdCBiZSA+PSAxXCIpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuYWRkcmVzc2VzID0gci5saXN0Lm1hcCgoY29ub2RlKSA9PiBjb25vZGUuZ2V0V2ViU29ja2V0QWRkcmVzcygpKTtcbiAgICAgICAgc2h1ZmZsZSh0aGlzLmFkZHJlc3Nlcyk7XG4gICAgICAgIC8vIEluaXRpYWxpemUgdGhlIHBvb2wgb2YgY29ubmVjdGlvbnNcbiAgICAgICAgdGhpcy5jb25uZWN0aW9uc1Bvb2wgPSB0aGlzLmFkZHJlc3Nlcy5tYXAoKGFkZHIpID0+IG5ldyBXZWJTb2NrZXRDb25uZWN0aW9uKGFkZHIsIHNlcnZpY2UpKTtcbiAgICAgICAgLy8gQW5kIHRha2UgdGhlIGZpcnN0ICdwYXJhbGxlbCcgY29ubmVjdGlvbnNcbiAgICAgICAgdGhpcy5jb25uZWN0aW9uc0FjdGl2ZSA9IHRoaXMuY29ubmVjdGlvbnNQb29sLnNwbGljZSgwLCBwYXJhbGxlbCk7XG4gICAgICAgIC8vIFVwb24gZmFpbHVyZSBvZiBhIGNvbm5lY3Rpb24sIGl0IGlzIHB1c2hlZCB0byB0aGUgZW5kIG9mIHRoZSBjb25uZWN0aW9uc1Bvb2wsIGFuZCBhXG4gICAgICAgIC8vIG5ldyBjb25uZWN0aW9uIGlzIHRha2VuIGZyb20gdGhlIGJlZ2lubmluZyBvZiB0aGUgY29ubmVjdGlvbnNQb29sLlxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNlbmRzIGEgbWVzc2FnZSB0byBjb25vZGVzIGluIHBhcmFsbGVsLiBBcyBzb29uIGFzIG9uZSBvZiB0aGUgY29ub2RlcyByZXR1cm5zXG4gICAgICogc3VjY2VzcywgdGhlIG1lc3NhZ2UgaXMgcmV0dXJuZWQuIElmIGEgY29ub2RlIHJldHVybnMgYW4gZXJyb3IgKG9yIHRpbWVzIG91dCksXG4gICAgICogYSBuZXh0IGNvbm9kZSBmcm9tIHRoaXMuYWRkcmVzc2VzIGlzIGNvbnRhY3RlZC4gSWYgYWxsIGNvbm9kZXMgcmV0dXJuIGFuIGVycm9yLFxuICAgICAqIHRoZSBwcm9taXNlIGlzIHJlamVjdGVkLlxuICAgICAqXG4gICAgICogQHBhcmFtIG1lc3NhZ2UgdGhlIG1lc3NhZ2UgdG8gc2VuZFxuICAgICAqIEBwYXJhbSByZXBseSB0aGUgdHlwZSBvZiB0aGUgbWVzc2FnZSB0byByZXR1cm5cbiAgICAgKi9cbiAgICBhc3luYyBzZW5kPFQgZXh0ZW5kcyBNZXNzYWdlPihtZXNzYWdlOiBNZXNzYWdlLCByZXBseTogdHlwZW9mIE1lc3NhZ2UpOiBQcm9taXNlPFQ+IHtcbiAgICAgICAgY29uc3QgZXJyb3JzOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICBsZXQgcm90YXRlID0gdGhpcy5hZGRyZXNzZXMubGVuZ3RoIC0gdGhpcy5jb25uZWN0aW9uc0FjdGl2ZS5sZW5ndGg7XG5cbiAgICAgICAgLy8gR2V0IHRoZSBmaXJzdCByZXBseSAtIG5lZWQgdG8gdGFrZSBjYXJlIG5vdCB0byByZXR1cm4gYSByZWplY3QgdG9vIHNvb24sIGVsc2VcbiAgICAgICAgLy8gYWxsIG90aGVyIHByb21pc2VzIHdpbGwgYmUgaWdub3JlZC5cbiAgICAgICAgLy8gVGhlIHByb21pc2VzIHRoYXQgbmV2ZXIgJ3Jlc29sdmUnIG9yICdyZWplY3QnIHdpbGwgbGF0ZXIgYmUgY29sbGVjdGVkIGJ5IEdDOlxuICAgICAgICAvLyBodHRwczovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8zNjczNDkwMC93aGF0LWhhcHBlbnMtaWYtd2UtZG9udC1yZXNvbHZlLW9yLXJlamVjdC10aGUtcHJvbWlzZVxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yYWNlKHRoaXMuY29ubmVjdGlvbnNBY3RpdmUubWFwKChfLCBpKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8VD4oYXN5bmMgKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgIGRvIHtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHN1YiA9IGF3YWl0IHRoaXMuY29ubmVjdGlvbnNBY3RpdmVbaV0uc2VuZChtZXNzYWdlLCByZXBseSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBTaWduYWwgdG8gb3RoZXIgY29ubmVjdGlvbnMgdGhhdCBoYXZlIGFuIGVycm9yIHRoYXQgdGhleSBkb24ndCBuZWVkXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0byByZXRyeS5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJvdGF0ZSA9IC0xO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShzdWIgYXMgVCk7XG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9ycy5wdXNoKGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVycm9ycy5sZW5ndGggPT09IHRoaXMuYWRkcmVzc2VzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEl0J3MgdGhlIGxhc3QgY29ubmVjdGlvbiB0aGF0IGFsc28gdGhyZXcgYW4gZXJyb3IsIHNvIGxldCdzIHF1aXRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyb3JzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJvdGF0ZS0tO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJvdGF0ZSA+PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVGFrZSB0aGUgb2xkZXN0IGNvbm5lY3Rpb24gdGhhdCBoYXNuJ3QgYmVlbiB1c2VkIHlldFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY29ubmVjdGlvbnNQb29sLnB1c2godGhpcy5jb25uZWN0aW9uc0FjdGl2ZVtpXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jb25uZWN0aW9uc0FjdGl2ZVtpXSA9IHRoaXMuY29ubmVjdGlvbnNQb29sLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IHdoaWxlIChyb3RhdGUgPj0gMCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRvIGJlIGNvbmZvcm0gd2l0aCBhbiBJQ29ubmVjdGlvblxuICAgICAqL1xuICAgIGdldFVSTCgpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gdGhpcy5jb25uZWN0aW9uc0FjdGl2ZVswXS5nZXRVUkwoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUbyBiZSBjb25mb3JtIHdpdGggYW4gSUNvbm5lY3Rpb24gLSBzZXRzIHRoZSB0aW1lb3V0IG9uIGFsbCBjb25uZWN0aW9ucy5cbiAgICAgKi9cbiAgICBzZXRUaW1lb3V0KHZhbHVlOiBudW1iZXIpIHtcbiAgICAgICAgdGhpcy5jb25uZWN0aW9uc1Bvb2wuZm9yRWFjaCgoY29ubikgPT4ge1xuICAgICAgICAgICAgY29ubi5zZXRUaW1lb3V0KHZhbHVlKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuY29ubmVjdGlvbnNBY3RpdmUuZm9yRWFjaCgoY29ubikgPT4ge1xuICAgICAgICAgICAgY29ubi5zZXRUaW1lb3V0KHZhbHVlKTtcbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG4vKipcbiAqIFNpbmdsZSBwZWVyIGNvbm5lY3Rpb24gdGhhdCByZWFjaGVzIG9ubHkgdGhlIGxlYWRlciBvZiB0aGUgcm9zdGVyXG4gKi9cbmV4cG9ydCBjbGFzcyBMZWFkZXJDb25uZWN0aW9uIGV4dGVuZHMgV2ViU29ja2V0Q29ubmVjdGlvbiB7XG4gICAgLyoqXG4gICAgICogQHBhcmFtIHJvc3RlciAgICBUaGUgcm9zdGVyIHRvIHVzZVxuICAgICAqIEBwYXJhbSBzZXJ2aWNlICAgVGhlIG5hbWUgb2YgdGhlIHNlcnZpY2VcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcihyb3N0ZXI6IFJvc3Rlciwgc2VydmljZTogc3RyaW5nKSB7XG4gICAgICAgIGlmIChyb3N0ZXIubGlzdC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlJvc3RlciBzaG91bGQgaGF2ZSBhdCBsZWFzdCBvbmUgbm9kZVwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHN1cGVyKHJvc3Rlci5saXN0WzBdLmFkZHJlc3MsIHNlcnZpY2UpO1xuICAgIH1cbn1cbiJdfQ==