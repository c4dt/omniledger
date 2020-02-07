"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
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
var rxjs_1 = require("rxjs");
var kyber_1 = require("@dedis/kyber");
var operators_1 = require("rxjs/operators");
var first_1 = require("rxjs/internal/operators/first");
var mergeMap_1 = require("rxjs/internal/operators/mergeMap");
var cothority_1 = require("@dedis/cothority");
var _a = cothority_1.byzcoin.contracts, CredentialStruct = _a.CredentialStruct, CredentialsInstance = _a.CredentialsInstance;
var ClientTransaction = cothority_1.byzcoin.ClientTransaction, Instruction = cothority_1.byzcoin.Instruction, Argument = cothority_1.byzcoin.Argument;
var SignerEd25519 = cothority_1.darc.SignerEd25519;
exports.ed25519 = new kyber_1.curve.edwards25519.Curve();
var EAttributes;
(function (EAttributes) {
    EAttributes["alias"] = "1-public:alias";
    EAttributes["email"] = "1-public:email";
    EAttributes["coinID"] = "1-public:coin";
    EAttributes["contacts"] = "1-public:contactsBuf";
    EAttributes["version"] = "1-public:version";
    EAttributes["structVersion"] = "1-public:structVersion";
    EAttributes["seed"] = "1-public:seedPub";
    EAttributes["spawner"] = "1-public:spawner";
    EAttributes["ltsID"] = "1-config:ltsID";
    EAttributes["ltsX"] = "1-config:ltsX";
    EAttributes["devInitial"] = "1-devices:initial";
})(EAttributes = exports.EAttributes || (exports.EAttributes = {}));
/**
 * Credential holds static methods that allow to setup instances for credentials.
 */
