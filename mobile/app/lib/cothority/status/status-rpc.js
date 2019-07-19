"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
var connection_1 = require("../network/connection");
var proto_1 = require("./proto");
/**
 * RPC to talk with the status service of the conodes
 */
var StatusRPC = /** @class */ (function () {
    function StatusRPC(roster) {
        this.timeout = 10 * 1000;
        this.conn = roster.list
            .map(function (srvid) { return new connection_1.WebSocketConnection(srvid.getWebSocketAddress(), StatusRPC.serviceName); });
    }
    /**
     * Set a new timeout value for the next requests
     * @param value Timeout in ms
     */
    StatusRPC.prototype.setTimeout = function (value) {
        this.timeout = value;
    };
    /**
     * Fetch the status of the server at the given index
     * @param index Index of the server identity
     * @returns a promise that resolves with the status response
     */
    StatusRPC.prototype.getStatus = function (index) {
        if (index === void 0) { index = 0; }
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (index >= this.conn.length || index < 0) {
                    throw new Error("Index out of bound for the roster");
                }
                this.conn[index].setTimeout(this.timeout);
                return [2 /*return*/, this.conn[index].send(new proto_1.StatusRequest(), proto_1.StatusResponse)];
            });
        });
    };
    StatusRPC.serviceName = "Status";
    return StatusRPC;
}());
exports.default = StatusRPC;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdHVzLXJwYy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInN0YXR1cy1ycGMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLG9EQUF5RTtBQUV6RSxpQ0FBd0Q7QUFFeEQ7O0dBRUc7QUFDSDtJQU1JLG1CQUFZLE1BQWM7UUFDdEIsSUFBSSxDQUFDLE9BQU8sR0FBRyxFQUFFLEdBQUcsSUFBSSxDQUFDO1FBQ3pCLElBQUksQ0FBQyxJQUFJLEdBQUcsTUFBTSxDQUFDLElBQUk7YUFDbEIsR0FBRyxDQUFDLFVBQUMsS0FBSyxJQUFLLE9BQUEsSUFBSSxnQ0FBbUIsQ0FBQyxLQUFLLENBQUMsbUJBQW1CLEVBQUUsRUFBRSxTQUFTLENBQUMsV0FBVyxDQUFDLEVBQTNFLENBQTJFLENBQUMsQ0FBQztJQUNyRyxDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsOEJBQVUsR0FBVixVQUFXLEtBQWE7UUFDcEIsSUFBSSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7SUFDekIsQ0FBQztJQUVEOzs7O09BSUc7SUFDRyw2QkFBUyxHQUFmLFVBQWdCLEtBQWlCO1FBQWpCLHNCQUFBLEVBQUEsU0FBaUI7OztnQkFDN0IsSUFBSSxLQUFLLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLElBQUksS0FBSyxHQUFHLENBQUMsRUFBRTtvQkFDeEMsTUFBTSxJQUFJLEtBQUssQ0FBQyxtQ0FBbUMsQ0FBQyxDQUFDO2lCQUN4RDtnQkFFRCxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBRTFDLHNCQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUkscUJBQWEsRUFBRSxFQUFFLHNCQUFjLENBQUMsRUFBQzs7O0tBQ3JFO0lBaENNLHFCQUFXLEdBQUcsUUFBUSxDQUFDO0lBaUNsQyxnQkFBQztDQUFBLEFBbENELElBa0NDO2tCQWxDb0IsU0FBUyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IElDb25uZWN0aW9uLCBXZWJTb2NrZXRDb25uZWN0aW9uIH0gZnJvbSBcIi4uL25ldHdvcmsvY29ubmVjdGlvblwiO1xuaW1wb3J0IHsgUm9zdGVyIH0gZnJvbSBcIi4uL25ldHdvcmsvcHJvdG9cIjtcbmltcG9ydCB7IFN0YXR1c1JlcXVlc3QsIFN0YXR1c1Jlc3BvbnNlIH0gZnJvbSBcIi4vcHJvdG9cIjtcblxuLyoqXG4gKiBSUEMgdG8gdGFsayB3aXRoIHRoZSBzdGF0dXMgc2VydmljZSBvZiB0aGUgY29ub2Rlc1xuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBTdGF0dXNSUEMge1xuICAgIHN0YXRpYyBzZXJ2aWNlTmFtZSA9IFwiU3RhdHVzXCI7XG5cbiAgICBwcml2YXRlIGNvbm46IElDb25uZWN0aW9uW107XG4gICAgcHJpdmF0ZSB0aW1lb3V0OiBudW1iZXI7XG5cbiAgICBjb25zdHJ1Y3Rvcihyb3N0ZXI6IFJvc3Rlcikge1xuICAgICAgICB0aGlzLnRpbWVvdXQgPSAxMCAqIDEwMDA7XG4gICAgICAgIHRoaXMuY29ubiA9IHJvc3Rlci5saXN0XG4gICAgICAgICAgICAubWFwKChzcnZpZCkgPT4gbmV3IFdlYlNvY2tldENvbm5lY3Rpb24oc3J2aWQuZ2V0V2ViU29ja2V0QWRkcmVzcygpLCBTdGF0dXNSUEMuc2VydmljZU5hbWUpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZXQgYSBuZXcgdGltZW91dCB2YWx1ZSBmb3IgdGhlIG5leHQgcmVxdWVzdHNcbiAgICAgKiBAcGFyYW0gdmFsdWUgVGltZW91dCBpbiBtc1xuICAgICAqL1xuICAgIHNldFRpbWVvdXQodmFsdWU6IG51bWJlcik6IHZvaWQge1xuICAgICAgICB0aGlzLnRpbWVvdXQgPSB2YWx1ZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBGZXRjaCB0aGUgc3RhdHVzIG9mIHRoZSBzZXJ2ZXIgYXQgdGhlIGdpdmVuIGluZGV4XG4gICAgICogQHBhcmFtIGluZGV4IEluZGV4IG9mIHRoZSBzZXJ2ZXIgaWRlbnRpdHlcbiAgICAgKiBAcmV0dXJucyBhIHByb21pc2UgdGhhdCByZXNvbHZlcyB3aXRoIHRoZSBzdGF0dXMgcmVzcG9uc2VcbiAgICAgKi9cbiAgICBhc3luYyBnZXRTdGF0dXMoaW5kZXg6IG51bWJlciA9IDApOiBQcm9taXNlPFN0YXR1c1Jlc3BvbnNlPiB7XG4gICAgICAgIGlmIChpbmRleCA+PSB0aGlzLmNvbm4ubGVuZ3RoIHx8IGluZGV4IDwgMCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSW5kZXggb3V0IG9mIGJvdW5kIGZvciB0aGUgcm9zdGVyXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jb25uW2luZGV4XS5zZXRUaW1lb3V0KHRoaXMudGltZW91dCk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuY29ubltpbmRleF0uc2VuZChuZXcgU3RhdHVzUmVxdWVzdCgpLCBTdGF0dXNSZXNwb25zZSk7XG4gICAgfVxufVxuIl19