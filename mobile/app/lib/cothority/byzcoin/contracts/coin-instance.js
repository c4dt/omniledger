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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var crypto_browserify_1 = require("crypto-browserify");
var light_1 = require("protobufjs/light");
var protobuf_1 = require("../../protobuf");
var client_transaction_1 = __importStar(require("../client-transaction"));
var instance_1 = __importDefault(require("../instance"));
var CoinInstance = /** @class */ (function (_super) {
    __extends(CoinInstance, _super);
    /**
     * Constructs a new CoinInstance. If the instance is not of type CoinInstance,
     * an error will be thrown.
     *
     * @param rpc a working RPC instance
     * @param inst an instance representing a CoinInstance
     */
    function CoinInstance(rpc, inst) {
        var _this = _super.call(this, inst) || this;
        _this.rpc = rpc;
        if (inst.contractID.toString() !== CoinInstance.contractID) {
            throw new Error("mismatch contract name: " + inst.contractID + " vs " + CoinInstance.contractID);
        }
        _this._coin = Coin.decode(inst.data);
        return _this;
    }
    /**
     * Generate the coin instance ID for a given darc ID
     *
     * @param buf Any buffer that is known to the caller
     * @returns the id as a buffer
     */
    CoinInstance.coinIID = function (buf) {
        var h = crypto_browserify_1.createHash("sha256");
        h.update(Buffer.from(CoinInstance.contractID));
        h.update(buf);
        return h.digest();
    };
    /**
     * Spawn a coin instance from a darc id
     *
     * @param bc        The RPC to use
     * @param darcID    The darc instance ID
     * @param signers   The list of signers for the transaction
     * @param type      The coin instance type
     * @returns a promise that resolves with the new instance
     */
    CoinInstance.spawn = function (bc, darcID, signers, type) {
        return __awaiter(this, void 0, void 0, function () {
            var inst, ctx;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        inst = client_transaction_1.Instruction.createSpawn(darcID, CoinInstance.contractID, [new client_transaction_1.Argument({ name: CoinInstance.argumentType, value: type })]);
                        return [4 /*yield*/, inst.updateCounters(bc, signers)];
                    case 1:
                        _a.sent();
                        ctx = new client_transaction_1.default({ instructions: [inst] });
                        ctx.signWith([signers]);
                        return [4 /*yield*/, bc.sendTransactionAndWait(ctx, 10)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, CoinInstance.fromByzcoin(bc, inst.deriveId())];
                }
            });
        });
    };
    /**
     * Create returns a CoinInstance from the given parameters.
     * @param bc
     * @param coinID
     * @param darcID
     * @param coin
     */
    CoinInstance.create = function (bc, coinID, darcID, coin) {
        return new CoinInstance(bc, new instance_1.default({
            contractID: CoinInstance.contractID,
            darcID: darcID,
            data: coin.toBytes(),
            id: coinID,
        }));
    };
    /**
     * Initializes using an existing coinInstance from ByzCoin
     * @param bc    The RPC to use
     * @param iid   The instance ID
     * @param waitMatch how many times to wait for a match - useful if its called just after an addTransactionAndWait.
     * @param interval how long to wait between two attempts in waitMatch.
     * @returns a promise that resolves with the coin instance
     */
    CoinInstance.fromByzcoin = function (bc, iid, waitMatch, interval) {
        if (waitMatch === void 0) { waitMatch = 0; }
        if (interval === void 0) { interval = 1000; }
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _a = CoinInstance.bind;
                        _b = [void 0, bc];
                        return [4 /*yield*/, instance_1.default.fromByzcoin(bc, iid, waitMatch, interval)];
                    case 1: return [2 /*return*/, new (_a.apply(CoinInstance, _b.concat([_c.sent()])))()];
                }
            });
        });
    };
    Object.defineProperty(CoinInstance.prototype, "value", {
        /**
         * @return value of the coin.
         */
        get: function () {
            return this._coin.value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CoinInstance.prototype, "name", {
        /**
         * @return the name of the coin, which is a 32-byte Buffer.
         */
        get: function () {
            return this._coin.name;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Transfer a certain amount of coin to another account.
     *
     * @param coins     the amount
     * @param to        the destination account (must be a coin contract instance id)
     * @param signers   the signers (of the giver account)
     */
    CoinInstance.prototype.transfer = function (coins, to, signers) {
        return __awaiter(this, void 0, void 0, function () {
            var args, inst, ctx;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        args = [
                            new client_transaction_1.Argument({ name: CoinInstance.argumentCoins, value: Buffer.from(coins.toBytesLE()) }),
                            new client_transaction_1.Argument({ name: CoinInstance.argumentDestination, value: to }),
                        ];
                        inst = client_transaction_1.Instruction.createInvoke(this.id, CoinInstance.contractID, CoinInstance.commandTransfer, args);
                        return [4 /*yield*/, inst.updateCounters(this.rpc, signers)];
                    case 1:
                        _a.sent();
                        ctx = new client_transaction_1.default({ instructions: [inst] });
                        ctx.signWith([signers]);
                        return [4 /*yield*/, this.rpc.sendTransactionAndWait(ctx, 10)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Mine a given amount of coins
     *
     * @param signers   The list of signers for the transaction
     * @param amount    The amount to add to the coin instance
     * @param wait      Number of blocks to wait for inclusion
     */
    CoinInstance.prototype.mint = function (signers, amount, wait) {
        return __awaiter(this, void 0, void 0, function () {
            var inst, ctx;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        inst = client_transaction_1.Instruction.createInvoke(this.id, CoinInstance.contractID, CoinInstance.commandMint, [new client_transaction_1.Argument({ name: CoinInstance.argumentCoins, value: Buffer.from(amount.toBytesLE()) })]);
                        return [4 /*yield*/, inst.updateCounters(this.rpc, signers)];
                    case 1:
                        _a.sent();
                        ctx = new client_transaction_1.default({ instructions: [inst] });
                        ctx.signWith([signers]);
                        return [4 /*yield*/, this.rpc.sendTransactionAndWait(ctx, wait)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Update the data of this instance
     *
     * @returns the updated instance
     */
    CoinInstance.prototype.update = function () {
        return __awaiter(this, void 0, void 0, function () {
            var p;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.rpc.getProofFromLatest(this.id)];
                    case 1:
                        p = _a.sent();
                        if (!p.exists(this.id)) {
                            throw new Error("fail to get a matching proof");
                        }
                        this._coin = Coin.decode(p.value);
                        return [2 /*return*/, this];
                }
            });
        });
    };
    CoinInstance.contractID = "coin";
    CoinInstance.commandMint = "mint";
    CoinInstance.commandFetch = "fetch";
    CoinInstance.commandTransfer = "transfer";
    CoinInstance.commandStore = "store";
    CoinInstance.argumentCoinID = "coinID";
    CoinInstance.argumentDarcID = "darcID";
    CoinInstance.argumentType = "type";
    CoinInstance.argumentCoins = "coins";
    CoinInstance.argumentDestination = "destination";
    return CoinInstance;
}(instance_1.default));
exports.default = CoinInstance;
var Coin = /** @class */ (function (_super) {
    __extends(Coin, _super);
    function Coin(props) {
        var _this = _super.call(this, props) || this;
        _this.name = Buffer.from(_this.name || protobuf_1.EMPTY_BUFFER);
        return _this;
    }
    /**
     * @see README#Message classes
     */
    Coin.register = function () {
        protobuf_1.registerMessage("byzcoin.Coin", Coin);
    };
    Coin.prototype.toBytes = function () {
        return Buffer.from(Coin.encode(this).finish());
    };
    return Coin;
}(light_1.Message));
exports.Coin = Coin;
Coin.register();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29pbi1pbnN0YW5jZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNvaW4taW5zdGFuY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsdURBQStDO0FBRS9DLDBDQUF1RDtBQUV2RCwyQ0FBK0Q7QUFFL0QsMEVBQWlGO0FBQ2pGLHlEQUFtRDtBQUVuRDtJQUEwQyxnQ0FBUTtJQXlHOUM7Ozs7OztPQU1HO0lBQ0gsc0JBQW9CLEdBQWUsRUFBRSxJQUFjO1FBQW5ELFlBQ0ksa0JBQU0sSUFBSSxDQUFDLFNBTWQ7UUFQbUIsU0FBRyxHQUFILEdBQUcsQ0FBWTtRQUUvQixJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxFQUFFLEtBQUssWUFBWSxDQUFDLFVBQVUsRUFBRTtZQUN4RCxNQUFNLElBQUksS0FBSyxDQUFDLDZCQUEyQixJQUFJLENBQUMsVUFBVSxZQUFPLFlBQVksQ0FBQyxVQUFZLENBQUMsQ0FBQztTQUMvRjtRQUVELEtBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7O0lBQ3hDLENBQUM7SUEzR0Q7Ozs7O09BS0c7SUFDSSxvQkFBTyxHQUFkLFVBQWUsR0FBVztRQUN0QixJQUFNLENBQUMsR0FBRyw4QkFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQy9CLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztRQUMvQyxDQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2QsT0FBTyxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUM7SUFDdEIsQ0FBQztJQUVEOzs7Ozs7OztPQVFHO0lBQ1Usa0JBQUssR0FBbEIsVUFDSSxFQUFjLEVBQ2QsTUFBa0IsRUFDbEIsT0FB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LElBQUksQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7SUFDbkQsQ0FBQztJQUNMLFdBQUM7QUFBRCxDQUFDLEFBcEJELENBQTBCLGVBQU8sR0FvQmhDO0FBcEJZLG9CQUFJO0FBc0JqQixJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBjcmVhdGVIYXNoIH0gZnJvbSBcImNyeXB0by1icm93c2VyaWZ5XCI7XG5pbXBvcnQgTG9uZyBmcm9tIFwibG9uZ1wiO1xuaW1wb3J0IHsgTWVzc2FnZSwgUHJvcGVydGllcyB9IGZyb20gXCJwcm90b2J1ZmpzL2xpZ2h0XCI7XG5pbXBvcnQgU2lnbmVyIGZyb20gXCIuLi8uLi9kYXJjL3NpZ25lclwiO1xuaW1wb3J0IHsgRU1QVFlfQlVGRkVSLCByZWdpc3Rlck1lc3NhZ2UgfSBmcm9tIFwiLi4vLi4vcHJvdG9idWZcIjtcbmltcG9ydCBCeXpDb2luUlBDIGZyb20gXCIuLi9ieXpjb2luLXJwY1wiO1xuaW1wb3J0IENsaWVudFRyYW5zYWN0aW9uLCB7IEFyZ3VtZW50LCBJbnN0cnVjdGlvbiB9IGZyb20gXCIuLi9jbGllbnQtdHJhbnNhY3Rpb25cIjtcbmltcG9ydCBJbnN0YW5jZSwgeyBJbnN0YW5jZUlEIH0gZnJvbSBcIi4uL2luc3RhbmNlXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIENvaW5JbnN0YW5jZSBleHRlbmRzIEluc3RhbmNlIHtcbiAgICBzdGF0aWMgcmVhZG9ubHkgY29udHJhY3RJRCA9IFwiY29pblwiO1xuICAgIHN0YXRpYyByZWFkb25seSBjb21tYW5kTWludCA9IFwibWludFwiO1xuICAgIHN0YXRpYyByZWFkb25seSBjb21tYW5kRmV0Y2ggPSBcImZldGNoXCI7XG4gICAgc3RhdGljIHJlYWRvbmx5IGNvbW1hbmRUcmFuc2ZlciA9IFwidHJhbnNmZXJcIjtcbiAgICBzdGF0aWMgcmVhZG9ubHkgY29tbWFuZFN0b3JlID0gXCJzdG9yZVwiO1xuICAgIHN0YXRpYyByZWFkb25seSBhcmd1bWVudENvaW5JRCA9IFwiY29pbklEXCI7XG4gICAgc3RhdGljIHJlYWRvbmx5IGFyZ3VtZW50RGFyY0lEID0gXCJkYXJjSURcIjtcbiAgICBzdGF0aWMgcmVhZG9ubHkgYXJndW1lbnRUeXBlID0gXCJ0eXBlXCI7XG4gICAgc3RhdGljIHJlYWRvbmx5IGFyZ3VtZW50Q29pbnMgPSBcImNvaW5zXCI7XG4gICAgc3RhdGljIHJlYWRvbmx5IGFyZ3VtZW50RGVzdGluYXRpb24gPSBcImRlc3RpbmF0aW9uXCI7XG5cbiAgICAvKipcbiAgICAgKiBHZW5lcmF0ZSB0aGUgY29pbiBpbnN0YW5jZSBJRCBmb3IgYSBnaXZlbiBkYXJjIElEXG4gICAgICpcbiAgICAgKiBAcGFyYW0gYnVmIEFueSBidWZmZXIgdGhhdCBpcyBrbm93biB0byB0aGUgY2FsbGVyXG4gICAgICogQHJldHVybnMgdGhlIGlkIGFzIGEgYnVmZmVyXG4gICAgICovXG4gICAgc3RhdGljIGNvaW5JSUQoYnVmOiBCdWZmZXIpOiBJbnN0YW5jZUlEIHtcbiAgICAgICAgY29uc3QgaCA9IGNyZWF0ZUhhc2goXCJzaGEyNTZcIik7XG4gICAgICAgIGgudXBkYXRlKEJ1ZmZlci5mcm9tKENvaW5JbnN0YW5jZS5jb250cmFjdElEKSk7XG4gICAgICAgIGgudXBkYXRlKGJ1Zik7XG4gICAgICAgIHJldHVybiBoLmRpZ2VzdCgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNwYXduIGEgY29pbiBpbnN0YW5jZSBmcm9tIGEgZGFyYyBpZFxuICAgICAqXG4gICAgICogQHBhcmFtIGJjICAgICAgICBUaGUgUlBDIHRvIHVzZVxuICAgICAqIEBwYXJhbSBkYXJjSUQgICAgVGhlIGRhcmMgaW5zdGFuY2UgSURcbiAgICAgKiBAcGFyYW0gc2lnbmVycyAgIFRoZSBsaXN0IG9mIHNpZ25lcnMgZm9yIHRoZSB0cmFuc2FjdGlvblxuICAgICAqIEBwYXJhbSB0eXBlICAgICAgVGhlIGNvaW4gaW5zdGFuY2UgdHlwZVxuICAgICAqIEByZXR1cm5zIGEgcHJvbWlzZSB0aGF0IHJlc29sdmVzIHdpdGggdGhlIG5ldyBpbnN0YW5jZVxuICAgICAqL1xuICAgIHN0YXRpYyBhc3luYyBzcGF3bihcbiAgICAgICAgYmM6IEJ5ekNvaW5SUEMsXG4gICAgICAgIGRhcmNJRDogSW5zdGFuY2VJRCxcbiAgICAgICAgc2lnbmVyczogU2lnbmVyW10sXG4gICAgICAgIHR5cGU6IEJ1ZmZlcixcbiAgICApOiBQcm9taXNlPENvaW5JbnN0YW5jZT4ge1xuICAgICAgICBjb25zdCBpbnN0ID0gSW5zdHJ1Y3Rpb24uY3JlYXRlU3Bhd24oXG4gICAgICAgICAgICBkYXJjSUQsXG4gICAgICAgICAgICBDb2luSW5zdGFuY2UuY29udHJhY3RJRCxcbiAgICAgICAgICAgIFtuZXcgQXJndW1lbnQoe25hbWU6IENvaW5JbnN0YW5jZS5hcmd1bWVudFR5cGUsIHZhbHVlOiB0eXBlfSldLFxuICAgICAgICApO1xuICAgICAgICBhd2FpdCBpbnN0LnVwZGF0ZUNvdW50ZXJzKGJjLCBzaWduZXJzKTtcblxuICAgICAgICBjb25zdCBjdHggPSBuZXcgQ2xpZW50VHJhbnNhY3Rpb24oe2luc3RydWN0aW9uczogW2luc3RdfSk7XG4gICAgICAgIGN0eC5zaWduV2l0aChbc2lnbmVyc10pO1xuXG4gICAgICAgIGF3YWl0IGJjLnNlbmRUcmFuc2FjdGlvbkFuZFdhaXQoY3R4LCAxMCk7XG5cbiAgICAgICAgcmV0dXJuIENvaW5JbnN0YW5jZS5mcm9tQnl6Y29pbihiYywgaW5zdC5kZXJpdmVJZCgpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgcmV0dXJucyBhIENvaW5JbnN0YW5jZSBmcm9tIHRoZSBnaXZlbiBwYXJhbWV0ZXJzLlxuICAgICAqIEBwYXJhbSBiY1xuICAgICAqIEBwYXJhbSBjb2luSURcbiAgICAgKiBAcGFyYW0gZGFyY0lEXG4gICAgICogQHBhcmFtIGNvaW5cbiAgICAgKi9cbiAgICBzdGF0aWMgY3JlYXRlKFxuICAgICAgICBiYzogQnl6Q29pblJQQyxcbiAgICAgICAgY29pbklEOiBJbnN0YW5jZUlELFxuICAgICAgICBkYXJjSUQ6IEluc3RhbmNlSUQsXG4gICAgICAgIGNvaW46IENvaW4sXG4gICAgKTogQ29pbkluc3RhbmNlIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDb2luSW5zdGFuY2UoYmMsIG5ldyBJbnN0YW5jZSh7XG4gICAgICAgICAgICBjb250cmFjdElEOiBDb2luSW5zdGFuY2UuY29udHJhY3RJRCxcbiAgICAgICAgICAgIGRhcmNJRCxcbiAgICAgICAgICAgIGRhdGE6IGNvaW4udG9CeXRlcygpLFxuICAgICAgICAgICAgaWQ6IGNvaW5JRCxcbiAgICAgICAgfSkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEluaXRpYWxpemVzIHVzaW5nIGFuIGV4aXN0aW5nIGNvaW5JbnN0YW5jZSBmcm9tIEJ5ekNvaW5cbiAgICAgKiBAcGFyYW0gYmMgICAgVGhlIFJQQyB0byB1c2VcbiAgICAgKiBAcGFyYW0gaWlkICAgVGhlIGluc3RhbmNlIElEXG4gICAgICogQHBhcmFtIHdhaXRNYXRjaCBob3cgbWFueSB0aW1lcyB0byB3YWl0IGZvciBhIG1hdGNoIC0gdXNlZnVsIGlmIGl0cyBjYWxsZWQganVzdCBhZnRlciBhbiBhZGRUcmFuc2FjdGlvbkFuZFdhaXQuXG4gICAgICogQHBhcmFtIGludGVydmFsIGhvdyBsb25nIHRvIHdhaXQgYmV0d2VlbiB0d28gYXR0ZW1wdHMgaW4gd2FpdE1hdGNoLlxuICAgICAqIEByZXR1cm5zIGEgcHJvbWlzZSB0aGF0IHJlc29sdmVzIHdpdGggdGhlIGNvaW4gaW5zdGFuY2VcbiAgICAgKi9cbiAgICBzdGF0aWMgYXN5bmMgZnJvbUJ5emNvaW4oYmM6IEJ5ekNvaW5SUEMsIGlpZDogSW5zdGFuY2VJRCwgd2FpdE1hdGNoOiBudW1iZXIgPSAwLCBpbnRlcnZhbDogbnVtYmVyID0gMTAwMCk6XG4gICAgICAgIFByb21pc2U8Q29pbkluc3RhbmNlPiB7XG4gICAgICAgIHJldHVybiBuZXcgQ29pbkluc3RhbmNlKGJjLCBhd2FpdCBJbnN0YW5jZS5mcm9tQnl6Y29pbihiYywgaWlkLCB3YWl0TWF0Y2gsIGludGVydmFsKSk7XG4gICAgfVxuXG4gICAgX2NvaW46IENvaW47XG5cbiAgICAvKipcbiAgICAgKiBAcmV0dXJuIHZhbHVlIG9mIHRoZSBjb2luLlxuICAgICAqL1xuICAgIGdldCB2YWx1ZSgpOiBMb25nIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2NvaW4udmFsdWU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQHJldHVybiB0aGUgbmFtZSBvZiB0aGUgY29pbiwgd2hpY2ggaXMgYSAzMi1ieXRlIEJ1ZmZlci5cbiAgICAgKi9cbiAgICBnZXQgbmFtZSgpOiBCdWZmZXIge1xuICAgICAgICByZXR1cm4gdGhpcy5fY29pbi5uYW1lO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnN0cnVjdHMgYSBuZXcgQ29pbkluc3RhbmNlLiBJZiB0aGUgaW5zdGFuY2UgaXMgbm90IG9mIHR5cGUgQ29pbkluc3RhbmNlLFxuICAgICAqIGFuIGVycm9yIHdpbGwgYmUgdGhyb3duLlxuICAgICAqXG4gICAgICogQHBhcmFtIHJwYyBhIHdvcmtpbmcgUlBDIGluc3RhbmNlXG4gICAgICogQHBhcmFtIGluc3QgYW4gaW5zdGFuY2UgcmVwcmVzZW50aW5nIGEgQ29pbkluc3RhbmNlXG4gICAgICovXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBycGM6IEJ5ekNvaW5SUEMsIGluc3Q6IEluc3RhbmNlKSB7XG4gICAgICAgIHN1cGVyKGluc3QpO1xuICAgICAgICBpZiAoaW5zdC5jb250cmFjdElELnRvU3RyaW5nKCkgIT09IENvaW5JbnN0YW5jZS5jb250cmFjdElEKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYG1pc21hdGNoIGNvbnRyYWN0IG5hbWU6ICR7aW5zdC5jb250cmFjdElEfSB2cyAke0NvaW5JbnN0YW5jZS5jb250cmFjdElEfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fY29pbiA9IENvaW4uZGVjb2RlKGluc3QuZGF0YSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVHJhbnNmZXIgYSBjZXJ0YWluIGFtb3VudCBvZiBjb2luIHRvIGFub3RoZXIgYWNjb3VudC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBjb2lucyAgICAgdGhlIGFtb3VudFxuICAgICAqIEBwYXJhbSB0byAgICAgICAgdGhlIGRlc3RpbmF0aW9uIGFjY291bnQgKG11c3QgYmUgYSBjb2luIGNvbnRyYWN0IGluc3RhbmNlIGlkKVxuICAgICAqIEBwYXJhbSBzaWduZXJzICAgdGhlIHNpZ25lcnMgKG9mIHRoZSBnaXZlciBhY2NvdW50KVxuICAgICAqL1xuICAgIGFzeW5jIHRyYW5zZmVyKGNvaW5zOiBMb25nLCB0bzogQnVmZmVyLCBzaWduZXJzOiBTaWduZXJbXSk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBjb25zdCBhcmdzID0gW1xuICAgICAgICAgICAgbmV3IEFyZ3VtZW50KHtuYW1lOiBDb2luSW5zdGFuY2UuYXJndW1lbnRDb2lucywgdmFsdWU6IEJ1ZmZlci5mcm9tKGNvaW5zLnRvQnl0ZXNMRSgpKX0pLFxuICAgICAgICAgICAgbmV3IEFyZ3VtZW50KHtuYW1lOiBDb2luSW5zdGFuY2UuYXJndW1lbnREZXN0aW5hdGlvbiwgdmFsdWU6IHRvfSksXG4gICAgICAgIF07XG5cbiAgICAgICAgY29uc3QgaW5zdCA9IEluc3RydWN0aW9uLmNyZWF0ZUludm9rZSh0aGlzLmlkLCBDb2luSW5zdGFuY2UuY29udHJhY3RJRCwgQ29pbkluc3RhbmNlLmNvbW1hbmRUcmFuc2ZlciwgYXJncyk7XG4gICAgICAgIGF3YWl0IGluc3QudXBkYXRlQ291bnRlcnModGhpcy5ycGMsIHNpZ25lcnMpO1xuXG4gICAgICAgIGNvbnN0IGN0eCA9IG5ldyBDbGllbnRUcmFuc2FjdGlvbih7aW5zdHJ1Y3Rpb25zOiBbaW5zdF19KTtcbiAgICAgICAgY3R4LnNpZ25XaXRoKFtzaWduZXJzXSk7XG5cbiAgICAgICAgYXdhaXQgdGhpcy5ycGMuc2VuZFRyYW5zYWN0aW9uQW5kV2FpdChjdHgsIDEwKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBNaW5lIGEgZ2l2ZW4gYW1vdW50IG9mIGNvaW5zXG4gICAgICpcbiAgICAgKiBAcGFyYW0gc2lnbmVycyAgIFRoZSBsaXN0IG9mIHNpZ25lcnMgZm9yIHRoZSB0cmFuc2FjdGlvblxuICAgICAqIEBwYXJhbSBhbW91bnQgICAgVGhlIGFtb3VudCB0byBhZGQgdG8gdGhlIGNvaW4gaW5zdGFuY2VcbiAgICAgKiBAcGFyYW0gd2FpdCAgICAgIE51bWJlciBvZiBibG9ja3MgdG8gd2FpdCBmb3IgaW5jbHVzaW9uXG4gICAgICovXG4gICAgYXN5bmMgbWludChzaWduZXJzOiBTaWduZXJbXSwgYW1vdW50OiBMb25nLCB3YWl0PzogbnVtYmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGNvbnN0IGluc3QgPSBJbnN0cnVjdGlvbi5jcmVhdGVJbnZva2UoXG4gICAgICAgICAgICB0aGlzLmlkLFxuICAgICAgICAgICAgQ29pbkluc3RhbmNlLmNvbnRyYWN0SUQsXG4gICAgICAgICAgICBDb2luSW5zdGFuY2UuY29tbWFuZE1pbnQsXG4gICAgICAgICAgICBbbmV3IEFyZ3VtZW50KHtuYW1lOiBDb2luSW5zdGFuY2UuYXJndW1lbnRDb2lucywgdmFsdWU6IEJ1ZmZlci5mcm9tKGFtb3VudC50b0J5dGVzTEUoKSl9KV0sXG4gICAgICAgICk7XG4gICAgICAgIGF3YWl0IGluc3QudXBkYXRlQ291bnRlcnModGhpcy5ycGMsIHNpZ25lcnMpO1xuXG4gICAgICAgIGNvbnN0IGN0eCA9IG5ldyBDbGllbnRUcmFuc2FjdGlvbih7aW5zdHJ1Y3Rpb25zOiBbaW5zdF19KTtcbiAgICAgICAgY3R4LnNpZ25XaXRoKFtzaWduZXJzXSk7XG5cbiAgICAgICAgYXdhaXQgdGhpcy5ycGMuc2VuZFRyYW5zYWN0aW9uQW5kV2FpdChjdHgsIHdhaXQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVwZGF0ZSB0aGUgZGF0YSBvZiB0aGlzIGluc3RhbmNlXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB0aGUgdXBkYXRlZCBpbnN0YW5jZVxuICAgICAqL1xuICAgIGFzeW5jIHVwZGF0ZSgpOiBQcm9taXNlPENvaW5JbnN0YW5jZT4ge1xuICAgICAgICBjb25zdCBwID0gYXdhaXQgdGhpcy5ycGMuZ2V0UHJvb2ZGcm9tTGF0ZXN0KHRoaXMuaWQpO1xuICAgICAgICBpZiAoIXAuZXhpc3RzKHRoaXMuaWQpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJmYWlsIHRvIGdldCBhIG1hdGNoaW5nIHByb29mXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fY29pbiA9IENvaW4uZGVjb2RlKHAudmFsdWUpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBDb2luIGV4dGVuZHMgTWVzc2FnZTxDb2luPiB7XG4gICAgLyoqXG4gICAgICogQHNlZSBSRUFETUUjTWVzc2FnZSBjbGFzc2VzXG4gICAgICovXG4gICAgc3RhdGljIHJlZ2lzdGVyKCkge1xuICAgICAgICByZWdpc3Rlck1lc3NhZ2UoXCJieXpjb2luLkNvaW5cIiwgQ29pbik7XG4gICAgfVxuXG4gICAgbmFtZTogQnVmZmVyO1xuICAgIHZhbHVlOiBMb25nO1xuXG4gICAgY29uc3RydWN0b3IocHJvcHM/OiBQcm9wZXJ0aWVzPENvaW4+KSB7XG4gICAgICAgIHN1cGVyKHByb3BzKTtcblxuICAgICAgICB0aGlzLm5hbWUgPSBCdWZmZXIuZnJvbSh0aGlzLm5hbWUgfHwgRU1QVFlfQlVGRkVSKTtcbiAgICB9XG5cbiAgICB0b0J5dGVzKCk6IEJ1ZmZlciB7XG4gICAgICAgIHJldHVybiBCdWZmZXIuZnJvbShDb2luLmVuY29kZSh0aGlzKS5maW5pc2goKSk7XG4gICAgfVxufVxuXG5Db2luLnJlZ2lzdGVyKCk7XG4iXX0=