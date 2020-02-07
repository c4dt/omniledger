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
var keypair_1 = require("./keypair");
var credentials_1 = require("./credentials");
var cothority_1 = require("@dedis/cothority");
var _a = cothority_1.byzcoin.contracts, CredentialStruct = _a.CredentialStruct, CredentialsInstance = _a.CredentialsInstance;
// The user class is to be used only once for a given DB. It is unique for
// one URL-domain and represents the logged in user.
// When calling `User.load`, it tries to migrate from a previous dynacred
// installation.
// If the migration is successful, it uses this configuration, stores the
// new information and deletes the old config.
var User = /** @class */ (function () {
    function User(db, credential, kp, kpPersonhood) {
        this.db = db;
        this.credential = credential;
        this.kp = kp;
        this.kpPersonhood = kpPersonhood;
    }
    Object.defineProperty(User.prototype, "id", {
        get: function () {
            return this.credential.id;
        },
        enumerable: true,
        configurable: true
    });
    User.migrate = function (db, inst) {
        return __awaiter(this, void 0, void 0, function () {
            var migrate, privIDBuf, credStruct, fields, seed, credID, cred, idKP, phKP, privPHBuf, u, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        return [4 /*yield*/, db.getObject(this.keyMigrate)];
                    case 1:
                        migrate = _a.sent();
                        cothority_1.Log.print("migrate is:", migrate);
                        if (!(migrate && migrate.version === this.versionMigrate)) return [3 /*break*/, 4];
                        // Just suppose everything is here and let it fail otherwise.
                        cothority_1.Log.lvl1("Migrating from", migrate);
                        privIDBuf = Buffer.from(migrate.keyIdentity, "hex");
                        credStruct = CredentialStruct.decode(migrate.contact.credential);
                        fields = credentials_1.EAttributes.seed.split(":");
                        seed = credStruct.getAttribute(fields[0], fields[1]);
                        if (!seed) {
                            cothority_1.Log.error("couldn't get seed");
                            return [2 /*return*/, undefined];
                        }
                        credID = CredentialsInstance.credentialIID(seed);
                        return [4 /*yield*/, credentials_1.Credentials.fromScratch(inst, credID)];
                    case 2:
                        cred = _a.sent();
                        idKP = keypair_1.KeyPair.fromPrivate(privIDBuf);
                        phKP = void 0;
                        if (migrate.keyPersonhood) {
                            privPHBuf = Buffer.from(migrate.keyPersonhood, "hex");
                            phKP = keypair_1.KeyPair.fromPrivate(privPHBuf);
                        }
                        cothority_1.Log.print("not deleting old config");
                        u = new User(db, cred, idKP, phKP);
                        return [4 /*yield*/, u.save()];
                    case 3:
                        _a.sent();
                        return [2 /*return*/, u];
                    case 4: return [3 /*break*/, 6];
                    case 5:
                        e_1 = _a.sent();
                        cothority_1.Log.lvl4("Nothing to migrate from", e_1);
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/, undefined];
                }
            });
        });
    };
    User.load = function (db, inst) {
        return __awaiter(this, void 0, void 0, function () {
            var user, privBuf, id, kpPersonhood, privPersonhoodBuf, e_2, kp, cred;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.migrate(db, inst)];
                    case 1:
                        user = _a.sent();
                        if (user) {
                            return [2 /*return*/, user];
                        }
                        return [4 /*yield*/, db.get(this.keyPriv)];
                    case 2:
                        privBuf = _a.sent();
                        if (privBuf === undefined) {
                            throw new Error("no private key stored");
                        }
                        return [4 /*yield*/, db.get(this.keyCredID)];
                    case 3:
                        id = _a.sent();
                        if (id === undefined) {
                            throw new Error("no credentialID stored");
                        }
                        _a.label = 4;
                    case 4:
                        _a.trys.push([4, 6, , 7]);
                        return [4 /*yield*/, db.get(this.keyPersonhood)];
                    case 5:
                        privPersonhoodBuf = _a.sent();
                        if (privPersonhoodBuf !== undefined) {
                            kpPersonhood = keypair_1.KeyPair.fromPrivate(privPersonhoodBuf);
                        }
                        return [3 /*break*/, 7];
                    case 6:
                        e_2 = _a.sent();
                        cothority_1.Log.lvl3("No personhood key");
                        return [3 /*break*/, 7];
                    case 7:
                        kp = keypair_1.KeyPair.fromPrivate(privBuf);
                        return [4 /*yield*/, credentials_1.Credentials.fromScratch(inst, id)];
                    case 8:
                        cred = _a.sent();
                        return [2 /*return*/, new User(db, cred, kp, kpPersonhood)];
                }
            });
        });
    };
    User.prototype.save = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.db.set(User.keyPriv, this.kp.priv.marshalBinary())];
                    case 1:
                        _a.sent();
                        if (!this.kpPersonhood) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.db.set(User.keyPersonhood, this.kpPersonhood.priv.marshalBinary())];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3: return [4 /*yield*/, this.db.set(User.keyCredID, this.credential.id)];
                    case 4:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    User.prototype.addContact = function (bc, id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.credential.addContact(bc, this.kp.priv, id)];
            });
        });
    };
    User.prototype.rmContact = function (bc, id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.credential.rmContact(bc, this.kp.priv, id)];
            });
        });
    };
    User.keyPriv = "private";
    User.keyPersonhood = "personhood";
    User.keyCredID = "credID";
    User.keyMigrate = "storage/data.json";
    User.versionMigrate = 1;
    return User;
}());
exports.User = User;
