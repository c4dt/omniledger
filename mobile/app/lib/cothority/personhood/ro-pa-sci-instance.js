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
var light_1 = require("protobufjs/light");
var client_transaction_1 = __importStar(require("../byzcoin/client-transaction"));
var coin_instance_1 = __importDefault(require("../byzcoin/contracts/coin-instance"));
var instance_1 = __importDefault(require("../byzcoin/instance"));
var protobuf_1 = require("../protobuf");
var RoPaSciInstance = /** @class */ (function (_super) {
    __extends(RoPaSciInstance, _super);
    function RoPaSciInstance(rpc, inst) {
        var _this = _super.call(this, inst) || this;
        _this.rpc = rpc;
        if (inst.contractID.toString() !== RoPaSciInstance.contractID) {
            throw new Error("mismatch contract name: " + inst.contractID + " vs " + RoPaSciInstance.contractID);
        }
        _this.struct = RoPaSciStruct.decode(_this.data);
        return _this;
    }
    Object.defineProperty(RoPaSciInstance.prototype, "stake", {
        get: function () {
            return this.struct.stake;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RoPaSciInstance.prototype, "playerChoice", {
        get: function () {
            return this.struct.firstPlayer;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RoPaSciInstance.prototype, "adversaryID", {
        /**
         * Getter for the second player ID
         * @returns id as a buffer
         */
        get: function () {
            return this.struct.secondPlayerAccount;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RoPaSciInstance.prototype, "adversaryChoice", {
        /**
         * Getter for the second player choice
         * @returns the choice as a number
         */
        get: function () {
            return this.struct.secondPlayer;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Fetch the proof for the given instance and create a
     * RoPaSciInstance from it
     *
     * @param bc    The ByzCoinRPC to use
     * @param iid   The instance ID
     * @param waitMatch how many times to wait for a match - useful if its called just after an addTransactionAndWait.
     * @param interval how long to wait between two attempts in waitMatch.
     * @returns the new instance
     */
    RoPaSciInstance.fromByzcoin = function (bc, iid, waitMatch, interval) {
        if (waitMatch === void 0) { waitMatch = 0; }
        if (interval === void 0) { interval = 1000; }
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _a = RoPaSciInstance.bind;
                        _b = [void 0, bc];
                        return [4 /*yield*/, instance_1.default.fromByzcoin(bc, iid, waitMatch, interval)];
                    case 1: return [2 /*return*/, new (_a.apply(RoPaSciInstance, _b.concat([_c.sent()])))()];
                }
            });
        });
    };
    /**
     * Update the instance data
     *
     * @param choice The choice of the first player
     * @param fillup The fillup of the first player
     */
    RoPaSciInstance.prototype.setChoice = function (choice, fillup) {
        this.firstMove = choice;
        this.fillUp = fillup;
    };
    /**
     * Check if both players have played their moves
     *
     * @returns true when both have played, false otherwise
     */
    RoPaSciInstance.prototype.isDone = function () {
        return this.struct.secondPlayer >= 0;
    };
    /**
     * Play the adversary move
     *
     * @param coin      The CoinInstance of the second player
     * @param signer    Signer for the transaction
     * @param choice    The choice of the second player
     * @returns a promise that resolves on success, or rejects with the error
     */
    RoPaSciInstance.prototype.second = function (coin, signer, choice) {
        return __awaiter(this, void 0, void 0, function () {
            var ctx;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!coin.name.equals(this.struct.stake.name)) {
                            throw new Error("not correct coin-type for player 2");
                        }
                        if (coin.value.lessThan(this.struct.stake.value)) {
                            throw new Error("don't have enough coins to match stake");
                        }
                        ctx = new client_transaction_1.default({
                            instructions: [
                                client_transaction_1.Instruction.createInvoke(coin.id, coin_instance_1.default.contractID, coin_instance_1.default.commandFetch, [
                                    new client_transaction_1.Argument({ name: coin_instance_1.default.argumentCoins,
                                        value: Buffer.from(this.struct.stake.value.toBytesLE()) }),
                                ]),
                                client_transaction_1.Instruction.createInvoke(this.id, RoPaSciInstance.contractID, "second", [
                                    new client_transaction_1.Argument({ name: "account", value: coin.id }),
                                    new client_transaction_1.Argument({ name: "choice", value: Buffer.from([choice % 3]) }),
                                ]),
                            ],
                        });
                        return [4 /*yield*/, ctx.updateCountersAndSign(this.rpc, [[signer], []])];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.rpc.sendTransactionAndWait(ctx)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Reveal the move of the first player
     *
     * @param coin The CoinInstance of the first player
     * @returns a promise that resolves on success, or rejects
     * with the error
     */
    RoPaSciInstance.prototype.confirm = function (coin) {
        return __awaiter(this, void 0, void 0, function () {
            var preHash, ctx;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!coin.name.equals(this.struct.stake.name)) {
                            throw new Error("not correct coin-type for player 1");
                        }
                        preHash = Buffer.alloc(32, 0);
                        preHash[0] = this.firstMove % 3;
                        this.fillUp.copy(preHash, 1);
                        ctx = new client_transaction_1.default({
                            instructions: [
                                client_transaction_1.Instruction.createInvoke(this.id, RoPaSciInstance.contractID, "confirm", [
                                    new client_transaction_1.Argument({ name: "prehash", value: preHash }),
                                    new client_transaction_1.Argument({ name: "account", value: coin.id }),
                                ]),
                            ],
                        });
                        return [4 /*yield*/, this.rpc.sendTransactionAndWait(ctx)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.update()];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Update the state of the instance
     *
     * @returns a promise that resolves with the updated instance,
     * or rejects with the error
     */
    RoPaSciInstance.prototype.update = function () {
        return __awaiter(this, void 0, void 0, function () {
            var proof, inst;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.rpc.getProofFromLatest(this.id)];
                    case 1:
                        proof = _a.sent();
                        if (!proof.exists(this.id)) {
                            throw new Error("fail to get a matching proof");
                        }
                        inst = instance_1.default.fromProof(this.id, proof);
                        this.data = inst.data;
                        this.struct = RoPaSciStruct.decode(this.data);
                        return [2 /*return*/, this];
                }
            });
        });
    };
    RoPaSciInstance.contractID = "ropasci";
    return RoPaSciInstance;
}(instance_1.default));
exports.default = RoPaSciInstance;
/**
 * Data hold by a rock-paper-scissors instance
 */
var RoPaSciStruct = /** @class */ (function (_super) {
    __extends(RoPaSciStruct, _super);
    function RoPaSciStruct(props) {
        var _this = _super.call(this, props) || this;
        _this.firstPlayerHash = Buffer.from(_this.firstPlayerHash || protobuf_1.EMPTY_BUFFER);
        _this.secondPlayerAccount = Buffer.from(_this.secondPlayerAccount || protobuf_1.EMPTY_BUFFER);
        Object.defineProperty(_this, "firstplayer", {
            get: function () {
                return this.firstPlayer;
            },
            set: function (value) {
                this.firstPlayer = value;
            },
        });
        Object.defineProperty(_this, "firstplayerhash", {
            get: function () {
                return this.firstPlayerHash;
            },
            set: function (value) {
                this.firstPlayerHash = value;
            },
        });
        Object.defineProperty(_this, "secondplayer", {
            get: function () {
                return this.secondPlayer;
            },
            set: function (value) {
                this.secondPlayer = value;
            },
        });
        Object.defineProperty(_this, "secondplayeraccount", {
            get: function () {
                return this.secondPlayerAccount;
            },
            set: function (value) {
                this.secondPlayerAccount = value;
            },
        });
        return _this;
    }
    /**
     * @see README#Message classes
     */
    RoPaSciStruct.register = function () {
        protobuf_1.registerMessage("personhood.RoPaSciStruct", RoPaSciStruct);
    };
    /**
     * Helper to encode the struct using protobuf
     *
     * @returns the data as a buffer
     */
    RoPaSciStruct.prototype.toBytes = function () {
        return Buffer.from(RoPaSciStruct.encode(this).finish());
    };
    return RoPaSciStruct;
}(light_1.Message));
exports.RoPaSciStruct = RoPaSciStruct;
RoPaSciStruct.register();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm8tcGEtc2NpLWluc3RhbmNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicm8tcGEtc2NpLWluc3RhbmNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLDBDQUF1RDtBQUV2RCxrRkFBeUY7QUFDekYscUZBQXdFO0FBQ3hFLGlFQUEyRDtBQUUzRCx3Q0FBNEQ7QUFFNUQ7SUFBNkMsbUNBQVE7SUE4Q2pELHlCQUFvQixHQUFlLEVBQUUsSUFBYztRQUFuRCxZQUNJLGtCQUFNLElBQUksQ0FBQyxTQU1kO1FBUG1CLFNBQUcsR0FBSCxHQUFHLENBQVk7UUFFL0IsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsRUFBRSxLQUFLLGVBQWUsQ0FBQyxVQUFVLEVBQUU7WUFDM0QsTUFBTSxJQUFJLEtBQUssQ0FBQyw2QkFBMkIsSUFBSSxDQUFDLFVBQVUsWUFBTyxlQUFlLENBQUMsVUFBWSxDQUFDLENBQUM7U0FDbEc7UUFFRCxLQUFJLENBQUMsTUFBTSxHQUFHLGFBQWEsQ0FBQyxNQUFNLENBQUMsS0FBSSxDQUFDLElBQUksQ0FBQyxDQUFDOztJQUNsRCxDQUFDO0lBbkRELHNCQUFJLGtDQUFLO2FBQVQ7WUFDSSxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDO1FBQzdCLENBQUM7OztPQUFBO0lBRUQsc0JBQUkseUNBQVk7YUFBaEI7WUFDSSxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDO1FBQ25DLENBQUM7OztPQUFBO0lBTUQsc0JBQUksd0NBQVc7UUFKZjs7O1dBR0c7YUFDSDtZQUNJLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQztRQUMzQyxDQUFDOzs7T0FBQTtJQU1ELHNCQUFJLDRDQUFlO1FBSm5COzs7V0FHRzthQUNIO1lBQ0ksT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFD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LE9BQU8sSUFBSSxDQUFDLGVBQWUsQ0FBQztZQUNoQyxDQUFDO1lBQ0QsR0FBRyxZQUFDLEtBQWE7Z0JBQ2IsSUFBSSxDQUFDLGVBQWUsR0FBRyxLQUFLLENBQUM7WUFDakMsQ0FBQztTQUNKLENBQUMsQ0FBQztRQUVILE1BQU0sQ0FBQyxjQUFjLENBQUMsS0FBSSxFQUFFLGNBQWMsRUFBRTtZQUN4QyxHQUFHLEVBQUg7Z0JBQ0ksT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDO1lBQzdCLENBQUM7WUFDRCxHQUFHLFlBQUMsS0FBYTtnQkFDYixJQUFJLENBQUMsWUFBWSxHQUFHLEtBQUssQ0FBQztZQUM5QixDQUFDO1NBQ0osQ0FBQyxDQUFDO1FBRUgsTUFBTSxDQUFDLGNBQWMsQ0FBQyxLQUFJLEVBQUUscUJBQXFCLEVBQUU7WUFDL0MsR0FBRyxFQUFIO2dCQUNJLE9BQU8sSUFBSSxDQUFDLG1CQUFtQixDQUFDO1lBQ3BDLENBQUM7WUFDRCxHQUFHLFlBQUMsS0FBYTtnQkFDYixJQUFJLENBQUMsbUJBQW1CLEdBQUcsS0FBSyxDQUFDO1lBQ3JDLENBQUM7U0FDSixDQUFDLENBQUM7O0lBQ1AsQ0FBQztJQXZERDs7T0FFRztJQUNJLHNCQUFRLEdBQWY7UUFDSSwwQkFBZSxDQUFDLDBCQUEwQixFQUFFLGFBQWEsQ0FBQyxDQUFDO0lBQy9ELENBQUM7SUFvREQ7Ozs7T0FJRztJQUNILCtCQUFPLEdBQVA7UUFDSSxPQUFPLE1BQU0sQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO0lBQzVELENBQUM7SUFDTCxvQkFBQztBQUFELENBQUMsQUFsRUQsQ0FBbUMsZUFBTyxHQWtFekM7QUFsRVksc0NBQWE7QUFvRTFCLGFBQWEsQ0FBQyxRQUFRLEVBQUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE1lc3NhZ2UsIFByb3BlcnRpZXMgfSBmcm9tIFwicHJvdG9idWZqcy9saWdodFwiO1xuaW1wb3J0IEJ5ekNvaW5SUEMgZnJvbSBcIi4uL2J5emNvaW4vYnl6Y29pbi1ycGNcIjtcbmltcG9ydCBDbGllbnRUcmFuc2FjdGlvbiwgeyBBcmd1bWVudCwgSW5zdHJ1Y3Rpb24gfSBmcm9tIFwiLi4vYnl6Y29pbi9jbGllbnQtdHJhbnNhY3Rpb25cIjtcbmltcG9ydCBDb2luSW5zdGFuY2UsIHsgQ29pbiB9IGZyb20gXCIuLi9ieXpjb2luL2NvbnRyYWN0cy9jb2luLWluc3RhbmNlXCI7XG5pbXBvcnQgSW5zdGFuY2UsIHsgSW5zdGFuY2VJRCB9IGZyb20gXCIuLi9ieXpjb2luL2luc3RhbmNlXCI7XG5pbXBvcnQgU2lnbmVyIGZyb20gXCIuLi9kYXJjL3NpZ25lclwiO1xuaW1wb3J0IHsgRU1QVFlfQlVGRkVSLCByZWdpc3Rlck1lc3NhZ2UgfSBmcm9tIFwiLi4vcHJvdG9idWZcIjtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUm9QYVNjaUluc3RhbmNlIGV4dGVuZHMgSW5zdGFuY2Uge1xuXG4gICAgZ2V0IHN0YWtlKCk6IENvaW4ge1xuICAgICAgICByZXR1cm4gdGhpcy5zdHJ1Y3Quc3Rha2U7XG4gICAgfVxuXG4gICAgZ2V0IHBsYXllckNob2ljZSgpOiBudW1iZXIge1xuICAgICAgICByZXR1cm4gdGhpcy5zdHJ1Y3QuZmlyc3RQbGF5ZXI7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0dGVyIGZvciB0aGUgc2Vjb25kIHBsYXllciBJRFxuICAgICAqIEByZXR1cm5zIGlkIGFzIGEgYnVmZmVyXG4gICAgICovXG4gICAgZ2V0IGFkdmVyc2FyeUlEKCk6IEJ1ZmZlciB7XG4gICAgICAgIHJldHVybiB0aGlzLnN0cnVjdC5zZWNvbmRQbGF5ZXJBY2NvdW50O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldHRlciBmb3IgdGhlIHNlY29uZCBwbGF5ZXIgY2hvaWNlXG4gICAgICogQHJldHVybnMgdGhlIGNob2ljZSBhcyBhIG51bWJlclxuICAgICAqL1xuICAgIGdldCBhZHZlcnNhcnlDaG9pY2UoKTogbnVtYmVyIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3RydWN0LnNlY29uZFBsYXllcjtcbiAgICB9XG4gICAgc3RhdGljIHJlYWRvbmx5IGNvbnRyYWN0SUQgPSBcInJvcGFzY2lcIjtcblxuICAgIC8qKlxuICAgICAqIEZldGNoIHRoZSBwcm9vZiBmb3IgdGhlIGdpdmVuIGluc3RhbmNlIGFuZCBjcmVhdGUgYVxuICAgICAqIFJvUGFTY2lJbnN0YW5jZSBmcm9tIGl0XG4gICAgICpcbiAgICAgKiBAcGFyYW0gYmMgICAgVGhlIEJ5ekNvaW5SUEMgdG8gdXNlXG4gICAgICogQHBhcmFtIGlpZCAgIFRoZSBpbnN0YW5jZSBJRFxuICAgICAqIEBwYXJhbSB3YWl0TWF0Y2ggaG93IG1hbnkgdGltZXMgdG8gd2FpdCBmb3IgYSBtYXRjaCAtIHVzZWZ1bCBpZiBpdHMgY2FsbGVkIGp1c3QgYWZ0ZXIgYW4gYWRkVHJhbnNhY3Rpb25BbmRXYWl0LlxuICAgICAqIEBwYXJhbSBpbnRlcnZhbCBob3cgbG9uZyB0byB3YWl0IGJldHdlZW4gdHdvIGF0dGVtcHRzIGluIHdhaXRNYXRjaC5cbiAgICAgKiBAcmV0dXJucyB0aGUgbmV3IGluc3RhbmNlXG4gICAgICovXG4gICAgc3RhdGljIGFzeW5jIGZyb21CeXpjb2luKGJjOiBCeXpDb2luUlBDLCBpaWQ6IEluc3RhbmNlSUQsIHdhaXRNYXRjaDogbnVtYmVyID0gMCwgaW50ZXJ2YWw6IG51bWJlciA9IDEwMDApOlxuICAgICAgICBQcm9taXNlPFJvUGFTY2lJbnN0YW5jZT4ge1xuICAgICAgICByZXR1cm4gbmV3IFJvUGFTY2lJbnN0YW5jZShiYywgYXdhaXQgSW5zdGFuY2UuZnJvbUJ5emNvaW4oYmMsIGlpZCwgd2FpdE1hdGNoLCBpbnRlcnZhbCkpO1xuICAgIH1cblxuICAgIHN0cnVjdDogUm9QYVNjaVN0cnVjdDtcbiAgICBmaWxsVXA6IEJ1ZmZlcjtcbiAgICBmaXJzdE1vdmU6IG51bWJlcjtcblxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgcnBjOiBCeXpDb2luUlBDLCBpbnN0OiBJbnN0YW5jZSkge1xuICAgICAgICBzdXBlcihpbnN0KTtcbiAgICAgICAgaWYgKGluc3QuY29udHJhY3RJRC50b1N0cmluZygpICE9PSBSb1BhU2NpSW5zdGFuY2UuY29udHJhY3RJRCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBtaXNtYXRjaCBjb250cmFjdCBuYW1lOiAke2luc3QuY29udHJhY3RJRH0gdnMgJHtSb1BhU2NpSW5zdGFuY2UuY29udHJhY3RJRH1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuc3RydWN0ID0gUm9QYVNjaVN0cnVjdC5kZWNvZGUodGhpcy5kYXRhKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVcGRhdGUgdGhlIGluc3RhbmNlIGRhdGFcbiAgICAgKlxuICAgICAqIEBwYXJhbSBjaG9pY2UgVGhlIGNob2ljZSBvZiB0aGUgZmlyc3QgcGxheWVyXG4gICAgICogQHBhcmFtIGZpbGx1cCBUaGUgZmlsbHVwIG9mIHRoZSBmaXJzdCBwbGF5ZXJcbiAgICAgKi9cbiAgICBzZXRDaG9pY2UoY2hvaWNlOiBudW1iZXIsIGZpbGx1cDogQnVmZmVyKSB7XG4gICAgICAgIHRoaXMuZmlyc3RNb3ZlID0gY2hvaWNlO1xuICAgICAgICB0aGlzLmZpbGxVcCA9IGZpbGx1cDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDaGVjayBpZiBib3RoIHBsYXllcnMgaGF2ZSBwbGF5ZWQgdGhlaXIgbW92ZXNcbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHRydWUgd2hlbiBib3RoIGhhdmUgcGxheWVkLCBmYWxzZSBvdGhlcndpc2VcbiAgICAgKi9cbiAgICBpc0RvbmUoKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiB0aGlzLnN0cnVjdC5zZWNvbmRQbGF5ZXIgPj0gMDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBQbGF5IHRoZSBhZHZlcnNhcnkgbW92ZVxuICAgICAqXG4gICAgICogQHBhcmFtIGNvaW4gICAgICBUaGUgQ29pbkluc3RhbmNlIG9mIHRoZSBzZWNvbmQgcGxheWVyXG4gICAgICogQHBhcmFtIHNpZ25lciAgICBTaWduZXIgZm9yIHRoZSB0cmFuc2FjdGlvblxuICAgICAqIEBwYXJhbSBjaG9pY2UgICAgVGhlIGNob2ljZSBvZiB0aGUgc2Vjb25kIHBsYXllclxuICAgICAqIEByZXR1cm5zIGEgcHJvbWlzZSB0aGF0IHJlc29sdmVzIG9uIHN1Y2Nlc3MsIG9yIHJlamVjdHMgd2l0aCB0aGUgZXJyb3JcbiAgICAgKi9cbiAgICBhc3luYyBzZWNvbmQoY29pbjogQ29pbkluc3RhbmNlLCBzaWduZXI6IFNpZ25lciwgY2hvaWNlOiBudW1iZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgaWYgKCFjb2luLm5hbWUuZXF1YWxzKHRoaXMuc3RydWN0LnN0YWtlLm5hbWUpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJub3QgY29ycmVjdCBjb2luLXR5cGUgZm9yIHBsYXllciAyXCIpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjb2luLnZhbHVlLmxlc3NUaGFuKHRoaXMuc3RydWN0LnN0YWtlLnZhbHVlKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiZG9uJ3QgaGF2ZSBlbm91Z2ggY29pbnMgdG8gbWF0Y2ggc3Rha2VcIik7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBjdHggPSBuZXcgQ2xpZW50VHJhbnNhY3Rpb24oe1xuICAgICAgICAgICAgaW5zdHJ1Y3Rpb25zOiBbXG4gICAgICAgICAgICAgICAgSW5zdHJ1Y3Rpb24uY3JlYXRlSW52b2tlKFxuICAgICAgICAgICAgICAgICAgICBjb2luLmlkLFxuICAgICAgICAgICAgICAgICAgICBDb2luSW5zdGFuY2UuY29udHJhY3RJRCxcbiAgICAgICAgICAgICAgICAgICAgQ29pbkluc3RhbmNlLmNvbW1hbmRGZXRjaCxcbiAgICAgICAgICAgICAgICAgICAgW1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV3IEFyZ3VtZW50KHtuYW1lOiBDb2luSW5zdGFuY2UuYXJndW1lbnRDb2lucyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogQnVmZmVyLmZyb20odGhpcy5zdHJ1Y3Quc3Rha2UudmFsdWUudG9CeXRlc0xFKCkpfSksXG4gICAgICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgICAgICBJbnN0cnVjdGlvbi5jcmVhdGVJbnZva2UoXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaWQsXG4gICAgICAgICAgICAgICAgICAgIFJvUGFTY2lJbnN0YW5jZS5jb250cmFjdElELFxuICAgICAgICAgICAgICAgICAgICBcInNlY29uZFwiLFxuICAgICAgICAgICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXcgQXJndW1lbnQoe25hbWU6IFwiYWNjb3VudFwiLCB2YWx1ZTogY29pbi5pZH0pLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3IEFyZ3VtZW50KHtuYW1lOiBcImNob2ljZVwiLCB2YWx1ZTogQnVmZmVyLmZyb20oW2Nob2ljZSAlIDNdKX0pLFxuICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICksXG4gICAgICAgICAgICBdLFxuICAgICAgICB9KTtcblxuICAgICAgICBhd2FpdCBjdHgudXBkYXRlQ291bnRlcnNBbmRTaWduKHRoaXMucnBjLCBbW3NpZ25lcl0sIFtdXSk7XG5cbiAgICAgICAgYXdhaXQgdGhpcy5ycGMuc2VuZFRyYW5zYWN0aW9uQW5kV2FpdChjdHgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldmVhbCB0aGUgbW92ZSBvZiB0aGUgZmlyc3QgcGxheWVyXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY29pbiBUaGUgQ29pbkluc3RhbmNlIG9mIHRoZSBmaXJzdCBwbGF5ZXJcbiAgICAgKiBAcmV0dXJucyBhIHByb21pc2UgdGhhdCByZXNvbHZlcyBvbiBzdWNjZXNzLCBvciByZWplY3RzXG4gICAgICogd2l0aCB0aGUgZXJyb3JcbiAgICAgKi9cbiAgICBhc3luYyBjb25maXJtKGNvaW46IENvaW5JbnN0YW5jZSk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBpZiAoIWNvaW4ubmFtZS5lcXVhbHModGhpcy5zdHJ1Y3Quc3Rha2UubmFtZSkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIm5vdCBjb3JyZWN0IGNvaW4tdHlwZSBmb3IgcGxheWVyIDFcIik7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBwcmVIYXNoID0gQnVmZmVyLmFsbG9jKDMyLCAwKTtcbiAgICAgICAgcHJlSGFzaFswXSA9IHRoaXMuZmlyc3RNb3ZlICUgMztcbiAgICAgICAgdGhpcy5maWxsVXAuY29weShwcmVIYXNoLCAxKTtcbiAgICAgICAgY29uc3QgY3R4ID0gbmV3IENsaWVudFRyYW5zYWN0aW9uKHtcbiAgICAgICAgICAgIGluc3RydWN0aW9uczogW1xuICAgICAgICAgICAgICAgIEluc3RydWN0aW9uLmNyZWF0ZUludm9rZShcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pZCxcbiAgICAgICAgICAgICAgICAgICAgUm9QYVNjaUluc3RhbmNlLmNvbnRyYWN0SUQsXG4gICAgICAgICAgICAgICAgICAgIFwiY29uZmlybVwiLFxuICAgICAgICAgICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXcgQXJndW1lbnQoe25hbWU6IFwicHJlaGFzaFwiLCB2YWx1ZTogcHJlSGFzaH0pLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3IEFyZ3VtZW50KHtuYW1lOiBcImFjY291bnRcIiwgdmFsdWU6IGNvaW4uaWR9KSxcbiAgICAgICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgXSxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgYXdhaXQgdGhpcy5ycGMuc2VuZFRyYW5zYWN0aW9uQW5kV2FpdChjdHgpO1xuICAgICAgICBhd2FpdCB0aGlzLnVwZGF0ZSgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVwZGF0ZSB0aGUgc3RhdGUgb2YgdGhlIGluc3RhbmNlXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBhIHByb21pc2UgdGhhdCByZXNvbHZlcyB3aXRoIHRoZSB1cGRhdGVkIGluc3RhbmNlLFxuICAgICAqIG9yIHJlamVjdHMgd2l0aCB0aGUgZXJyb3JcbiAgICAgKi9cbiAgICBhc3luYyB1cGRhdGUoKTogUHJvbWlzZTxSb1BhU2NpSW5zdGFuY2U+IHtcbiAgICAgICAgY29uc3QgcHJvb2YgPSBhd2FpdCB0aGlzLnJwYy5nZXRQcm9vZkZyb21MYXRlc3QodGhpcy5pZCk7XG4gICAgICAgIGlmICghcHJvb2YuZXhpc3RzKHRoaXMuaWQpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJmYWlsIHRvIGdldCBhIG1hdGNoaW5nIHByb29mXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgaW5zdCA9IEluc3RhbmNlLmZyb21Qcm9vZih0aGlzLmlkLCBwcm9vZik7XG4gICAgICAgIHRoaXMuZGF0YSA9IGluc3QuZGF0YTtcbiAgICAgICAgdGhpcy5zdHJ1Y3QgPSBSb1BhU2NpU3RydWN0LmRlY29kZSh0aGlzLmRhdGEpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG59XG5cbi8qKlxuICogRGF0YSBob2xkIGJ5IGEgcm9jay1wYXBlci1zY2lzc29ycyBpbnN0YW5jZVxuICovXG5leHBvcnQgY2xhc3MgUm9QYVNjaVN0cnVjdCBleHRlbmRzIE1lc3NhZ2U8Um9QYVNjaVN0cnVjdD4ge1xuICAgIC8qKlxuICAgICAqIEBzZWUgUkVBRE1FI01lc3NhZ2UgY2xhc3Nlc1xuICAgICAqL1xuICAgIHN0YXRpYyByZWdpc3RlcigpIHtcbiAgICAgICAgcmVnaXN0ZXJNZXNzYWdlKFwicGVyc29uaG9vZC5Sb1BhU2NpU3RydWN0XCIsIFJvUGFTY2lTdHJ1Y3QpO1xuICAgIH1cblxuICAgIHJlYWRvbmx5IGRlc2NyaXB0aW9uOiBzdHJpbmc7XG4gICAgcmVhZG9ubHkgc3Rha2U6IENvaW47XG4gICAgcmVhZG9ubHkgZmlyc3RQbGF5ZXJIYXNoOiBCdWZmZXI7XG4gICAgcmVhZG9ubHkgZmlyc3RQbGF5ZXI6IG51bWJlcjtcbiAgICByZWFkb25seSBzZWNvbmRQbGF5ZXI6IG51bWJlcjtcbiAgICByZWFkb25seSBzZWNvbmRQbGF5ZXJBY2NvdW50OiBCdWZmZXI7XG5cbiAgICBjb25zdHJ1Y3Rvcihwcm9wcz86IFByb3BlcnRpZXM8Um9QYVNjaVN0cnVjdD4pIHtcbiAgICAgICAgc3VwZXIocHJvcHMpO1xuXG4gICAgICAgIHRoaXMuZmlyc3RQbGF5ZXJIYXNoID0gQnVmZmVyLmZyb20odGhpcy5maXJzdFBsYXllckhhc2ggfHwgRU1QVFlfQlVGRkVSKTtcbiAgICAgICAgdGhpcy5zZWNvbmRQbGF5ZXJBY2NvdW50ID0gQnVmZmVyLmZyb20odGhpcy5zZWNvbmRQbGF5ZXJBY2NvdW50IHx8IEVNUFRZX0JVRkZFUik7XG5cbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIFwiZmlyc3RwbGF5ZXJcIiwge1xuICAgICAgICAgICAgZ2V0KCk6IG51bWJlciB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZmlyc3RQbGF5ZXI7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2V0KHZhbHVlOiBudW1iZXIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmZpcnN0UGxheWVyID0gdmFsdWU7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9KTtcblxuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgXCJmaXJzdHBsYXllcmhhc2hcIiwge1xuICAgICAgICAgICAgZ2V0KCk6IEJ1ZmZlciB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZmlyc3RQbGF5ZXJIYXNoO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNldCh2YWx1ZTogQnVmZmVyKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5maXJzdFBsYXllckhhc2ggPSB2YWx1ZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0pO1xuXG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCBcInNlY29uZHBsYXllclwiLCB7XG4gICAgICAgICAgICBnZXQoKTogbnVtYmVyIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zZWNvbmRQbGF5ZXI7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2V0KHZhbHVlOiBudW1iZXIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNlY29uZFBsYXllciA9IHZhbHVlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIFwic2Vjb25kcGxheWVyYWNjb3VudFwiLCB7XG4gICAgICAgICAgICBnZXQoKTogQnVmZmVyIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zZWNvbmRQbGF5ZXJBY2NvdW50O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNldCh2YWx1ZTogQnVmZmVyKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zZWNvbmRQbGF5ZXJBY2NvdW50ID0gdmFsdWU7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBIZWxwZXIgdG8gZW5jb2RlIHRoZSBzdHJ1Y3QgdXNpbmcgcHJvdG9idWZcbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHRoZSBkYXRhIGFzIGEgYnVmZmVyXG4gICAgICovXG4gICAgdG9CeXRlcygpOiBCdWZmZXIge1xuICAgICAgICByZXR1cm4gQnVmZmVyLmZyb20oUm9QYVNjaVN0cnVjdC5lbmNvZGUodGhpcykuZmluaXNoKCkpO1xuICAgIH1cbn1cblxuUm9QYVNjaVN0cnVjdC5yZWdpc3RlcigpO1xuIl19