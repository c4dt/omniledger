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
/**
 * Instance with basic information
 */
var Instance = /** @class */ (function () {
    function Instance(init) {
        this.id = init.id;
        this.contractID = init.contractID;
        this.darcID = init.darcID;
        this.data = init.data;
    }
    /**
     * Create an instance from a proof
     * @param p The proof
     * @returns the instance
     */
    Instance.fromProof = function (id, p) {
        if (!p.exists(id)) {
            throw new Error("key not in proof: " + id.toString("hex"));
        }
        return new Instance({ id: id, contractID: p.contractID, darcID: p.darcID, data: p.value });
    };
    /**
     * Create an instance after requesting its proof to byzcoin
     * @param rpc   The RPC to use
     * @param id    The ID of the instance
     * @param waitMatch how many times to wait for a match - useful if its called just after an addTransactionAndWait.
     * @param interval how long to wait between two attempts in waitMatch.
     * @returns the instance if it exists
     */
    Instance.fromByzcoin = function (rpc, iid, waitMatch, interval) {
        if (waitMatch === void 0) { waitMatch = 0; }
        if (interval === void 0) { interval = 1000; }
        return __awaiter(this, void 0, void 0, function () {
            var p;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, rpc.getProofFromLatest(iid, waitMatch, interval)];
                    case 1:
                        p = _a.sent();
                        return [2 /*return*/, Instance.fromProof(iid, p)];
                }
            });
        });
    };
    /**
     * Returns an instance from a previously toBytes() call.
     * @param buf
     */
    Instance.fromBytes = function (buf) {
        var obj = JSON.parse(buf.toString());
        return new Instance({
            contractID: obj.contractID,
            darcID: Buffer.from(obj.darcID),
            data: Buffer.from(obj.data),
            id: Buffer.from(obj.id),
        });
    };
    /**
     * Returns a byte representation of the Instance.
     */
    Instance.prototype.toBytes = function () {
        return Buffer.from(JSON.stringify(this));
    };
    return Instance;
}());
exports.default = Instance;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5zdGFuY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbnN0YW5jZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBTUE7O0dBRUc7QUFDSDtJQWdESSxrQkFBWSxJQUFxQztRQUM3QyxJQUFJLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUM7UUFDbEIsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDO1FBQ2xDLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztRQUMxQixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7SUFDMUIsQ0FBQztJQXBERDs7OztPQUlHO0lBQ0ksa0JBQVMsR0FBaEIsVUFBaUIsRUFBYyxFQUFFLENBQVE7UUFDckMsSUFBSSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLEVBQUU7WUFDZixNQUFNLElBQUksS0FBSyxDQUFDLHVCQUFxQixFQUFFLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBRyxDQUFDLENBQUM7U0FDOUQ7UUFFRCxPQUFPLElBQUksUUFBUSxDQUFDLEVBQUMsRUFBRSxJQUFBLEVBQUUsVUFBVSxFQUFFLENBQUMsQ0FBQyxVQUFVLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxLQUFLLEVBQUMsQ0FBQyxDQUFDO0lBQ3pGLENBQUM7SUFFRDs7Ozs7OztPQU9HO0lBQ1Usb0JBQVcsR0FBeEIsVUFBeUIsR0FBZSxFQUFFLEdBQWUsRUFBRSxTQUFxQixFQUFFLFFBQXVCO1FBQTlDLDBCQUFBLEVBQUEsYUFBcUI7UUFBRSx5QkFBQSxFQUFBLGVBQXVCOzs7Ozs0QkFFM0YscUJBQU0sR0FBRyxDQUFDLGtCQUFrQixDQUFDLEdBQUcsRUFBRSxTQUFTLEVBQUUsUUFBUSxDQUFDLEVBQUE7O3dCQUExRCxDQUFDLEdBQUcsU0FBc0Q7d0JBRWhFLHNCQUFPLFFBQVEsQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFDOzs7O0tBQ3JDO0lBRUQ7OztPQUdHO0lBQ0ksa0JBQVMsR0FBaEIsVUFBaUIsR0FBVztRQUN4QixJQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBQ3ZDLE9BQU8sSUFBSSxRQUFRLENBQUM7WUFDaEIsVUFBVSxFQUFFLEdBQUcsQ0FBQyxVQUFVO1lBQzFCLE1BQU0sRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUM7WUFDL0IsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQztZQUMzQixFQUFFLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO1NBQzFCLENBQUMsQ0FBQztJQUNQLENBQUM7SUFjRDs7T0FFRztJQUNILDBCQUFPLEdBQVA7UUFDSSxPQUFPLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQzdDLENBQUM7SUFDTCxlQUFDO0FBQUQsQ0FBQyxBQTdERCxJQTZEQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFByb3BlcnRpZXMgfSBmcm9tIFwicHJvdG9idWZqc1wiO1xuaW1wb3J0IEJ5ekNvaW5SUEMgZnJvbSBcIi4vYnl6Y29pbi1ycGNcIjtcbmltcG9ydCBQcm9vZiBmcm9tIFwiLi9wcm9vZlwiO1xuXG5leHBvcnQgdHlwZSBJbnN0YW5jZUlEID0gQnVmZmVyO1xuXG4vKipcbiAqIEluc3RhbmNlIHdpdGggYmFzaWMgaW5mb3JtYXRpb25cbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgSW5zdGFuY2Uge1xuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhbiBpbnN0YW5jZSBmcm9tIGEgcHJvb2ZcbiAgICAgKiBAcGFyYW0gcCBUaGUgcHJvb2ZcbiAgICAgKiBAcmV0dXJucyB0aGUgaW5zdGFuY2VcbiAgICAgKi9cbiAgICBzdGF0aWMgZnJvbVByb29mKGlkOiBJbnN0YW5jZUlELCBwOiBQcm9vZik6IEluc3RhbmNlIHtcbiAgICAgICAgaWYgKCFwLmV4aXN0cyhpZCkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihga2V5IG5vdCBpbiBwcm9vZjogJHtpZC50b1N0cmluZyhcImhleFwiKX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBuZXcgSW5zdGFuY2Uoe2lkLCBjb250cmFjdElEOiBwLmNvbnRyYWN0SUQsIGRhcmNJRDogcC5kYXJjSUQsIGRhdGE6IHAudmFsdWV9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgYW4gaW5zdGFuY2UgYWZ0ZXIgcmVxdWVzdGluZyBpdHMgcHJvb2YgdG8gYnl6Y29pblxuICAgICAqIEBwYXJhbSBycGMgICBUaGUgUlBDIHRvIHVzZVxuICAgICAqIEBwYXJhbSBpZCAgICBUaGUgSUQgb2YgdGhlIGluc3RhbmNlXG4gICAgICogQHBhcmFtIHdhaXRNYXRjaCBob3cgbWFueSB0aW1lcyB0byB3YWl0IGZvciBhIG1hdGNoIC0gdXNlZnVsIGlmIGl0cyBjYWxsZWQganVzdCBhZnRlciBhbiBhZGRUcmFuc2FjdGlvbkFuZFdhaXQuXG4gICAgICogQHBhcmFtIGludGVydmFsIGhvdyBsb25nIHRvIHdhaXQgYmV0d2VlbiB0d28gYXR0ZW1wdHMgaW4gd2FpdE1hdGNoLlxuICAgICAqIEByZXR1cm5zIHRoZSBpbnN0YW5jZSBpZiBpdCBleGlzdHNcbiAgICAgKi9cbiAgICBzdGF0aWMgYXN5bmMgZnJvbUJ5emNvaW4ocnBjOiBCeXpDb2luUlBDLCBpaWQ6IEluc3RhbmNlSUQsIHdhaXRNYXRjaDogbnVtYmVyID0gMCwgaW50ZXJ2YWw6IG51bWJlciA9IDEwMDApOlxuICAgICAgICBQcm9taXNlPEluc3RhbmNlPiB7XG4gICAgICAgIGNvbnN0IHAgPSBhd2FpdCBycGMuZ2V0UHJvb2ZGcm9tTGF0ZXN0KGlpZCwgd2FpdE1hdGNoLCBpbnRlcnZhbCk7XG5cbiAgICAgICAgcmV0dXJuIEluc3RhbmNlLmZyb21Qcm9vZihpaWQsIHApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYW4gaW5zdGFuY2UgZnJvbSBhIHByZXZpb3VzbHkgdG9CeXRlcygpIGNhbGwuXG4gICAgICogQHBhcmFtIGJ1ZlxuICAgICAqL1xuICAgIHN0YXRpYyBmcm9tQnl0ZXMoYnVmOiBCdWZmZXIpOiBJbnN0YW5jZSB7XG4gICAgICAgIGNvbnN0IG9iaiA9IEpTT04ucGFyc2UoYnVmLnRvU3RyaW5nKCkpO1xuICAgICAgICByZXR1cm4gbmV3IEluc3RhbmNlKHtcbiAgICAgICAgICAgIGNvbnRyYWN0SUQ6IG9iai5jb250cmFjdElELFxuICAgICAgICAgICAgZGFyY0lEOiBCdWZmZXIuZnJvbShvYmouZGFyY0lEKSxcbiAgICAgICAgICAgIGRhdGE6IEJ1ZmZlci5mcm9tKG9iai5kYXRhKSxcbiAgICAgICAgICAgIGlkOiBCdWZmZXIuZnJvbShvYmouaWQpLFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICByZWFkb25seSBpZDogSW5zdGFuY2VJRDtcbiAgICByZWFkb25seSBjb250cmFjdElEOiBzdHJpbmc7XG4gICAgZGFyY0lEOiBJbnN0YW5jZUlEO1xuICAgIGRhdGE6IEJ1ZmZlcjtcblxuICAgIGNvbnN0cnVjdG9yKGluaXQ6IFByb3BlcnRpZXM8SW5zdGFuY2U+IHwgSW5zdGFuY2UpIHtcbiAgICAgICAgdGhpcy5pZCA9IGluaXQuaWQ7XG4gICAgICAgIHRoaXMuY29udHJhY3RJRCA9IGluaXQuY29udHJhY3RJRDtcbiAgICAgICAgdGhpcy5kYXJjSUQgPSBpbml0LmRhcmNJRDtcbiAgICAgICAgdGhpcy5kYXRhID0gaW5pdC5kYXRhO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSBieXRlIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBJbnN0YW5jZS5cbiAgICAgKi9cbiAgICB0b0J5dGVzKCk6IEJ1ZmZlciB7XG4gICAgICAgIHJldHVybiBCdWZmZXIuZnJvbShKU09OLnN0cmluZ2lmeSh0aGlzKSk7XG4gICAgfVxufVxuIl19