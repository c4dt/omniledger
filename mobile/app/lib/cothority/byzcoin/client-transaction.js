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
var crypto_browserify_1 = require("crypto-browserify");
var lodash_1 = __importDefault(require("lodash"));
var long_1 = __importDefault(require("long"));
var light_1 = require("protobufjs/light");
var identity_wrapper_1 = __importDefault(require("../darc/identity-wrapper"));
var protobuf_1 = require("../protobuf");
/**
 * List of instructions to send to a byzcoin chain
 */
var ClientTransaction = /** @class */ (function (_super) {
    __extends(ClientTransaction, _super);
    function ClientTransaction(props) {
        var _this = _super.call(this, props) || this;
        _this.instructions = _this.instructions || [];
        return _this;
    }
    /**
     * @see README#Message classes
     */
    ClientTransaction.register = function () {
        protobuf_1.registerMessage("byzcoin.ClientTransaction", ClientTransaction, Instruction);
    };
    /**
     * Sign the hash of the instructions using the list of signers
     * @param signers List of signers
     */
    ClientTransaction.prototype.signWith = function (signers) {
        var ctxHash = this.hash();
        if (signers.length !== this.instructions.length) {
            throw new Error("need same number of signers as instructions");
        }
        this.instructions.forEach(function (instr, i) { return instr.signWith(ctxHash, signers[i]); });
    };
    /**
     * Fetch the counters and update the instructions accordingly
     * @param rpc       The RPC to use to fetch
     * @param signers   List of signers
     */
    ClientTransaction.prototype.updateCounters = function (rpc, signers) {
        return __awaiter(this, void 0, void 0, function () {
            var uniqueSigners, counters, signerCounters, _loop_1, i;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.instructions.length === 0) {
                            return [2 /*return*/];
                        }
                        if (signers.length !== this.instructions.length) {
                            return [2 /*return*/, Promise.reject("length of signers and instructions do not match")];
                        }
                        uniqueSigners = lodash_1.default.uniq(lodash_1.default.flatten(signers));
                        return [4 /*yield*/, rpc.getSignerCounters(uniqueSigners, 1)];
                    case 1:
                        counters = _a.sent();
                        signerCounters = {};
                        uniqueSigners.forEach(function (us, i) {
                            signerCounters[us.toString()] = counters[i];
                        });
                        _loop_1 = function (i) {
                            signers[i].forEach(function (signer) {
                                _this.instructions[i].signerIdentities.push(identity_wrapper_1.default.fromIdentity(signer));
                                _this.instructions[i].signerCounter.push(signerCounters[signer.toString()]);
                                signerCounters[signer.toString()] = signerCounters[signer.toString()].add(1);
                            });
                        };
                        // Iterate over the instructions, and store the appropriate signers and counters, while
                        // increasing those that have been used.
                        for (i = 0; i < this.instructions.length; i++) {
                            _loop_1(i);
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    ClientTransaction.prototype.updateCountersAndSign = function (rpc, signers) {
        return __awaiter(this, void 0, void 0, function () {
            var i;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Extend the signers to the number of instructions if there is only one signer.
                        if (signers.length === 1) {
                            for (i = 1; i < this.instructions.length; i++) {
                                signers.push(signers[0]);
                            }
                        }
                        return [4 /*yield*/, this.updateCounters(rpc, signers)];
                    case 1:
                        _a.sent();
                        this.signWith(signers);
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Hash the instructions' hash
     * @returns a buffer of the hash
     */
    ClientTransaction.prototype.hash = function () {
        var h = crypto_browserify_1.createHash("sha256");
        this.instructions.forEach(function (i) { return h.update(i.hash()); });
        return h.digest();
    };
    return ClientTransaction;
}(light_1.Message));
exports.default = ClientTransaction;
/**
 * An instruction represents one action
 */
var Instruction = /** @class */ (function (_super) {
    __extends(Instruction, _super);
    function Instruction(props) {
        var _this = _super.call(this, props) || this;
        _this.signerCounter = _this.signerCounter || [];
        _this.signerIdentities = _this.signerIdentities || [];
        _this.signatures = _this.signatures || [];
        /* Protobuf aliases */
        Object.defineProperty(_this, "instanceid", {
            get: function () {
                return this.instanceID;
            },
            set: function (value) {
                this.instanceID = value;
            },
        });
        Object.defineProperty(_this, "signercounter", {
            get: function () {
                return this.signerCounter;
            },
            set: function (value) {
                this.signerCounter = value;
            },
        });
        Object.defineProperty(_this, "signeridentities", {
            get: function () {
                return this.signerIdentities;
            },
            set: function (value) {
                this.signerIdentities = value;
            },
        });
        return _this;
    }
    Object.defineProperty(Instruction.prototype, "type", {
        /**
         * Get the type of the instruction
         * @returns the type as a number
         */
        get: function () {
            if (this.spawn) {
                return Instruction.typeSpawn;
            }
            if (this.invoke) {
                return Instruction.typeInvoke;
            }
            if (this.delete) {
                return Instruction.typeDelete;
            }
            throw new Error("instruction without type");
        },
        enumerable: true,
        configurable: true
    });
    /**
     * @see README#Message classes
     */
    Instruction.register = function () {
        protobuf_1.registerMessage("byzcoin.Instruction", Instruction, identity_wrapper_1.default, Spawn, Invoke, Delete);
    };
    /**
     * Helper to create a spawn instruction
     * @param iid           The instance ID
     * @param contractID    The contract name
     * @param args          Arguments for the instruction
     * @returns the instruction
     */
    Instruction.createSpawn = function (iid, contractID, args) {
        return new Instruction({
            instanceID: iid,
            signerCounter: [],
            spawn: new Spawn({ contractID: contractID, args: args }),
        });
    };
    /**
     * Helper to create a invoke instruction
     * @param iid           The instance ID
     * @param contractID    The contract name
     * @param command       The command to invoke
     * @param args          The list of arguments
     * @returns the instruction
     */
    Instruction.createInvoke = function (iid, contractID, command, args) {
        return new Instruction({
            instanceID: iid,
            invoke: new Invoke({ command: command, contractID: contractID, args: args }),
            signerCounter: [],
        });
    };
    /**
     * Helper to create a delete instruction
     * @param iid           The instance ID
     * @param contractID    The contract name
     * @returns the instruction
     */
    Instruction.createDelete = function (iid, contractID) {
        return new Instruction({
            delete: new Delete({ contractID: contractID }),
            instanceID: iid,
            signerCounter: [],
        });
    };
    /**
     * Use the signers to make a signature of the hash
     * @param ctxHash The client transaction hash
     * @param signers The list of signers
     */
    Instruction.prototype.signWith = function (ctxHash, signers) {
        // @ts-ignore
        this.signatures = signers.map(function (s) { return s.sign(ctxHash); });
    };
    /**
     * Set the signer counters and identities
     * @param counters      List of counters
     * @param identities    List of identities
     */
    Instruction.prototype.setCounters = function (counters, identities) {
        // @ts-ignore
        this.signerCounter = counters;
        // @ts-ignore
        this.signerIdentities = identities;
    };
    /**
     * Fetch and update the counters
     * @param rpc       the RPC to use to fetch
     * @param signers   the list of signers
     */
    Instruction.prototype.updateCounters = function (rpc, signers) {
        return __awaiter(this, void 0, void 0, function () {
            var counters;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, rpc.getSignerCounters(signers, 1)];
                    case 1:
                        counters = _a.sent();
                        this.setCounters(counters, signers.map(function (s) { return identity_wrapper_1.default.fromIdentity(s); }));
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Hash the instruction
     * @returns a buffer of the hash
     */
    Instruction.prototype.hash = function () {
        var h = crypto_browserify_1.createHash("sha256");
        h.update(this.instanceID);
        h.update(Buffer.from([this.type]));
        var args = [];
        switch (this.type) {
            case Instruction.typeSpawn:
                h.update(this.spawn.contractID);
                args = this.spawn.args;
                break;
            case Instruction.typeInvoke:
                h.update(this.invoke.contractID);
                args = this.invoke.args;
                break;
            case Instruction.typeDelete:
                h.update(this.delete.contractID);
                break;
        }
        args.forEach(function (arg) {
            var nameBuf = Buffer.from(arg.name);
            var nameLenBuf = Buffer.from(long_1.default.fromNumber(nameBuf.length).toBytesLE());
            h.update(nameLenBuf);
            h.update(arg.name);
            var valueLenBuf = Buffer.from(long_1.default.fromNumber(arg.value.length).toBytesLE());
            h.update(valueLenBuf);
            h.update(arg.value);
        });
        this.signerCounter.forEach(function (sc) {
            h.update(Buffer.from(sc.toBytesLE()));
        });
        this.signerIdentities.forEach(function (si) {
            var buf = si.toBytes();
            var lenBuf = Buffer.from(long_1.default.fromNumber(buf.length).toBytesLE());
            h.update(lenBuf);
            h.update(si.toBytes());
        });
        return h.digest();
    };
    /**
     * Get the unique identifier of the instruction
     * @returns the id as a buffer
     */
    Instruction.prototype.deriveId = function (what) {
        if (what === void 0) { what = ""; }
        var h = crypto_browserify_1.createHash("sha256");
        h.update(this.hash());
        var b = Buffer.alloc(4);
        b.writeUInt32LE(this.signatures.length, 0);
        h.update(b);
        this.signatures.forEach(function (sig) {
            b.writeUInt32LE(sig.length, 0);
            h.update(b);
            h.update(sig);
        });
        h.update(Buffer.from(what));
        return h.digest();
    };
    Instruction.typeSpawn = 0;
    Instruction.typeInvoke = 1;
    Instruction.typeDelete = 2;
    return Instruction;
}(light_1.Message));
exports.Instruction = Instruction;
/**
 * Argument of an instruction
 */
var Argument = /** @class */ (function (_super) {
    __extends(Argument, _super);
    function Argument(props) {
        var _this = _super.call(this, props) || this;
        _this.value = Buffer.from(_this.value || protobuf_1.EMPTY_BUFFER);
        return _this;
    }
    /**
     * @see README#Message classes
     */
    Argument.register = function () {
        protobuf_1.registerMessage("byzcoin.Argument", Argument);
    };
    return Argument;
}(light_1.Message));
exports.Argument = Argument;
/**
 * Spawn instruction that will create instances
 */
var Spawn = /** @class */ (function (_super) {
    __extends(Spawn, _super);
    function Spawn(props) {
        var _this = _super.call(this, props) || this;
        _this.args = _this.args || [];
        /* Protobuf aliases */
        Object.defineProperty(_this, "contractid", {
            get: function () {
                return this.contractID;
            },
            set: function (value) {
                this.contractID = value;
            },
        });
        return _this;
    }
    /**
     * @see README#Message classes
     */
    Spawn.register = function () {
        protobuf_1.registerMessage("byzcoin.Spawn", Spawn, Argument);
    };
    return Spawn;
}(light_1.Message));
exports.Spawn = Spawn;
/**
 * Invoke instruction that will update an existing instance
 */
var Invoke = /** @class */ (function (_super) {
    __extends(Invoke, _super);
    function Invoke(props) {
        var _this = _super.call(this, props) || this;
        _this.args = _this.args || [];
        /* Protobuf aliases */
        Object.defineProperty(_this, "contractid", {
            get: function () {
                return this.contractID;
            },
            set: function (value) {
                this.contractID = value;
            },
        });
        return _this;
    }
    /**
     * @see README#Message classes
     */
    Invoke.register = function () {
        protobuf_1.registerMessage("byzcoin.Invoke", Invoke, Argument);
    };
    return Invoke;
}(light_1.Message));
exports.Invoke = Invoke;
/**
 * Delete instruction that will delete an instance
 */
var Delete = /** @class */ (function (_super) {
    __extends(Delete, _super);
    function Delete(props) {
        var _this = _super.call(this, props) || this;
        Object.defineProperty(_this, "contractid", {
            get: function () {
                return this.contractID;
            },
            set: function (value) {
                this.contractID = value;
            },
        });
        return _this;
    }
    /**
     * @see README#Message classes
     */
    Delete.register = function () {
        protobuf_1.registerMessage("byzcoin.Delete", Delete);
    };
    return Delete;
}(light_1.Message));
exports.Delete = Delete;
ClientTransaction.register();
Instruction.register();
Argument.register();
Spawn.register();
Invoke.register();
Delete.register();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpZW50LXRyYW5zYWN0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY2xpZW50LXRyYW5zYWN0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsdURBQStDO0FBQy9DLGtEQUF1QjtBQUN2Qiw4Q0FBd0I7QUFDeEIsMENBQXVEO0FBQ3ZELDhFQUFzRTtBQUd0RSx3Q0FBNEQ7QUFPNUQ7O0dBRUc7QUFDSDtJQUErQyxxQ0FBMEI7SUFVckUsMkJBQVksS0FBcUM7UUFBakQsWUFDSSxrQkFBTSxLQUFLLENBQUMsU0FHZjtRQURHLEtBQUksQ0FBQyxZQUFZLEdBQUcsS0FBSSxDQUFDLFlBQVksSUFBSSxFQUFFLENBQUM7O0lBQ2hELENBQUM7SUFiRDs7T0FFRztJQUNJLDBCQUFRLEdBQWY7UUFDSSwwQkFBZSxDQUFDLDJCQUEyQixFQUFFLGlCQUFpQixFQUFFLFdBQVcsQ0FBQyxDQUFDO0lBQ2pGLENBQUM7SUFVRDs7O09BR0c7SUFDSCxvQ0FBUSxHQUFSLFVBQVMsT0FBbUI7UUFDeEIsSUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1FBRTVCLElBQUksT0FBTyxDQUFDLE1BQU0sS0FBSyxJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRTtZQUM3QyxNQUFNLElBQUksS0FBSyxDQUFDLDZDQUE2QyxDQUFDLENBQUM7U0FDbEU7UUFFRCxJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxVQUFDLEtBQUssRUFBRSxDQUFDLElBQUssT0FBQSxLQUFLLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBbkMsQ0FBbUMsQ0FBQyxDQUFDO0lBQ2pGLENBQUM7SUFFRDs7OztPQUlHO0lBQ0csMENBQWMsR0FBcEIsVUFBcUIsR0FBb0IsRUFBRSxPQUFzQjs7Ozs7Ozt3QkFD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TTtBQThCbkI7O0dBRUc7QUFDSDtJQUE0QiwwQkFBZTtJQVV2QyxnQkFBWSxLQUEwQjtRQUF0QyxZQUNJLGtCQUFNLEtBQUssQ0FBQyxTQVVmO1FBUkcsTUFBTSxDQUFDLGNBQWMsQ0FBQyxLQUFJLEVBQUUsWUFBWSxFQUFFO1lBQ3RDLEdBQUcsRUFBSDtnQkFDSSxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUM7WUFDM0IsQ0FBQztZQUNELEdBQUcsWUFBQyxLQUFhO2dCQUNiLElBQUksQ0FBQyxVQUFVLEdBQUcsS0FBSyxDQUFDO1lBQzVCLENBQUM7U0FDSixDQUFDLENBQUM7O0lBQ1AsQ0FBQztJQXBCRDs7T0FFRztJQUNJLGVBQVEsR0FBZjtRQUNJLDBCQUFlLENBQUMsZ0JBQWdCLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDOUMsQ0FBQztJQWdCTCxhQUFDO0FBQUQsQ0FBQyxBQXRCRCxDQUE0QixlQUFPLEdBc0JsQztBQXRCWSx3QkFBTTtBQXdCbkIsaUJBQWlCLENBQUMsUUFBUSxFQUFFLENBQUM7QUFDN0IsV0FBVyxDQUFDLFFBQVEsRUFBRSxDQUFDO0FBQ3ZCLFFBQVEsQ0FBQyxRQUFRLEVBQUUsQ0FBQztBQUNwQixLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7QUFDakIsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDO0FBQ2xCLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGNyZWF0ZUhhc2ggfSBmcm9tIFwiY3J5cHRvLWJyb3dzZXJpZnlcIjtcbmltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcbmltcG9ydCBMb25nIGZyb20gXCJsb25nXCI7XG5pbXBvcnQgeyBNZXNzYWdlLCBQcm9wZXJ0aWVzIH0gZnJvbSBcInByb3RvYnVmanMvbGlnaHRcIjtcbmltcG9ydCBJZGVudGl0eVdyYXBwZXIsIHsgSUlkZW50aXR5IH0gZnJvbSBcIi4uL2RhcmMvaWRlbnRpdHktd3JhcHBlclwiO1xuaW1wb3J0IFNpZ25lciBmcm9tIFwiLi4vZGFyYy9zaWduZXJcIjtcbmltcG9ydCBMb2cgZnJvbSBcIi4uL2xvZ1wiO1xuaW1wb3J0IHsgRU1QVFlfQlVGRkVSLCByZWdpc3Rlck1lc3NhZ2UgfSBmcm9tIFwiLi4vcHJvdG9idWZcIjtcbmltcG9ydCB7IEluc3RhbmNlSUQgfSBmcm9tIFwiLi9pbnN0YW5jZVwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIElDb3VudGVyVXBkYXRlciB7XG4gICAgZ2V0U2lnbmVyQ291bnRlcnMoc2lnbmVyczogSUlkZW50aXR5W10sIGluY3JlbWVudDogbnVtYmVyKTogUHJvbWlzZTxMb25nW10+O1xufVxuXG4vKipcbiAqIExpc3Qgb2YgaW5zdHJ1Y3Rpb25zIHRvIHNlbmQgdG8gYSBieXpjb2luIGNoYWluXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIENsaWVudFRyYW5zYWN0aW9uIGV4dGVuZHMgTWVzc2FnZTxDbGllbnRUcmFuc2FjdGlvbj4ge1xuICAgIC8qKlxuICAgICAqIEBzZWUgUkVBRE1FI01lc3NhZ2UgY2xhc3Nlc1xuICAgICAqL1xuICAgIHN0YXRpYyByZWdpc3RlcigpIHtcbiAgICAgICAgcmVnaXN0ZXJNZXNzYWdlKFwiYnl6Y29pbi5DbGllbnRUcmFuc2FjdGlvblwiLCBDbGllbnRUcmFuc2FjdGlvbiwgSW5zdHJ1Y3Rpb24pO1xuICAgIH1cblxuICAgIHJlYWRvbmx5IGluc3RydWN0aW9uczogSW5zdHJ1Y3Rpb25bXTtcblxuICAgIGNvbnN0cnVjdG9yKHByb3BzPzogUHJvcGVydGllczxDbGllbnRUcmFuc2FjdGlvbj4pIHtcbiAgICAgICAgc3VwZXIocHJvcHMpO1xuXG4gICAgICAgIHRoaXMuaW5zdHJ1Y3Rpb25zID0gdGhpcy5pbnN0cnVjdGlvbnMgfHwgW107XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2lnbiB0aGUgaGFzaCBvZiB0aGUgaW5zdHJ1Y3Rpb25zIHVzaW5nIHRoZSBsaXN0IG9mIHNpZ25lcnNcbiAgICAgKiBAcGFyYW0gc2lnbmVycyBMaXN0IG9mIHNpZ25lcnNcbiAgICAgKi9cbiAgICBzaWduV2l0aChzaWduZXJzOiBTaWduZXJbXVtdKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IGN0eEhhc2ggPSB0aGlzLmhhc2goKTtcblxuICAgICAgICBpZiAoc2lnbmVycy5sZW5ndGggIT09IHRoaXMuaW5zdHJ1Y3Rpb25zLmxlbmd0aCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwibmVlZCBzYW1lIG51bWJlciBvZiBzaWduZXJzIGFzIGluc3RydWN0aW9uc1wiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuaW5zdHJ1Y3Rpb25zLmZvckVhY2goKGluc3RyLCBpKSA9PiBpbnN0ci5zaWduV2l0aChjdHhIYXNoLCBzaWduZXJzW2ldKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRmV0Y2ggdGhlIGNvdW50ZXJzIGFuZCB1cGRhdGUgdGhlIGluc3RydWN0aW9ucyBhY2NvcmRpbmdseVxuICAgICAqIEBwYXJhbSBycGMgICAgICAgVGhlIFJQQyB0byB1c2UgdG8gZmV0Y2hcbiAgICAgKiBAcGFyYW0gc2lnbmVycyAgIExpc3Qgb2Ygc2lnbmVyc1xuICAgICAqL1xuICAgIGFzeW5jIHVwZGF0ZUNvdW50ZXJzKHJwYzogSUNvdW50ZXJVcGRhdGVyLCBzaWduZXJzOiBJSWRlbnRpdHlbXVtdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGlmICh0aGlzLmluc3RydWN0aW9ucy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzaWduZXJzLmxlbmd0aCAhPT0gdGhpcy5pbnN0cnVjdGlvbnMubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoXCJsZW5ndGggb2Ygc2lnbmVycyBhbmQgaW5zdHJ1Y3Rpb25zIGRvIG5vdCBtYXRjaFwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEdldCBhbGwgY291bnRlcnMgZnJvbSBhbGwgc2lnbmVycyBvZiBhbGwgaW5zdHJ1Y3Rpb25zIGFuZCBtYXAgdGhlbSBpbnRvIGFuIG9iamVjdC5cbiAgICAgICAgY29uc3QgdW5pcXVlU2lnbmVyczogSUlkZW50aXR5W10gPSBfLnVuaXEoXy5mbGF0dGVuKHNpZ25lcnMpKTtcbiAgICAgICAgY29uc3QgY291bnRlcnMgPSBhd2FpdCBycGMuZ2V0U2lnbmVyQ291bnRlcnModW5pcXVlU2lnbmVycywgMSk7XG5cbiAgICAgICAgY29uc3Qgc2lnbmVyQ291bnRlcnM6IHtba2V5OiBzdHJpbmddOiBhbnl9ID0ge307XG4gICAgICAgIHVuaXF1ZVNpZ25lcnMuZm9yRWFjaCgodXMsIGkpID0+IHtcbiAgICAgICAgICAgIHNpZ25lckNvdW50ZXJzW3VzLnRvU3RyaW5nKCldID0gY291bnRlcnNbaV07XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIEl0ZXJhdGUgb3ZlciB0aGUgaW5zdHJ1Y3Rpb25zLCBhbmQgc3RvcmUgdGhlIGFwcHJvcHJpYXRlIHNpZ25lcnMgYW5kIGNvdW50ZXJzLCB3aGlsZVxuICAgICAgICAvLyBpbmNyZWFzaW5nIHRob3NlIHRoYXQgaGF2ZSBiZWVuIHVzZWQuXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5pbnN0cnVjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHNpZ25lcnNbaV0uZm9yRWFjaCgoc2lnbmVyKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5pbnN0cnVjdGlvbnNbaV0uc2lnbmVySWRlbnRpdGllcy5wdXNoKElkZW50aXR5V3JhcHBlci5mcm9tSWRlbnRpdHkoc2lnbmVyKSk7XG4gICAgICAgICAgICAgICAgdGhpcy5pbnN0cnVjdGlvbnNbaV0uc2lnbmVyQ291bnRlci5wdXNoKHNpZ25lckNvdW50ZXJzW3NpZ25lci50b1N0cmluZygpXSk7XG4gICAgICAgICAgICAgICAgc2lnbmVyQ291bnRlcnNbc2lnbmVyLnRvU3RyaW5nKCldID0gc2lnbmVyQ291bnRlcnNbc2lnbmVyLnRvU3RyaW5nKCldLmFkZCgxKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYXN5bmMgdXBkYXRlQ291bnRlcnNBbmRTaWduKHJwYzogSUNvdW50ZXJVcGRhdGVyLCBzaWduZXJzOiBTaWduZXJbXVtdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIC8vIEV4dGVuZCB0aGUgc2lnbmVycyB0byB0aGUgbnVtYmVyIG9mIGluc3RydWN0aW9ucyBpZiB0aGVyZSBpcyBvbmx5IG9uZSBzaWduZXIuXG4gICAgICAgIGlmIChzaWduZXJzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPCB0aGlzLmluc3RydWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHNpZ25lcnMucHVzaChzaWduZXJzWzBdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBhd2FpdCB0aGlzLnVwZGF0ZUNvdW50ZXJzKHJwYywgc2lnbmVycyk7XG4gICAgICAgIHRoaXMuc2lnbldpdGgoc2lnbmVycyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSGFzaCB0aGUgaW5zdHJ1Y3Rpb25zJyBoYXNoXG4gICAgICogQHJldHVybnMgYSBidWZmZXIgb2YgdGhlIGhhc2hcbiAgICAgKi9cbiAgICBoYXNoKCk6IEJ1ZmZlciB7XG4gICAgICAgIGNvbnN0IGggPSBjcmVhdGVIYXNoKFwic2hhMjU2XCIpO1xuICAgICAgICB0aGlzLmluc3RydWN0aW9ucy5mb3JFYWNoKChpKSA9PiBoLnVwZGF0ZShpLmhhc2goKSkpO1xuICAgICAgICByZXR1cm4gaC5kaWdlc3QoKTtcbiAgICB9XG59XG5cbi8qKlxuICogQW4gaW5zdHJ1Y3Rpb24gcmVwcmVzZW50cyBvbmUgYWN0aW9uXG4gKi9cbmV4cG9ydCBjbGFzcyBJbnN0cnVjdGlvbiBleHRlbmRzIE1lc3NhZ2U8SW5zdHJ1Y3Rpb24+IHtcbiAgICBzdGF0aWMgcmVhZG9ubHkgdHlwZVNwYXduID0gMDtcbiAgICBzdGF0aWMgcmVhZG9ubHkgdHlwZUludm9rZSA9IDE7XG4gICAgc3RhdGljIHJlYWRvbmx5IHR5cGVEZWxldGUgPSAyO1xuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSB0eXBlIG9mIHRoZSBpbnN0cnVjdGlvblxuICAgICAqIEByZXR1cm5zIHRoZSB0eXBlIGFzIGEgbnVtYmVyXG4gICAgICovXG4gICAgZ2V0IHR5cGUoKTogbnVtYmVyIHtcbiAgICAgICAgaWYgKHRoaXMuc3Bhd24pIHtcbiAgICAgICAgICAgIHJldHVybiBJbnN0cnVjdGlvbi50eXBlU3Bhd247XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuaW52b2tlKSB7XG4gICAgICAgICAgICByZXR1cm4gSW5zdHJ1Y3Rpb24udHlwZUludm9rZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5kZWxldGUpIHtcbiAgICAgICAgICAgIHJldHVybiBJbnN0cnVjdGlvbi50eXBlRGVsZXRlO1xuICAgICAgICB9XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcImluc3RydWN0aW9uIHdpdGhvdXQgdHlwZVwiKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQHNlZSBSRUFETUUjTWVzc2FnZSBjbGFzc2VzXG4gICAgICovXG4gICAgc3RhdGljIHJlZ2lzdGVyKCkge1xuICAgICAgICByZWdpc3Rlck1lc3NhZ2UoXCJieXpjb2luLkluc3RydWN0aW9uXCIsIEluc3RydWN0aW9uLCBJZGVudGl0eVdyYXBwZXIsIFNwYXduLCBJbnZva2UsIERlbGV0ZSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSGVscGVyIHRvIGNyZWF0ZSBhIHNwYXduIGluc3RydWN0aW9uXG4gICAgICogQHBhcmFtIGlpZCAgICAgICAgICAgVGhlIGluc3RhbmNlIElEXG4gICAgICogQHBhcmFtIGNvbnRyYWN0SUQgICAgVGhlIGNvbnRyYWN0IG5hbWVcbiAgICAgKiBAcGFyYW0gYXJncyAgICAgICAgICBBcmd1bWVudHMgZm9yIHRoZSBpbnN0cnVjdGlvblxuICAgICAqIEByZXR1cm5zIHRoZSBpbnN0cnVjdGlvblxuICAgICAqL1xuICAgIHN0YXRpYyBjcmVhdGVTcGF3bihpaWQ6IEJ1ZmZlciwgY29udHJhY3RJRDogc3RyaW5nLCBhcmdzOiBBcmd1bWVudFtdKTogSW5zdHJ1Y3Rpb24ge1xuICAgICAgICByZXR1cm4gbmV3IEluc3RydWN0aW9uKHtcbiAgICAgICAgICAgIGluc3RhbmNlSUQ6IGlpZCxcbiAgICAgICAgICAgIHNpZ25lckNvdW50ZXI6IFtdLFxuICAgICAgICAgICAgc3Bhd246IG5ldyBTcGF3bih7Y29udHJhY3RJRCwgYXJnc30pLFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBIZWxwZXIgdG8gY3JlYXRlIGEgaW52b2tlIGluc3RydWN0aW9uXG4gICAgICogQHBhcmFtIGlpZCAgICAgICAgICAgVGhlIGluc3RhbmNlIElEXG4gICAgICogQHBhcmFtIGNvbnRyYWN0SUQgICAgVGhlIGNvbnRyYWN0IG5hbWVcbiAgICAgKiBAcGFyYW0gY29tbWFuZCAgICAgICBUaGUgY29tbWFuZCB0byBpbnZva2VcbiAgICAgKiBAcGFyYW0gYXJncyAgICAgICAgICBUaGUgbGlzdCBvZiBhcmd1bWVudHNcbiAgICAgKiBAcmV0dXJucyB0aGUgaW5zdHJ1Y3Rpb25cbiAgICAgKi9cbiAgICBzdGF0aWMgY3JlYXRlSW52b2tlKGlpZDogQnVmZmVyLCBjb250cmFjdElEOiBzdHJpbmcsIGNvbW1hbmQ6IHN0cmluZywgYXJnczogQXJndW1lbnRbXSk6IEluc3RydWN0aW9uIHtcbiAgICAgICAgcmV0dXJuIG5ldyBJbnN0cnVjdGlvbih7XG4gICAgICAgICAgICBpbnN0YW5jZUlEOiBpaWQsXG4gICAgICAgICAgICBpbnZva2U6IG5ldyBJbnZva2Uoe2NvbW1hbmQsIGNvbnRyYWN0SUQsIGFyZ3N9KSxcbiAgICAgICAgICAgIHNpZ25lckNvdW50ZXI6IFtdLFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBIZWxwZXIgdG8gY3JlYXRlIGEgZGVsZXRlIGluc3RydWN0aW9uXG4gICAgICogQHBhcmFtIGlpZCAgICAgICAgICAgVGhlIGluc3RhbmNlIElEXG4gICAgICogQHBhcmFtIGNvbnRyYWN0SUQgICAgVGhlIGNvbnRyYWN0IG5hbWVcbiAgICAgKiBAcmV0dXJucyB0aGUgaW5zdHJ1Y3Rpb25cbiAgICAgKi9cbiAgICBzdGF0aWMgY3JlYXRlRGVsZXRlKGlpZDogQnVmZmVyLCBjb250cmFjdElEOiBzdHJpbmcpOiBJbnN0cnVjdGlvbiB7XG4gICAgICAgIHJldHVybiBuZXcgSW5zdHJ1Y3Rpb24oe1xuICAgICAgICAgICAgZGVsZXRlOiBuZXcgRGVsZXRlKHtjb250cmFjdElEfSksXG4gICAgICAgICAgICBpbnN0YW5jZUlEOiBpaWQsXG4gICAgICAgICAgICBzaWduZXJDb3VudGVyOiBbXSxcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmVhZG9ubHkgc3Bhd246IFNwYXduO1xuICAgIHJlYWRvbmx5IGludm9rZTogSW52b2tlO1xuICAgIHJlYWRvbmx5IGRlbGV0ZTogRGVsZXRlO1xuICAgIHJlYWRvbmx5IGluc3RhbmNlSUQ6IEluc3RhbmNlSUQ7XG4gICAgcmVhZG9ubHkgc2lnbmVyQ291bnRlcjogTG9uZ1tdO1xuICAgIHJlYWRvbmx5IHNpZ25lcklkZW50aXRpZXM6IElkZW50aXR5V3JhcHBlcltdO1xuICAgIHJlYWRvbmx5IHNpZ25hdHVyZXM6IEJ1ZmZlcltdO1xuXG4gICAgY29uc3RydWN0b3IocHJvcHM/OiBQcm9wZXJ0aWVzPEluc3RydWN0aW9uPikge1xuICAgICAgICBzdXBlcihwcm9wcyk7XG5cbiAgICAgICAgdGhpcy5zaWduZXJDb3VudGVyID0gdGhpcy5zaWduZXJDb3VudGVyIHx8IFtdO1xuICAgICAgICB0aGlzLnNpZ25lcklkZW50aXRpZXMgPSB0aGlzLnNpZ25lcklkZW50aXRpZXMgfHwgW107XG4gICAgICAgIHRoaXMuc2lnbmF0dXJlcyA9IHRoaXMuc2lnbmF0dXJlcyB8fCBbXTtcblxuICAgICAgICAvKiBQcm90b2J1ZiBhbGlhc2VzICovXG5cbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIFwiaW5zdGFuY2VpZFwiLCB7XG4gICAgICAgICAgICBnZXQoKTogSW5zdGFuY2VJRCB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaW5zdGFuY2VJRDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzZXQodmFsdWU6IEluc3RhbmNlSUQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmluc3RhbmNlSUQgPSB2YWx1ZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0pO1xuXG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCBcInNpZ25lcmNvdW50ZXJcIiwge1xuICAgICAgICAgICAgZ2V0KCk6IExvbmdbXSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2lnbmVyQ291bnRlcjtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzZXQodmFsdWU6IExvbmdbXSkge1xuICAgICAgICAgICAgICAgIHRoaXMuc2lnbmVyQ291bnRlciA9IHZhbHVlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIFwic2lnbmVyaWRlbnRpdGllc1wiLCB7XG4gICAgICAgICAgICBnZXQoKTogSWRlbnRpdHlXcmFwcGVyW10ge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnNpZ25lcklkZW50aXRpZXM7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2V0KHZhbHVlOiBJZGVudGl0eVdyYXBwZXJbXSkge1xuICAgICAgICAgICAgICAgIHRoaXMuc2lnbmVySWRlbnRpdGllcyA9IHZhbHVlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlIHRoZSBzaWduZXJzIHRvIG1ha2UgYSBzaWduYXR1cmUgb2YgdGhlIGhhc2hcbiAgICAgKiBAcGFyYW0gY3R4SGFzaCBUaGUgY2xpZW50IHRyYW5zYWN0aW9uIGhhc2hcbiAgICAgKiBAcGFyYW0gc2lnbmVycyBUaGUgbGlzdCBvZiBzaWduZXJzXG4gICAgICovXG4gICAgc2lnbldpdGgoY3R4SGFzaDogQnVmZmVyLCBzaWduZXJzOiBTaWduZXJbXSk6IHZvaWQge1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIHRoaXMuc2lnbmF0dXJlcyA9IHNpZ25lcnMubWFwKChzKSA9PiBzLnNpZ24oY3R4SGFzaCkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNldCB0aGUgc2lnbmVyIGNvdW50ZXJzIGFuZCBpZGVudGl0aWVzXG4gICAgICogQHBhcmFtIGNvdW50ZXJzICAgICAgTGlzdCBvZiBjb3VudGVyc1xuICAgICAqIEBwYXJhbSBpZGVudGl0aWVzICAgIExpc3Qgb2YgaWRlbnRpdGllc1xuICAgICAqL1xuICAgIHNldENvdW50ZXJzKGNvdW50ZXJzOiBMb25nW10sIGlkZW50aXRpZXM6IElkZW50aXR5V3JhcHBlcltdKTogdm9pZCB7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgdGhpcy5zaWduZXJDb3VudGVyID0gY291bnRlcnM7XG5cbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICB0aGlzLnNpZ25lcklkZW50aXRpZXMgPSBpZGVudGl0aWVzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEZldGNoIGFuZCB1cGRhdGUgdGhlIGNvdW50ZXJzXG4gICAgICogQHBhcmFtIHJwYyAgICAgICB0aGUgUlBDIHRvIHVzZSB0byBmZXRjaFxuICAgICAqIEBwYXJhbSBzaWduZXJzICAgdGhlIGxpc3Qgb2Ygc2lnbmVyc1xuICAgICAqL1xuICAgIGFzeW5jIHVwZGF0ZUNvdW50ZXJzKHJwYzogSUNvdW50ZXJVcGRhdGVyLCBzaWduZXJzOiBJSWRlbnRpdHlbXSk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBjb25zdCBjb3VudGVycyA9IGF3YWl0IHJwYy5nZXRTaWduZXJDb3VudGVycyhzaWduZXJzLCAxKTtcblxuICAgICAgICB0aGlzLnNldENvdW50ZXJzKGNvdW50ZXJzLCBzaWduZXJzLm1hcCgocykgPT4gSWRlbnRpdHlXcmFwcGVyLmZyb21JZGVudGl0eShzKSkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEhhc2ggdGhlIGluc3RydWN0aW9uXG4gICAgICogQHJldHVybnMgYSBidWZmZXIgb2YgdGhlIGhhc2hcbiAgICAgKi9cbiAgICBoYXNoKCk6IEJ1ZmZlciB7XG4gICAgICAgIGNvbnN0IGggPSBjcmVhdGVIYXNoKFwic2hhMjU2XCIpO1xuICAgICAgICBoLnVwZGF0ZSh0aGlzLmluc3RhbmNlSUQpO1xuICAgICAgICBoLnVwZGF0ZShCdWZmZXIuZnJvbShbdGhpcy50eXBlXSkpO1xuICAgICAgICBsZXQgYXJnczogQXJndW1lbnRbXSA9IFtdO1xuICAgICAgICBzd2l0Y2ggKHRoaXMudHlwZSkge1xuICAgICAgICAgICAgY2FzZSBJbnN0cnVjdGlvbi50eXBlU3Bhd246XG4gICAgICAgICAgICAgICAgaC51cGRhdGUodGhpcy5zcGF3bi5jb250cmFjdElEKTtcbiAgICAgICAgICAgICAgICBhcmdzID0gdGhpcy5zcGF3bi5hcmdzO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBJbnN0cnVjdGlvbi50eXBlSW52b2tlOlxuICAgICAgICAgICAgICAgIGgudXBkYXRlKHRoaXMuaW52b2tlLmNvbnRyYWN0SUQpO1xuICAgICAgICAgICAgICAgIGFyZ3MgPSB0aGlzLmludm9rZS5hcmdzO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBJbnN0cnVjdGlvbi50eXBlRGVsZXRlOlxuICAgICAgICAgICAgICAgIGgudXBkYXRlKHRoaXMuZGVsZXRlLmNvbnRyYWN0SUQpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGFyZ3MuZm9yRWFjaCgoYXJnKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBuYW1lQnVmID0gQnVmZmVyLmZyb20oYXJnLm5hbWUpO1xuICAgICAgICAgICAgY29uc3QgbmFtZUxlbkJ1ZiA9IEJ1ZmZlci5mcm9tKExvbmcuZnJvbU51bWJlcihuYW1lQnVmLmxlbmd0aCkudG9CeXRlc0xFKCkpO1xuXG4gICAgICAgICAgICBoLnVwZGF0ZShuYW1lTGVuQnVmKTtcbiAgICAgICAgICAgIGgudXBkYXRlKGFyZy5uYW1lKTtcblxuICAgICAgICAgICAgY29uc3QgdmFsdWVMZW5CdWYgPSBCdWZmZXIuZnJvbShMb25nLmZyb21OdW1iZXIoYXJnLnZhbHVlLmxlbmd0aCkudG9CeXRlc0xFKCkpO1xuICAgICAgICAgICAgaC51cGRhdGUodmFsdWVMZW5CdWYpO1xuICAgICAgICAgICAgaC51cGRhdGUoYXJnLnZhbHVlKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuc2lnbmVyQ291bnRlci5mb3JFYWNoKChzYykgPT4ge1xuICAgICAgICAgICAgaC51cGRhdGUoQnVmZmVyLmZyb20oc2MudG9CeXRlc0xFKCkpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuc2lnbmVySWRlbnRpdGllcy5mb3JFYWNoKChzaSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgYnVmID0gc2kudG9CeXRlcygpO1xuICAgICAgICAgICAgY29uc3QgbGVuQnVmID0gQnVmZmVyLmZyb20oTG9uZy5mcm9tTnVtYmVyKGJ1Zi5sZW5ndGgpLnRvQnl0ZXNMRSgpKTtcblxuICAgICAgICAgICAgaC51cGRhdGUobGVuQnVmKTtcbiAgICAgICAgICAgIGgudXBkYXRlKHNpLnRvQnl0ZXMoKSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gaC5kaWdlc3QoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIHVuaXF1ZSBpZGVudGlmaWVyIG9mIHRoZSBpbnN0cnVjdGlvblxuICAgICAqIEByZXR1cm5zIHRoZSBpZCBhcyBhIGJ1ZmZlclxuICAgICAqL1xuICAgIGRlcml2ZUlkKHdoYXQ6IHN0cmluZyA9IFwiXCIpOiBCdWZmZXIge1xuICAgICAgICBjb25zdCBoID0gY3JlYXRlSGFzaChcInNoYTI1NlwiKTtcbiAgICAgICAgaC51cGRhdGUodGhpcy5oYXNoKCkpO1xuICAgICAgICBjb25zdCBiID0gQnVmZmVyLmFsbG9jKDQpO1xuICAgICAgICBiLndyaXRlVUludDMyTEUodGhpcy5zaWduYXR1cmVzLmxlbmd0aCwgMCk7XG4gICAgICAgIGgudXBkYXRlKGIpO1xuICAgICAgICB0aGlzLnNpZ25hdHVyZXMuZm9yRWFjaCgoc2lnKSA9PiB7XG4gICAgICAgICAgICBiLndyaXRlVUludDMyTEUoc2lnLmxlbmd0aCwgMCk7XG4gICAgICAgICAgICBoLnVwZGF0ZShiKTtcbiAgICAgICAgICAgIGgudXBkYXRlKHNpZyk7XG4gICAgICAgIH0pO1xuICAgICAgICBoLnVwZGF0ZShCdWZmZXIuZnJvbSh3aGF0KSk7XG4gICAgICAgIHJldHVybiBoLmRpZ2VzdCgpO1xuICAgIH1cbn1cblxuLyoqXG4gKiBBcmd1bWVudCBvZiBhbiBpbnN0cnVjdGlvblxuICovXG5leHBvcnQgY2xhc3MgQXJndW1lbnQgZXh0ZW5kcyBNZXNzYWdlPEFyZ3VtZW50PiB7XG4gICAgLyoqXG4gICAgICogQHNlZSBSRUFETUUjTWVzc2FnZSBjbGFzc2VzXG4gICAgICovXG4gICAgc3RhdGljIHJlZ2lzdGVyKCkge1xuICAgICAgICByZWdpc3Rlck1lc3NhZ2UoXCJieXpjb2luLkFyZ3VtZW50XCIsIEFyZ3VtZW50KTtcbiAgICB9XG5cbiAgICByZWFkb25seSBuYW1lOiBzdHJpbmc7XG4gICAgcmVhZG9ubHkgdmFsdWU6IEJ1ZmZlcjtcblxuICAgIGNvbnN0cnVjdG9yKHByb3BzPzogUHJvcGVydGllczxBcmd1bWVudD4pIHtcbiAgICAgICAgc3VwZXIocHJvcHMpO1xuXG4gICAgICAgIHRoaXMudmFsdWUgPSBCdWZmZXIuZnJvbSh0aGlzLnZhbHVlIHx8IEVNUFRZX0JVRkZFUik7XG4gICAgfVxufVxuXG4vKipcbiAqIFNwYXduIGluc3RydWN0aW9uIHRoYXQgd2lsbCBjcmVhdGUgaW5zdGFuY2VzXG4gKi9cbmV4cG9ydCBjbGFzcyBTcGF3biBleHRlbmRzIE1lc3NhZ2U8U3Bhd24+IHtcbiAgICAvKipcbiAgICAgKiBAc2VlIFJFQURNRSNNZXNzYWdlIGNsYXNzZXNcbiAgICAgKi9cbiAgICBzdGF0aWMgcmVnaXN0ZXIoKSB7XG4gICAgICAgIHJlZ2lzdGVyTWVzc2FnZShcImJ5emNvaW4uU3Bhd25cIiwgU3Bhd24sIEFyZ3VtZW50KTtcbiAgICB9XG5cbiAgICByZWFkb25seSBhcmdzOiBBcmd1bWVudFtdO1xuICAgIHJlYWRvbmx5IGNvbnRyYWN0SUQ6IHN0cmluZztcblxuICAgIGNvbnN0cnVjdG9yKHByb3BzPzogUHJvcGVydGllczxTcGF3bj4pIHtcbiAgICAgICAgc3VwZXIocHJvcHMpO1xuXG4gICAgICAgIHRoaXMuYXJncyA9IHRoaXMuYXJncyB8fCBbXTtcblxuICAgICAgICAvKiBQcm90b2J1ZiBhbGlhc2VzICovXG5cbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIFwiY29udHJhY3RpZFwiLCB7XG4gICAgICAgICAgICBnZXQoKTogc3RyaW5nIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5jb250cmFjdElEO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNldCh2YWx1ZTogc3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb250cmFjdElEID0gdmFsdWU7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9KTtcbiAgICB9XG59XG5cbi8qKlxuICogSW52b2tlIGluc3RydWN0aW9uIHRoYXQgd2lsbCB1cGRhdGUgYW4gZXhpc3RpbmcgaW5zdGFuY2VcbiAqL1xuZXhwb3J0IGNsYXNzIEludm9rZSBleHRlbmRzIE1lc3NhZ2U8SW52b2tlPiB7XG4gICAgLyoqXG4gICAgICogQHNlZSBSRUFETUUjTWVzc2FnZSBjbGFzc2VzXG4gICAgICovXG4gICAgc3RhdGljIHJlZ2lzdGVyKCkge1xuICAgICAgICByZWdpc3Rlck1lc3NhZ2UoXCJieXpjb2luLkludm9rZVwiLCBJbnZva2UsIEFyZ3VtZW50KTtcbiAgICB9XG5cbiAgICByZWFkb25seSBjb21tYW5kOiBzdHJpbmc7XG4gICAgcmVhZG9ubHkgYXJnczogQXJndW1lbnRbXTtcbiAgICByZWFkb25seSBjb250cmFjdElEOiBzdHJpbmc7XG5cbiAgICBjb25zdHJ1Y3Rvcihwcm9wcz86IFByb3BlcnRpZXM8SW52b2tlPikge1xuICAgICAgICBzdXBlcihwcm9wcyk7XG5cbiAgICAgICAgdGhpcy5hcmdzID0gdGhpcy5hcmdzIHx8IFtdO1xuXG4gICAgICAgIC8qIFByb3RvYnVmIGFsaWFzZXMgKi9cblxuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgXCJjb250cmFjdGlkXCIsIHtcbiAgICAgICAgICAgIGdldCgpOiBzdHJpbmcge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNvbnRyYWN0SUQ7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2V0KHZhbHVlOiBzdHJpbmcpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRyYWN0SUQgPSB2YWx1ZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuLyoqXG4gKiBEZWxldGUgaW5zdHJ1Y3Rpb24gdGhhdCB3aWxsIGRlbGV0ZSBhbiBpbnN0YW5jZVxuICovXG5leHBvcnQgY2xhc3MgRGVsZXRlIGV4dGVuZHMgTWVzc2FnZTxEZWxldGU+IHtcbiAgICAvKipcbiAgICAgKiBAc2VlIFJFQURNRSNNZXNzYWdlIGNsYXNzZXNcbiAgICAgKi9cbiAgICBzdGF0aWMgcmVnaXN0ZXIoKSB7XG4gICAgICAgIHJlZ2lzdGVyTWVzc2FnZShcImJ5emNvaW4uRGVsZXRlXCIsIERlbGV0ZSk7XG4gICAgfVxuXG4gICAgcmVhZG9ubHkgY29udHJhY3RJRDogc3RyaW5nO1xuXG4gICAgY29uc3RydWN0b3IocHJvcHM/OiBQcm9wZXJ0aWVzPERlbGV0ZT4pIHtcbiAgICAgICAgc3VwZXIocHJvcHMpO1xuXG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCBcImNvbnRyYWN0aWRcIiwge1xuICAgICAgICAgICAgZ2V0KCk6IHN0cmluZyB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuY29udHJhY3RJRDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzZXQodmFsdWU6IHN0cmluZykge1xuICAgICAgICAgICAgICAgIHRoaXMuY29udHJhY3RJRCA9IHZhbHVlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG5DbGllbnRUcmFuc2FjdGlvbi5yZWdpc3RlcigpO1xuSW5zdHJ1Y3Rpb24ucmVnaXN0ZXIoKTtcbkFyZ3VtZW50LnJlZ2lzdGVyKCk7XG5TcGF3bi5yZWdpc3RlcigpO1xuSW52b2tlLnJlZ2lzdGVyKCk7XG5EZWxldGUucmVnaXN0ZXIoKTtcbiJdfQ==