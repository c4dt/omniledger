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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var darc_1 = __importDefault(require("../../darc/darc"));
var log_1 = __importDefault(require("../../log"));
var client_transaction_1 = __importStar(require("../client-transaction"));
var instance_1 = __importDefault(require("../instance"));
var DarcInstance = /** @class */ (function (_super) {
    __extends(DarcInstance, _super);
    function DarcInstance(rpc, inst) {
        var _this = _super.call(this, inst) || this;
        _this.rpc = rpc;
        if (inst.contractID.toString() !== DarcInstance.contractID) {
            throw new Error("mismatch contract name: " + inst.contractID + " vs " + DarcInstance.contractID);
        }
        _this._darc = darc_1.default.decode(inst.data);
        return _this;
    }
    /**
     * Initializes using an existing coinInstance from ByzCoin
     *
     * @param bc a working ByzCoin instance
     * @param iid the instance id of the darc-instance
     * @param waitMatch how many times to wait for a match - useful if its called just after an addTransactionAndWait.
     * @param interval how long to wait between two attempts in waitMatch.
     * @returns a promise that resolves with the darc instance
     */
    DarcInstance.fromByzcoin = function (bc, iid, waitMatch, interval) {
        if (waitMatch === void 0) { waitMatch = 0; }
        if (interval === void 0) { interval = 1000; }
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _a = DarcInstance.bind;
                        _b = [void 0, bc];
                        return [4 /*yield*/, instance_1.default.fromByzcoin(bc, iid, waitMatch, interval)];
                    case 1: return [2 /*return*/, new (_a.apply(DarcInstance, _b.concat([_c.sent()])))()];
                }
            });
        });
    };
    /**
     * spawn creates a new darc, given a darcID.
     *
     * @param rpc a working ByzCoin instance
     * @param darcID a darc that has the right to spawn new darcs
     * @param signers fulfilling the `spawn:darc` rule of the darc pointed to by darcID
     * @param newD the new darc to spawn
     */
    DarcInstance.spawn = function (rpc, darcID, signers, newD) {
        return __awaiter(this, void 0, void 0, function () {
            var di;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, DarcInstance.fromByzcoin(rpc, darcID)];
                    case 1:
                        di = _a.sent();
                        return [2 /*return*/, di.spawnDarcAndWait(newD, signers, 10)];
                }
            });
        });
    };
    /**
     * create returns a DarcInstance, given a ByzCoin and a darc. The instance must already exist on
     * ByzCoin. This method does not verify if it does or not.
     *
     * @param rpc a working ByzCoin instance
     * @param d the darc
     */
    DarcInstance.create = function (rpc, d) {
        return new DarcInstance(rpc, new instance_1.default({
            contractID: DarcInstance.contractID,
            darcID: d.getBaseID(),
            data: d.toBytes(),
            id: d.getBaseID(),
        }));
    };
    Object.defineProperty(DarcInstance.prototype, "darc", {
        /**
         * Returns a copy of the darc.
         */
        get: function () {
            return this._darc.copy();
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Update the data of this instance
     *
     * @return a promise that resolves once the data is up-to-date
     */
    DarcInstance.prototype.update = function () {
        return __awaiter(this, void 0, void 0, function () {
            var proof, inst;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.rpc.getProofFromLatest(this._darc.getBaseID())];
                    case 1:
                        proof = _a.sent();
                        inst = instance_1.default.fromProof(this._darc.getBaseID(), proof);
                        this._darc = darc_1.default.decode(inst.data);
                        return [2 /*return*/, this];
                }
            });
        });
    };
    /**
     * Searches for the rule that corresponds to the Darc.ruleSign action. If that rule
     * does not exist, it returns an error.
     */
    DarcInstance.prototype.getSignerIdentities = function () {
        for (var _i = 0, _a = this._darc.rules.list; _i < _a.length; _i++) {
            var rule = _a[_i];
            if (rule.action === darc_1.default.ruleSign) {
                return rule.getIdentities();
            }
        }
        throw new Error("This darc doesn't have a sign expression");
    };
    /**
     * Returns all darcs that are stored in the signer expression. It leaves out any
     * other element of the expression.
     */
    DarcInstance.prototype.getSignerDarcIDs = function () {
        var ids = this.getSignerIdentities();
        var ret = [];
        ids.forEach(function (e) {
            if (e.startsWith("darc:")) {
                ret.push(Buffer.from(e.slice(5), "hex"));
            }
            else {
                log_1.default.warn("Non-darc expression in signer:", e);
            }
        });
        return ret;
    };
    /**
     * Request to evolve the existing darc using the new darc and wait for
     * the block inclusion
     *
     * @param newDarc The new darc
     * @param signers Signers for the counters
     * @param wait Number of blocks to wait for
     * @returns a promise that resolves with the new darc instance
     */
    DarcInstance.prototype.evolveDarcAndWait = function (newDarc, signers, wait, unrestricted) {
        if (unrestricted === void 0) { unrestricted = false; }
        return __awaiter(this, void 0, void 0, function () {
            var args, cmd, instr, ctx;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!newDarc.getBaseID().equals(this._darc.getBaseID())) {
                            throw new Error("not the same base id for the darc");
                        }
                        if (newDarc.version.compare(this._darc.version.add(1)) !== 0) {
                            throw new Error("not the right version");
                        }
                        if (!newDarc.prevID.equals(this._darc.id)) {
                            throw new Error("doesn't point to the previous darc");
                        }
                        args = [new client_transaction_1.Argument({ name: DarcInstance.argumentDarc,
                                value: Buffer.from(darc_1.default.encode(newDarc).finish()) })];
                        cmd = unrestricted ? DarcInstance.commandEvolveUnrestricted : DarcInstance.commandEvolve;
                        instr = client_transaction_1.Instruction.createInvoke(this._darc.getBaseID(), DarcInstance.contractID, cmd, args);
                        ctx = new client_transaction_1.default({ instructions: [instr] });
                        return [4 /*yield*/, ctx.updateCounters(this.rpc, [signers])];
                    case 1:
                        _a.sent();
                        ctx.signWith([signers]);
                        return [4 /*yield*/, this.rpc.sendTransactionAndWait(ctx, wait)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, this.update()];
                }
            });
        });
    };
    /**
     * Request to spawn an instance and wait for the inclusion
     *
     * @param d             The darc to spawn
     * @param signers       Signers for the counters
     * @param wait          Number of blocks to wait for
     * @returns a promise that resolves with the new darc instance
     */
    DarcInstance.prototype.spawnDarcAndWait = function (d, signers, wait) {
        if (wait === void 0) { wait = 0; }
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.spawnInstanceAndWait(DarcInstance.contractID, [new client_transaction_1.Argument({
                                name: DarcInstance.argumentDarc,
                                value: Buffer.from(darc_1.default.encode(d).finish()),
                            })], signers, wait)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, DarcInstance.fromByzcoin(this.rpc, d.getBaseID())];
                }
            });
        });
    };
    /**
     * Request to spawn an instance of any contract and wait
     *
     * @param contractID    Contract name of the new instance
     * @param signers       Signers for the counters
     * @param wait          Number of blocks to wait for
     * @returns a promise that resolves with the instanceID of the new instance, which is only valid if the
     *          contract.spawn uses DeriveID.
     */
    DarcInstance.prototype.spawnInstanceAndWait = function (contractID, args, signers, wait) {
        if (wait === void 0) { wait = 0; }
        return __awaiter(this, void 0, void 0, function () {
            var instr, ctx;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        instr = client_transaction_1.Instruction.createSpawn(this._darc.getBaseID(), DarcInstance.contractID, args);
                        ctx = new client_transaction_1.default({ instructions: [instr] });
                        return [4 /*yield*/, ctx.updateCounters(this.rpc, [signers])];
                    case 1:
                        _a.sent();
                        ctx.signWith([signers]);
                        return [4 /*yield*/, this.rpc.sendTransactionAndWait(ctx, wait)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, ctx.instructions[0].deriveId()];
                }
            });
        });
    };
    /**
     * Checks whether the given rule can be matched by a multi-signature created by all
     * signers. If the rule doesn't exist, this method silently returns 'false'.
     * Currently only Rule.OR are supported. A Rule.AND or "(" will return an error.
     * Currently only 1 signer is supported.
     *
     * @param action the action to match
     * @param signers all supposed signers for this action.
     */
    DarcInstance.prototype.ruleMatch = function (action, signers) {
        return __awaiter(this, void 0, void 0, function () {
            var ids;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._darc.ruleMatch(action, signers, function (id) { return __awaiter(_this, void 0, void 0, function () {
                            var di;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, DarcInstance.fromByzcoin(this.rpc, id)];
                                    case 1:
                                        di = _a.sent();
                                        return [2 /*return*/, di._darc];
                                }
                            });
                        }); })];
                    case 1:
                        ids = _a.sent();
                        return [2 /*return*/, ids.length > 0];
                }
            });
        });
    };
    DarcInstance.contractID = "darc";
    DarcInstance.commandEvolve = "evolve";
    DarcInstance.commandEvolveUnrestricted = "evolve_unrestricted";
    DarcInstance.argumentDarc = "darc";
    DarcInstance.ruleEvolve = "invoke:" + DarcInstance.argumentDarc + "." + DarcInstance.commandEvolve;
    DarcInstance.ruleEvolveUnrestricted = "invoke:" + DarcInstance.argumentDarc + "." +
        DarcInstance.commandEvolveUnrestricted;
    return DarcInstance;
}(instance_1.default));
exports.default = DarcInstance;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGFyYy1pbnN0YW5jZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImRhcmMtaW5zdGFuY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQ0EseURBQW1DO0FBRW5DLGtEQUE0QjtBQUU1QiwwRUFBaUY7QUFDakYseURBQW1EO0FBRW5EO0lBQTBDLGdDQUFRO0lBaUU5QyxzQkFBb0IsR0FBZSxFQUFFLElBQWM7UUFBbkQsWUFDSSxrQkFBTSxJQUFJLENBQUMsU0FNZDtRQVBtQixTQUFHLEdBQUgsR0FBRyxDQUFZO1FBRS9CLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxRQUFRLEVBQUUsS0FBSyxZQUFZLENBQUMsVUFBVSxFQUFFO1lBQ3hELE1BQU0sSUFBSSxLQUFLLENBQUMsNkJBQTJCLElBQUksQ0FBQyxVQUFVLFlBQU8sWUFBWSxDQUFDLFVBQVksQ0FBQyxDQUFDO1NBQy9GO1FBRUQsS0FBSSxDQUFDLEtBQUssR0FBRyxjQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQzs7SUFDeEMsQ0FBQztJQS9ERDs7Ozs7Ozs7T0FRRztJQUNVLHdCQUFXLEdBQXhCLFVBQXlCLEVBQWMsRUFBRSxHQUFlLEVBQUUsU0FBcUIsRUFBRSxRQUF1QjtRQUE5QywwQkFBQSxFQUFBLGFBQXFCO1FBQUUseUJBQUEsRUFBQSxlQUF1Qjs7Ozs7OzZCQUV6RixZQUFZO3NDQUFDLEVBQUU7d0JBQUUscUJBQU0sa0JBQVEsQ0FBQyxXQUFXLENBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRSxTQUFTLEVBQUUsUUFBUSxDQUFDLEVBQUE7NEJBQXBGLHNCQUFPLGNBQUksWUFBWSxhQUFLLFNBQXdELE1BQUMsRUFBQzs7OztLQUN6RjtJQUVEOzs7Ozs7O09BT0c7SUFDVSxrQkFBSyxHQUFsQixVQUFtQixHQUFlLEVBQ2YsTUFBa0IsRUFDbEIsT0FBaUIsRUFDakIsSUFBVTs7Ozs7NEJBQ2QscUJBQU0sWUFBWSxDQUFDLFdBQVcsQ0FBQyxHQUFHLEVBQUUsTUFBTSxDQUFDLEVBQUE7O3dCQUFoRCxFQUFFLEdBQUcsU0FBMkM7d0JBQ3RELHNCQUFPLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFLEVBQUUsQ0FBQyxFQUFDOzs7O0tBQ2pEO0lBRUQ7Ozs7OztPQU1HO0lBQ0ksbUJBQU0sR0FBYixVQUFjLEdBQWUsRUFDZixDQUFPO1FBQ2pCLE9BQU8sSUFBSSxZQUFZLENBQUMsR0FBRyxFQUFFLElBQUksa0JBQVEsQ0FBQztZQUN0QyxVQUFVLEVBQUUsWUFBWSxDQUFDLFVBQVU7WUFDbkMsTUFBTSxFQUFFLENBQUMsQ0FBQyxTQUFTLEVBQUU7WUFDckIsSUFBSSxFQUFFLENBQUMsQ0FBQyxPQUFPLEVBQUU7WUFDakIsRUFBRSxFQUFFLENBQUMsQ0FBQyxTQUFTLEVBQUU7U0FDcEIsQ0FBQyxDQUFDLENBQUM7SUFDUixDQUFDO0lBT0Qsc0JBQUksOEJBQUk7UUFIUjs7V0FFRzthQUNIO1lBQ0ksT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDO1FBQzdCLENBQUM7OztPQUFBO0lBV0Q7Ozs7T0FJRztJQUNHLDZCQUFNLEdBQVo7Ozs7OzRCQUNrQixxQkFBTSxJQUFJLENBQUMsR0FBRyxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLENBQUMsRUFBQTs7d0JBQWpFLEtBQUssR0FBRyxTQUF5RDt3QkFDakUsSUFBSSxHQUFHLGtCQUFRLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7d0JBQy9ELElBQUksQ0FBQyxLQUFLLEdBQUcsY0FBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7d0JBRXBDLHNCQUFPLElBQUksRUFBQzs7OztLQUNmO0lBRUQ7OztPQUdHO0lBQ0gsMENBQW1CLEdBQW5CO1FBQ0ksS0FBbUIsVUFBcUIsRUFBckIsS0FBQSxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQXJCLGNBQXFCLEVBQXJCLElBQXFCLEVBQUU7WUFBckMsSUFBTSxJQUFJLFNBQUE7WUFDWCxJQUFJLElBQUksQ0FBQyxNQUFNLEtBQUssY0FBSSxDQUFDLFFBQVEsRUFBRTtnQkFDL0IsT0FBTyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7YUFDL0I7U0FDSjtRQUNELE1BQU0sSUFBSSxLQUFLLENBQUMsMENBQTBDLENBQUMsQ0FBQztJQUNoRSxDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsdUNBQWdCLEdBQWhCO1FBQ0ksSUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUM7UUFDdkMsSUFBTSxHQUFHLEdBQWlCLEVBQUUsQ0FBQztRQUM3QixHQUFHLENBQUMsT0FBTyxDQUFDLFVBQUMsQ0FBQztZQUNWLElBQUksQ0FBQyxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsRUFBRTtnQkFDdkIsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQzthQUM1QztpQkFBTTtnQkFDSCxhQUFHLENBQUMsSUFBSSxDQUFDLGdDQUFnQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2FBQ2pEO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFDSCxPQUFPLEdBQUcsQ0FBQztJQUNmLENBQUM7SUFFRDs7Ozs7Ozs7T0FRRztJQUNHLHdDQUFpQixHQUF2QixVQUF3QixPQUFhLEVBQUUsT0FBaUIsRUFBRSxJQUFZLEVBQzlDLFlBQTZCO1FBQTdCLDZCQUFBLEVBQUEsb0JBQTZCOzs7Ozs7d0JBQ2pELElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLENBQUMsRUFBRTs0QkFDckQsTUFBTSxJQUFJLEtBQUssQ0FBQyxtQ0FBbUMsQ0FBQyxDQUFDO3lCQUN4RDt3QkFDRCxJQUFJLE9BQU8sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRTs0QkFDMUQsTUFBTSxJQUFJLEtBQUssQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO3lCQUM1Qzt3QkFDRCxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsRUFBRTs0QkFDdkMsTUFBTSxJQUFJLEtBQUssQ0FBQyxvQ0FBb0MsQ0FBQyxDQUFDO3lCQUN6RDt3QkFDSyxJQUFJLEdBQUcsQ0FBQyxJQUFJLDZCQUFRLENBQUMsRUFBQyxJQUFJLEVBQUUsWUFBWSxDQUFDLFlBQVk7Z0NBQ3ZELEtBQUssRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLGNBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQzt3QkFDbkQsR0FBRyxHQUFHLFlBQVksQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLHlCQUF5QixDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsYUFBYSxDQUFDO3dCQUN6RixLQUFLLEdBQUcsZ0NBQVcsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsRUFDekQsWUFBWSxDQUFDLFVBQVUsRUFBRSxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7d0JBRWxDLEdBQUcsR0FBRyxJQUFJLDRCQUFpQixDQUFDLEVBQUMsWUFBWSxFQUFFLENBQUMsS0FBSyxDQUFDLEVBQUMsQ0FBQyxDQUFDO3dCQUMzRCxxQkFBTSxHQUFHLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFBOzt3QkFBN0MsU0FBNkMsQ0FBQzt3QkFDOUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7d0JBRXhCLHFCQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsc0JBQXNCLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxFQUFBOzt3QkFBaEQsU0FBZ0QsQ0FBQzt3QkFFakQsc0JBQU8sSUFBSSxDQUFDLE1BQU0sRUFBRSxFQUFDOzs7O0tBQ3hCO0lBRUQ7Ozs7Ozs7T0FPRztJQUNHLHVDQUFnQixHQUF0QixVQUF1QixDQUFPLEVBQUUsT0FBaUIsRUFBRSxJQUFnQjtRQUFoQixxQkFBQSxFQUFBLFFBQWdCOzs7OzRCQUMvRCxxQkFBTSxJQUFJLENBQUMsb0JBQW9CLENBQUMsWUFBWSxDQUFDLFVBQVUsRUFDbkQsQ0FBQyxJQUFJLDZCQUFRLENBQUM7Z0NBQ1YsSUFBSSxFQUFFLFlBQVksQ0FBQyxZQUFZO2dDQUMvQixLQUFLLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxjQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDOzZCQUM5QyxDQUFDLENBQUMsRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLEVBQUE7O3dCQUp2QixTQUl1QixDQUFDO3dCQUN4QixzQkFBTyxZQUFZLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLFNBQVMsRUFBRSxDQUFDLEVBQUM7Ozs7S0FDNUQ7SUFFRDs7Ozs7Ozs7T0FRRztJQUNHLDJDQUFvQixHQUExQixVQUEyQixVQUFrQixFQUFFLElBQWdCLEVBQUUsT0FBaUIsRUFBRSxJQUFnQjtRQUFoQixxQkFBQSxFQUFBLFFBQWdCOzs7Ozs7d0JBRTFGLEtBQUssR0FBRyxnQ0FBVyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxFQUFFLFlBQVksQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLENBQUM7d0JBRXZGLEdBQUcsR0FBRyxJQUFJLDRCQUFpQixDQUFDLEVBQUMsWUFBWSxFQUFFLENBQUMsS0FBSyxDQUFDLEVBQUMsQ0FBQyxDQUFDO3dCQUMzRCxxQkFBTSxHQUFHLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFBOzt3QkFBN0MsU0FBNkMsQ0FBQzt3QkFDOUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7d0JBRXhCLHFCQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsc0JBQXNCLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxFQUFBOzt3QkFBaEQsU0FBZ0QsQ0FBQzt3QkFFakQsc0JBQU8sR0FBRyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsRUFBQzs7OztLQUN6QztJQUVEOzs7Ozs7OztPQVFHO0lBQ0csZ0NBQVMsR0FBZixVQUFnQixNQUFjLEVBQUUsT0FBb0I7Ozs7Ozs0QkFDcEMscUJBQU0sSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLE9BQU8sRUFBRSxVQUFPLEVBQVU7Ozs7NENBQzFELHFCQUFNLFlBQVksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsRUFBQTs7d0NBQWpELEVBQUUsR0FBRyxTQUE0Qzt3Q0FDdkQsc0JBQU8sRUFBRSxDQUFDLEtBQUssRUFBQzs7OzZCQUNuQixDQUFDLEVBQUE7O3dCQUhJLEdBQUcsR0FBRyxTQUdWO3dCQUNGLHNCQUFPLEdBQUcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFDOzs7O0tBQ3pCO0lBN01lLHVCQUFVLEdBQUcsTUFBTSxDQUFDO0lBQ3BCLDBCQUFhLEdBQUcsUUFBUSxDQUFDO0lBQ3pCLHNDQUF5QixHQUFHLHFCQUFxQixDQUFDO0lBQ2xELHlCQUFZLEdBQUcsTUFBTSxDQUFDO0lBQ3RCLHVCQUFVLEdBQUcsU0FBUyxHQUFHLFlBQVksQ0FBQyxZQUFZLEdBQUcsR0FBRyxHQUFHLFlBQVksQ0FBQyxhQUFhLENBQUM7SUFDdEYsbUNBQXNCLEdBQUcsU0FBUyxHQUFHLFlBQVksQ0FBQyxZQUFZLEdBQUcsR0FBRztRQUNoRixZQUFZLENBQUMseUJBQXlCLENBQUM7SUF3TS9DLG1CQUFDO0NBQUEsQUEvTUQsQ0FBMEMsa0JBQVEsR0ErTWpEO2tCQS9Nb0IsWUFBWSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IElJZGVudGl0eSB9IGZyb20gXCIuLi8uLi9kYXJjXCI7XG5pbXBvcnQgRGFyYyBmcm9tIFwiLi4vLi4vZGFyYy9kYXJjXCI7XG5pbXBvcnQgU2lnbmVyIGZyb20gXCIuLi8uLi9kYXJjL3NpZ25lclwiO1xuaW1wb3J0IExvZyBmcm9tIFwiLi4vLi4vbG9nXCI7XG5pbXBvcnQgQnl6Q29pblJQQyBmcm9tIFwiLi4vYnl6Y29pbi1ycGNcIjtcbmltcG9ydCBDbGllbnRUcmFuc2FjdGlvbiwgeyBBcmd1bWVudCwgSW5zdHJ1Y3Rpb24gfSBmcm9tIFwiLi4vY2xpZW50LXRyYW5zYWN0aW9uXCI7XG5pbXBvcnQgSW5zdGFuY2UsIHsgSW5zdGFuY2VJRCB9IGZyb20gXCIuLi9pbnN0YW5jZVwiO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBEYXJjSW5zdGFuY2UgZXh0ZW5kcyBJbnN0YW5jZSB7XG4gICAgc3RhdGljIHJlYWRvbmx5IGNvbnRyYWN0SUQgPSBcImRhcmNcIjtcbiAgICBzdGF0aWMgcmVhZG9ubHkgY29tbWFuZEV2b2x2ZSA9IFwiZXZvbHZlXCI7XG4gICAgc3RhdGljIHJlYWRvbmx5IGNvbW1hbmRFdm9sdmVVbnJlc3RyaWN0ZWQgPSBcImV2b2x2ZV91bnJlc3RyaWN0ZWRcIjtcbiAgICBzdGF0aWMgcmVhZG9ubHkgYXJndW1lbnREYXJjID0gXCJkYXJjXCI7XG4gICAgc3RhdGljIHJlYWRvbmx5IHJ1bGVFdm9sdmUgPSBcImludm9rZTpcIiArIERhcmNJbnN0YW5jZS5hcmd1bWVudERhcmMgKyBcIi5cIiArIERhcmNJbnN0YW5jZS5jb21tYW5kRXZvbHZlO1xuICAgIHN0YXRpYyByZWFkb25seSBydWxlRXZvbHZlVW5yZXN0cmljdGVkID0gXCJpbnZva2U6XCIgKyBEYXJjSW5zdGFuY2UuYXJndW1lbnREYXJjICsgXCIuXCIgK1xuICAgICAgICBEYXJjSW5zdGFuY2UuY29tbWFuZEV2b2x2ZVVucmVzdHJpY3RlZDtcblxuICAgIC8qKlxuICAgICAqIEluaXRpYWxpemVzIHVzaW5nIGFuIGV4aXN0aW5nIGNvaW5JbnN0YW5jZSBmcm9tIEJ5ekNvaW5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBiYyBhIHdvcmtpbmcgQnl6Q29pbiBpbnN0YW5jZVxuICAgICAqIEBwYXJhbSBpaWQgdGhlIGluc3RhbmNlIGlkIG9mIHRoZSBkYXJjLWluc3RhbmNlXG4gICAgICogQHBhcmFtIHdhaXRNYXRjaCBob3cgbWFueSB0aW1lcyB0byB3YWl0IGZvciBhIG1hdGNoIC0gdXNlZnVsIGlmIGl0cyBjYWxsZWQganVzdCBhZnRlciBhbiBhZGRUcmFuc2FjdGlvbkFuZFdhaXQuXG4gICAgICogQHBhcmFtIGludGVydmFsIGhvdyBsb25nIHRvIHdhaXQgYmV0d2VlbiB0d28gYXR0ZW1wdHMgaW4gd2FpdE1hdGNoLlxuICAgICAqIEByZXR1cm5zIGEgcHJvbWlzZSB0aGF0IHJlc29sdmVzIHdpdGggdGhlIGRhcmMgaW5zdGFuY2VcbiAgICAgKi9cbiAgICBzdGF0aWMgYXN5bmMgZnJvbUJ5emNvaW4oYmM6IEJ5ekNvaW5SUEMsIGlpZDogSW5zdGFuY2VJRCwgd2FpdE1hdGNoOiBudW1iZXIgPSAwLCBpbnRlcnZhbDogbnVtYmVyID0gMTAwMCk6XG4gICAgICAgIFByb21pc2U8RGFyY0luc3RhbmNlPiB7XG4gICAgICAgIHJldHVybiBuZXcgRGFyY0luc3RhbmNlKGJjLCBhd2FpdCBJbnN0YW5jZS5mcm9tQnl6Y29pbihiYywgaWlkLCB3YWl0TWF0Y2gsIGludGVydmFsKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogc3Bhd24gY3JlYXRlcyBhIG5ldyBkYXJjLCBnaXZlbiBhIGRhcmNJRC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBycGMgYSB3b3JraW5nIEJ5ekNvaW4gaW5zdGFuY2VcbiAgICAgKiBAcGFyYW0gZGFyY0lEIGEgZGFyYyB0aGF0IGhhcyB0aGUgcmlnaHQgdG8gc3Bhd24gbmV3IGRhcmNzXG4gICAgICogQHBhcmFtIHNpZ25lcnMgZnVsZmlsbGluZyB0aGUgYHNwYXduOmRhcmNgIHJ1bGUgb2YgdGhlIGRhcmMgcG9pbnRlZCB0byBieSBkYXJjSURcbiAgICAgKiBAcGFyYW0gbmV3RCB0aGUgbmV3IGRhcmMgdG8gc3Bhd25cbiAgICAgKi9cbiAgICBzdGF0aWMgYXN5bmMgc3Bhd24ocnBjOiBCeXpDb2luUlBDLFxuICAgICAgICAgICAgICAgICAgICAgICBkYXJjSUQ6IEluc3RhbmNlSUQsXG4gICAgICAgICAgICAgICAgICAgICAgIHNpZ25lcnM6IFNpZ25lcltdLFxuICAgICAgICAgICAgICAgICAgICAgICBuZXdEOiBEYXJjKTogUHJvbWlzZTxEYXJjSW5zdGFuY2U+IHtcbiAgICAgICAgY29uc3QgZGkgPSBhd2FpdCBEYXJjSW5zdGFuY2UuZnJvbUJ5emNvaW4ocnBjLCBkYXJjSUQpO1xuICAgICAgICByZXR1cm4gZGkuc3Bhd25EYXJjQW5kV2FpdChuZXdELCBzaWduZXJzLCAxMCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogY3JlYXRlIHJldHVybnMgYSBEYXJjSW5zdGFuY2UsIGdpdmVuIGEgQnl6Q29pbiBhbmQgYSBkYXJjLiBUaGUgaW5zdGFuY2UgbXVzdCBhbHJlYWR5IGV4aXN0IG9uXG4gICAgICogQnl6Q29pbi4gVGhpcyBtZXRob2QgZG9lcyBub3QgdmVyaWZ5IGlmIGl0IGRvZXMgb3Igbm90LlxuICAgICAqXG4gICAgICogQHBhcmFtIHJwYyBhIHdvcmtpbmcgQnl6Q29pbiBpbnN0YW5jZVxuICAgICAqIEBwYXJhbSBkIHRoZSBkYXJjXG4gICAgICovXG4gICAgc3RhdGljIGNyZWF0ZShycGM6IEJ5ekNvaW5SUEMsXG4gICAgICAgICAgICAgICAgICBkOiBEYXJjKTogRGFyY0luc3RhbmNlIHtcbiAgICAgICAgcmV0dXJuIG5ldyBEYXJjSW5zdGFuY2UocnBjLCBuZXcgSW5zdGFuY2Uoe1xuICAgICAgICAgICAgY29udHJhY3RJRDogRGFyY0luc3RhbmNlLmNvbnRyYWN0SUQsXG4gICAgICAgICAgICBkYXJjSUQ6IGQuZ2V0QmFzZUlEKCksXG4gICAgICAgICAgICBkYXRhOiBkLnRvQnl0ZXMoKSxcbiAgICAgICAgICAgIGlkOiBkLmdldEJhc2VJRCgpLFxuICAgICAgICB9KSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfZGFyYzogRGFyYztcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSBjb3B5IG9mIHRoZSBkYXJjLlxuICAgICAqL1xuICAgIGdldCBkYXJjKCk6IERhcmMge1xuICAgICAgICByZXR1cm4gdGhpcy5fZGFyYy5jb3B5KCk7XG4gICAgfVxuXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBycGM6IEJ5ekNvaW5SUEMsIGluc3Q6IEluc3RhbmNlKSB7XG4gICAgICAgIHN1cGVyKGluc3QpO1xuICAgICAgICBpZiAoaW5zdC5jb250cmFjdElELnRvU3RyaW5nKCkgIT09IERhcmNJbnN0YW5jZS5jb250cmFjdElEKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYG1pc21hdGNoIGNvbnRyYWN0IG5hbWU6ICR7aW5zdC5jb250cmFjdElEfSB2cyAke0RhcmNJbnN0YW5jZS5jb250cmFjdElEfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fZGFyYyA9IERhcmMuZGVjb2RlKGluc3QuZGF0YSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXBkYXRlIHRoZSBkYXRhIG9mIHRoaXMgaW5zdGFuY2VcbiAgICAgKlxuICAgICAqIEByZXR1cm4gYSBwcm9taXNlIHRoYXQgcmVzb2x2ZXMgb25jZSB0aGUgZGF0YSBpcyB1cC10by1kYXRlXG4gICAgICovXG4gICAgYXN5bmMgdXBkYXRlKCk6IFByb21pc2U8RGFyY0luc3RhbmNlPiB7XG4gICAgICAgIGNvbnN0IHByb29mID0gYXdhaXQgdGhpcy5ycGMuZ2V0UHJvb2ZGcm9tTGF0ZXN0KHRoaXMuX2RhcmMuZ2V0QmFzZUlEKCkpO1xuICAgICAgICBjb25zdCBpbnN0ID0gSW5zdGFuY2UuZnJvbVByb29mKHRoaXMuX2RhcmMuZ2V0QmFzZUlEKCksIHByb29mKTtcbiAgICAgICAgdGhpcy5fZGFyYyA9IERhcmMuZGVjb2RlKGluc3QuZGF0YSk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2VhcmNoZXMgZm9yIHRoZSBydWxlIHRoYXQgY29ycmVzcG9uZHMgdG8gdGhlIERhcmMucnVsZVNpZ24gYWN0aW9uLiBJZiB0aGF0IHJ1bGVcbiAgICAgKiBkb2VzIG5vdCBleGlzdCwgaXQgcmV0dXJucyBhbiBlcnJvci5cbiAgICAgKi9cbiAgICBnZXRTaWduZXJJZGVudGl0aWVzKCk6IHN0cmluZ1tdIHtcbiAgICAgICAgZm9yIChjb25zdCBydWxlIG9mIHRoaXMuX2RhcmMucnVsZXMubGlzdCkge1xuICAgICAgICAgICAgaWYgKHJ1bGUuYWN0aW9uID09PSBEYXJjLnJ1bGVTaWduKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJ1bGUuZ2V0SWRlbnRpdGllcygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlRoaXMgZGFyYyBkb2Vzbid0IGhhdmUgYSBzaWduIGV4cHJlc3Npb25cIik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhbGwgZGFyY3MgdGhhdCBhcmUgc3RvcmVkIGluIHRoZSBzaWduZXIgZXhwcmVzc2lvbi4gSXQgbGVhdmVzIG91dCBhbnlcbiAgICAgKiBvdGhlciBlbGVtZW50IG9mIHRoZSBleHByZXNzaW9uLlxuICAgICAqL1xuICAgIGdldFNpZ25lckRhcmNJRHMoKTogSW5zdGFuY2VJRFtdIHtcbiAgICAgICAgY29uc3QgaWRzID0gdGhpcy5nZXRTaWduZXJJZGVudGl0aWVzKCk7XG4gICAgICAgIGNvbnN0IHJldDogSW5zdGFuY2VJRFtdID0gW107XG4gICAgICAgIGlkcy5mb3JFYWNoKChlKSA9PiB7XG4gICAgICAgICAgICBpZiAoZS5zdGFydHNXaXRoKFwiZGFyYzpcIikpIHtcbiAgICAgICAgICAgICAgICByZXQucHVzaChCdWZmZXIuZnJvbShlLnNsaWNlKDUpLCBcImhleFwiKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIExvZy53YXJuKFwiTm9uLWRhcmMgZXhwcmVzc2lvbiBpbiBzaWduZXI6XCIsIGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXF1ZXN0IHRvIGV2b2x2ZSB0aGUgZXhpc3RpbmcgZGFyYyB1c2luZyB0aGUgbmV3IGRhcmMgYW5kIHdhaXQgZm9yXG4gICAgICogdGhlIGJsb2NrIGluY2x1c2lvblxuICAgICAqXG4gICAgICogQHBhcmFtIG5ld0RhcmMgVGhlIG5ldyBkYXJjXG4gICAgICogQHBhcmFtIHNpZ25lcnMgU2lnbmVycyBmb3IgdGhlIGNvdW50ZXJzXG4gICAgICogQHBhcmFtIHdhaXQgTnVtYmVyIG9mIGJsb2NrcyB0byB3YWl0IGZvclxuICAgICAqIEByZXR1cm5zIGEgcHJvbWlzZSB0aGF0IHJlc29sdmVzIHdpdGggdGhlIG5ldyBkYXJjIGluc3RhbmNlXG4gICAgICovXG4gICAgYXN5bmMgZXZvbHZlRGFyY0FuZFdhaXQobmV3RGFyYzogRGFyYywgc2lnbmVyczogU2lnbmVyW10sIHdhaXQ6IG51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1bnJlc3RyaWN0ZWQ6IGJvb2xlYW4gPSBmYWxzZSk6IFByb21pc2U8RGFyY0luc3RhbmNlPiB7XG4gICAgICAgIGlmICghbmV3RGFyYy5nZXRCYXNlSUQoKS5lcXVhbHModGhpcy5fZGFyYy5nZXRCYXNlSUQoKSkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIm5vdCB0aGUgc2FtZSBiYXNlIGlkIGZvciB0aGUgZGFyY1wiKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobmV3RGFyYy52ZXJzaW9uLmNvbXBhcmUodGhpcy5fZGFyYy52ZXJzaW9uLmFkZCgxKSkgIT09IDApIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIm5vdCB0aGUgcmlnaHQgdmVyc2lvblwiKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIW5ld0RhcmMucHJldklELmVxdWFscyh0aGlzLl9kYXJjLmlkKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiZG9lc24ndCBwb2ludCB0byB0aGUgcHJldmlvdXMgZGFyY1wiKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBhcmdzID0gW25ldyBBcmd1bWVudCh7bmFtZTogRGFyY0luc3RhbmNlLmFyZ3VtZW50RGFyYyxcbiAgICAgICAgICAgIHZhbHVlOiBCdWZmZXIuZnJvbShEYXJjLmVuY29kZShuZXdEYXJjKS5maW5pc2goKSl9KV07XG4gICAgICAgIGNvbnN0IGNtZCA9IHVucmVzdHJpY3RlZCA/IERhcmNJbnN0YW5jZS5jb21tYW5kRXZvbHZlVW5yZXN0cmljdGVkIDogRGFyY0luc3RhbmNlLmNvbW1hbmRFdm9sdmU7XG4gICAgICAgIGNvbnN0IGluc3RyID0gSW5zdHJ1Y3Rpb24uY3JlYXRlSW52b2tlKHRoaXMuX2RhcmMuZ2V0QmFzZUlEKCksXG4gICAgICAgICAgICBEYXJjSW5zdGFuY2UuY29udHJhY3RJRCwgY21kLCBhcmdzKTtcblxuICAgICAgICBjb25zdCBjdHggPSBuZXcgQ2xpZW50VHJhbnNhY3Rpb24oe2luc3RydWN0aW9uczogW2luc3RyXX0pO1xuICAgICAgICBhd2FpdCBjdHgudXBkYXRlQ291bnRlcnModGhpcy5ycGMsIFtzaWduZXJzXSk7XG4gICAgICAgIGN0eC5zaWduV2l0aChbc2lnbmVyc10pO1xuXG4gICAgICAgIGF3YWl0IHRoaXMucnBjLnNlbmRUcmFuc2FjdGlvbkFuZFdhaXQoY3R4LCB3YWl0KTtcblxuICAgICAgICByZXR1cm4gdGhpcy51cGRhdGUoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXF1ZXN0IHRvIHNwYXduIGFuIGluc3RhbmNlIGFuZCB3YWl0IGZvciB0aGUgaW5jbHVzaW9uXG4gICAgICpcbiAgICAgKiBAcGFyYW0gZCAgICAgICAgICAgICBUaGUgZGFyYyB0byBzcGF3blxuICAgICAqIEBwYXJhbSBzaWduZXJzICAgICAgIFNpZ25lcnMgZm9yIHRoZSBjb3VudGVyc1xuICAgICAqIEBwYXJhbSB3YWl0ICAgICAgICAgIE51bWJlciBvZiBibG9ja3MgdG8gd2FpdCBmb3JcbiAgICAgKiBAcmV0dXJucyBhIHByb21pc2UgdGhhdCByZXNvbHZlcyB3aXRoIHRoZSBuZXcgZGFyYyBpbnN0YW5jZVxuICAgICAqL1xuICAgIGFzeW5jIHNwYXduRGFyY0FuZFdhaXQoZDogRGFyYywgc2lnbmVyczogU2lnbmVyW10sIHdhaXQ6IG51bWJlciA9IDApOiBQcm9taXNlPERhcmNJbnN0YW5jZT4ge1xuICAgICAgICBhd2FpdCB0aGlzLnNwYXduSW5zdGFuY2VBbmRXYWl0KERhcmNJbnN0YW5jZS5jb250cmFjdElELFxuICAgICAgICAgICAgW25ldyBBcmd1bWVudCh7XG4gICAgICAgICAgICAgICAgbmFtZTogRGFyY0luc3RhbmNlLmFyZ3VtZW50RGFyYyxcbiAgICAgICAgICAgICAgICB2YWx1ZTogQnVmZmVyLmZyb20oRGFyYy5lbmNvZGUoZCkuZmluaXNoKCkpLFxuICAgICAgICAgICAgfSldLCBzaWduZXJzLCB3YWl0KTtcbiAgICAgICAgcmV0dXJuIERhcmNJbnN0YW5jZS5mcm9tQnl6Y29pbih0aGlzLnJwYywgZC5nZXRCYXNlSUQoKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVxdWVzdCB0byBzcGF3biBhbiBpbnN0YW5jZSBvZiBhbnkgY29udHJhY3QgYW5kIHdhaXRcbiAgICAgKlxuICAgICAqIEBwYXJhbSBjb250cmFjdElEICAgIENvbnRyYWN0IG5hbWUgb2YgdGhlIG5ldyBpbnN0YW5jZVxuICAgICAqIEBwYXJhbSBzaWduZXJzICAgICAgIFNpZ25lcnMgZm9yIHRoZSBjb3VudGVyc1xuICAgICAqIEBwYXJhbSB3YWl0ICAgICAgICAgIE51bWJlciBvZiBibG9ja3MgdG8gd2FpdCBmb3JcbiAgICAgKiBAcmV0dXJucyBhIHByb21pc2UgdGhhdCByZXNvbHZlcyB3aXRoIHRoZSBpbnN0YW5jZUlEIG9mIHRoZSBuZXcgaW5zdGFuY2UsIHdoaWNoIGlzIG9ubHkgdmFsaWQgaWYgdGhlXG4gICAgICogICAgICAgICAgY29udHJhY3Quc3Bhd24gdXNlcyBEZXJpdmVJRC5cbiAgICAgKi9cbiAgICBhc3luYyBzcGF3bkluc3RhbmNlQW5kV2FpdChjb250cmFjdElEOiBzdHJpbmcsIGFyZ3M6IEFyZ3VtZW50W10sIHNpZ25lcnM6IFNpZ25lcltdLCB3YWl0OiBudW1iZXIgPSAwKTpcbiAgICAgICAgUHJvbWlzZTxJbnN0YW5jZUlEPiB7XG4gICAgICAgIGNvbnN0IGluc3RyID0gSW5zdHJ1Y3Rpb24uY3JlYXRlU3Bhd24odGhpcy5fZGFyYy5nZXRCYXNlSUQoKSwgRGFyY0luc3RhbmNlLmNvbnRyYWN0SUQsIGFyZ3MpO1xuXG4gICAgICAgIGNvbnN0IGN0eCA9IG5ldyBDbGllbnRUcmFuc2FjdGlvbih7aW5zdHJ1Y3Rpb25zOiBbaW5zdHJdfSk7XG4gICAgICAgIGF3YWl0IGN0eC51cGRhdGVDb3VudGVycyh0aGlzLnJwYywgW3NpZ25lcnNdKTtcbiAgICAgICAgY3R4LnNpZ25XaXRoKFtzaWduZXJzXSk7XG5cbiAgICAgICAgYXdhaXQgdGhpcy5ycGMuc2VuZFRyYW5zYWN0aW9uQW5kV2FpdChjdHgsIHdhaXQpO1xuXG4gICAgICAgIHJldHVybiBjdHguaW5zdHJ1Y3Rpb25zWzBdLmRlcml2ZUlkKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2hlY2tzIHdoZXRoZXIgdGhlIGdpdmVuIHJ1bGUgY2FuIGJlIG1hdGNoZWQgYnkgYSBtdWx0aS1zaWduYXR1cmUgY3JlYXRlZCBieSBhbGxcbiAgICAgKiBzaWduZXJzLiBJZiB0aGUgcnVsZSBkb2Vzbid0IGV4aXN0LCB0aGlzIG1ldGhvZCBzaWxlbnRseSByZXR1cm5zICdmYWxzZScuXG4gICAgICogQ3VycmVudGx5IG9ubHkgUnVsZS5PUiBhcmUgc3VwcG9ydGVkLiBBIFJ1bGUuQU5EIG9yIFwiKFwiIHdpbGwgcmV0dXJuIGFuIGVycm9yLlxuICAgICAqIEN1cnJlbnRseSBvbmx5IDEgc2lnbmVyIGlzIHN1cHBvcnRlZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBhY3Rpb24gdGhlIGFjdGlvbiB0byBtYXRjaFxuICAgICAqIEBwYXJhbSBzaWduZXJzIGFsbCBzdXBwb3NlZCBzaWduZXJzIGZvciB0aGlzIGFjdGlvbi5cbiAgICAgKi9cbiAgICBhc3luYyBydWxlTWF0Y2goYWN0aW9uOiBzdHJpbmcsIHNpZ25lcnM6IElJZGVudGl0eVtdKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgICAgIGNvbnN0IGlkcyA9IGF3YWl0IHRoaXMuX2RhcmMucnVsZU1hdGNoKGFjdGlvbiwgc2lnbmVycywgYXN5bmMgKGlkOiBCdWZmZXIpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGRpID0gYXdhaXQgRGFyY0luc3RhbmNlLmZyb21CeXpjb2luKHRoaXMucnBjLCBpZCk7XG4gICAgICAgICAgICByZXR1cm4gZGkuX2RhcmM7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gaWRzLmxlbmd0aCA+IDA7XG4gICAgfVxufVxuIl19