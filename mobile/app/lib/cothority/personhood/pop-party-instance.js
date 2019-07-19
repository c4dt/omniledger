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
var kyber_1 = require("@dedis/kyber");
var client_transaction_1 = __importStar(require("../byzcoin/client-transaction"));
var darc_instance_1 = __importDefault(require("../byzcoin/contracts/darc-instance"));
var instance_1 = __importDefault(require("../byzcoin/instance"));
var darc_1 = __importDefault(require("../darc/darc"));
var identity_darc_1 = __importDefault(require("../darc/identity-darc"));
var rules_1 = require("../darc/rules");
var credentials_instance_1 = __importDefault(require("./credentials-instance"));
var proto_1 = require("./proto");
var anon = kyber_1.sign.anon;
var PopPartyInstance = /** @class */ (function (_super) {
    __extends(PopPartyInstance, _super);
    function PopPartyInstance(rpc, inst) {
        var _this = _super.call(this, inst) || this;
        _this.rpc = rpc;
        _this.tmpAttendees = [];
        if (inst.contractID.toString() !== PopPartyInstance.contractID) {
            throw new Error("mismatch contract name: " + inst.contractID + " vs " + PopPartyInstance.contractID);
        }
        _this.popPartyStruct = proto_1.PopPartyStruct.decode(_this.data);
        return _this;
    }
    Object.defineProperty(PopPartyInstance.prototype, "finalStatement", {
        /**
         * Getter for the final statement. It throws if the party
         * is not finalized.
         *
         * @returns the final statement
         */
        get: function () {
            if (this.popPartyStruct.state !== PopPartyInstance.FINALIZED) {
                throw new Error("this party is not finalized yet");
            }
            return new proto_1.FinalStatement({
                attendees: this.popPartyStruct.attendees,
                desc: this.popPartyStruct.description,
            });
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Helper to create a PoP party darc
     *
     * @param darcIDs   Organizers darc instance IDs
     * @param desc      Description of the party
     * @returns the new darc
     */
    PopPartyInstance.preparePartyDarc = function (darcIDs, desc) {
        var ids = darcIDs.map(function (di) { return new identity_darc_1.default({ id: di }); });
        var darc = darc_1.default.createBasic(ids, ids, Buffer.from(desc));
        ids.forEach(function (id) {
            darc.addIdentity("invoke:popParty.barrier", id, rules_1.Rule.OR);
            darc.addIdentity("invoke:popParty.finalize", id, rules_1.Rule.OR);
            darc.addIdentity("invoke:popParty.addParty", id, rules_1.Rule.OR);
        });
        return darc;
    };
    /**
     * Get a pop party from byzcoin
     *
     * @param bc    The RPC to use
     * @param iid   The instance ID of the party
     * @param waitMatch how many times to wait for a match - useful if its called just after an addTransactionAndWait.
     * @param interval how long to wait between two attempts in waitMatch.
     * @returns a promise that resolves with the party instance
     */
    PopPartyInstance.fromByzcoin = function (bc, iid, waitMatch, interval) {
        if (waitMatch === void 0) { waitMatch = 0; }
        if (interval === void 0) { interval = 1000; }
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _a = PopPartyInstance.bind;
                        _b = [void 0, bc];
                        return [4 /*yield*/, instance_1.default.fromByzcoin(bc, iid, waitMatch, interval)];
                    case 1: return [2 /*return*/, new (_a.apply(PopPartyInstance, _b.concat([_c.sent()])))()];
                }
            });
        });
    };
    /**
     * Add an attendee to the party
     *
     * @param attendee The public key of the attendee
     */
    PopPartyInstance.prototype.addAttendee = function (attendee) {
        if (this.popPartyStruct.state !== PopPartyInstance.SCANNING) {
            throw new Error("party is not in attendee-adding mode");
        }
        if (this.tmpAttendees.findIndex(function (pub) { return pub.equals(attendee); }) === -1) {
            this.tmpAttendees.push(attendee);
        }
    };
    /**
     * Remove an attendee from the party
     *
     * @param attendee The public key of the attendee
     */
    PopPartyInstance.prototype.removeAttendee = function (attendee) {
        if (this.popPartyStruct.state !== PopPartyInstance.SCANNING) {
            throw new Error("party is not in attendee-adding mode");
        }
        var i = this.tmpAttendees.findIndex(function (pub) { return pub.equals(attendee); });
        if (i >= 0) {
            this.tmpAttendees.splice(i, 1);
        }
        return this.tmpAttendees.length;
    };
    /**
     * Start the party
     *
     * @param signers The list of signers for the transaction
     * @returns a promise that resolves with the state of the party
     */
    PopPartyInstance.prototype.activateBarrier = function (signers) {
        return __awaiter(this, void 0, void 0, function () {
            var instr, ctx;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.popPartyStruct.state !== PopPartyInstance.PRE_BARRIER) {
                            throw new Error("barrier point has already been passed");
                        }
                        instr = client_transaction_1.Instruction.createInvoke(this.id, PopPartyInstance.contractID, "barrier", []);
                        ctx = new client_transaction_1.default({ instructions: [instr] });
                        return [4 /*yield*/, ctx.updateCountersAndSign(this.rpc, [signers])];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.rpc.sendTransactionAndWait(ctx)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, this.update()];
                    case 3:
                        _a.sent();
                        return [2 /*return*/, this.popPartyStruct.state];
                }
            });
        });
    };
    /**
     * Finalize the party
     *
     * @param signers The list of signers for the transaction
     * @returns a promise that resolves with the state of the party
     */
    PopPartyInstance.prototype.finalize = function (signers) {
        return __awaiter(this, void 0, void 0, function () {
            var instr, ctx;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.popPartyStruct.state !== PopPartyInstance.SCANNING) {
                            throw new Error("party did not pass barrier-point yet");
                        }
                        this.popPartyStruct.updateAttendes(this.tmpAttendees);
                        instr = client_transaction_1.Instruction.createInvoke(this.id, PopPartyInstance.contractID, "finalize", [new client_transaction_1.Argument({ name: "attendees", value: this.popPartyStruct.attendees.toBytes() })]);
                        ctx = new client_transaction_1.default({ instructions: [instr] });
                        return [4 /*yield*/, ctx.updateCountersAndSign(this.rpc, [signers])];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.rpc.sendTransactionAndWait(ctx)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, this.update()];
                    case 3:
                        _a.sent();
                        return [2 /*return*/, this.popPartyStruct.state];
                }
            });
        });
    };
    /**
     * Update the party data
     * @returns a promise that resolves with an updaed instance
     */
    PopPartyInstance.prototype.update = function () {
        return __awaiter(this, void 0, void 0, function () {
            var inst, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, instance_1.default.fromByzcoin(this.rpc, this.id)];
                    case 1:
                        inst = _b.sent();
                        this.data = inst.data;
                        this.popPartyStruct = proto_1.PopPartyStruct.decode(this.data);
                        if (!(this.popPartyStruct.state === PopPartyInstance.SCANNING &&
                            this.tmpAttendees.length === 0)) return [3 /*break*/, 3];
                        _a = this;
                        return [4 /*yield*/, this.fetchOrgKeys()];
                    case 2:
                        _a.tmpAttendees = _b.sent();
                        _b.label = 3;
                    case 3: return [2 /*return*/, this];
                }
            });
        });
    };
    /**
     * Mine coins for a person using either an existing coinIID, or a
     * new darc that yet has to be instantiated.
     *
     * @param secret The secret key of the miner
     * @param coinID The coin instance ID of the miner
     * @param newD A new darc that has not been instantiated yet
     */
    PopPartyInstance.prototype.mine = function (secret, coinID, newD) {
        return __awaiter(this, void 0, void 0, function () {
            var keys, lrs, args, instr, ctx;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.popPartyStruct.state !== PopPartyInstance.FINALIZED) {
                            throw new Error("cannot mine on a non-finalized party");
                        }
                        keys = this.popPartyStruct.attendees.publics;
                        return [4 /*yield*/, anon.sign(Buffer.from("mine"), keys, secret, this.id)];
                    case 1:
                        lrs = _a.sent();
                        args = [
                            new client_transaction_1.Argument({ name: "lrs", value: lrs.encode() }),
                        ];
                        if (coinID) {
                            args.push(new client_transaction_1.Argument({ name: "coinIID", value: coinID }));
                        }
                        else if (newD) {
                            args.push(new client_transaction_1.Argument({ name: "newDarc", value: newD.toBytes() }));
                        }
                        else {
                            throw new Error("need to give either coinIID or newDarc");
                        }
                        instr = client_transaction_1.Instruction.createInvoke(this.id, PopPartyInstance.contractID, "mine", args);
                        ctx = new client_transaction_1.default({ instructions: [instr] });
                        return [4 /*yield*/, this.rpc.sendTransactionAndWait(ctx)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, this.update()];
                    case 3:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    PopPartyInstance.prototype.fetchOrgKeys = function () {
        return __awaiter(this, void 0, void 0, function () {
            var piDarc, orgDarcs, orgPers, _i, orgDarcs_1, orgDarc, orgCred, cred, credPers, pub;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, darc_instance_1.default.fromByzcoin(this.rpc, this.darcID)];
                    case 1:
                        piDarc = _a.sent();
                        orgDarcs = piDarc.darc.rules.list.find(function (l) { return l.action === "invoke:popParty.finalize"; }).getIdentities();
                        orgPers = [];
                        _i = 0, orgDarcs_1 = orgDarcs;
                        _a.label = 2;
                    case 2:
                        if (!(_i < orgDarcs_1.length)) return [3 /*break*/, 5];
                        orgDarc = orgDarcs_1[_i];
                        // Remove leading "darc:" from expression
                        orgDarc = orgDarc.substr(5);
                        orgCred = credentials_instance_1.default.credentialIID(Buffer.from(orgDarc, "hex"));
                        return [4 /*yield*/, credentials_instance_1.default.fromByzcoin(this.rpc, orgCred)];
                    case 3:
                        cred = _a.sent();
                        credPers = cred.getAttribute("personhood", "ed25519");
                        if (!credPers) {
                            throw new Error("found organizer without personhood credential");
                        }
                        pub = kyber_1.PointFactory.fromProto(credPers);
                        orgPers.push(pub);
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5: return [2 /*return*/, orgPers];
                }
            });
        });
    };
    PopPartyInstance.contractID = "popParty";
    PopPartyInstance.PRE_BARRIER = 1;
    PopPartyInstance.SCANNING = 2;
    PopPartyInstance.FINALIZED = 3;
    return PopPartyInstance;
}(instance_1.default));
exports.PopPartyInstance = PopPartyInstance;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wLXBhcnR5LWluc3RhbmNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicG9wLXBhcnR5LWluc3RhbmNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLHNDQUFpRTtBQUVqRSxrRkFBeUY7QUFDekYscUZBQThEO0FBQzlELGlFQUEyRDtBQUMzRCxzREFBZ0M7QUFDaEMsd0VBQWlEO0FBQ2pELHVDQUFxQztBQUVyQyxnRkFBeUQ7QUFDekQsaUNBQXlEO0FBRWxELElBQUEsd0JBQUksQ0FBUztBQUVwQjtJQUFzQyxvQ0FBUTtJQTJEMUMsMEJBQW9CLEdBQWUsRUFBRSxJQUFjO1FBQW5ELFlBQ0ksa0JBQU0sSUFBSSxDQUFDLFNBTWQ7UUFQbUIsU0FBRyxHQUFILEdBQUcsQ0FBWTtRQUZuQyxrQkFBWSxHQUFZLEVBQUUsQ0FBQztRQUl2QixJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxFQUFFLEtBQUssZ0JBQWdCLENBQUMsVUFBVSxFQUFFO1lBQzVELE1BQU0sSUFBSSxLQUFLLENBQUMsNkJBQTJCLElBQUksQ0FBQyxVQUFVLFlBQU8sZ0JBQWdCLENBQUMsVUFBWSxDQUFDLENBQUM7U0FDbkc7UUFFRCxLQUFJLENBQUMsY0FBYyxHQUFHLHNCQUFjLENBQUMsTUFBTSxDQUFDLEtBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQzs7SUFDM0QsQ0FBQztJQTFERCxzQkFBSSw0Q0FBYztRQU5sQjs7Ozs7V0FLRzthQUNIO1lBQ0ksSUFBSSxJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssS0FBSyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUU7Z0JBQzFELE1BQU0sSUFBSSxLQUFLLENBQUMsaUNBQWlDLENBQUMsQ0FBQzthQUN0RDtZQUVELE9BQU8sSUFBSSxzQkFBYyxDQUFDO2dCQUN0QixTQUFTLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxT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R0FBRyxTQUF3RDt3QkFDL0QsUUFBUSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsWUFBWSxFQUFFLFNBQVMsQ0FBQyxDQUFDO3dCQUM1RCxJQUFJLENBQUMsUUFBUSxFQUFFOzRCQUNYLE1BQU0sSUFBSSxLQUFLLENBQUMsK0NBQStDLENBQUMsQ0FBQzt5QkFDcEU7d0JBRUssR0FBRyxHQUFHLG9CQUFZLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDO3dCQUM3QyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDOzs7d0JBWEYsSUFBUSxDQUFBOzs0QkFjNUIsc0JBQU8sT0FBTyxFQUFDOzs7O0tBQ2xCO0lBek5lLDJCQUFVLEdBQUcsVUFBVSxDQUFDO0lBQ3hCLDRCQUFXLEdBQUcsQ0FBQyxDQUFDO0lBQ2hCLHlCQUFRLEdBQUcsQ0FBQyxDQUFDO0lBQ2IsMEJBQVMsR0FBRyxDQUFDLENBQUM7SUF1TmxDLHVCQUFDO0NBQUEsQUE1T0QsQ0FBc0Msa0JBQVEsR0E0TzdDO0FBNU9ZLDRDQUFnQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFBvaW50LCBQb2ludEZhY3RvcnksIFNjYWxhciwgc2lnbiB9IGZyb20gXCJAZGVkaXMva3liZXJcIjtcbmltcG9ydCBCeXpDb2luUlBDIGZyb20gXCIuLi9ieXpjb2luL2J5emNvaW4tcnBjXCI7XG5pbXBvcnQgQ2xpZW50VHJhbnNhY3Rpb24sIHsgQXJndW1lbnQsIEluc3RydWN0aW9uIH0gZnJvbSBcIi4uL2J5emNvaW4vY2xpZW50LXRyYW5zYWN0aW9uXCI7XG5pbXBvcnQgRGFyY0luc3RhbmNlIGZyb20gXCIuLi9ieXpjb2luL2NvbnRyYWN0cy9kYXJjLWluc3RhbmNlXCI7XG5pbXBvcnQgSW5zdGFuY2UsIHsgSW5zdGFuY2VJRCB9IGZyb20gXCIuLi9ieXpjb2luL2luc3RhbmNlXCI7XG5pbXBvcnQgRGFyYyBmcm9tIFwiLi4vZGFyYy9kYXJjXCI7XG5pbXBvcnQgSWRlbnRpdHlEYXJjIGZyb20gXCIuLi9kYXJjL2lkZW50aXR5LWRhcmNcIjtcbmltcG9ydCB7IFJ1bGUgfSBmcm9tIFwiLi4vZGFyYy9ydWxlc1wiO1xuaW1wb3J0IFNpZ25lciBmcm9tIFwiLi4vZGFyYy9zaWduZXJcIjtcbmltcG9ydCBDcmVkZW50aWFsc0luc3RhbmNlIGZyb20gXCIuL2NyZWRlbnRpYWxzLWluc3RhbmNlXCI7XG5pbXBvcnQgeyBGaW5hbFN0YXRlbWVudCwgUG9wUGFydHlTdHJ1Y3QgfSBmcm9tIFwiLi9wcm90b1wiO1xuXG5jb25zdCB7YW5vbn0gPSBzaWduO1xuXG5leHBvcnQgY2xhc3MgUG9wUGFydHlJbnN0YW5jZSBleHRlbmRzIEluc3RhbmNlIHtcblxuICAgIC8qKlxuICAgICAqIEdldHRlciBmb3IgdGhlIGZpbmFsIHN0YXRlbWVudC4gSXQgdGhyb3dzIGlmIHRoZSBwYXJ0eVxuICAgICAqIGlzIG5vdCBmaW5hbGl6ZWQuXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB0aGUgZmluYWwgc3RhdGVtZW50XG4gICAgICovXG4gICAgZ2V0IGZpbmFsU3RhdGVtZW50KCk6IEZpbmFsU3RhdGVtZW50IHtcbiAgICAgICAgaWYgKHRoaXMucG9wUGFydHlTdHJ1Y3Quc3RhdGUgIT09IFBvcFBhcnR5SW5zdGFuY2UuRklOQUxJWkVEKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJ0aGlzIHBhcnR5IGlzIG5vdCBmaW5hbGl6ZWQgeWV0XCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5ldyBGaW5hbFN0YXRlbWVudCh7XG4gICAgICAgICAgICBhdHRlbmRlZXM6IHRoaXMucG9wUGFydHlTdHJ1Y3QuYXR0ZW5kZWVzLFxuICAgICAgICAgICAgZGVzYzogdGhpcy5wb3BQYXJ0eVN0cnVjdC5kZXNjcmlwdGlvbixcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHN0YXRpYyByZWFkb25seSBjb250cmFjdElEID0gXCJwb3BQYXJ0eVwiO1xuICAgIHN0YXRpYyByZWFkb25seSBQUkVfQkFSUklFUiA9IDE7XG4gICAgc3RhdGljIHJlYWRvbmx5IFNDQU5OSU5HID0gMjtcbiAgICBzdGF0aWMgcmVhZG9ubHkgRklOQUxJWkVEID0gMztcblxuICAgIC8qKlxuICAgICAqIEhlbHBlciB0byBjcmVhdGUgYSBQb1AgcGFydHkgZGFyY1xuICAgICAqXG4gICAgICogQHBhcmFtIGRhcmNJRHMgICBPcmdhbml6ZXJzIGRhcmMgaW5zdGFuY2UgSURzXG4gICAgICogQHBhcmFtIGRlc2MgICAgICBEZXNjcmlwdGlvbiBvZiB0aGUgcGFydHlcbiAgICAgKiBAcmV0dXJucyB0aGUgbmV3IGRhcmNcbiAgICAgKi9cbiAgICBzdGF0aWMgcHJlcGFyZVBhcnR5RGFyYyhkYXJjSURzOiBJbnN0YW5jZUlEW10sIGRlc2M6IHN0cmluZyk6IERhcmMge1xuICAgICAgICBjb25zdCBpZHMgPSBkYXJjSURzLm1hcCgoZGkpID0+IG5ldyBJZGVudGl0eURhcmMoe2lkOiBkaX0pKTtcbiAgICAgICAgY29uc3QgZGFyYyA9IERhcmMuY3JlYXRlQmFzaWMoaWRzLCBpZHMsIEJ1ZmZlci5mcm9tKGRlc2MpKTtcbiAgICAgICAgaWRzLmZvckVhY2goKGlkKSA9PiB7XG4gICAgICAgICAgICBkYXJjLmFkZElkZW50aXR5KFwiaW52b2tlOnBvcFBhcnR5LmJhcnJpZXJcIiwgaWQsIFJ1bGUuT1IpO1xuICAgICAgICAgICAgZGFyYy5hZGRJZGVudGl0eShcImludm9rZTpwb3BQYXJ0eS5maW5hbGl6ZVwiLCBpZCwgUnVsZS5PUik7XG4gICAgICAgICAgICBkYXJjLmFkZElkZW50aXR5KFwiaW52b2tlOnBvcFBhcnR5LmFkZFBhcnR5XCIsIGlkLCBSdWxlLk9SKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIGRhcmM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IGEgcG9wIHBhcnR5IGZyb20gYnl6Y29pblxuICAgICAqXG4gICAgICogQHBhcmFtIGJjICAgIFRoZSBSUEMgdG8gdXNlXG4gICAgICogQHBhcmFtIGlpZCAgIFRoZSBpbnN0YW5jZSBJRCBvZiB0aGUgcGFydHlcbiAgICAgKiBAcGFyYW0gd2FpdE1hdGNoIGhvdyBtYW55IHRpbWVzIHRvIHdhaXQgZm9yIGEgbWF0Y2ggLSB1c2VmdWwgaWYgaXRzIGNhbGxlZCBqdXN0IGFmdGVyIGFuIGFkZFRyYW5zYWN0aW9uQW5kV2FpdC5cbiAgICAgKiBAcGFyYW0gaW50ZXJ2YWwgaG93IGxvbmcgdG8gd2FpdCBiZXR3ZWVuIHR3byBhdHRlbXB0cyBpbiB3YWl0TWF0Y2guXG4gICAgICogQHJldHVybnMgYSBwcm9taXNlIHRoYXQgcmVzb2x2ZXMgd2l0aCB0aGUgcGFydHkgaW5zdGFuY2VcbiAgICAgKi9cbiAgICBzdGF0aWMgYXN5bmMgZnJvbUJ5emNvaW4oYmM6IEJ5ekNvaW5SUEMsIGlpZDogSW5zdGFuY2VJRCwgd2FpdE1hdGNoOiBudW1iZXIgPSAwLCBpbnRlcnZhbDogbnVtYmVyID0gMTAwMCk6XG4gICAgICAgIFByb21pc2U8UG9wUGFydHlJbnN0YW5jZT4ge1xuICAgICAgICByZXR1cm4gbmV3IFBvcFBhcnR5SW5zdGFuY2UoYmMsIGF3YWl0IEluc3RhbmNlLmZyb21CeXpjb2luKGJjLCBpaWQsIHdhaXRNYXRjaCwgaW50ZXJ2YWwpKTtcbiAgICB9XG4gICAgcG9wUGFydHlTdHJ1Y3Q6IFBvcFBhcnR5U3RydWN0O1xuXG4gICAgdG1wQXR0ZW5kZWVzOiBQb2ludFtdID0gW107XG5cbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJwYzogQnl6Q29pblJQQywgaW5zdDogSW5zdGFuY2UpIHtcbiAgICAgICAgc3VwZXIoaW5zdCk7XG4gICAgICAgIGlmIChpbnN0LmNvbnRyYWN0SUQudG9TdHJpbmcoKSAhPT0gUG9wUGFydHlJbnN0YW5jZS5jb250cmFjdElEKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYG1pc21hdGNoIGNvbnRyYWN0IG5hbWU6ICR7aW5zdC5jb250cmFjdElEfSB2cyAke1BvcFBhcnR5SW5zdGFuY2UuY29udHJhY3RJRH1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMucG9wUGFydHlTdHJ1Y3QgPSBQb3BQYXJ0eVN0cnVjdC5kZWNvZGUodGhpcy5kYXRhKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBZGQgYW4gYXR0ZW5kZWUgdG8gdGhlIHBhcnR5XG4gICAgICpcbiAgICAgKiBAcGFyYW0gYXR0ZW5kZWUgVGhlIHB1YmxpYyBrZXkgb2YgdGhlIGF0dGVuZGVlXG4gICAgICovXG4gICAgYWRkQXR0ZW5kZWUoYXR0ZW5kZWU6IFBvaW50KTogdm9pZCB7XG4gICAgICAgIGlmICh0aGlzLnBvcFBhcnR5U3RydWN0LnN0YXRlICE9PSBQb3BQYXJ0eUluc3RhbmNlLlNDQU5OSU5HKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJwYXJ0eSBpcyBub3QgaW4gYXR0ZW5kZWUtYWRkaW5nIG1vZGVcIik7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy50bXBBdHRlbmRlZXMuZmluZEluZGV4KChwdWIpID0+IHB1Yi5lcXVhbHMoYXR0ZW5kZWUpKSA9PT0gLTEpIHtcbiAgICAgICAgICAgIHRoaXMudG1wQXR0ZW5kZWVzLnB1c2goYXR0ZW5kZWUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGFuIGF0dGVuZGVlIGZyb20gdGhlIHBhcnR5XG4gICAgICpcbiAgICAgKiBAcGFyYW0gYXR0ZW5kZWUgVGhlIHB1YmxpYyBrZXkgb2YgdGhlIGF0dGVuZGVlXG4gICAgICovXG4gICAgcmVtb3ZlQXR0ZW5kZWUoYXR0ZW5kZWU6IFBvaW50KTogbnVtYmVyIHtcbiAgICAgICAgaWYgKHRoaXMucG9wUGFydHlTdHJ1Y3Quc3RhdGUgIT09IFBvcFBhcnR5SW5zdGFuY2UuU0NBTk5JTkcpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcInBhcnR5IGlzIG5vdCBpbiBhdHRlbmRlZS1hZGRpbmcgbW9kZVwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGkgPSB0aGlzLnRtcEF0dGVuZGVlcy5maW5kSW5kZXgoKHB1YikgPT4gcHViLmVxdWFscyhhdHRlbmRlZSkpO1xuICAgICAgICBpZiAoaSA+PSAwKSB7XG4gICAgICAgICAgICB0aGlzLnRtcEF0dGVuZGVlcy5zcGxpY2UoaSwgMSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy50bXBBdHRlbmRlZXMubGVuZ3RoO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFN0YXJ0IHRoZSBwYXJ0eVxuICAgICAqXG4gICAgICogQHBhcmFtIHNpZ25lcnMgVGhlIGxpc3Qgb2Ygc2lnbmVycyBmb3IgdGhlIHRyYW5zYWN0aW9uXG4gICAgICogQHJldHVybnMgYSBwcm9taXNlIHRoYXQgcmVzb2x2ZXMgd2l0aCB0aGUgc3RhdGUgb2YgdGhlIHBhcnR5XG4gICAgICovXG4gICAgYXN5bmMgYWN0aXZhdGVCYXJyaWVyKHNpZ25lcnM6IFNpZ25lcltdKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICAgICAgaWYgKHRoaXMucG9wUGFydHlTdHJ1Y3Quc3RhdGUgIT09IFBvcFBhcnR5SW5zdGFuY2UuUFJFX0JBUlJJRVIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcImJhcnJpZXIgcG9pbnQgaGFzIGFscmVhZHkgYmVlbiBwYXNzZWRcIik7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBpbnN0ciA9IEluc3RydWN0aW9uLmNyZWF0ZUludm9rZShcbiAgICAgICAgICAgIHRoaXMuaWQsXG4gICAgICAgICAgICBQb3BQYXJ0eUluc3RhbmNlLmNvbnRyYWN0SUQsXG4gICAgICAgICAgICBcImJhcnJpZXJcIixcbiAgICAgICAgICAgIFtdLFxuICAgICAgICApO1xuXG4gICAgICAgIGNvbnN0IGN0eCA9IG5ldyBDbGllbnRUcmFuc2FjdGlvbih7aW5zdHJ1Y3Rpb25zOiBbaW5zdHJdfSk7XG4gICAgICAgIGF3YWl0IGN0eC51cGRhdGVDb3VudGVyc0FuZFNpZ24odGhpcy5ycGMsIFtzaWduZXJzXSk7XG5cbiAgICAgICAgYXdhaXQgdGhpcy5ycGMuc2VuZFRyYW5zYWN0aW9uQW5kV2FpdChjdHgpO1xuICAgICAgICBhd2FpdCB0aGlzLnVwZGF0ZSgpO1xuXG4gICAgICAgIHJldHVybiB0aGlzLnBvcFBhcnR5U3RydWN0LnN0YXRlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEZpbmFsaXplIHRoZSBwYXJ0eVxuICAgICAqXG4gICAgICogQHBhcmFtIHNpZ25lcnMgVGhlIGxpc3Qgb2Ygc2lnbmVycyBmb3IgdGhlIHRyYW5zYWN0aW9uXG4gICAgICogQHJldHVybnMgYSBwcm9taXNlIHRoYXQgcmVzb2x2ZXMgd2l0aCB0aGUgc3RhdGUgb2YgdGhlIHBhcnR5XG4gICAgICovXG4gICAgYXN5bmMgZmluYWxpemUoc2lnbmVyczogU2lnbmVyW10pOiBQcm9taXNlPG51bWJlcj4ge1xuICAgICAgICBpZiAodGhpcy5wb3BQYXJ0eVN0cnVjdC5zdGF0ZSAhPT0gUG9wUGFydHlJbnN0YW5jZS5TQ0FOTklORykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGFydHkgZGlkIG5vdCBwYXNzIGJhcnJpZXItcG9pbnQgeWV0XCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5wb3BQYXJ0eVN0cnVjdC51cGRhdGVBdHRlbmRlcyh0aGlzLnRtcEF0dGVuZGVlcyk7XG5cbiAgICAgICAgY29uc3QgaW5zdHIgPSBJbnN0cnVjdGlvbi5jcmVhdGVJbnZva2UoXG4gICAgICAgICAgICB0aGlzLmlkLFxuICAgICAgICAgICAgUG9wUGFydHlJbnN0YW5jZS5jb250cmFjdElELFxuICAgICAgICAgICAgXCJmaW5hbGl6ZVwiLFxuICAgICAgICAgICAgW25ldyBBcmd1bWVudCh7bmFtZTogXCJhdHRlbmRlZXNcIiwgdmFsdWU6IHRoaXMucG9wUGFydHlTdHJ1Y3QuYXR0ZW5kZWVzLnRvQnl0ZXMoKX0pXSxcbiAgICAgICAgKTtcblxuICAgICAgICBjb25zdCBjdHggPSBuZXcgQ2xpZW50VHJhbnNhY3Rpb24oe2luc3RydWN0aW9uczogW2luc3RyXX0pO1xuICAgICAgICBhd2FpdCBjdHgudXBkYXRlQ291bnRlcnNBbmRTaWduKHRoaXMucnBjLCBbc2lnbmVyc10pO1xuXG4gICAgICAgIGF3YWl0IHRoaXMucnBjLnNlbmRUcmFuc2FjdGlvbkFuZFdhaXQoY3R4KTtcbiAgICAgICAgYXdhaXQgdGhpcy51cGRhdGUoKTtcblxuICAgICAgICByZXR1cm4gdGhpcy5wb3BQYXJ0eVN0cnVjdC5zdGF0ZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVcGRhdGUgdGhlIHBhcnR5IGRhdGFcbiAgICAgKiBAcmV0dXJucyBhIHByb21pc2UgdGhhdCByZXNvbHZlcyB3aXRoIGFuIHVwZGFlZCBpbnN0YW5jZVxuICAgICAqL1xuICAgIGFzeW5jIHVwZGF0ZSgpOiBQcm9taXNlPFBvcFBhcnR5SW5zdGFuY2U+IHtcbiAgICAgICAgY29uc3QgaW5zdCA9IGF3YWl0IEluc3RhbmNlLmZyb21CeXpjb2luKHRoaXMucnBjLCB0aGlzLmlkKTtcbiAgICAgICAgdGhpcy5kYXRhID0gaW5zdC5kYXRhO1xuICAgICAgICB0aGlzLnBvcFBhcnR5U3RydWN0ID0gUG9wUGFydHlTdHJ1Y3QuZGVjb2RlKHRoaXMuZGF0YSk7XG5cbiAgICAgICAgaWYgKHRoaXMucG9wUGFydHlTdHJ1Y3Quc3RhdGUgPT09IFBvcFBhcnR5SW5zdGFuY2UuU0NBTk5JTkcgJiZcbiAgICAgICAgICAgIHRoaXMudG1wQXR0ZW5kZWVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgdGhpcy50bXBBdHRlbmRlZXMgPSBhd2FpdCB0aGlzLmZldGNoT3JnS2V5cygpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTWluZSBjb2lucyBmb3IgYSBwZXJzb24gdXNpbmcgZWl0aGVyIGFuIGV4aXN0aW5nIGNvaW5JSUQsIG9yIGFcbiAgICAgKiBuZXcgZGFyYyB0aGF0IHlldCBoYXMgdG8gYmUgaW5zdGFudGlhdGVkLlxuICAgICAqXG4gICAgICogQHBhcmFtIHNlY3JldCBUaGUgc2VjcmV0IGtleSBvZiB0aGUgbWluZXJcbiAgICAgKiBAcGFyYW0gY29pbklEIFRoZSBjb2luIGluc3RhbmNlIElEIG9mIHRoZSBtaW5lclxuICAgICAqIEBwYXJhbSBuZXdEIEEgbmV3IGRhcmMgdGhhdCBoYXMgbm90IGJlZW4gaW5zdGFudGlhdGVkIHlldFxuICAgICAqL1xuICAgIGFzeW5jIG1pbmUoc2VjcmV0OiBTY2FsYXIsIGNvaW5JRD86IEJ1ZmZlciwgbmV3RD86IERhcmMpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgaWYgKHRoaXMucG9wUGFydHlTdHJ1Y3Quc3RhdGUgIT09IFBvcFBhcnR5SW5zdGFuY2UuRklOQUxJWkVEKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJjYW5ub3QgbWluZSBvbiBhIG5vbi1maW5hbGl6ZWQgcGFydHlcIik7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBrZXlzID0gdGhpcy5wb3BQYXJ0eVN0cnVjdC5hdHRlbmRlZXMucHVibGljcztcbiAgICAgICAgY29uc3QgbHJzID0gYXdhaXQgYW5vbi5zaWduKEJ1ZmZlci5mcm9tKFwibWluZVwiKSwga2V5cywgc2VjcmV0LCB0aGlzLmlkKTtcbiAgICAgICAgY29uc3QgYXJncyA9IFtcbiAgICAgICAgICAgIG5ldyBBcmd1bWVudCh7bmFtZTogXCJscnNcIiwgdmFsdWU6IGxycy5lbmNvZGUoKX0pLFxuICAgICAgICBdO1xuICAgICAgICBpZiAoY29pbklEKSB7XG4gICAgICAgICAgICBhcmdzLnB1c2gobmV3IEFyZ3VtZW50KHtuYW1lOiBcImNvaW5JSURcIiwgdmFsdWU6IGNvaW5JRH0pKTtcbiAgICAgICAgfSBlbHNlIGlmIChuZXdEKSB7XG4gICAgICAgICAgICBhcmdzLnB1c2gobmV3IEFyZ3VtZW50KHtuYW1lOiBcIm5ld0RhcmNcIiwgdmFsdWU6IG5ld0QudG9CeXRlcygpfSkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwibmVlZCB0byBnaXZlIGVpdGhlciBjb2luSUlEIG9yIG5ld0RhcmNcIik7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBpbnN0ciA9IEluc3RydWN0aW9uLmNyZWF0ZUludm9rZShcbiAgICAgICAgICAgIHRoaXMuaWQsXG4gICAgICAgICAgICBQb3BQYXJ0eUluc3RhbmNlLmNvbnRyYWN0SUQsXG4gICAgICAgICAgICBcIm1pbmVcIixcbiAgICAgICAgICAgIGFyZ3MsXG4gICAgICAgICk7XG5cbiAgICAgICAgLy8gdGhlIHRyYW5zYWN0aW9uIGlzIG5vdCBzaWduZWQgYnV0IHRoZXJlIGlzIGEgY291bnRlci1tZWFzdXJlIGFnYWluc3RcbiAgICAgICAgLy8gcmVwbGF5IGF0dGFja3Mgc2VydmVyLXNpZGVcbiAgICAgICAgY29uc3QgY3R4ID0gbmV3IENsaWVudFRyYW5zYWN0aW9uKHtpbnN0cnVjdGlvbnM6IFtpbnN0cl19KTtcblxuICAgICAgICBhd2FpdCB0aGlzLnJwYy5zZW5kVHJhbnNhY3Rpb25BbmRXYWl0KGN0eCk7XG4gICAgICAgIGF3YWl0IHRoaXMudXBkYXRlKCk7XG4gICAgfVxuXG4gICAgYXN5bmMgZmV0Y2hPcmdLZXlzKCk6IFByb21pc2U8UG9pbnRbXT4ge1xuICAgICAgICBjb25zdCBwaURhcmMgPSBhd2FpdCBEYXJjSW5zdGFuY2UuZnJvbUJ5emNvaW4odGhpcy5ycGMsIHRoaXMuZGFyY0lEKTtcbiAgICAgICAgY29uc3Qgb3JnRGFyY3MgPSBwaURhcmMuZGFyYy5ydWxlcy5saXN0LmZpbmQoKGwpID0+IGwuYWN0aW9uID09PSBcImludm9rZTpwb3BQYXJ0eS5maW5hbGl6ZVwiKS5nZXRJZGVudGl0aWVzKCk7XG4gICAgICAgIGNvbnN0IG9yZ1BlcnM6IFBvaW50W10gPSBbXTtcblxuICAgICAgICBmb3IgKGxldCBvcmdEYXJjIG9mIG9yZ0RhcmNzKSB7XG4gICAgICAgICAgICAvLyBSZW1vdmUgbGVhZGluZyBcImRhcmM6XCIgZnJvbSBleHByZXNzaW9uXG4gICAgICAgICAgICBvcmdEYXJjID0gb3JnRGFyYy5zdWJzdHIoNSk7XG4gICAgICAgICAgICBjb25zdCBvcmdDcmVkID0gQ3JlZGVudGlhbHNJbnN0YW5jZS5jcmVkZW50aWFsSUlEKEJ1ZmZlci5mcm9tKG9yZ0RhcmMsIFwiaGV4XCIpKTtcbiAgICAgICAgICAgIGNvbnN0IGNyZWQgPSBhd2FpdCBDcmVkZW50aWFsc0luc3RhbmNlLmZyb21CeXpjb2luKHRoaXMucnBjLCBvcmdDcmVkKTtcbiAgICAgICAgICAgIGNvbnN0IGNyZWRQZXJzID0gY3JlZC5nZXRBdHRyaWJ1dGUoXCJwZXJzb25ob29kXCIsIFwiZWQyNTUxOVwiKTtcbiAgICAgICAgICAgIGlmICghY3JlZFBlcnMpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJmb3VuZCBvcmdhbml6ZXIgd2l0aG91dCBwZXJzb25ob29kIGNyZWRlbnRpYWxcIik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHB1YiA9IFBvaW50RmFjdG9yeS5mcm9tUHJvdG8oY3JlZFBlcnMpO1xuICAgICAgICAgICAgb3JnUGVycy5wdXNoKHB1Yik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gb3JnUGVycztcbiAgICB9XG59XG4iXX0=