var Credentials = /** @class */ (function () {
    function Credentials(inst, id, cred) {
        this.inst = inst;
        this.id = id;
        this.cred = cred;
        this.attributeCache = new Map();
        this.contactsCache = new Map();
    }
    Credentials.fromScratch = function (inst, id) {
        return __awaiter(this, void 0, void 0, function () {
            var cred;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        cred = new rxjs_1.ReplaySubject(1);
                        return [4 /*yield*/, inst.instanceObservable(id)];
                    case 1:
                        (_a.sent())
                            .pipe(operators_1.map(function (ii) { return CredentialStruct.decode(ii.value); }))
                            .subscribe(cred);
                        return [2 /*return*/, new Credentials(inst, id, cred)];
                }
            });
        });
    };
    Credentials.prototype.attributeObservable = function (name) {
        var bs = this.attributeCache.get(name);
        if (bs !== undefined) {
            return bs;
        }
        var newBS = new rxjs_1.ReplaySubject(1);
        this.cred.pipe(operators_1.map(function (cred) {
            var fields = name.split(":");
            return cred.getAttribute(fields[0], fields[1]) || Buffer.alloc(0);
        }), operators_1.distinctUntilChanged(function (a, b) { return a.equals(b); }))
            .subscribe(newBS);
        this.attributeCache.set(name, newBS);
        return newBS;
    };
    Credentials.prototype.aliasObservable = function () {
        return this.attributeObservable(EAttributes.alias).pipe(operators_1.map(function (buf) { return buf.toString(); }));
    };
    Credentials.prototype.emailObservable = function () {
        return this.attributeObservable(EAttributes.email).pipe(operators_1.map(function (buf) { return buf.toString(); }));
    };
    Credentials.prototype.coinIDObservable = function () {
        return this.attributeObservable(EAttributes.coinID).pipe(operators_1.map(function (buf) { return buf; }));
    };
    // contactsObservable returns an observable that emits a list of new
    // contacts whenever one or more new contacts are available.
    // When first calling this method, all available contacts will be sent
    // together.
    // Once a contact disappears, the `complete` method is invoked.
    Credentials.prototype.contactsObservable = function () {
        var _this = this;
        return this.attributeObservable(EAttributes.contacts)
            .pipe(operators_1.startWith(Buffer.alloc(0)), operators_1.map(function (buf) { return new ContactList(buf); }), operators_1.pairwise(), operators_1.map(function (pair) {
            // First check which contacts have been removed
            var previous = pair[0], current = pair[1];
            cothority_1.Log.lvl3("Got new pair:", current.set);
            var newCreds = [];
            previous.set.forEach(function (id) {
                if (!current.has(id)) {
                    // End this contact
                    var co = _this.contactsCache.get(id);
                    if (co !== undefined) {
                        cothority_1.Log.lvl2("Removing contact", id);
                        co.complete();
                        _this.contactsCache.delete(id);
                    }
                }
            });
            current.set.forEach(function (id) {
                if (!previous.has(id)) {
                    cothority_1.Log.lvl2("Adding contact", id);
                    newCreds.push(Buffer.from(id, "hex"));
                }
            });
            return newCreds;
        }))
            .pipe(mergeMap_1.mergeMap(function (ids) {
            return Promise.all(ids.map(function (id) {
                return Credentials.fromScratch(_this.inst, id);
            }));
        }), operators_1.map(function (creds) {
            return creds.map(function (cred) {
                var co = new rxjs_1.BehaviorSubject(cred);
                _this.contactsCache.set(cred.id.toString("hex"), co);
                return co;
            });
        }));
    };
    Credentials.prototype.updateCredentials = function (bc, priv) {
        var cred = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            cred[_i - 2] = arguments[_i];
        }
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                this.cred.pipe(first_1.first()).subscribe(function (orig) { return __awaiter(_this, void 0, void 0, function () {
                    var _i, cred_1, c, fields, value, ctx, signer;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                for (_i = 0, cred_1 = cred; _i < cred_1.length; _i++) {
                                    c = cred_1[_i];
                                    fields = c.name.split(":");
                                    value = c.value instanceof Buffer ? c.value : Buffer.from(c.value);
                                    orig.setAttribute(fields[0], fields[1], value);
                                }
                                ctx = ClientTransaction.make(3, Instruction.createInvoke(this.id, CredentialsInstance.contractID, CredentialsInstance.commandUpdate, [
                                    new Argument({
                                        name: CredentialsInstance.argumentCredential,
                                        value: orig.toBytes()
                                    })
                                ]));
                                signer = [[new SignerEd25519(exports.ed25519.point().mul(priv), priv)]];
                                return [4 /*yield*/, ctx.updateCountersAndSign(bc, signer)];
                            case 1:
                                _a.sent();
                                return [4 /*yield*/, bc.sendTransactionAndWait(ctx)];
                            case 2:
                                _a.sent();
                                return [4 /*yield*/, this.inst.reload()];
                            case 3:
                                _a.sent();
                                return [2 /*return*/];
                        }
                    });
                }); });
                return [2 /*return*/];
            });
        });
    };
    Credentials.prototype.addContact = function (bc, priv, id) {
        return __awaiter(this, void 0, void 0, function () {
            var creds;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, ContactList.fromCredentials(this)];
                    case 1:
                        creds = _a.sent();
                        if (creds.has(id)) {
                            return [2 /*return*/];
                        }
                        creds.add(id);
                        return [2 /*return*/, this.updateCredentials(bc, priv, { name: EAttributes.contacts, value: creds.toBuffer() })];
                }
            });
        });
    };
    Credentials.prototype.rmContact = function (bc, priv, id) {
        return __awaiter(this, void 0, void 0, function () {
            var creds;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, ContactList.fromCredentials(this)];
                    case 1:
                        creds = _a.sent();
                        if (!creds.has(id)) {
                            return [2 /*return*/];
                        }
                        creds.rm(id);
                        return [2 /*return*/, this.updateCredentials(bc, priv, { name: EAttributes.contacts, value: creds.toBuffer() })];
                }
            });
        });
    };
    Credentials.structVersionLatest = 2;
    Credentials.urlRegistered = "https://pop.dedis.ch/qrcode/identity-2";
    Credentials.urlUnregistered = "https://pop.dedis.ch/qrcode/unregistered-2";
    return Credentials;
}());
exports.Credentials = Credentials;
/**
 * ContactList wraps a list of credentialIDs in a set to be able to do add,
 * rm, has and convert it back to a long buffer again.
 * As the existing sets will store happily Buffer.from("1") and
 * Buffer.from("1") twice, this class converts all buffer to hex-codes, and
 * then back again.
 */
var ContactList = /** @class */ (function () {
    function ContactList(contacts) {
        if (contacts instanceof Buffer) {
            var list = [];
            for (var i = 0; i < contacts.length; i += 32) {
                list.push(contacts.slice(i, i + 32).toString("hex"));
            }
            this.set = new Set(list);
        }
        else {
            this.set = contacts;
        }
    }
    ContactList.fromCredentials = function (cred) {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = ContactList.bind;
                        return [4 /*yield*/, new Promise(function (r) {
                                cred.attributeObservable(EAttributes.contacts)
                                    .subscribe(function (buf) { return r(buf); });
                            })];
                    case 1: return [2 /*return*/, new (_a.apply(ContactList, [void 0, _b.sent()]))()];
                }
            });
        });
    };
    ContactList.prototype.toBuffer = function () {
        var ret = Buffer.alloc(this.set.size * 32);
        var i = 0;
        this.set.forEach(function (c) {
            Buffer.from(c, "hex").copy(ret, i * 32);
            i++;
        });
        return ret;
    };
    ContactList.prototype.add = function (contact) {
        if (contact instanceof Buffer) {
            this.set.add(contact.toString("hex"));
        }
        else {
            this.set.add(contact);
        }
    };
    ContactList.prototype.rm = function (contact) {
        if (contact instanceof Buffer) {
            this.set.delete(contact.toString("hex"));
        }
        else {
            this.set.delete(contact);
        }
    };
    ContactList.prototype.has = function (contact) {
        if (contact instanceof Buffer) {
            return this.set.has(contact.toString("hex"));
        }
        else {
            return this.set.has(contact);
        }
    };
    return ContactList;
}());
exports.ContactList = ContactList;
