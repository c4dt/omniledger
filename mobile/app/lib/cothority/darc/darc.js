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
var crypto_browserify_1 = require("crypto-browserify");
var long_1 = __importDefault(require("long"));
var light_1 = require("protobufjs/light");
var protobuf_1 = require("../protobuf");
var identity_wrapper_1 = __importDefault(require("./identity-wrapper"));
var rules_1 = __importStar(require("./rules"));
/**
 * Distributed Access Right Controls
 */
var Darc = /** @class */ (function (_super) {
    __extends(Darc, _super);
    function Darc(properties) {
        var _this = _super.call(this, properties) || this;
        _this.description = Buffer.from(_this.description || protobuf_1.EMPTY_BUFFER);
        _this.baseID = Buffer.from(_this.baseID || protobuf_1.EMPTY_BUFFER);
        _this.prevID = Buffer.from(_this.prevID || protobuf_1.EMPTY_BUFFER);
        _this.rules = _this.rules || new rules_1.default();
        /* Protobuf aliases */
        Object.defineProperty(_this, "baseid", {
            get: function () {
                return this.baseID;
            },
            set: function (value) {
                this.baseID = value;
            },
        });
        Object.defineProperty(_this, "previd", {
            get: function () {
                return this.prevID;
            },
            set: function (value) {
                this.prevID = value;
            },
        });
        return _this;
    }
    Object.defineProperty(Darc.prototype, "id", {
        /**
         * Get the id of the darc
         * @returns the id as a buffer
         */
        get: function () {
            var h = crypto_browserify_1.createHash("sha256");
            var versionBuf = Buffer.from(this.version.toBytesLE());
            h.update(versionBuf);
            h.update(this.description);
            if (this.baseID.length > 0) {
                h.update(this.baseID);
            }
            if (this.prevID.length > 0) {
                h.update(this.prevID);
            }
            this.rules.list.forEach(function (r) {
                h.update(r.action);
                h.update(r.getExpr());
            });
            return h.digest();
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Create a list of rules with basic permissions for owners and signers
     * @param owners those allow to evolve the darc
     * @param signers those allow to sign
     * @returns the list of rules
     */
    Darc.initRules = function (owners, signers) {
        var rules = new rules_1.default();
        owners.forEach(function (o) { return rules.appendToRule("invoke:darc.evolve", o, rules_1.Rule.AND); });
        signers.forEach(function (s) { return rules.appendToRule(Darc.ruleSign, s, rules_1.Rule.OR); });
        return rules;
    };
    /**
     * Creates a basic darc using the owners and signers to populate the
     * rules.
     * @param owners    those you can evolve the darc
     * @param signers   those you can sign
     * @param desc      the description of the darc
     * @returns the new darc
     */
    Darc.createBasic = function (owners, signers, desc, rules) {
        var darc = new Darc({
            baseID: Buffer.from([]),
            description: desc,
            prevID: crypto_browserify_1.createHash("sha256").digest(),
            rules: this.initRules(owners, signers),
            version: long_1.default.fromNumber(0, true),
        });
        if (rules) {
            rules.forEach(function (r) {
                signers.forEach(function (s) {
                    darc.rules.appendToRule(r, s, "|");
                });
            });
        }
        return darc;
    };
    /**
     * @see README#Message classes
     */
    Darc.register = function () {
        protobuf_1.registerMessage("Darc", Darc, rules_1.default);
    };
    /**
     * Get the id of the genesis darc
     * @returns the id as a buffer
     */
    Darc.prototype.getBaseID = function () {
        if (this.version.eq(0)) {
            return this.id;
        }
        else {
            return this.baseID;
        }
    };
    /**
     * Append an identity to a rule using the given operator when
     * it already exists
     * @param rule      the name of the rule
     * @param identity  the identity to append to the rule
     * @param op        the operator to use if necessary
     */
    Darc.prototype.addIdentity = function (rule, identity, op) {
        this.rules.appendToRule(rule, identity, op);
    };
    /**
     * Copy and evolve the darc to the next version so that it can be
     * changed and proposed to byzcoin.
     * @returns a new darc
     */
    Darc.prototype.evolve = function () {
        return new Darc({
            baseID: this.getBaseID(),
            description: this.description,
            prevID: this.id,
            rules: this.rules.clone(),
            version: this.version.add(1),
        });
    };
    /**
     * Get a string representation of the darc
     * @returns the string representation
     */
    Darc.prototype.toString = function () {
        return "ID: " + this.id.toString("hex") + "\n" +
            "Base: " + this.baseID.toString("hex") + "\n" +
            "Prev: " + this.prevID.toString("hex") + "\n" +
            "Version: " + this.version + "\n" +
            "Rules: " + this.rules;
    };
    /**
     * Helper to encode the darc using protobuf
     * @returns encoded darc as a buffer
     */
    Darc.prototype.toBytes = function () {
        return Buffer.from(Darc.encode(this).finish());
    };
    /**
     * Returns a deep copy of the darc.
     */
    Darc.prototype.copy = function () {
        return Darc.decode(this.toBytes());
    };
    /**
     * Checks whether the given rule can be matched by a multi-signature created by all
     * signers. If the rule doesn't exist, it throws an error.
     * Currently restrictions:
     *  - only Rule.OR are supported. A Rule.AND or "(" will return an error.
     *  - only one identity can be checked. If more identities are given, the function
     *  returns an error.
     *
     * @param action the action to match
     * @param signers all supposed signers for this action.
     * @return the set of identities that match the rule.
     */
    Darc.prototype.ruleMatch = function (action, signers, getDarc) {
        return __awaiter(this, void 0, void 0, function () {
            var rule, ids, _i, ids_1, idStr, id, d;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        rule = this.rules.getRule(action);
                        if (!rule) {
                            throw new Error("This rule doesn't exist");
                        }
                        if (signers.length !== 1) {
                            throw new Error("Currently only supports checking 1 identity");
                        }
                        ids = rule.getIdentities();
                        _i = 0, ids_1 = ids;
                        _a.label = 1;
                    case 1:
                        if (!(_i < ids_1.length)) return [3 /*break*/, 5];
                        idStr = ids_1[_i];
                        id = identity_wrapper_1.default.fromString(idStr);
                        if (id.toString() === signers[0].toString()) {
                            return [2 /*return*/, signers];
                        }
                        if (!id.darc) return [3 /*break*/, 4];
                        return [4 /*yield*/, getDarc(id.darc.id)];
                    case 2:
                        d = _a.sent();
                        return [4 /*yield*/, d.ruleMatch(Darc.ruleSign, signers, getDarc)];
                    case 3:
                        if ((_a.sent()).length === 1) {
                            return [2 /*return*/, signers];
                        }
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 1];
                    case 5: return [2 /*return*/, []];
                }
            });
        });
    };
    Darc.ruleSign = "_sign";
    return Darc;
}(light_1.Message));
exports.default = Darc;
Darc.register();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGFyYy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImRhcmMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsdURBQStDO0FBQy9DLDhDQUF3QjtBQUN4QiwwQ0FBdUQ7QUFDdkQsd0NBQTREO0FBQzVELHdFQUFnRTtBQUNoRSwrQ0FBc0M7QUFFdEM7O0dBRUc7QUFDSDtJQUFrQyx3QkFBYTtJQW1GM0MsY0FBWSxVQUE2QjtRQUF6QyxZQUNJLGtCQUFNLFVBQVUsQ0FBQyxTQTBCcEI7UUF4QkcsS0FBSSxDQUFDLFdBQVcsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUksQ0FBQyxXQUFXLElBQUksdUJBQVksQ0FBQyxDQUFDO1FBQ2pFLEtBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFJLENBQUMsTUFBTSxJQUFJLHVCQUFZLENBQUMsQ0FBQztRQUN2RCxLQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSSxDQUFDLE1BQU0sSUFBSSx1QkFBWSxDQUFDLENBQUM7UUFDdkQsS0FBSSxDQUFDLEtBQUssR0FBRyxLQUFJLENBQUMsS0FBSyxJQUFJLElBQUksZUFBSyxFQUFFLENBQUM7UUFFdkMsc0JBQXNCO1FBRXRCLE1BQU0sQ0FBQyxjQUFjLENBQUMsS0FBSSxFQUFFLFFBQVEsRUFBRTtZQUNsQyxHQUFHLEVBQUg7Z0JBQ0ksT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDO1lBQ3ZCLENBQUM7WUFDRCxHQUFHLFlBQUMsS0FBYTtnQkFDYixJQUFJLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQztZQUN4QixDQUFDO1NBQ0osQ0FBQyxDQUFDO1FBRUgsTUFBTSxDQUFDLGNBQWMsQ0FBQyxLQUFJLEVBQUUsUUFBUSxFQUFFO1lBQ2xDLEdBQUcsRUFBSDtnQkFDSSxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUM7WUFDdkIsQ0FBQztZQUNELEdBQUcsWUFBQyxLQUFhO2dCQUNiLElBQUksQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDO1lBQ3hCLENBQUM7U0FDSixDQUFDLENBQUM7O0lBQ1AsQ0FBQztJQXhHRCxzQkFBSSxvQkFBRTtRQUpOOzs7V0FHRzthQUNIO1lBQ0ksSUFBTSxDQUFDLEdBQUcsOEJBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUMvQixJQUFNLFVBQVUsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQztZQUN6RCxDQUFDLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ3JCLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBRTNCLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO2dCQUN4QixDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQzthQUN6QjtZQUNELElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO2dCQUN4QixDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQzthQUN6QjtZQUVELElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFDLENBQUM7Z0JBQ3RCLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUNuQixDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1lBQzFCLENBQUMsQ0FBQyxDQUFDO1lBRUgsT0FBTyxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDdEIsQ0FBQzs7O09BQUE7SUFHRDs7Ozs7T0FLRztJQUNJLGNBQVMsR0FBaEIsVUFBaUIsTUFBbUIsRUFBRSxPQUFvQjtRQUN0RCxJQUFNLEtBQUssR0FBRyxJQUFJLGVBQUssRUFBRSxDQUFDO1FBRTFCLE1BQU0sQ0FBQyxPQUFPLENBQUMsVUFBQyxDQUFDLElBQUssT0FBQSxLQUFLLENBQUMsWUFBWSxDQUFDLG9CQUFvQixFQUFFLENBQUMsRUFBRSxZQUFJLENBQUMsR0FBRyxDQUFDLEVBQXJELENBQXFELENBQUMsQ0FBQztRQUM3RSxPQUFPLENBQUMsT0FBTyxDQUFDLFVBQUMsQ0FBQyxJQUFLLE9BQUEsS0FBSyxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsRUFBRSxZQUFJLENBQUMsRUFBRSxDQUFDLEVBQTdDLENBQTZDLENBQUMsQ0FBQztRQUV0RSxPQUFPLEtBQUssQ0FBQztJQUNqQixDQUFDO0lBRUQ7Ozs7Ozs7T0FPRztJQUNJLGdCQUFXLEdBQWxCLFVBQW1CLE1BQW1CLEVBQUUsT0FBb0IsRUFBRSxJQUFhLEVBQUUsS0FBZ0I7UUFDekYsSUFBTSxJQUFJLEdBQUcsSUFBSSxJQUFJLENBQUM7WUFDbEIsTUFBTSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1lBQ3ZCLFdBQVcsRUFBRSxJQUFJO1lBQ2pCLE1BQU0sRUFBRSw4QkFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDLE1BQU0sRUFBRTtZQUNyQyxLQUFLLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFDO1lBQ3RDLE9BQU8sRUFBRSxjQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUM7U0FDcEMsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxLQUFLLEVBQUU7WUFDUCxLQUFLLENBQUMsT0FBTyxDQUFDLFVBQUMsQ0FBQztnQkFDWixPQUFPLENBQUMsT0FBTyxDQUFDLFVBQUMsQ0FBQztvQkFDZCxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO2dCQUN2QyxDQUFDLENBQUMsQ0FBQztZQUNQLENBQUMsQ0FBQyxDQUFDO1NBQ047UUFFRCxPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDO0lBRUQ7O09BRUc7SUFDSSxhQUFRLEdBQWY7UUFDSSwwQkFBZSxDQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUUsZUFBSyxDQUFDLENBQUM7SUFDekMsQ0FBQztJQXFDRDs7O09BR0c7SUFDSCx3QkFBUyxHQUFUO1FBQ0ksSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRTtZQUNwQixPQUFPLElBQUksQ0FBQyxFQUFFLENBQUM7U0FDbEI7YUFBTTtZQUNILE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQztTQUN0QjtJQUNMLENBQUM7SUFFRDs7Ozs7O09BTUc7SUFDSCwwQkFBVyxHQUFYLFVBQVksSUFBWSxFQUFFLFFBQW1CLEVBQUUsRUFBVTtRQUNyRCxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsUUFBUSxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQ2hELENBQUM7SUFFRDs7OztPQUlHO0lBQ0gscUJBQU0sR0FBTjtRQUNJLE9BQU8sSUFBSSxJQUFJLENBQUM7WUFDWixNQUFNLEVBQUUsSUFBSSxDQUFDLFNBQVMsRUFBRTtZQUN4QixXQUFXLEVBQUUsSUFBSSxDQUFDLFdBQVc7WUFDN0IsTUFBTSxFQUFFLElBQUksQ0FBQyxFQUFFO1lBQ2YsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFO1lBQ3pCLE9BQU8sRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7U0FDL0IsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVEOzs7T0FHRztJQUNILHVCQUFRLEdBQVI7UUFDSSxPQUFPLE1BQU0sR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsR0FBRyxJQUFJO1lBQzFDLFFBQVEsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsR0FBRyxJQUFJO1lBQzdDLFFBQVEsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsR0FBRyxJQUFJO1lBQzdDLFdBQVcsR0FBRyxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUk7WUFDakMsU0FBUyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7SUFDL0IsQ0FBQztJQUVEOzs7T0FHRztJQUNILHNCQUFPLEdBQVA7UUFDSSxPQUFPLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO0lBQ25ELENBQUM7SUFFRDs7T0FFRztJQUNILG1CQUFJLEdBQUo7UUFDSSxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7SUFDdkMsQ0FBQztJQUVEOzs7Ozs7Ozs7OztPQVdHO0lBQ0csd0JBQVMsR0FBZixVQUFnQixNQUFjLEVBQUUsT0FBb0IsRUFDcEMsT0FBc0M7Ozs7Ozt3QkFDNUMsSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO3dCQUN4QyxJQUFJLENBQUMsSUFBSSxFQUFFOzRCQUNQLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQzt5QkFDOUM7d0JBQ0QsSUFBSSxPQUFPLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTs0QkFDdEIsTUFBTSxJQUFJLEtBQUssQ0FBQyw2Q0FBNkMsQ0FBQyxDQUFDO3lCQUNsRTt3QkFDSyxHQUFHLEdBQUcsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDOzhCQUNWLEVBQUgsV0FBRzs7OzZCQUFILENBQUEsaUJBQUcsQ0FBQTt3QkFBWixLQUFLO3dCQUNOLEVBQUUsR0FBRywwQkFBZSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQzt3QkFDN0MsSUFBSSxFQUFFLENBQUMsUUFBUSxFQUFFLEtBQUssT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxFQUFFOzRCQUN6QyxzQkFBTyxPQUFPLEVBQUM7eUJBQ2xCOzZCQUNHLEVBQUUsQ0FBQyxJQUFJLEVBQVAsd0JBQU87d0JBQ0cscUJBQU0sT0FBTyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUE7O3dCQUE3QixDQUFDLEdBQUcsU0FBeUI7d0JBQzlCLHFCQUFNLENBQUMsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxPQUFPLEVBQUUsT0FBTyxDQUFDLEVBQUE7O3dCQUF2RCxJQUFJLENBQUMsU0FBa0QsQ0FBQyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7NEJBQ25FLHNCQUFPLE9BQU8sRUFBQzt5QkFDbEI7Ozt3QkFUVyxJQUFHLENBQUE7OzRCQVl2QixzQkFBTyxFQUFFLEVBQUM7Ozs7S0FDYjtJQXpMZSxhQUFRLEdBQUcsT0FBTyxDQUFDO0lBMEx2QyxXQUFDO0NBQUEsQUFyTkQsQ0FBa0MsZUFBTyxHQXFOeEM7a0JBck5vQixJQUFJO0FBdU56QixJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBjcmVhdGVIYXNoIH0gZnJvbSBcImNyeXB0by1icm93c2VyaWZ5XCI7XG5pbXBvcnQgTG9uZyBmcm9tIFwibG9uZ1wiO1xuaW1wb3J0IHsgTWVzc2FnZSwgUHJvcGVydGllcyB9IGZyb20gXCJwcm90b2J1ZmpzL2xpZ2h0XCI7XG5pbXBvcnQgeyBFTVBUWV9CVUZGRVIsIHJlZ2lzdGVyTWVzc2FnZSB9IGZyb20gXCIuLi9wcm90b2J1ZlwiO1xuaW1wb3J0IElkZW50aXR5V3JhcHBlciwgeyBJSWRlbnRpdHkgfSBmcm9tIFwiLi9pZGVudGl0eS13cmFwcGVyXCI7XG5pbXBvcnQgUnVsZXMsIHsgUnVsZSB9IGZyb20gXCIuL3J1bGVzXCI7XG5cbi8qKlxuICogRGlzdHJpYnV0ZWQgQWNjZXNzIFJpZ2h0IENvbnRyb2xzXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIERhcmMgZXh0ZW5kcyBNZXNzYWdlPERhcmM+IHtcblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgaWQgb2YgdGhlIGRhcmNcbiAgICAgKiBAcmV0dXJucyB0aGUgaWQgYXMgYSBidWZmZXJcbiAgICAgKi9cbiAgICBnZXQgaWQoKTogQnVmZmVyIHtcbiAgICAgICAgY29uc3QgaCA9IGNyZWF0ZUhhc2goXCJzaGEyNTZcIik7XG4gICAgICAgIGNvbnN0IHZlcnNpb25CdWYgPSBCdWZmZXIuZnJvbSh0aGlzLnZlcnNpb24udG9CeXRlc0xFKCkpO1xuICAgICAgICBoLnVwZGF0ZSh2ZXJzaW9uQnVmKTtcbiAgICAgICAgaC51cGRhdGUodGhpcy5kZXNjcmlwdGlvbik7XG5cbiAgICAgICAgaWYgKHRoaXMuYmFzZUlELmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGgudXBkYXRlKHRoaXMuYmFzZUlEKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5wcmV2SUQubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgaC51cGRhdGUodGhpcy5wcmV2SUQpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5ydWxlcy5saXN0LmZvckVhY2goKHIpID0+IHtcbiAgICAgICAgICAgIGgudXBkYXRlKHIuYWN0aW9uKTtcbiAgICAgICAgICAgIGgudXBkYXRlKHIuZ2V0RXhwcigpKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIGguZGlnZXN0KCk7XG4gICAgfVxuXG4gICAgc3RhdGljIHJlYWRvbmx5IHJ1bGVTaWduID0gXCJfc2lnblwiO1xuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhIGxpc3Qgb2YgcnVsZXMgd2l0aCBiYXNpYyBwZXJtaXNzaW9ucyBmb3Igb3duZXJzIGFuZCBzaWduZXJzXG4gICAgICogQHBhcmFtIG93bmVycyB0aG9zZSBhbGxvdyB0byBldm9sdmUgdGhlIGRhcmNcbiAgICAgKiBAcGFyYW0gc2lnbmVycyB0aG9zZSBhbGxvdyB0byBzaWduXG4gICAgICogQHJldHVybnMgdGhlIGxpc3Qgb2YgcnVsZXNcbiAgICAgKi9cbiAgICBzdGF0aWMgaW5pdFJ1bGVzKG93bmVyczogSUlkZW50aXR5W10sIHNpZ25lcnM6IElJZGVudGl0eVtdKTogUnVsZXMge1xuICAgICAgICBjb25zdCBydWxlcyA9IG5ldyBSdWxlcygpO1xuXG4gICAgICAgIG93bmVycy5mb3JFYWNoKChvKSA9PiBydWxlcy5hcHBlbmRUb1J1bGUoXCJpbnZva2U6ZGFyYy5ldm9sdmVcIiwgbywgUnVsZS5BTkQpKTtcbiAgICAgICAgc2lnbmVycy5mb3JFYWNoKChzKSA9PiBydWxlcy5hcHBlbmRUb1J1bGUoRGFyYy5ydWxlU2lnbiwgcywgUnVsZS5PUikpO1xuXG4gICAgICAgIHJldHVybiBydWxlcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgYmFzaWMgZGFyYyB1c2luZyB0aGUgb3duZXJzIGFuZCBzaWduZXJzIHRvIHBvcHVsYXRlIHRoZVxuICAgICAqIHJ1bGVzLlxuICAgICAqIEBwYXJhbSBvd25lcnMgICAgdGhvc2UgeW91IGNhbiBldm9sdmUgdGhlIGRhcmNcbiAgICAgKiBAcGFyYW0gc2lnbmVycyAgIHRob3NlIHlvdSBjYW4gc2lnblxuICAgICAqIEBwYXJhbSBkZXNjICAgICAgdGhlIGRlc2NyaXB0aW9uIG9mIHRoZSBkYXJjXG4gICAgICogQHJldHVybnMgdGhlIG5ldyBkYXJjXG4gICAgICovXG4gICAgc3RhdGljIGNyZWF0ZUJhc2ljKG93bmVyczogSUlkZW50aXR5W10sIHNpZ25lcnM6IElJZGVudGl0eVtdLCBkZXNjPzogQnVmZmVyLCBydWxlcz86IHN0cmluZ1tdKTogRGFyYyB7XG4gICAgICAgIGNvbnN0IGRhcmMgPSBuZXcgRGFyYyh7XG4gICAgICAgICAgICBiYXNlSUQ6IEJ1ZmZlci5mcm9tKFtdKSxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBkZXNjLFxuICAgICAgICAgICAgcHJldklEOiBjcmVhdGVIYXNoKFwic2hhMjU2XCIpLmRpZ2VzdCgpLFxuICAgICAgICAgICAgcnVsZXM6IHRoaXMuaW5pdFJ1bGVzKG93bmVycywgc2lnbmVycyksXG4gICAgICAgICAgICB2ZXJzaW9uOiBMb25nLmZyb21OdW1iZXIoMCwgdHJ1ZSksXG4gICAgICAgIH0pO1xuICAgICAgICBpZiAocnVsZXMpIHtcbiAgICAgICAgICAgIHJ1bGVzLmZvckVhY2goKHIpID0+IHtcbiAgICAgICAgICAgICAgICBzaWduZXJzLmZvckVhY2goKHMpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgZGFyYy5ydWxlcy5hcHBlbmRUb1J1bGUociwgcywgXCJ8XCIpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZGFyYztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAc2VlIFJFQURNRSNNZXNzYWdlIGNsYXNzZXNcbiAgICAgKi9cbiAgICBzdGF0aWMgcmVnaXN0ZXIoKSB7XG4gICAgICAgIHJlZ2lzdGVyTWVzc2FnZShcIkRhcmNcIiwgRGFyYywgUnVsZXMpO1xuICAgIH1cblxuICAgIHJlYWRvbmx5IHZlcnNpb246IExvbmc7XG4gICAgcmVhZG9ubHkgZGVzY3JpcHRpb246IEJ1ZmZlcjtcbiAgICByZWFkb25seSBiYXNlSUQ6IEJ1ZmZlcjtcbiAgICByZWFkb25seSBwcmV2SUQ6IEJ1ZmZlcjtcbiAgICByZWFkb25seSBydWxlczogUnVsZXM7XG5cbiAgICBjb25zdHJ1Y3Rvcihwcm9wZXJ0aWVzPzogUHJvcGVydGllczxEYXJjPikge1xuICAgICAgICBzdXBlcihwcm9wZXJ0aWVzKTtcblxuICAgICAgICB0aGlzLmRlc2NyaXB0aW9uID0gQnVmZmVyLmZyb20odGhpcy5kZXNjcmlwdGlvbiB8fCBFTVBUWV9CVUZGRVIpO1xuICAgICAgICB0aGlzLmJhc2VJRCA9IEJ1ZmZlci5mcm9tKHRoaXMuYmFzZUlEIHx8IEVNUFRZX0JVRkZFUik7XG4gICAgICAgIHRoaXMucHJldklEID0gQnVmZmVyLmZyb20odGhpcy5wcmV2SUQgfHwgRU1QVFlfQlVGRkVSKTtcbiAgICAgICAgdGhpcy5ydWxlcyA9IHRoaXMucnVsZXMgfHwgbmV3IFJ1bGVzKCk7XG5cbiAgICAgICAgLyogUHJvdG9idWYgYWxpYXNlcyAqL1xuXG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCBcImJhc2VpZFwiLCB7XG4gICAgICAgICAgICBnZXQoKTogQnVmZmVyIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5iYXNlSUQ7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2V0KHZhbHVlOiBCdWZmZXIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmJhc2VJRCA9IHZhbHVlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIFwicHJldmlkXCIsIHtcbiAgICAgICAgICAgIGdldCgpOiBCdWZmZXIge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnByZXZJRDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzZXQodmFsdWU6IEJ1ZmZlcikge1xuICAgICAgICAgICAgICAgIHRoaXMucHJldklEID0gdmFsdWU7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIGlkIG9mIHRoZSBnZW5lc2lzIGRhcmNcbiAgICAgKiBAcmV0dXJucyB0aGUgaWQgYXMgYSBidWZmZXJcbiAgICAgKi9cbiAgICBnZXRCYXNlSUQoKTogQnVmZmVyIHtcbiAgICAgICAgaWYgKHRoaXMudmVyc2lvbi5lcSgwKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuaWQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5iYXNlSUQ7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBcHBlbmQgYW4gaWRlbnRpdHkgdG8gYSBydWxlIHVzaW5nIHRoZSBnaXZlbiBvcGVyYXRvciB3aGVuXG4gICAgICogaXQgYWxyZWFkeSBleGlzdHNcbiAgICAgKiBAcGFyYW0gcnVsZSAgICAgIHRoZSBuYW1lIG9mIHRoZSBydWxlXG4gICAgICogQHBhcmFtIGlkZW50aXR5ICB0aGUgaWRlbnRpdHkgdG8gYXBwZW5kIHRvIHRoZSBydWxlXG4gICAgICogQHBhcmFtIG9wICAgICAgICB0aGUgb3BlcmF0b3IgdG8gdXNlIGlmIG5lY2Vzc2FyeVxuICAgICAqL1xuICAgIGFkZElkZW50aXR5KHJ1bGU6IHN0cmluZywgaWRlbnRpdHk6IElJZGVudGl0eSwgb3A6IHN0cmluZyk6IHZvaWQge1xuICAgICAgICB0aGlzLnJ1bGVzLmFwcGVuZFRvUnVsZShydWxlLCBpZGVudGl0eSwgb3ApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvcHkgYW5kIGV2b2x2ZSB0aGUgZGFyYyB0byB0aGUgbmV4dCB2ZXJzaW9uIHNvIHRoYXQgaXQgY2FuIGJlXG4gICAgICogY2hhbmdlZCBhbmQgcHJvcG9zZWQgdG8gYnl6Y29pbi5cbiAgICAgKiBAcmV0dXJucyBhIG5ldyBkYXJjXG4gICAgICovXG4gICAgZXZvbHZlKCk6IERhcmMge1xuICAgICAgICByZXR1cm4gbmV3IERhcmMoe1xuICAgICAgICAgICAgYmFzZUlEOiB0aGlzLmdldEJhc2VJRCgpLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246IHRoaXMuZGVzY3JpcHRpb24sXG4gICAgICAgICAgICBwcmV2SUQ6IHRoaXMuaWQsXG4gICAgICAgICAgICBydWxlczogdGhpcy5ydWxlcy5jbG9uZSgpLFxuICAgICAgICAgICAgdmVyc2lvbjogdGhpcy52ZXJzaW9uLmFkZCgxKSxcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IGEgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBkYXJjXG4gICAgICogQHJldHVybnMgdGhlIHN0cmluZyByZXByZXNlbnRhdGlvblxuICAgICAqL1xuICAgIHRvU3RyaW5nKCk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiBcIklEOiBcIiArIHRoaXMuaWQudG9TdHJpbmcoXCJoZXhcIikgKyBcIlxcblwiICtcbiAgICAgICAgICAgIFwiQmFzZTogXCIgKyB0aGlzLmJhc2VJRC50b1N0cmluZyhcImhleFwiKSArIFwiXFxuXCIgK1xuICAgICAgICAgICAgXCJQcmV2OiBcIiArIHRoaXMucHJldklELnRvU3RyaW5nKFwiaGV4XCIpICsgXCJcXG5cIiArXG4gICAgICAgICAgICBcIlZlcnNpb246IFwiICsgdGhpcy52ZXJzaW9uICsgXCJcXG5cIiArXG4gICAgICAgICAgICBcIlJ1bGVzOiBcIiArIHRoaXMucnVsZXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSGVscGVyIHRvIGVuY29kZSB0aGUgZGFyYyB1c2luZyBwcm90b2J1ZlxuICAgICAqIEByZXR1cm5zIGVuY29kZWQgZGFyYyBhcyBhIGJ1ZmZlclxuICAgICAqL1xuICAgIHRvQnl0ZXMoKTogQnVmZmVyIHtcbiAgICAgICAgcmV0dXJuIEJ1ZmZlci5mcm9tKERhcmMuZW5jb2RlKHRoaXMpLmZpbmlzaCgpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgZGVlcCBjb3B5IG9mIHRoZSBkYXJjLlxuICAgICAqL1xuICAgIGNvcHkoKTogRGFyYyB7XG4gICAgICAgIHJldHVybiBEYXJjLmRlY29kZSh0aGlzLnRvQnl0ZXMoKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2hlY2tzIHdoZXRoZXIgdGhlIGdpdmVuIHJ1bGUgY2FuIGJlIG1hdGNoZWQgYnkgYSBtdWx0aS1zaWduYXR1cmUgY3JlYXRlZCBieSBhbGxcbiAgICAgKiBzaWduZXJzLiBJZiB0aGUgcnVsZSBkb2Vzbid0IGV4aXN0LCBpdCB0aHJvd3MgYW4gZXJyb3IuXG4gICAgICogQ3VycmVudGx5IHJlc3RyaWN0aW9uczpcbiAgICAgKiAgLSBvbmx5IFJ1bGUuT1IgYXJlIHN1cHBvcnRlZC4gQSBSdWxlLkFORCBvciBcIihcIiB3aWxsIHJldHVybiBhbiBlcnJvci5cbiAgICAgKiAgLSBvbmx5IG9uZSBpZGVudGl0eSBjYW4gYmUgY2hlY2tlZC4gSWYgbW9yZSBpZGVudGl0aWVzIGFyZSBnaXZlbiwgdGhlIGZ1bmN0aW9uXG4gICAgICogIHJldHVybnMgYW4gZXJyb3IuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gYWN0aW9uIHRoZSBhY3Rpb24gdG8gbWF0Y2hcbiAgICAgKiBAcGFyYW0gc2lnbmVycyBhbGwgc3VwcG9zZWQgc2lnbmVycyBmb3IgdGhpcyBhY3Rpb24uXG4gICAgICogQHJldHVybiB0aGUgc2V0IG9mIGlkZW50aXRpZXMgdGhhdCBtYXRjaCB0aGUgcnVsZS5cbiAgICAgKi9cbiAgICBhc3luYyBydWxlTWF0Y2goYWN0aW9uOiBzdHJpbmcsIHNpZ25lcnM6IElJZGVudGl0eVtdLFxuICAgICAgICAgICAgICAgICAgICBnZXREYXJjOiAoaWQ6IEJ1ZmZlcikgPT4gUHJvbWlzZTxEYXJjPik6IFByb21pc2U8SUlkZW50aXR5W10+IHtcbiAgICAgICAgY29uc3QgcnVsZSA9IHRoaXMucnVsZXMuZ2V0UnVsZShhY3Rpb24pO1xuICAgICAgICBpZiAoIXJ1bGUpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlRoaXMgcnVsZSBkb2Vzbid0IGV4aXN0XCIpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzaWduZXJzLmxlbmd0aCAhPT0gMSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ3VycmVudGx5IG9ubHkgc3VwcG9ydHMgY2hlY2tpbmcgMSBpZGVudGl0eVwiKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBpZHMgPSBydWxlLmdldElkZW50aXRpZXMoKTtcbiAgICAgICAgZm9yIChjb25zdCBpZFN0ciBvZiBpZHMpIHtcbiAgICAgICAgICAgIGNvbnN0IGlkID0gSWRlbnRpdHlXcmFwcGVyLmZyb21TdHJpbmcoaWRTdHIpO1xuICAgICAgICAgICAgaWYgKGlkLnRvU3RyaW5nKCkgPT09IHNpZ25lcnNbMF0udG9TdHJpbmcoKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBzaWduZXJzO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGlkLmRhcmMpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBkID0gYXdhaXQgZ2V0RGFyYyhpZC5kYXJjLmlkKTtcbiAgICAgICAgICAgICAgICBpZiAoKGF3YWl0IGQucnVsZU1hdGNoKERhcmMucnVsZVNpZ24sIHNpZ25lcnMsIGdldERhcmMpKS5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNpZ25lcnM7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBbXTtcbiAgICB9XG59XG5cbkRhcmMucmVnaXN0ZXIoKTtcbiJdfQ==