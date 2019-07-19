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
var client_transaction_1 = __importStar(require("../byzcoin/client-transaction"));
var instance_1 = __importDefault(require("../byzcoin/instance"));
var protobuf_1 = require("../protobuf");
var CredentialsInstance = /** @class */ (function (_super) {
    __extends(CredentialsInstance, _super);
    function CredentialsInstance(rpc, inst) {
        var _this = _super.call(this, inst) || this;
        _this.rpc = rpc;
        if (inst.contractID.toString() !== CredentialsInstance.contractID) {
            throw new Error("mismatch contract name: " + inst.contractID + " vs " + CredentialsInstance.contractID);
        }
        _this.credential = CredentialStruct.decode(inst.data);
        return _this;
    }
    /**
     * Generate the credential instance ID for a given darc ID
     *
     * @param buf The base ID of the darc
     * @returns the id as a buffer
     */
    CredentialsInstance.credentialIID = function (buf) {
        var h = crypto_browserify_1.createHash("sha256");
        h.update(Buffer.from(CredentialsInstance.contractID));
        h.update(buf);
        return h.digest();
    };
    /**
     * Spawn a new credential instance from a darc
     *
     * @param bc        The RPC to use
     * @param darcID    The darc instance ID
     * @param signers   The list of signers for the transaction
     * @param cred      The credential to store
     * @param credID    Optional - if given, the instanceID will be sha256("credential" | pub)
     * @param credDarcID Optional - if given, replaces the darc stored in the new credential with credDarcID.
     * @returns a promise that resolves with the new instance
     */
    CredentialsInstance.spawn = function (bc, darcID, signers, cred, credID, credDarcID) {
        if (credID === void 0) { credID = null; }
        if (credDarcID === void 0) { credDarcID = null; }
        return __awaiter(this, void 0, void 0, function () {
            var args, inst, ctx;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        args = [new client_transaction_1.Argument({ name: CredentialsInstance.argumentCredential, value: cred.toBytes() })];
                        if (credID) {
                            args.push(new client_transaction_1.Argument({ name: CredentialsInstance.argumentCredID, value: credID }));
                        }
                        if (credDarcID) {
                            args.push(new client_transaction_1.Argument({ name: CredentialsInstance.argumentDarcID, value: credDarcID }));
                        }
                        inst = client_transaction_1.Instruction.createSpawn(darcID, CredentialsInstance.contractID, args);
                        return [4 /*yield*/, inst.updateCounters(bc, signers)];
                    case 1:
                        _a.sent();
                        ctx = new client_transaction_1.default({ instructions: [inst] });
                        ctx.signWith([signers]);
                        return [4 /*yield*/, bc.sendTransactionAndWait(ctx, 10)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, CredentialsInstance.fromByzcoin(bc, inst.deriveId())];
                }
            });
        });
    };
    /**
     * Create a new credential instance from a darc
     *
     * @param bc        The RPC to use
     * @param darcID    The darc instance ID
     * @param cred      The credential to store
     * @param credID       Optional - if given, the instanceID will be sha256("credential" | credID)
     * @returns a promise that resolves with the new instance
     */
    CredentialsInstance.create = function (bc, darcID, cred, credID) {
        if (credID === void 0) { credID = null; }
        if (!credID) {
            credID = crypto_browserify_1.randomBytes(32);
        }
        var inst = new instance_1.default({
            contractID: CredentialsInstance.contractID,
            darcID: darcID,
            data: cred.toBytes(),
            id: CredentialsInstance.credentialIID(credID),
        });
        return new CredentialsInstance(bc, inst);
    };
    /**
     * Get an existing credential instance using its instance ID by fetching
     * the proof.
     * @param bc    the byzcoin RPC
     * @param iid   the instance ID
     * @param waitMatch how many times to wait for a match - useful if its called just after an addTransactionAndWait.
     * @param interval how long to wait between two attempts in waitMatch.
     */
    CredentialsInstance.fromByzcoin = function (bc, iid, waitMatch, interval) {
        if (waitMatch === void 0) { waitMatch = 0; }
        if (interval === void 0) { interval = 1000; }
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _a = CredentialsInstance.bind;
                        _b = [void 0, bc];
                        return [4 /*yield*/, instance_1.default.fromByzcoin(bc, iid, waitMatch, interval)];
                    case 1: return [2 /*return*/, new (_a.apply(CredentialsInstance, _b.concat([_c.sent()])))()];
                }
            });
        });
    };
    /**
     * Update the data of the crendetial instance by fetching the proof
     *
     * @returns a promise resolving with the instance on success, rejecting with
     * the error otherwise
     */
    CredentialsInstance.prototype.update = function () {
        return __awaiter(this, void 0, void 0, function () {
            var inst;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, instance_1.default.fromByzcoin(this.rpc, this.id)];
                    case 1:
                        inst = _a.sent();
                        this.data = inst.data;
                        this.darcID = inst.darcID;
                        this.credential = CredentialStruct.decode(this.data);
                        return [2 /*return*/, this];
                }
            });
        });
    };
    /**
     * Get a credential attribute
     *
     * @param credential    The name of the credential
     * @param attribute     The name of the attribute
     * @returns the value of the attribute if it exists, null otherwise
     */
    CredentialsInstance.prototype.getAttribute = function (credential, attribute) {
        return this.credential.getAttribute(credential, attribute);
    };
    /**
     * Set or update a credential attribute locally. The new credential is not sent to
     * the blockchain, for this you need to call sendUpdate.
     *
     * @param credential    Name of the credential
     * @param attribute     Name of the attribute
     * @param value         The value to set
     * @returns a promise resolving when the transaction is in a block, or rejecting
     * for an error
     */
    CredentialsInstance.prototype.setAttribute = function (credential, attribute, value) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.credential.setAttribute(credential, attribute, value)];
            });
        });
    };
    /**
     * Creates a transaction to update the credential and sends it to ByzCoin.
     *
     * @param owners a list of signers to fulfill the expression of the `invoke:credential.update` rule.
     * @param newCred the new credentialStruct to store in the instance.
     */
    CredentialsInstance.prototype.sendUpdate = function (owners, newCred) {
        if (newCred === void 0) { newCred = null; }
        return __awaiter(this, void 0, void 0, function () {
            var instr, ctx;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (newCred) {
                            this.credential = newCred.copy();
                        }
                        instr = client_transaction_1.Instruction.createInvoke(this.id, CredentialsInstance.contractID, CredentialsInstance.commandUpdate, [new client_transaction_1.Argument({ name: CredentialsInstance.argumentCredential, value: this.credential.toBytes() })]);
                        ctx = new client_transaction_1.default({ instructions: [instr] });
                        return [4 /*yield*/, ctx.updateCountersAndSign(this.rpc, [owners])];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.rpc.sendTransactionAndWait(ctx)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, this];
                }
            });
        });
    };
    /**
     * Recovers an identity by giving a list of signatures from trusted people.
     *
     * @param pubKey the new public key for the identity. It will be stored as the new expression for the
     * signer-rule.
     * @param signatures a threshold list of signatures on the public key and the instanceID.
     */
    CredentialsInstance.prototype.recoverIdentity = function (pubKey, signatures) {
        return __awaiter(this, void 0, void 0, function () {
            var sigBuf, ctx;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        sigBuf = Buffer.alloc(RecoverySignature.pubSig * signatures.length);
                        signatures.forEach(function (s, i) { return s.signature.copy(sigBuf, RecoverySignature.pubSig * i); });
                        ctx = new client_transaction_1.default({
                            instructions: [
                                client_transaction_1.Instruction.createInvoke(this.id, CredentialsInstance.contractID, "recover", [new client_transaction_1.Argument({ name: "signatures", value: sigBuf }),
                                    new client_transaction_1.Argument({ name: "public", value: pubKey.toProto() })]),
                            ],
                        });
                        return [4 /*yield*/, this.rpc.sendTransactionAndWait(ctx)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    CredentialsInstance.contractID = "credential";
    CredentialsInstance.commandUpdate = "update";
    CredentialsInstance.argumentCredential = "credential";
    CredentialsInstance.argumentCredID = "credentialID";
    CredentialsInstance.argumentDarcID = "darcIDBuf";
    return CredentialsInstance;
}(instance_1.default));
exports.default = CredentialsInstance;
/**
 * Data of a credential instance. It contains none, one or multiple
 * credentials.
 */
var CredentialStruct = /** @class */ (function (_super) {
    __extends(CredentialStruct, _super);
    function CredentialStruct(properties) {
        var _this = _super.call(this, properties) || this;
        _this.credentials = _this.credentials.slice() || [];
        return _this;
    }
    /**
     * @see README#Message classes
     */
    CredentialStruct.register = function () {
        protobuf_1.registerMessage("personhood.CredentialStruct", CredentialStruct, Credential);
    };
    /**
     * Get a credential attribute
     *
     * @param credential    The name of the credential
     * @param attribute     The name of the attribute
     * @returns the value of the attribute if it exists, null otherwise
     */
    CredentialStruct.prototype.getAttribute = function (credential, attribute) {
        var cred = this.credentials.find(function (c) { return c.name === credential; });
        if (!cred) {
            return null;
        }
        var att = cred.attributes.find(function (a) { return a.name === attribute; });
        if (!att) {
            return null;
        }
        return att.value;
    };
    /**
     * getCredential returns the credential with the given name, or null if
     * nothing found.
     * @param credential name of the credential to return
     */
    CredentialStruct.prototype.getCredential = function (credential) {
        return this.credentials.find(function (c) { return c.name === credential; });
    };
    /**
     * Overwrites the credential with name 'name' with the given credential.
     * If it doesn't exist, it will be appended to the list.
     *
     * @param name the name of the credential
     * @param cred the credential to store
     */
    CredentialStruct.prototype.setCredential = function (name, cred) {
        var index = this.credentials.findIndex(function (c) { return c.name === name; });
        if (index < 0) {
            this.credentials.push(cred);
        }
        else {
            this.credentials[index] = cred;
        }
    };
    /**
     * Set or update a credential attribute locally. The update is not sent to the blockchain.
     * For this you need to call CredentialsInstance.sendUpdate().
     *
     * @param owner         Signer to use for the transaction
     * @param credential    Name of the credential
     * @param attribute     Name of the attribute
     * @param value         The value to set
     * @returns a promise resolving when the transaction is in a block, or rejecting
     * for an error
     */
    CredentialStruct.prototype.setAttribute = function (credential, attribute, value) {
        var cred = this.credentials.find(function (c) { return c.name === credential; });
        if (!cred) {
            cred = new Credential({ name: credential, attributes: [new Attribute({ name: attribute, value: value })] });
            this.credentials.push(cred);
        }
        else {
            var idx = cred.attributes.findIndex(function (a) { return a.name === attribute; });
            var attr = new Attribute({ name: attribute, value: value });
            if (idx === -1) {
                cred.attributes.push(attr);
            }
            else {
                cred.attributes[idx] = attr;
            }
        }
    };
    /**
     * Removes the attribute from the given credential. If the credential or the
     * attribute doesn't exist, it returns 'undefined', else it returns the
     * content of the deleted attribute.
     *
     * @param credential the name of the credential
     * @param attribute the attribute to be deleted
     */
    CredentialStruct.prototype.deleteAttribute = function (credential, attribute) {
        var cred = this.getCredential(credential);
        if (!cred) {
            return undefined;
        }
        var index = cred.attributes.findIndex(function (att) { return att.name === attribute; });
        if (index < 0) {
            return undefined;
        }
        return cred.attributes.splice(index, 1)[0].value;
    };
    /**
     * Copy returns a new CredentialStruct with copies of all internal data.
     */
    CredentialStruct.prototype.copy = function () {
        return CredentialStruct.decode(this.toBytes());
    };
    /**
     * Helper to encode the struct using protobuf
     * @returns encoded struct as a buffer
     */
    CredentialStruct.prototype.toBytes = function () {
        return Buffer.from(CredentialStruct.encode(this).finish());
    };
    return CredentialStruct;
}(light_1.Message));
exports.CredentialStruct = CredentialStruct;
/**
 * A credential has a given name used as a key and one or more attributes
 */
var Credential = /** @class */ (function (_super) {
    __extends(Credential, _super);
    function Credential(props) {
        var _this = _super.call(this, props) || this;
        _this.attributes = _this.attributes.slice() || [];
        return _this;
    }
    /**
     * @see README#Message classes
     */
    Credential.register = function () {
        protobuf_1.registerMessage("personhood.Credential", Credential, Attribute);
    };
    /**
     * Returns a credential with only the given name/key = value stored in it.
     *
     * @param name the name of the attribute
     * @param key the key to store
     * @param value the value that will be stored in the key
     */
    Credential.fromNameAttr = function (name, key, value) {
        return new Credential({ name: name, attributes: [new Attribute({ name: key, value: value })] });
    };
    return Credential;
}(light_1.Message));
exports.Credential = Credential;
/**
 * Attribute of a credential
 */
var Attribute = /** @class */ (function (_super) {
    __extends(Attribute, _super);
    function Attribute(props) {
        var _this = _super.call(this, props) || this;
        _this.value = Buffer.from(_this.value || protobuf_1.EMPTY_BUFFER);
        return _this;
    }
    /**
     * @see README#Message classes
     */
    Attribute.register = function () {
        protobuf_1.registerMessage("personhood.Attribute", Attribute);
    };
    return Attribute;
}(light_1.Message));
exports.Attribute = Attribute;
var RecoverySignature = /** @class */ (function () {
    function RecoverySignature(credentialIID, signature) {
        this.credentialIID = credentialIID;
        this.signature = signature;
    }
    RecoverySignature.sig = 64;
    RecoverySignature.pub = 32;
    RecoverySignature.credIID = 32;
    RecoverySignature.version = 8;
    RecoverySignature.pubSig = RecoverySignature.pub + RecoverySignature.sig;
    RecoverySignature.msgBuf = RecoverySignature.credIID + RecoverySignature.pub + RecoverySignature.version;
    return RecoverySignature;
}());
exports.RecoverySignature = RecoverySignature;
CredentialStruct.register();
Credential.register();
Attribute.register();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlZGVudGlhbHMtaW5zdGFuY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJjcmVkZW50aWFscy1pbnN0YW5jZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFDQSx1REFBNEQ7QUFDNUQsMENBQXVEO0FBRXZELGtGQUF5RjtBQUN6RixpRUFBMkQ7QUFHM0Qsd0NBQTREO0FBRTVEO0lBQWlELHVDQUFRO0lBc0dyRCw2QkFBb0IsR0FBZSxFQUFFLElBQWM7UUFBbkQsWUFDSSxrQkFBTSxJQUFJLENBQUMsU0FLZDtRQU5tQixTQUFHLEdBQUgsR0FBRyxDQUFZO1FBRS9CLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxRQUFRLEVBQUUsS0FBSyxtQkFBbUIsQ0FBQyxVQUFVLEVBQUU7WUFDL0QsTUFBTSxJQUFJLEtBQUssQ0FBQyw2QkFBMkIsSUFBSSxDQUFDLFVBQVUsWUFBTyxtQkFBbUIsQ0FBQyxVQUFZLENBQUMsQ0FBQztTQUN0RztRQUNELEtBQUksQ0FBQyxVQUFVLEdBQUcsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQzs7SUFDekQsQ0FBQztJQXJHRDs7Ozs7T0FLRztJQUNJLGlDQUFhLEdBQXBCLFVBQXFCLEdBQVc7UUFDNUIsSUFBTSxDQUFDLEdBQUcsOEJBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUMvQixDQUFDLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztRQUN0RCxDQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2QsT0FBTyxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUM7SUFDdEIsQ0FBQztJQUVEOzs7Ozs7Ozs7O09BVUc7SUFDVSx5QkFBSyxHQUFsQixVQUNJLEVBQWMsRUFDZCxNQUFr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QUcsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFJLENBQUMsS0FBSyxJQUFJLHVCQUFZLENBQUMsQ0FBQzs7SUFDekQsQ0FBQztJQWREOztPQUVHO0lBQ0ksa0JBQVEsR0FBZjtRQUNJLDBCQUFlLENBQUMsc0JBQXNCLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDdkQsQ0FBQztJQVVMLGdCQUFDO0FBQUQsQ0FBQyxBQWpCRCxDQUErQixlQUFPLEdBaUJyQztBQWpCWSw4QkFBUztBQW1CdEI7SUFRSSwyQkFBbUIsYUFBeUIsRUFBUyxTQUFpQjtRQUFuRCxrQkFBYSxHQUFiLGFBQWEsQ0FBWTtRQUFTLGNBQVMsR0FBVCxTQUFTLENBQVE7SUFDdEUsQ0FBQztJQVJlLHFCQUFHLEdBQUcsRUFBRSxDQUFDO0lBQ1QscUJBQUcsR0FBRyxFQUFFLENBQUM7SUFDVCx5QkFBTyxHQUFHLEVBQUUsQ0FBQztJQUNiLHlCQUFPLEdBQUcsQ0FBQyxDQUFDO0lBQ1osd0JBQU0sR0FBRyxpQkFBaUIsQ0FBQyxHQUFHLEdBQUcsaUJBQWlCLENBQUMsR0FBRyxDQUFDO0lBQ3ZELHdCQUFNLEdBQUcsaUJBQWlCLENBQUMsT0FBTyxHQUFHLGlCQUFpQixDQUFDLEdBQUcsR0FBRyxpQkFBaUIsQ0FBQyxPQUFPLENBQUM7SUFJM0csd0JBQUM7Q0FBQSxBQVZELElBVUM7QUFWWSw4Q0FBaUI7QUFZOUIsZ0JBQWdCLENBQUMsUUFBUSxFQUFFLENBQUM7QUFDNUIsVUFBVSxDQUFDLFFBQVEsRUFBRSxDQUFDO0FBQ3RCLFNBQVMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFBvaW50IH0gZnJvbSBcIkBkZWRpcy9reWJlclwiO1xuaW1wb3J0IHsgY3JlYXRlSGFzaCwgcmFuZG9tQnl0ZXMgfSBmcm9tIFwiY3J5cHRvLWJyb3dzZXJpZnlcIjtcbmltcG9ydCB7IE1lc3NhZ2UsIFByb3BlcnRpZXMgfSBmcm9tIFwicHJvdG9idWZqcy9saWdodFwiO1xuaW1wb3J0IEJ5ekNvaW5SUEMgZnJvbSBcIi4uL2J5emNvaW4vYnl6Y29pbi1ycGNcIjtcbmltcG9ydCBDbGllbnRUcmFuc2FjdGlvbiwgeyBBcmd1bWVudCwgSW5zdHJ1Y3Rpb24gfSBmcm9tIFwiLi4vYnl6Y29pbi9jbGllbnQtdHJhbnNhY3Rpb25cIjtcbmltcG9ydCBJbnN0YW5jZSwgeyBJbnN0YW5jZUlEIH0gZnJvbSBcIi4uL2J5emNvaW4vaW5zdGFuY2VcIjtcbmltcG9ydCBTaWduZXIgZnJvbSBcIi4uL2RhcmMvc2lnbmVyXCI7XG5pbXBvcnQgTG9nIGZyb20gXCIuLi9sb2dcIjtcbmltcG9ydCB7IEVNUFRZX0JVRkZFUiwgcmVnaXN0ZXJNZXNzYWdlIH0gZnJvbSBcIi4uL3Byb3RvYnVmXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIENyZWRlbnRpYWxzSW5zdGFuY2UgZXh0ZW5kcyBJbnN0YW5jZSB7XG4gICAgc3RhdGljIHJlYWRvbmx5IGNvbnRyYWN0SUQgPSBcImNyZWRlbnRpYWxcIjtcbiAgICBzdGF0aWMgcmVhZG9ubHkgY29tbWFuZFVwZGF0ZSA9IFwidXBkYXRlXCI7XG4gICAgc3RhdGljIHJlYWRvbmx5IGFyZ3VtZW50Q3JlZGVudGlhbCA9IFwiY3JlZGVudGlhbFwiO1xuICAgIHN0YXRpYyByZWFkb25seSBhcmd1bWVudENyZWRJRCA9IFwiY3JlZGVudGlhbElEXCI7XG4gICAgc3RhdGljIHJlYWRvbmx5IGFyZ3VtZW50RGFyY0lEID0gXCJkYXJjSURCdWZcIjtcblxuICAgIC8qKlxuICAgICAqIEdlbmVyYXRlIHRoZSBjcmVkZW50aWFsIGluc3RhbmNlIElEIGZvciBhIGdpdmVuIGRhcmMgSURcbiAgICAgKlxuICAgICAqIEBwYXJhbSBidWYgVGhlIGJhc2UgSUQgb2YgdGhlIGRhcmNcbiAgICAgKiBAcmV0dXJucyB0aGUgaWQgYXMgYSBidWZmZXJcbiAgICAgKi9cbiAgICBzdGF0aWMgY3JlZGVudGlhbElJRChidWY6IEJ1ZmZlcik6IEluc3RhbmNlSUQge1xuICAgICAgICBjb25zdCBoID0gY3JlYXRlSGFzaChcInNoYTI1NlwiKTtcbiAgICAgICAgaC51cGRhdGUoQnVmZmVyLmZyb20oQ3JlZGVudGlhbHNJbnN0YW5jZS5jb250cmFjdElEKSk7XG4gICAgICAgIGgudXBkYXRlKGJ1Zik7XG4gICAgICAgIHJldHVybiBoLmRpZ2VzdCgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNwYXduIGEgbmV3IGNyZWRlbnRpYWwgaW5zdGFuY2UgZnJvbSBhIGRhcmNcbiAgICAgKlxuICAgICAqIEBwYXJhbSBiYyAgICAgICAgVGhlIFJQQyB0byB1c2VcbiAgICAgKiBAcGFyYW0gZGFyY0lEICAgIFRoZSBkYXJjIGluc3RhbmNlIElEXG4gICAgICogQHBhcmFtIHNpZ25lcnMgICBUaGUgbGlzdCBvZiBzaWduZXJzIGZvciB0aGUgdHJhbnNhY3Rpb25cbiAgICAgKiBAcGFyYW0gY3JlZCAgICAgIFRoZSBjcmVkZW50aWFsIHRvIHN0b3JlXG4gICAgICogQHBhcmFtIGNyZWRJRCAgICBPcHRpb25hbCAtIGlmIGdpdmVuLCB0aGUgaW5zdGFuY2VJRCB3aWxsIGJlIHNoYTI1NihcImNyZWRlbnRpYWxcIiB8IHB1YilcbiAgICAgKiBAcGFyYW0gY3JlZERhcmNJRCBPcHRpb25hbCAtIGlmIGdpdmVuLCByZXBsYWNlcyB0aGUgZGFyYyBzdG9yZWQgaW4gdGhlIG5ldyBjcmVkZW50aWFsIHdpdGggY3JlZERhcmNJRC5cbiAgICAgKiBAcmV0dXJucyBhIHByb21pc2UgdGhhdCByZXNvbHZlcyB3aXRoIHRoZSBuZXcgaW5zdGFuY2VcbiAgICAgKi9cbiAgICBzdGF0aWMgYXN5bmMgc3Bhd24oXG4gICAgICAgIGJjOiBCeXpDb2luUlBDLFxuICAgICAgICBkYXJjSUQ6IEluc3RhbmNlSUQsXG4gICAgICAgIHNpZ25lcnM6IFNpZ25lcltdLFxuICAgICAgICBjcmVkOiBDcmVkZW50aWFsU3RydWN0LFxuICAgICAgICBjcmVkSUQ6IEJ1ZmZlciA9IG51bGwsXG4gICAgICAgIGNyZWREYXJjSUQ6IEluc3RhbmNlSUQgPSBudWxsLFxuICAgICk6IFByb21pc2U8Q3JlZGVudGlhbHNJbnN0YW5jZT4ge1xuICAgICAgICBjb25zdCBhcmdzID0gW25ldyBBcmd1bWVudCh7bmFtZTogQ3JlZGVudGlhbHNJbnN0YW5jZS5hcmd1bWVudENyZWRlbnRpYWwsIHZhbHVlOiBjcmVkLnRvQnl0ZXMoKX0pXTtcbiAgICAgICAgaWYgKGNyZWRJRCkge1xuICAgICAgICAgICAgYXJncy5wdXNoKG5ldyBBcmd1bWVudCh7bmFtZTogQ3JlZGVudGlhbHNJbnN0YW5jZS5hcmd1bWVudENyZWRJRCwgdmFsdWU6IGNyZWRJRH0pKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY3JlZERhcmNJRCkge1xuICAgICAgICAgICAgYXJncy5wdXNoKG5ldyBBcmd1bWVudCh7bmFtZTogQ3JlZGVudGlhbHNJbnN0YW5jZS5hcmd1bWVudERhcmNJRCwgdmFsdWU6IGNyZWREYXJjSUR9KSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgaW5zdCA9IEluc3RydWN0aW9uLmNyZWF0ZVNwYXduKFxuICAgICAgICAgICAgZGFyY0lELFxuICAgICAgICAgICAgQ3JlZGVudGlhbHNJbnN0YW5jZS5jb250cmFjdElELFxuICAgICAgICAgICAgYXJncyxcbiAgICAgICAgKTtcbiAgICAgICAgYXdhaXQgaW5zdC51cGRhdGVDb3VudGVycyhiYywgc2lnbmVycyk7XG5cbiAgICAgICAgY29uc3QgY3R4ID0gbmV3IENsaWVudFRyYW5zYWN0aW9uKHtpbnN0cnVjdGlvbnM6IFtpbnN0XX0pO1xuICAgICAgICBjdHguc2lnbldpdGgoW3NpZ25lcnNdKTtcblxuICAgICAgICBhd2FpdCBiYy5zZW5kVHJhbnNhY3Rpb25BbmRXYWl0KGN0eCwgMTApO1xuXG4gICAgICAgIHJldHVybiBDcmVkZW50aWFsc0luc3RhbmNlLmZyb21CeXpjb2luKGJjLCBpbnN0LmRlcml2ZUlkKCkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhIG5ldyBjcmVkZW50aWFsIGluc3RhbmNlIGZyb20gYSBkYXJjXG4gICAgICpcbiAgICAgKiBAcGFyYW0gYmMgICAgICAgIFRoZSBSUEMgdG8gdXNlXG4gICAgICogQHBhcmFtIGRhcmNJRCAgICBUaGUgZGFyYyBpbnN0YW5jZSBJRFxuICAgICAqIEBwYXJhbSBjcmVkICAgICAgVGhlIGNyZWRlbnRpYWwgdG8gc3RvcmVcbiAgICAgKiBAcGFyYW0gY3JlZElEICAgICAgIE9wdGlvbmFsIC0gaWYgZ2l2ZW4sIHRoZSBpbnN0YW5jZUlEIHdpbGwgYmUgc2hhMjU2KFwiY3JlZGVudGlhbFwiIHwgY3JlZElEKVxuICAgICAqIEByZXR1cm5zIGEgcHJvbWlzZSB0aGF0IHJlc29sdmVzIHdpdGggdGhlIG5ldyBpbnN0YW5jZVxuICAgICAqL1xuICAgIHN0YXRpYyBjcmVhdGUoXG4gICAgICAgIGJjOiBCeXpDb2luUlBDLFxuICAgICAgICBkYXJjSUQ6IEluc3RhbmNlSUQsXG4gICAgICAgIGNyZWQ6IENyZWRlbnRpYWxTdHJ1Y3QsXG4gICAgICAgIGNyZWRJRDogQnVmZmVyID0gbnVsbCxcbiAgICApOiBDcmVkZW50aWFsc0luc3RhbmNlIHtcbiAgICAgICAgaWYgKCFjcmVkSUQpIHtcbiAgICAgICAgICAgIGNyZWRJRCA9IHJhbmRvbUJ5dGVzKDMyKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBpbnN0ID0gbmV3IEluc3RhbmNlKHtcbiAgICAgICAgICAgIGNvbnRyYWN0SUQ6IENyZWRlbnRpYWxzSW5zdGFuY2UuY29udHJhY3RJRCxcbiAgICAgICAgICAgIGRhcmNJRCxcbiAgICAgICAgICAgIGRhdGE6IGNyZWQudG9CeXRlcygpLFxuICAgICAgICAgICAgaWQ6IENyZWRlbnRpYWxzSW5zdGFuY2UuY3JlZGVudGlhbElJRChjcmVkSUQpLFxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIG5ldyBDcmVkZW50aWFsc0luc3RhbmNlKGJjLCBpbnN0KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgYW4gZXhpc3RpbmcgY3JlZGVudGlhbCBpbnN0YW5jZSB1c2luZyBpdHMgaW5zdGFuY2UgSUQgYnkgZmV0Y2hpbmdcbiAgICAgKiB0aGUgcHJvb2YuXG4gICAgICogQHBhcmFtIGJjICAgIHRoZSBieXpjb2luIFJQQ1xuICAgICAqIEBwYXJhbSBpaWQgICB0aGUgaW5zdGFuY2UgSURcbiAgICAgKiBAcGFyYW0gd2FpdE1hdGNoIGhvdyBtYW55IHRpbWVzIHRvIHdhaXQgZm9yIGEgbWF0Y2ggLSB1c2VmdWwgaWYgaXRzIGNhbGxlZCBqdXN0IGFmdGVyIGFuIGFkZFRyYW5zYWN0aW9uQW5kV2FpdC5cbiAgICAgKiBAcGFyYW0gaW50ZXJ2YWwgaG93IGxvbmcgdG8gd2FpdCBiZXR3ZWVuIHR3byBhdHRlbXB0cyBpbiB3YWl0TWF0Y2guXG4gICAgICovXG4gICAgc3RhdGljIGFzeW5jIGZyb21CeXpjb2luKGJjOiBCeXpDb2luUlBDLCBpaWQ6IEluc3RhbmNlSUQsIHdhaXRNYXRjaDogbnVtYmVyID0gMCwgaW50ZXJ2YWw6IG51bWJlciA9IDEwMDApOlxuICAgICAgICBQcm9taXNlPENyZWRlbnRpYWxzSW5zdGFuY2U+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBDcmVkZW50aWFsc0luc3RhbmNlKGJjLCBhd2FpdCBJbnN0YW5jZS5mcm9tQnl6Y29pbihiYywgaWlkLCB3YWl0TWF0Y2gsIGludGVydmFsKSk7XG4gICAgfVxuICAgIGNyZWRlbnRpYWw6IENyZWRlbnRpYWxTdHJ1Y3Q7XG5cbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJwYzogQnl6Q29pblJQQywgaW5zdDogSW5zdGFuY2UpIHtcbiAgICAgICAgc3VwZXIoaW5zdCk7XG4gICAgICAgIGlmIChpbnN0LmNvbnRyYWN0SUQudG9TdHJpbmcoKSAhPT0gQ3JlZGVudGlhbHNJbnN0YW5jZS5jb250cmFjdElEKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYG1pc21hdGNoIGNvbnRyYWN0IG5hbWU6ICR7aW5zdC5jb250cmFjdElEfSB2cyAke0NyZWRlbnRpYWxzSW5zdGFuY2UuY29udHJhY3RJRH1gKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmNyZWRlbnRpYWwgPSBDcmVkZW50aWFsU3RydWN0LmRlY29kZShpbnN0LmRhdGEpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVwZGF0ZSB0aGUgZGF0YSBvZiB0aGUgY3JlbmRldGlhbCBpbnN0YW5jZSBieSBmZXRjaGluZyB0aGUgcHJvb2ZcbiAgICAgKlxuICAgICAqIEByZXR1cm5zIGEgcHJvbWlzZSByZXNvbHZpbmcgd2l0aCB0aGUgaW5zdGFuY2Ugb24gc3VjY2VzcywgcmVqZWN0aW5nIHdpdGhcbiAgICAgKiB0aGUgZXJyb3Igb3RoZXJ3aXNlXG4gICAgICovXG4gICAgYXN5bmMgdXBkYXRlKCk6IFByb21pc2U8Q3JlZGVudGlhbHNJbnN0YW5jZT4ge1xuICAgICAgICBjb25zdCBpbnN0ID0gYXdhaXQgSW5zdGFuY2UuZnJvbUJ5emNvaW4odGhpcy5ycGMsIHRoaXMuaWQpO1xuICAgICAgICB0aGlzLmRhdGEgPSBpbnN0LmRhdGE7XG4gICAgICAgIHRoaXMuZGFyY0lEID0gaW5zdC5kYXJjSUQ7XG4gICAgICAgIHRoaXMuY3JlZGVudGlhbCA9IENyZWRlbnRpYWxTdHJ1Y3QuZGVjb2RlKHRoaXMuZGF0YSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldCBhIGNyZWRlbnRpYWwgYXR0cmlidXRlXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY3JlZGVudGlhbCAgICBUaGUgbmFtZSBvZiB0aGUgY3JlZGVudGlhbFxuICAgICAqIEBwYXJhbSBhdHRyaWJ1dGUgICAgIFRoZSBuYW1lIG9mIHRoZSBhdHRyaWJ1dGVcbiAgICAgKiBAcmV0dXJucyB0aGUgdmFsdWUgb2YgdGhlIGF0dHJpYnV0ZSBpZiBpdCBleGlzdHMsIG51bGwgb3RoZXJ3aXNlXG4gICAgICovXG4gICAgZ2V0QXR0cmlidXRlKGNyZWRlbnRpYWw6IHN0cmluZywgYXR0cmlidXRlOiBzdHJpbmcpOiBCdWZmZXIge1xuICAgICAgICByZXR1cm4gdGhpcy5jcmVkZW50aWFsLmdldEF0dHJpYnV0ZShjcmVkZW50aWFsLCBhdHRyaWJ1dGUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNldCBvciB1cGRhdGUgYSBjcmVkZW50aWFsIGF0dHJpYnV0ZSBsb2NhbGx5LiBUaGUgbmV3IGNyZWRlbnRpYWwgaXMgbm90IHNlbnQgdG9cbiAgICAgKiB0aGUgYmxvY2tjaGFpbiwgZm9yIHRoaXMgeW91IG5lZWQgdG8gY2FsbCBzZW5kVXBkYXRlLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNyZWRlbnRpYWwgICAgTmFtZSBvZiB0aGUgY3JlZGVudGlhbFxuICAgICAqIEBwYXJhbSBhdHRyaWJ1dGUgICAgIE5hbWUgb2YgdGhlIGF0dHJpYnV0ZVxuICAgICAqIEBwYXJhbSB2YWx1ZSAgICAgICAgIFRoZSB2YWx1ZSB0byBzZXRcbiAgICAgKiBAcmV0dXJucyBhIHByb21pc2UgcmVzb2x2aW5nIHdoZW4gdGhlIHRyYW5zYWN0aW9uIGlzIGluIGEgYmxvY2ssIG9yIHJlamVjdGluZ1xuICAgICAqIGZvciBhbiBlcnJvclxuICAgICAqL1xuICAgIGFzeW5jIHNldEF0dHJpYnV0ZShjcmVkZW50aWFsOiBzdHJpbmcsIGF0dHJpYnV0ZTogc3RyaW5nLCB2YWx1ZTogQnVmZmVyKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY3JlZGVudGlhbC5zZXRBdHRyaWJ1dGUoY3JlZGVudGlhbCwgYXR0cmlidXRlLCB2YWx1ZSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIHRyYW5zYWN0aW9uIHRvIHVwZGF0ZSB0aGUgY3JlZGVudGlhbCBhbmQgc2VuZHMgaXQgdG8gQnl6Q29pbi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBvd25lcnMgYSBsaXN0IG9mIHNpZ25lcnMgdG8gZnVsZmlsbCB0aGUgZXhwcmVzc2lvbiBvZiB0aGUgYGludm9rZTpjcmVkZW50aWFsLnVwZGF0ZWAgcnVsZS5cbiAgICAgKiBAcGFyYW0gbmV3Q3JlZCB0aGUgbmV3IGNyZWRlbnRpYWxTdHJ1Y3QgdG8gc3RvcmUgaW4gdGhlIGluc3RhbmNlLlxuICAgICAqL1xuICAgIGFzeW5jIHNlbmRVcGRhdGUob3duZXJzOiBTaWduZXJbXSwgbmV3Q3JlZDogQ3JlZGVudGlhbFN0cnVjdCA9IG51bGwpOiBQcm9taXNlPENyZWRlbnRpYWxzSW5zdGFuY2U+IHtcbiAgICAgICAgaWYgKG5ld0NyZWQpIHtcbiAgICAgICAgICAgIHRoaXMuY3JlZGVudGlhbCA9IG5ld0NyZWQuY29weSgpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGluc3RyID0gSW5zdHJ1Y3Rpb24uY3JlYXRlSW52b2tlKFxuICAgICAgICAgICAgdGhpcy5pZCxcbiAgICAgICAgICAgIENyZWRlbnRpYWxzSW5zdGFuY2UuY29udHJhY3RJRCxcbiAgICAgICAgICAgIENyZWRlbnRpYWxzSW5zdGFuY2UuY29tbWFuZFVwZGF0ZSxcbiAgICAgICAgICAgIFtuZXcgQXJndW1lbnQoe25hbWU6IENyZWRlbnRpYWxzSW5zdGFuY2UuYXJndW1lbnRDcmVkZW50aWFsLCB2YWx1ZTogdGhpcy5jcmVkZW50aWFsLnRvQnl0ZXMoKX0pXSxcbiAgICAgICAgKTtcbiAgICAgICAgY29uc3QgY3R4ID0gbmV3IENsaWVudFRyYW5zYWN0aW9uKHtpbnN0cnVjdGlvbnM6IFtpbnN0cl19KTtcbiAgICAgICAgYXdhaXQgY3R4LnVwZGF0ZUNvdW50ZXJzQW5kU2lnbih0aGlzLnJwYywgW293bmVyc10pO1xuXG4gICAgICAgIGF3YWl0IHRoaXMucnBjLnNlbmRUcmFuc2FjdGlvbkFuZFdhaXQoY3R4KTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZWNvdmVycyBhbiBpZGVudGl0eSBieSBnaXZpbmcgYSBsaXN0IG9mIHNpZ25hdHVyZXMgZnJvbSB0cnVzdGVkIHBlb3BsZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBwdWJLZXkgdGhlIG5ldyBwdWJsaWMga2V5IGZvciB0aGUgaWRlbnRpdHkuIEl0IHdpbGwgYmUgc3RvcmVkIGFzIHRoZSBuZXcgZXhwcmVzc2lvbiBmb3IgdGhlXG4gICAgICogc2lnbmVyLXJ1bGUuXG4gICAgICogQHBhcmFtIHNpZ25hdHVyZXMgYSB0aHJlc2hvbGQgbGlzdCBvZiBzaWduYXR1cmVzIG9uIHRoZSBwdWJsaWMga2V5IGFuZCB0aGUgaW5zdGFuY2VJRC5cbiAgICAgKi9cbiAgICBhc3luYyByZWNvdmVySWRlbnRpdHkocHViS2V5OiBQb2ludCwgc2lnbmF0dXJlczogUmVjb3ZlcnlTaWduYXR1cmVbXSk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIGNvbnN0IHNpZ0J1ZiA9IEJ1ZmZlci5hbGxvYyhSZWNvdmVyeVNpZ25hdHVyZS5wdWJTaWcgKiBzaWduYXR1cmVzLmxlbmd0aCk7XG4gICAgICAgIHNpZ25hdHVyZXMuZm9yRWFjaCgocywgaSkgPT4gcy5zaWduYXR1cmUuY29weShzaWdCdWYsIFJlY292ZXJ5U2lnbmF0dXJlLnB1YlNpZyAqIGkpKTtcbiAgICAgICAgY29uc3QgY3R4ID0gbmV3IENsaWVudFRyYW5zYWN0aW9uKHtcbiAgICAgICAgICAgIGluc3RydWN0aW9uczogW1xuICAgICAgICAgICAgICAgIEluc3RydWN0aW9uLmNyZWF0ZUludm9rZShcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pZCxcbiAgICAgICAgICAgICAgICAgICAgQ3JlZGVudGlhbHNJbnN0YW5jZS5jb250cmFjdElELFxuICAgICAgICAgICAgICAgICAgICBcInJlY292ZXJcIixcbiAgICAgICAgICAgICAgICAgICAgW25ldyBBcmd1bWVudCh7bmFtZTogXCJzaWduYXR1cmVzXCIsIHZhbHVlOiBzaWdCdWZ9KSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ldyBBcmd1bWVudCh7bmFtZTogXCJwdWJsaWNcIiwgdmFsdWU6IHB1YktleS50b1Byb3RvKCl9KV0pLFxuICAgICAgICAgICAgXSxcbiAgICAgICAgfSk7XG4gICAgICAgIGF3YWl0IHRoaXMucnBjLnNlbmRUcmFuc2FjdGlvbkFuZFdhaXQoY3R4KTtcbiAgICB9XG59XG5cbi8qKlxuICogRGF0YSBvZiBhIGNyZWRlbnRpYWwgaW5zdGFuY2UuIEl0IGNvbnRhaW5zIG5vbmUsIG9uZSBvciBtdWx0aXBsZVxuICogY3JlZGVudGlhbHMuXG4gKi9cbmV4cG9ydCBjbGFzcyBDcmVkZW50aWFsU3RydWN0IGV4dGVuZHMgTWVzc2FnZTxDcmVkZW50aWFsU3RydWN0PiB7XG5cbiAgICAvKipcbiAgICAgKiBAc2VlIFJFQURNRSNNZXNzYWdlIGNsYXNzZXNcbiAgICAgKi9cbiAgICBzdGF0aWMgcmVnaXN0ZXIoKSB7XG4gICAgICAgIHJlZ2lzdGVyTWVzc2FnZShcInBlcnNvbmhvb2QuQ3JlZGVudGlhbFN0cnVjdFwiLCBDcmVkZW50aWFsU3RydWN0LCBDcmVkZW50aWFsKTtcbiAgICB9XG5cbiAgICByZWFkb25seSBjcmVkZW50aWFsczogQ3JlZGVudGlhbFtdO1xuXG4gICAgY29uc3RydWN0b3IocHJvcGVydGllcz86IFByb3BlcnRpZXM8Q3JlZGVudGlhbFN0cnVjdD4pIHtcbiAgICAgICAgc3VwZXIocHJvcGVydGllcyk7XG5cbiAgICAgICAgdGhpcy5jcmVkZW50aWFscyA9IHRoaXMuY3JlZGVudGlhbHMuc2xpY2UoKSB8fCBbXTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgYSBjcmVkZW50aWFsIGF0dHJpYnV0ZVxuICAgICAqXG4gICAgICogQHBhcmFtIGNyZWRlbnRpYWwgICAgVGhlIG5hbWUgb2YgdGhlIGNyZWRlbnRpYWxcbiAgICAgKiBAcGFyYW0gYXR0cmlidXRlICAgICBUaGUgbmFtZSBvZiB0aGUgYXR0cmlidXRlXG4gICAgICogQHJldHVybnMgdGhlIHZhbHVlIG9mIHRoZSBhdHRyaWJ1dGUgaWYgaXQgZXhpc3RzLCBudWxsIG90aGVyd2lzZVxuICAgICAqL1xuICAgIGdldEF0dHJpYnV0ZShjcmVkZW50aWFsOiBzdHJpbmcsIGF0dHJpYnV0ZTogc3RyaW5nKTogQnVmZmVyIHtcbiAgICAgICAgY29uc3QgY3JlZCA9IHRoaXMuY3JlZGVudGlhbHMuZmluZCgoYykgPT4gYy5uYW1lID09PSBjcmVkZW50aWFsKTtcbiAgICAgICAgaWYgKCFjcmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBhdHQgPSBjcmVkLmF0dHJpYnV0ZXMuZmluZCgoYSkgPT4gYS5uYW1lID09PSBhdHRyaWJ1dGUpO1xuICAgICAgICBpZiAoIWF0dCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGF0dC52YWx1ZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBnZXRDcmVkZW50aWFsIHJldHVybnMgdGhlIGNyZWRlbnRpYWwgd2l0aCB0aGUgZ2l2ZW4gbmFtZSwgb3IgbnVsbCBpZlxuICAgICAqIG5vdGhpbmcgZm91bmQuXG4gICAgICogQHBhcmFtIGNyZWRlbnRpYWwgbmFtZSBvZiB0aGUgY3JlZGVudGlhbCB0byByZXR1cm5cbiAgICAgKi9cbiAgICBnZXRDcmVkZW50aWFsKGNyZWRlbnRpYWw6IHN0cmluZyk6IENyZWRlbnRpYWwge1xuICAgICAgICByZXR1cm4gdGhpcy5jcmVkZW50aWFscy5maW5kKChjKSA9PiBjLm5hbWUgPT09IGNyZWRlbnRpYWwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE92ZXJ3cml0ZXMgdGhlIGNyZWRlbnRpYWwgd2l0aCBuYW1lICduYW1lJyB3aXRoIHRoZSBnaXZlbiBjcmVkZW50aWFsLlxuICAgICAqIElmIGl0IGRvZXNuJ3QgZXhpc3QsIGl0IHdpbGwgYmUgYXBwZW5kZWQgdG8gdGhlIGxpc3QuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gbmFtZSB0aGUgbmFtZSBvZiB0aGUgY3JlZGVudGlhbFxuICAgICAqIEBwYXJhbSBjcmVkIHRoZSBjcmVkZW50aWFsIHRvIHN0b3JlXG4gICAgICovXG4gICAgc2V0Q3JlZGVudGlhbChuYW1lOiBzdHJpbmcsIGNyZWQ6IENyZWRlbnRpYWwpIHtcbiAgICAgICAgY29uc3QgaW5kZXggPSB0aGlzLmNyZWRlbnRpYWxzLmZpbmRJbmRleCgoYykgPT4gYy5uYW1lID09PSBuYW1lKTtcbiAgICAgICAgaWYgKGluZGV4IDwgMCkge1xuICAgICAgICAgICAgdGhpcy5jcmVkZW50aWFscy5wdXNoKGNyZWQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5jcmVkZW50aWFsc1tpbmRleF0gPSBjcmVkO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2V0IG9yIHVwZGF0ZSBhIGNyZWRlbnRpYWwgYXR0cmlidXRlIGxvY2FsbHkuIFRoZSB1cGRhdGUgaXMgbm90IHNlbnQgdG8gdGhlIGJsb2NrY2hhaW4uXG4gICAgICogRm9yIHRoaXMgeW91IG5lZWQgdG8gY2FsbCBDcmVkZW50aWFsc0luc3RhbmNlLnNlbmRVcGRhdGUoKS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBvd25lciAgICAgICAgIFNpZ25lciB0byB1c2UgZm9yIHRoZSB0cmFuc2FjdGlvblxuICAgICAqIEBwYXJhbSBjcmVkZW50aWFsICAgIE5hbWUgb2YgdGhlIGNyZWRlbnRpYWxcbiAgICAgKiBAcGFyYW0gYXR0cmlidXRlICAgICBOYW1lIG9mIHRoZSBhdHRyaWJ1dGVcbiAgICAgKiBAcGFyYW0gdmFsdWUgICAgICAgICBUaGUgdmFsdWUgdG8gc2V0XG4gICAgICogQHJldHVybnMgYSBwcm9taXNlIHJlc29sdmluZyB3aGVuIHRoZSB0cmFuc2FjdGlvbiBpcyBpbiBhIGJsb2NrLCBvciByZWplY3RpbmdcbiAgICAgKiBmb3IgYW4gZXJyb3JcbiAgICAgKi9cbiAgICBzZXRBdHRyaWJ1dGUoY3JlZGVudGlhbDogc3RyaW5nLCBhdHRyaWJ1dGU6IHN0cmluZywgdmFsdWU6IEJ1ZmZlcikge1xuICAgICAgICBsZXQgY3JlZCA9IHRoaXMuY3JlZGVudGlhbHMuZmluZCgoYykgPT4gYy5uYW1lID09PSBjcmVkZW50aWFsKTtcbiAgICAgICAgaWYgKCFjcmVkKSB7XG4gICAgICAgICAgICBjcmVkID0gbmV3IENyZWRlbnRpYWwoe25hbWU6IGNyZWRlbnRpYWwsIGF0dHJpYnV0ZXM6IFtuZXcgQXR0cmlidXRlKHtuYW1lOiBhdHRyaWJ1dGUsIHZhbHVlfSldfSk7XG4gICAgICAgICAgICB0aGlzLmNyZWRlbnRpYWxzLnB1c2goY3JlZCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBpZHggPSBjcmVkLmF0dHJpYnV0ZXMuZmluZEluZGV4KChhKSA9PiBhLm5hbWUgPT09IGF0dHJpYnV0ZSk7XG4gICAgICAgICAgICBjb25zdCBhdHRyID0gbmV3IEF0dHJpYnV0ZSh7bmFtZTogYXR0cmlidXRlLCB2YWx1ZX0pO1xuICAgICAgICAgICAgaWYgKGlkeCA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICBjcmVkLmF0dHJpYnV0ZXMucHVzaChhdHRyKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY3JlZC5hdHRyaWJ1dGVzW2lkeF0gPSBhdHRyO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlcyB0aGUgYXR0cmlidXRlIGZyb20gdGhlIGdpdmVuIGNyZWRlbnRpYWwuIElmIHRoZSBjcmVkZW50aWFsIG9yIHRoZVxuICAgICAqIGF0dHJpYnV0ZSBkb2Vzbid0IGV4aXN0LCBpdCByZXR1cm5zICd1bmRlZmluZWQnLCBlbHNlIGl0IHJldHVybnMgdGhlXG4gICAgICogY29udGVudCBvZiB0aGUgZGVsZXRlZCBhdHRyaWJ1dGUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY3JlZGVudGlhbCB0aGUgbmFtZSBvZiB0aGUgY3JlZGVudGlhbFxuICAgICAqIEBwYXJhbSBhdHRyaWJ1dGUgdGhlIGF0dHJpYnV0ZSB0byBiZSBkZWxldGVkXG4gICAgICovXG4gICAgZGVsZXRlQXR0cmlidXRlKGNyZWRlbnRpYWw6IHN0cmluZywgYXR0cmlidXRlOiBzdHJpbmcpOiBCdWZmZXIge1xuICAgICAgICBjb25zdCBjcmVkID0gdGhpcy5nZXRDcmVkZW50aWFsKGNyZWRlbnRpYWwpO1xuICAgICAgICBpZiAoIWNyZWQpIHtcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgaW5kZXggPSBjcmVkLmF0dHJpYnV0ZXMuZmluZEluZGV4KChhdHQpID0+IGF0dC5uYW1lID09PSBhdHRyaWJ1dGUpO1xuICAgICAgICBpZiAoaW5kZXggPCAwKSB7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjcmVkLmF0dHJpYnV0ZXMuc3BsaWNlKGluZGV4LCAxKVswXS52YWx1ZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb3B5IHJldHVybnMgYSBuZXcgQ3JlZGVudGlhbFN0cnVjdCB3aXRoIGNvcGllcyBvZiBhbGwgaW50ZXJuYWwgZGF0YS5cbiAgICAgKi9cbiAgICBjb3B5KCk6IENyZWRlbnRpYWxTdHJ1Y3Qge1xuICAgICAgICByZXR1cm4gQ3JlZGVudGlhbFN0cnVjdC5kZWNvZGUodGhpcy50b0J5dGVzKCkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEhlbHBlciB0byBlbmNvZGUgdGhlIHN0cnVjdCB1c2luZyBwcm90b2J1ZlxuICAgICAqIEByZXR1cm5zIGVuY29kZWQgc3RydWN0IGFzIGEgYnVmZmVyXG4gICAgICovXG4gICAgdG9CeXRlcygpOiBCdWZmZXIge1xuICAgICAgICByZXR1cm4gQnVmZmVyLmZyb20oQ3JlZGVudGlhbFN0cnVjdC5lbmNvZGUodGhpcykuZmluaXNoKCkpO1xuICAgIH1cbn1cblxuLyoqXG4gKiBBIGNyZWRlbnRpYWwgaGFzIGEgZ2l2ZW4gbmFtZSB1c2VkIGFzIGEga2V5IGFuZCBvbmUgb3IgbW9yZSBhdHRyaWJ1dGVzXG4gKi9cbmV4cG9ydCBjbGFzcyBDcmVkZW50aWFsIGV4dGVuZHMgTWVzc2FnZTxDcmVkZW50aWFsPiB7XG5cbiAgICAvKipcbiAgICAgKiBAc2VlIFJFQURNRSNNZXNzYWdlIGNsYXNzZXNcbiAgICAgKi9cbiAgICBzdGF0aWMgcmVnaXN0ZXIoKSB7XG4gICAgICAgIHJlZ2lzdGVyTWVzc2FnZShcInBlcnNvbmhvb2QuQ3JlZGVudGlhbFwiLCBDcmVkZW50aWFsLCBBdHRyaWJ1dGUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSBjcmVkZW50aWFsIHdpdGggb25seSB0aGUgZ2l2ZW4gbmFtZS9rZXkgPSB2YWx1ZSBzdG9yZWQgaW4gaXQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gbmFtZSB0aGUgbmFtZSBvZiB0aGUgYXR0cmlidXRlXG4gICAgICogQHBhcmFtIGtleSB0aGUga2V5IHRvIHN0b3JlXG4gICAgICogQHBhcmFtIHZhbHVlIHRoZSB2YWx1ZSB0aGF0IHdpbGwgYmUgc3RvcmVkIGluIHRoZSBrZXlcbiAgICAgKi9cbiAgICBzdGF0aWMgZnJvbU5hbWVBdHRyKG5hbWU6IHN0cmluZywga2V5OiBzdHJpbmcsIHZhbHVlOiBCdWZmZXIpOiBDcmVkZW50aWFsIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDcmVkZW50aWFsKHtuYW1lLCBhdHRyaWJ1dGVzOiBbbmV3IEF0dHJpYnV0ZSh7bmFtZToga2V5LCB2YWx1ZX0pXX0pO1xuICAgIH1cblxuICAgIHJlYWRvbmx5IG5hbWU6IHN0cmluZztcbiAgICByZWFkb25seSBhdHRyaWJ1dGVzOiBBdHRyaWJ1dGVbXTtcblxuICAgIGNvbnN0cnVjdG9yKHByb3BzPzogUHJvcGVydGllczxDcmVkZW50aWFsPikge1xuICAgICAgICBzdXBlcihwcm9wcyk7XG5cbiAgICAgICAgdGhpcy5hdHRyaWJ1dGVzID0gdGhpcy5hdHRyaWJ1dGVzLnNsaWNlKCkgfHwgW107XG4gICAgfVxufVxuXG4vKipcbiAqIEF0dHJpYnV0ZSBvZiBhIGNyZWRlbnRpYWxcbiAqL1xuZXhwb3J0IGNsYXNzIEF0dHJpYnV0ZSBleHRlbmRzIE1lc3NhZ2U8QXR0cmlidXRlPiB7XG5cbiAgICAvKipcbiAgICAgKiBAc2VlIFJFQURNRSNNZXNzYWdlIGNsYXNzZXNcbiAgICAgKi9cbiAgICBzdGF0aWMgcmVnaXN0ZXIoKSB7XG4gICAgICAgIHJlZ2lzdGVyTWVzc2FnZShcInBlcnNvbmhvb2QuQXR0cmlidXRlXCIsIEF0dHJpYnV0ZSk7XG4gICAgfVxuXG4gICAgcmVhZG9ubHkgbmFtZTogc3RyaW5nO1xuICAgIHJlYWRvbmx5IHZhbHVlOiBCdWZmZXI7XG5cbiAgICBjb25zdHJ1Y3Rvcihwcm9wcz86IFByb3BlcnRpZXM8QXR0cmlidXRlPikge1xuICAgICAgICBzdXBlcihwcm9wcyk7XG5cbiAgICAgICAgdGhpcy52YWx1ZSA9IEJ1ZmZlci5mcm9tKHRoaXMudmFsdWUgfHwgRU1QVFlfQlVGRkVSKTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBSZWNvdmVyeVNpZ25hdHVyZSB7XG4gICAgc3RhdGljIHJlYWRvbmx5IHNpZyA9IDY0O1xuICAgIHN0YXRpYyByZWFkb25seSBwdWIgPSAzMjtcbiAgICBzdGF0aWMgcmVhZG9ubHkgY3JlZElJRCA9IDMyO1xuICAgIHN0YXRpYyByZWFkb25seSB2ZXJzaW9uID0gODtcbiAgICBzdGF0aWMgcmVhZG9ubHkgcHViU2lnID0gUmVjb3ZlcnlTaWduYXR1cmUucHViICsgUmVjb3ZlcnlTaWduYXR1cmUuc2lnO1xuICAgIHN0YXRpYyByZWFkb25seSBtc2dCdWYgPSBSZWNvdmVyeVNpZ25hdHVyZS5jcmVkSUlEICsgUmVjb3ZlcnlTaWduYXR1cmUucHViICsgUmVjb3ZlcnlTaWduYXR1cmUudmVyc2lvbjtcblxuICAgIGNvbnN0cnVjdG9yKHB1YmxpYyBjcmVkZW50aWFsSUlEOiBJbnN0YW5jZUlELCBwdWJsaWMgc2lnbmF0dXJlOiBCdWZmZXIpIHtcbiAgICB9XG59XG5cbkNyZWRlbnRpYWxTdHJ1Y3QucmVnaXN0ZXIoKTtcbkNyZWRlbnRpYWwucmVnaXN0ZXIoKTtcbkF0dHJpYnV0ZS5yZWdpc3RlcigpO1xuIl19