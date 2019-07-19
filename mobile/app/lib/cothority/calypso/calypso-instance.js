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
var kyber_1 = require("@dedis/kyber");
var crypto_browserify_1 = require("crypto-browserify");
var keccak_1 = __importDefault(require("keccak"));
var light_1 = require("protobufjs/light");
var client_transaction_1 = __importStar(require("../byzcoin/client-transaction"));
var coin_instance_1 = __importDefault(require("../byzcoin/contracts/coin-instance"));
var instance_1 = __importDefault(require("../byzcoin/instance"));
var protobuf_1 = require("../protobuf");
var curve25519 = kyber_1.curve.newCurve("edwards25519");
var OnChainSecretInstance = /** @class */ (function (_super) {
    __extends(OnChainSecretInstance, _super);
    function OnChainSecretInstance(rpc, inst) {
        var _this = _super.call(this, inst) || this;
        _this.rpc = rpc;
        if (inst.contractID.toString() !== OnChainSecretInstance.contractID) {
            throw new Error("mismatch contract name: " + inst.contractID + " vs " + OnChainSecretInstance.contractID);
        }
        _this.write = Write.decode(inst.data);
        return _this;
    }
    /**
     * Spawn a longTermSecret instance
     *
     * @param bc        The RPC to use
     * @param darcID    The darc instance ID
     * @param signers   The list of signers for the transaction
     * @param write The write structure containing the encrypted secret
     * @returns a promise that resolves with the new instance
     */
    OnChainSecretInstance.spawn = function (bc, darcID, signers) {
        return __awaiter(this, void 0, void 0, function () {
            var inst, ctx;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        inst = client_transaction_1.Instruction.createSpawn(darcID, OnChainSecretInstance.contractID, []);
                        return [4 /*yield*/, inst.updateCounters(bc, signers)];
                    case 1:
                        _a.sent();
                        ctx = new client_transaction_1.default({ instructions: [inst] });
                        ctx.signWith([signers]);
                        return [4 /*yield*/, bc.sendTransactionAndWait(ctx, 10)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, OnChainSecretInstance.fromByzcoin(bc, inst.deriveId())];
                }
            });
        });
    };
    /**
     * Initializes using an existing coinInstance from ByzCoin
     * @param bc    The RPC to use
     * @param iid   The instance ID
     * @param waitMatch how many times to wait for a match - useful if its called just after an addTransactionAndWait.
     * @param interval how long to wait between two attempts in waitMatch.
     * @returns a promise that resolves with the OnChainSecret instance
     */
    OnChainSecretInstance.fromByzcoin = function (bc, iid, waitMatch, interval) {
        if (waitMatch === void 0) { waitMatch = 0; }
        if (interval === void 0) { interval = 1000; }
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _a = OnChainSecretInstance.bind;
                        _b = [void 0, bc];
                        return [4 /*yield*/, instance_1.default.fromByzcoin(bc, iid, waitMatch, interval)];
                    case 1: return [2 /*return*/, new (_a.apply(OnChainSecretInstance, _b.concat([_c.sent()])))()];
                }
            });
        });
    };
    OnChainSecretInstance.contractID = "longTermSecret";
    return OnChainSecretInstance;
}(instance_1.default));
exports.OnChainSecretInstance = OnChainSecretInstance;
var CalypsoWriteInstance = /** @class */ (function (_super) {
    __extends(CalypsoWriteInstance, _super);
    function CalypsoWriteInstance(rpc, inst) {
        var _this = _super.call(this, inst) || this;
        _this.rpc = rpc;
        if (inst.contractID.toString() !== CalypsoWriteInstance.contractID) {
            throw new Error("mismatch contract name: " + inst.contractID + " vs " + CalypsoWriteInstance.contractID);
        }
        _this.write = Write.decode(inst.data);
        return _this;
    }
    /**
     * Spawn a calypsoWrite instance
     *
     * @param bc        The RPC to use
     * @param darcID    The darc instance ID
     * @param write The write structure containing the encrypted secret
     * @param signers   The list of signers for the transaction
     * @returns a promise that resolves with the new instance
     */
    CalypsoWriteInstance.spawn = function (bc, darcID, write, signers) {
        return __awaiter(this, void 0, void 0, function () {
            var ctx;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        ctx = new client_transaction_1.default({
                            instructions: [
                                client_transaction_1.Instruction.createSpawn(darcID, CalypsoWriteInstance.contractID, [new client_transaction_1.Argument({ name: CalypsoWriteInstance.argumentWrite,
                                        value: Buffer.from(Write.encode(write).finish()) })]),
                            ],
                        });
                        return [4 /*yield*/, ctx.updateCountersAndSign(bc, [signers])];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, bc.sendTransactionAndWait(ctx, 10)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, CalypsoWriteInstance.fromByzcoin(bc, ctx.instructions[0].deriveId())];
                }
            });
        });
    };
    /**
     * Initializes using an existing coinInstance from ByzCoin
     * @param bc    The RPC to use
     * @param iid   The instance ID
     * @returns a promise that resolves with the coin instance
     */
    CalypsoWriteInstance.fromByzcoin = function (bc, iid, waitMatch, interval) {
        if (waitMatch === void 0) { waitMatch = 0; }
        if (interval === void 0) { interval = 1000; }
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _a = CalypsoWriteInstance.bind;
                        _b = [void 0, bc];
                        return [4 /*yield*/, instance_1.default.fromByzcoin(bc, iid, waitMatch, interval)];
                    case 1: return [2 /*return*/, new (_a.apply(CalypsoWriteInstance, _b.concat([_c.sent()])))()];
                }
            });
        });
    };
    CalypsoWriteInstance.prototype.spawnRead = function (pub, signers, coin, coinSigners) {
        return __awaiter(this, void 0, void 0, function () {
            var pay;
            return __generator(this, function (_a) {
                if (this.write.cost && (!coin || !coinSigners)) {
                    throw new Error("spawning a read instance costs coins");
                }
                if (coin && coinSigners) {
                    pay = client_transaction_1.Instruction.createInvoke(coin.id, coin_instance_1.default.contractID, coin_instance_1.default.commandFetch, [
                        new client_transaction_1.Argument({ name: coin_instance_1.default.argumentCoins, value: Buffer.from(this.write.cost.value.toBytesLE()) }),
                    ]);
                }
                return [2 /*return*/, CalypsoReadInstance.spawn(this.rpc, this.id, pub, signers, pay)];
            });
        });
    };
    CalypsoWriteInstance.contractID = "calypsoWrite";
    CalypsoWriteInstance.argumentWrite = "write";
    return CalypsoWriteInstance;
}(instance_1.default));
exports.CalypsoWriteInstance = CalypsoWriteInstance;
var CalypsoReadInstance = /** @class */ (function (_super) {
    __extends(CalypsoReadInstance, _super);
    function CalypsoReadInstance(rpc, inst) {
        var _this = _super.call(this, inst) || this;
        _this.rpc = rpc;
        if (inst.contractID.toString() !== CalypsoReadInstance.contractID) {
            throw new Error("mismatch contract name: " + inst.contractID + " vs " + CalypsoReadInstance.contractID);
        }
        _this.read = Read.decode(inst.data);
        return _this;
    }
    CalypsoReadInstance.spawn = function (bc, writeId, pub, signers, pay) {
        return __awaiter(this, void 0, void 0, function () {
            var read, ctx, ctxSigners;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        read = new Read({ write: writeId, xc: pub.marshalBinary() });
                        ctx = new client_transaction_1.default({
                            instructions: [
                                client_transaction_1.Instruction.createSpawn(writeId, CalypsoReadInstance.contractID, [
                                    new client_transaction_1.Argument({ name: CalypsoReadInstance.argumentRead,
                                        value: Buffer.from(Read.encode(read).finish()) }),
                                ]),
                            ],
                        });
                        ctxSigners = [signers];
                        if (pay) {
                            ctx.instructions.unshift(pay);
                            ctxSigners.unshift(signers);
                        }
                        return [4 /*yield*/, ctx.updateCountersAndSign(bc, ctxSigners)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, bc.sendTransactionAndWait(ctx)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, CalypsoReadInstance.fromByzcoin(bc, ctx.instructions[ctx.instructions.length - 1].deriveId())];
                }
            });
        });
    };
    /**
     * Initializes using an existing CalypsoReadInstance from ByzCoin
     * @param bc    The RPC to use
     * @param iid   The instance ID
     * @returns a promise that resolves with the coin instance
     */
    CalypsoReadInstance.fromByzcoin = function (bc, iid) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _a = CalypsoReadInstance.bind;
                        _b = [void 0, bc];
                        return [4 /*yield*/, instance_1.default.fromByzcoin(bc, iid)];
                    case 1: return [2 /*return*/, new (_a.apply(CalypsoReadInstance, _b.concat([_c.sent()])))()];
                }
            });
        });
    };
    CalypsoReadInstance.prototype.decrypt = function (ocs, priv) {
        return __awaiter(this, void 0, void 0, function () {
            var xhatenc, _a, _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _b = (_a = ocs).reencryptKey;
                        return [4 /*yield*/, this.rpc.getProof(this.read.write)];
                    case 1:
                        _c = [_d.sent()];
                        return [4 /*yield*/, this.rpc.getProof(this.id)];
                    case 2: return [4 /*yield*/, _b.apply(_a, _c.concat([_d.sent()]))];
                    case 3:
                        xhatenc = _d.sent();
                        return [2 /*return*/, xhatenc.decrypt(priv)];
                }
            });
        });
    };
    CalypsoReadInstance.contractID = "calypsoRead";
    CalypsoReadInstance.argumentRead = "read";
    return CalypsoReadInstance;
}(instance_1.default));
exports.CalypsoReadInstance = CalypsoReadInstance;
var Write = /** @class */ (function (_super) {
    __extends(Write, _super);
    function Write(props) {
        return _super.call(this, props) || this;
    }
    /**
     * @see README#Message classes
     */
    Write.register = function () {
        protobuf_1.registerMessage("calypso.Write", Write);
    };
    /**
     * createWrite returns a new write structure that contains a proof for the read-request
     * with regard to the LTS-ID and the write-Darc.
     *
     * @param ltsid the long-term-secret ID that can re-encrypt the key
     * @param writeDarc allowed to ask for a re-encryption
     * @param X the aggregate public key under which the symmetric key will be encrypted
     * @param key the symmetric key to be encrypted
     */
    Write.createWrite = function (ltsid, writeDarc, X, key, rand) {
        return __awaiter(this, void 0, void 0, function () {
            var wr, r, C, kp, k, gBar, s, w, wBar, hash, E;
            return __generator(this, function (_a) {
                wr = new Write();
                r = curve25519.scalar().pick(rand);
                C = curve25519.point().mul(r, X);
                // wr.U = suite.Point().Mul(r, nil)
                wr.u = curve25519.point().mul(r).marshalBinary();
                // Create proof
                // if len(key) > suite.Point().EmbedLen() {
                // 	return nil
                // }
                if (key.length > curve25519.point().embedLen()) {
                    return [2 /*return*/, Promise.reject("key is too long")];
                }
                kp = curve25519.point().embed(key, rand);
                // wr.C = suite.Point().Add(C, kp)
                wr.c = curve25519.point().add(C, kp).marshalBinary();
                k = new keccak_1.default("shake256");
                k.update(ltsid);
                gBar = curve25519.point().embed(Buffer.from(ltsid.subarray(0, curve25519.point().embedLen())), function (l) { return k.squeeze(l); });
                // wr.Ubar = suite.Point().Mul(r, gBar)
                wr.ubar = curve25519.point().mul(r, gBar).marshalBinary();
                s = curve25519.scalar().pick(rand);
                w = curve25519.point().mul(s);
                wBar = curve25519.point().mul(s, gBar);
                hash = crypto_browserify_1.createHash("sha256");
                // wr.C.MarshalTo(hash)
                hash.update(wr.c);
                // wr.U.MarshalTo(hash)
                hash.update(wr.u);
                // wr.Ubar.MarshalTo(hash)
                hash.update(wr.ubar);
                // w.MarshalTo(hash)
                hash.update(w.marshalBinary());
                // wBar.MarshalTo(hash)
                hash.update(wBar.marshalBinary());
                // hash.Write(writeDarc)
                hash.update(writeDarc);
                E = curve25519.scalar().setBytes(hash.digest());
                wr.e = E.marshalBinary();
                // wr.F = suite.Scalar().Add(s, suite.Scalar().Mul(wr.E, r))
                wr.f = curve25519.scalar().add(s, curve25519.scalar().mul(E, r)).marshalBinary();
                wr.ltsid = ltsid;
                return [2 /*return*/, wr];
            });
        });
    };
    Write.prototype.toBytes = function () {
        return Buffer.from(Write.encode(this).finish());
    };
    return Write;
}(light_1.Message));
exports.Write = Write;
var Read = /** @class */ (function (_super) {
    __extends(Read, _super);
    function Read(props) {
        return _super.call(this, props) || this;
    }
    /**
     * @see README#Message classes
     */
    Read.register = function () {
        protobuf_1.registerMessage("calypso.Read", Read);
    };
    Read.prototype.toBytes = function () {
        return Buffer.from(Read.encode(this).finish());
    };
    return Read;
}(light_1.Message));
exports.Read = Read;
// DecodeKey can be used by the reader of ByzCoin to convert the
// re-encrypted secret back to a symmetric key that can be used later to decode
// the document.
//
// Input:
//   - suite - the cryptographic suite to use
//   - X - the aggregate public key of the DKG
//   - C - the encrypted key
//   - XhatEnc - the re-encrypted schnorr-commit
//   - xc - the private key of the reader
//
// Output:
//   - key - the re-assembled key
//   - err - an eventual error when trying to recover the data from the points
// func DecodeKey(suite kyber.Group, X kyber.Point, C kyber.Point, XhatEnc kyber.Point,
// 	xc kyber.Scalar) (key []byte, err error) {
/* tslint:disable: variable-name */
function DecodeKey(X, C, XhatEnc, priv) {
    return __awaiter(this, void 0, void 0, function () {
        var xcInv, XhatDec, Xhat, XhatInv, keyPointHat;
        return __generator(this, function (_a) {
            xcInv = curve25519.scalar().neg(priv);
            XhatDec = curve25519.point().mul(xcInv, X);
            Xhat = curve25519.point().add(XhatEnc, XhatDec);
            XhatInv = curve25519.point().neg(Xhat);
            keyPointHat = curve25519.point().add(C, XhatInv);
            // 	key, err = keyPointHat.Data()
            return [2 /*return*/, Buffer.from(keyPointHat.data())];
        });
    });
}
exports.DecodeKey = DecodeKey;
Write.register();
Read.register();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FseXBzby1pbnN0YW5jZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNhbHlwc28taW5zdGFuY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsc0NBQW9EO0FBQ3BELHVEQUErQztBQUMvQyxrREFBNEI7QUFDNUIsMENBQXVEO0FBRXZELGtGQUF5RjtBQUN6RixxRkFBd0U7QUFDeEUsaUVBQTJEO0FBRTNELHdDQUE4QztBQUc5QyxJQUFNLFVBQVUsR0FBRyxhQUFLLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxDQUFDO0FBRWxEO0lBQTJDLHlDQUFRO0lBOEMvQywrQkFBb0IsR0FBZSxFQUFFLElBQWM7UUFBbkQsWUFDSSxrQkFBTSxJQUFJLENBQUMsU0FNZDtRQVBtQixTQUFHLEdBQUgsR0FBRyxDQUFZO1FBRS9CLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxRQUFRLEVBQUUsS0FBSyxxQkFBcUIsQ0FBQyxVQUFVLEVBQUU7WUFDakUsTUFBTSxJQUFJLEtBQUssQ0FBQyw2QkFBMkIsSUFBSSxDQUFDLFVBQVUsWUFBTyxxQkFBcUIsQ0FBQyxVQUFZLENBQUMsQ0FBQztTQUN4RztRQUVELEtBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7O0lBQ3pDLENBQUM7SUFsREQ7Ozs7Ozs7O09BUUc7SUFDVSwyQkFBSyxHQUFsQixVQUNJLEVBQWMsRUFDZCxNQUFrQixFQUNsQixPQUFpQjs7Ozs7O3dCQUVYLElBQUksR0FBRyxnQ0FBVyxDQUFDLFdBQVcsQ0FDaEMsTUFBTSxFQUNOLHFCQUFxQixDQUFDLFVBQVUsRUFDaEMsRUFBRSxDQUNMLENBQUM7d0JBQ0YscUJBQU0sSUFBSSxDQUFDLGNBQWMsQ0FBQyxFQUFFLEVBQUUsT0FBTyxDQUFDLEVBQUE7O3dCQUF0QyxT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LElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBQzs7O0NBQzFDO0FBZkQsOEJBZUM7QUFFRCxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7QUFDakIsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgY3VydmUsIFBvaW50LCBTY2FsYXIgfSBmcm9tIFwiQGRlZGlzL2t5YmVyXCI7XG5pbXBvcnQgeyBjcmVhdGVIYXNoIH0gZnJvbSBcImNyeXB0by1icm93c2VyaWZ5XCI7XG5pbXBvcnQgS2VjY2FrIGZyb20gXCJrZWNjYWtcIjtcbmltcG9ydCB7IE1lc3NhZ2UsIFByb3BlcnRpZXMgfSBmcm9tIFwicHJvdG9idWZqcy9saWdodFwiO1xuaW1wb3J0IEJ5ekNvaW5SUEMgZnJvbSBcIi4uL2J5emNvaW4vYnl6Y29pbi1ycGNcIjtcbmltcG9ydCBDbGllbnRUcmFuc2FjdGlvbiwgeyBBcmd1bWVudCwgSW5zdHJ1Y3Rpb24gfSBmcm9tIFwiLi4vYnl6Y29pbi9jbGllbnQtdHJhbnNhY3Rpb25cIjtcbmltcG9ydCBDb2luSW5zdGFuY2UsIHsgQ29pbiB9IGZyb20gXCIuLi9ieXpjb2luL2NvbnRyYWN0cy9jb2luLWluc3RhbmNlXCI7XG5pbXBvcnQgSW5zdGFuY2UsIHsgSW5zdGFuY2VJRCB9IGZyb20gXCIuLi9ieXpjb2luL2luc3RhbmNlXCI7XG5pbXBvcnQgU2lnbmVyIGZyb20gXCIuLi9kYXJjL3NpZ25lclwiO1xuaW1wb3J0IHsgcmVnaXN0ZXJNZXNzYWdlIH0gZnJvbSBcIi4uL3Byb3RvYnVmXCI7XG5pbXBvcnQgeyBPbkNoYWluU2VjcmV0UlBDIH0gZnJvbSBcIi4vY2FseXBzby1ycGNcIjtcblxuY29uc3QgY3VydmUyNTUxOSA9IGN1cnZlLm5ld0N1cnZlKFwiZWR3YXJkczI1NTE5XCIpO1xuXG5leHBvcnQgY2xhc3MgT25DaGFpblNlY3JldEluc3RhbmNlIGV4dGVuZHMgSW5zdGFuY2Uge1xuICAgIHN0YXRpYyByZWFkb25seSBjb250cmFjdElEID0gXCJsb25nVGVybVNlY3JldFwiO1xuXG4gICAgLyoqXG4gICAgICogU3Bhd24gYSBsb25nVGVybVNlY3JldCBpbnN0YW5jZVxuICAgICAqXG4gICAgICogQHBhcmFtIGJjICAgICAgICBUaGUgUlBDIHRvIHVzZVxuICAgICAqIEBwYXJhbSBkYXJjSUQgICAgVGhlIGRhcmMgaW5zdGFuY2UgSURcbiAgICAgKiBAcGFyYW0gc2lnbmVycyAgIFRoZSBsaXN0IG9mIHNpZ25lcnMgZm9yIHRoZSB0cmFuc2FjdGlvblxuICAgICAqIEBwYXJhbSB3cml0ZSBUaGUgd3JpdGUgc3RydWN0dXJlIGNvbnRhaW5pbmcgdGhlIGVuY3J5cHRlZCBzZWNyZXRcbiAgICAgKiBAcmV0dXJucyBhIHByb21pc2UgdGhhdCByZXNvbHZlcyB3aXRoIHRoZSBuZXcgaW5zdGFuY2VcbiAgICAgKi9cbiAgICBzdGF0aWMgYXN5bmMgc3Bhd24oXG4gICAgICAgIGJjOiBCeXpDb2luUlBDLFxuICAgICAgICBkYXJjSUQ6IEluc3RhbmNlSUQsXG4gICAgICAgIHNpZ25lcnM6IFNpZ25lcltdLFxuICAgICk6IFByb21pc2U8T25DaGFpblNlY3JldEluc3RhbmNlPiB7XG4gICAgICAgIGNvbnN0IGluc3QgPSBJbnN0cnVjdGlvbi5jcmVhdGVTcGF3bihcbiAgICAgICAgICAgIGRhcmNJRCxcbiAgICAgICAgICAgIE9uQ2hhaW5TZWNyZXRJbnN0YW5jZS5jb250cmFjdElELFxuICAgICAgICAgICAgW10sXG4gICAgICAgICk7XG4gICAgICAgIGF3YWl0IGluc3QudXBkYXRlQ291bnRlcnMoYmMsIHNpZ25lcnMpO1xuXG4gICAgICAgIGNvbnN0IGN0eCA9IG5ldyBDbGllbnRUcmFuc2FjdGlvbih7aW5zdHJ1Y3Rpb25zOiBbaW5zdF19KTtcbiAgICAgICAgY3R4LnNpZ25XaXRoKFtzaWduZXJzXSk7XG5cbiAgICAgICAgYXdhaXQgYmMuc2VuZFRyYW5zYWN0aW9uQW5kV2FpdChjdHgsIDEwKTtcblxuICAgICAgICByZXR1cm4gT25DaGFpblNlY3JldEluc3RhbmNlLmZyb21CeXpjb2luKGJjLCBpbnN0LmRlcml2ZUlkKCkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEluaXRpYWxpemVzIHVzaW5nIGFuIGV4aXN0aW5nIGNvaW5JbnN0YW5jZSBmcm9tIEJ5ekNvaW5cbiAgICAgKiBAcGFyYW0gYmMgICAgVGhlIFJQQyB0byB1c2VcbiAgICAgKiBAcGFyYW0gaWlkICAgVGhlIGluc3RhbmNlIElEXG4gICAgICogQHBhcmFtIHdhaXRNYXRjaCBob3cgbWFueSB0aW1lcyB0byB3YWl0IGZvciBhIG1hdGNoIC0gdXNlZnVsIGlmIGl0cyBjYWxsZWQganVzdCBhZnRlciBhbiBhZGRUcmFuc2FjdGlvbkFuZFdhaXQuXG4gICAgICogQHBhcmFtIGludGVydmFsIGhvdyBsb25nIHRvIHdhaXQgYmV0d2VlbiB0d28gYXR0ZW1wdHMgaW4gd2FpdE1hdGNoLlxuICAgICAqIEByZXR1cm5zIGEgcHJvbWlzZSB0aGF0IHJlc29sdmVzIHdpdGggdGhlIE9uQ2hhaW5TZWNyZXQgaW5zdGFuY2VcbiAgICAgKi9cbiAgICBzdGF0aWMgYXN5bmMgZnJvbUJ5emNvaW4oYmM6IEJ5ekNvaW5SUEMsIGlpZDogSW5zdGFuY2VJRCwgd2FpdE1hdGNoOiBudW1iZXIgPSAwLCBpbnRlcnZhbDogbnVtYmVyID0gMTAwMCk6XG4gICAgICAgIFByb21pc2U8T25DaGFpblNlY3JldEluc3RhbmNlPiB7XG4gICAgICAgIHJldHVybiBuZXcgT25DaGFpblNlY3JldEluc3RhbmNlKGJjLCBhd2FpdCBJbnN0YW5jZS5mcm9tQnl6Y29pbihiYywgaWlkLCB3YWl0TWF0Y2gsIGludGVydmFsKSk7XG4gICAgfVxuICAgIHdyaXRlOiBXcml0ZTtcblxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgcnBjOiBCeXpDb2luUlBDLCBpbnN0OiBJbnN0YW5jZSkge1xuICAgICAgICBzdXBlcihpbnN0KTtcbiAgICAgICAgaWYgKGluc3QuY29udHJhY3RJRC50b1N0cmluZygpICE9PSBPbkNoYWluU2VjcmV0SW5zdGFuY2UuY29udHJhY3RJRCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBtaXNtYXRjaCBjb250cmFjdCBuYW1lOiAke2luc3QuY29udHJhY3RJRH0gdnMgJHtPbkNoYWluU2VjcmV0SW5zdGFuY2UuY29udHJhY3RJRH1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMud3JpdGUgPSBXcml0ZS5kZWNvZGUoaW5zdC5kYXRhKTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBDYWx5cHNvV3JpdGVJbnN0YW5jZSBleHRlbmRzIEluc3RhbmNlIHtcbiAgICBzdGF0aWMgcmVhZG9ubHkgY29udHJhY3RJRCA9IFwiY2FseXBzb1dyaXRlXCI7XG4gICAgc3RhdGljIHJlYWRvbmx5IGFyZ3VtZW50V3JpdGUgPSBcIndyaXRlXCI7XG5cbiAgICAvKipcbiAgICAgKiBTcGF3biBhIGNhbHlwc29Xcml0ZSBpbnN0YW5jZVxuICAgICAqXG4gICAgICogQHBhcmFtIGJjICAgICAgICBUaGUgUlBDIHRvIHVzZVxuICAgICAqIEBwYXJhbSBkYXJjSUQgICAgVGhlIGRhcmMgaW5zdGFuY2UgSURcbiAgICAgKiBAcGFyYW0gd3JpdGUgVGhlIHdyaXRlIHN0cnVjdHVyZSBjb250YWluaW5nIHRoZSBlbmNyeXB0ZWQgc2VjcmV0XG4gICAgICogQHBhcmFtIHNpZ25lcnMgICBUaGUgbGlzdCBvZiBzaWduZXJzIGZvciB0aGUgdHJhbnNhY3Rpb25cbiAgICAgKiBAcmV0dXJucyBhIHByb21pc2UgdGhhdCByZXNvbHZlcyB3aXRoIHRoZSBuZXcgaW5zdGFuY2VcbiAgICAgKi9cbiAgICBzdGF0aWMgYXN5bmMgc3Bhd24oXG4gICAgICAgIGJjOiBCeXpDb2luUlBDLFxuICAgICAgICBkYXJjSUQ6IEluc3RhbmNlSUQsXG4gICAgICAgIHdyaXRlOiBXcml0ZSxcbiAgICAgICAgc2lnbmVyczogU2lnbmVyW10sXG4gICAgKTogUHJvbWlzZTxDYWx5cHNvV3JpdGVJbnN0YW5jZT4ge1xuICAgICAgICBjb25zdCBjdHggPSBuZXcgQ2xpZW50VHJhbnNhY3Rpb24oe1xuICAgICAgICAgICAgaW5zdHJ1Y3Rpb25zOiBbXG4gICAgICAgICAgICAgICAgSW5zdHJ1Y3Rpb24uY3JlYXRlU3Bhd24oXG4gICAgICAgICAgICAgICAgICAgIGRhcmNJRCxcbiAgICAgICAgICAgICAgICAgICAgQ2FseXBzb1dyaXRlSW5zdGFuY2UuY29udHJhY3RJRCxcbiAgICAgICAgICAgICAgICAgICAgW25ldyBBcmd1bWVudCh7bmFtZTogQ2FseXBzb1dyaXRlSW5zdGFuY2UuYXJndW1lbnRXcml0ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiBCdWZmZXIuZnJvbShXcml0ZS5lbmNvZGUod3JpdGUpLmZpbmlzaCgpKX0pXSxcbiAgICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgXSxcbiAgICAgICAgfSk7XG4gICAgICAgIGF3YWl0IGN0eC51cGRhdGVDb3VudGVyc0FuZFNpZ24oYmMsIFtzaWduZXJzXSk7XG4gICAgICAgIGF3YWl0IGJjLnNlbmRUcmFuc2FjdGlvbkFuZFdhaXQoY3R4LCAxMCk7XG5cbiAgICAgICAgcmV0dXJuIENhbHlwc29Xcml0ZUluc3RhbmNlLmZyb21CeXpjb2luKGJjLCBjdHguaW5zdHJ1Y3Rpb25zWzBdLmRlcml2ZUlkKCkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEluaXRpYWxpemVzIHVzaW5nIGFuIGV4aXN0aW5nIGNvaW5JbnN0YW5jZSBmcm9tIEJ5ekNvaW5cbiAgICAgKiBAcGFyYW0gYmMgICAgVGhlIFJQQyB0byB1c2VcbiAgICAgKiBAcGFyYW0gaWlkICAgVGhlIGluc3RhbmNlIElEXG4gICAgICogQHJldHVybnMgYSBwcm9taXNlIHRoYXQgcmVzb2x2ZXMgd2l0aCB0aGUgY29pbiBpbnN0YW5jZVxuICAgICAqL1xuICAgIHN0YXRpYyBhc3luYyBmcm9tQnl6Y29pbihiYzogQnl6Q29pblJQQywgaWlkOiBJbnN0YW5jZUlELCB3YWl0TWF0Y2g6IG51bWJlciA9IDAsIGludGVydmFsOiBudW1iZXIgPSAxMDAwKTpcbiAgICAgICAgUHJvbWlzZTxDYWx5cHNvV3JpdGVJbnN0YW5jZT4ge1xuICAgICAgICByZXR1cm4gbmV3IENhbHlwc29Xcml0ZUluc3RhbmNlKGJjLCBhd2FpdCBJbnN0YW5jZS5mcm9tQnl6Y29pbihiYywgaWlkLCB3YWl0TWF0Y2gsIGludGVydmFsKSk7XG4gICAgfVxuICAgIHdyaXRlOiBXcml0ZTtcblxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgcnBjOiBCeXpDb2luUlBDLCBpbnN0OiBJbnN0YW5jZSkge1xuICAgICAgICBzdXBlcihpbnN0KTtcbiAgICAgICAgaWYgKGluc3QuY29udHJhY3RJRC50b1N0cmluZygpICE9PSBDYWx5cHNvV3JpdGVJbnN0YW5jZS5jb250cmFjdElEKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYG1pc21hdGNoIGNvbnRyYWN0IG5hbWU6ICR7aW5zdC5jb250cmFjdElEfSB2cyAke0NhbHlwc29Xcml0ZUluc3RhbmNlLmNvbnRyYWN0SUR9YCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLndyaXRlID0gV3JpdGUuZGVjb2RlKGluc3QuZGF0YSk7XG4gICAgfVxuXG4gICAgYXN5bmMgc3Bhd25SZWFkKHB1YjogUG9pbnQsIHNpZ25lcnM6IFNpZ25lcltdLCBjb2luPzogQ29pbkluc3RhbmNlLCBjb2luU2lnbmVycz86IFNpZ25lcltdKTpcbiAgICAgICAgUHJvbWlzZTxDYWx5cHNvUmVhZEluc3RhbmNlPiB7XG4gICAgICAgIGlmICh0aGlzLndyaXRlLmNvc3QgJiYgKCFjb2luIHx8ICFjb2luU2lnbmVycykpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcInNwYXduaW5nIGEgcmVhZCBpbnN0YW5jZSBjb3N0cyBjb2luc1wiKTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgcGF5OiBJbnN0cnVjdGlvbjtcbiAgICAgICAgaWYgKGNvaW4gJiYgY29pblNpZ25lcnMpIHtcbiAgICAgICAgICAgIHBheSA9IEluc3RydWN0aW9uLmNyZWF0ZUludm9rZShjb2luLmlkLCBDb2luSW5zdGFuY2UuY29udHJhY3RJRCwgQ29pbkluc3RhbmNlLmNvbW1hbmRGZXRjaCwgW1xuICAgICAgICAgICAgICAgIG5ldyBBcmd1bWVudCh7bmFtZTogQ29pbkluc3RhbmNlLmFyZ3VtZW50Q29pbnMsIHZhbHVlOiBCdWZmZXIuZnJvbSh0aGlzLndyaXRlLmNvc3QudmFsdWUudG9CeXRlc0xFKCkpfSksXG4gICAgICAgICAgICBdKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gQ2FseXBzb1JlYWRJbnN0YW5jZS5zcGF3bih0aGlzLnJwYywgdGhpcy5pZCwgcHViLCBzaWduZXJzLCBwYXkpO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIENhbHlwc29SZWFkSW5zdGFuY2UgZXh0ZW5kcyBJbnN0YW5jZSB7XG4gICAgc3RhdGljIHJlYWRvbmx5IGNvbnRyYWN0SUQgPSBcImNhbHlwc29SZWFkXCI7XG4gICAgc3RhdGljIHJlYWRvbmx5IGFyZ3VtZW50UmVhZCA9IFwicmVhZFwiO1xuXG4gICAgc3RhdGljIGFzeW5jIHNwYXduKGJjOiBCeXpDb2luUlBDLCB3cml0ZUlkOiBJbnN0YW5jZUlELCBwdWI6IFBvaW50LCBzaWduZXJzOiBTaWduZXJbXSwgcGF5PzogSW5zdHJ1Y3Rpb24pOlxuICAgICAgICBQcm9taXNlPENhbHlwc29SZWFkSW5zdGFuY2U+IHtcbiAgICAgICAgY29uc3QgcmVhZCA9IG5ldyBSZWFkKHt3cml0ZTogd3JpdGVJZCwgeGM6IHB1Yi5tYXJzaGFsQmluYXJ5KCl9KTtcbiAgICAgICAgY29uc3QgY3R4ID0gbmV3IENsaWVudFRyYW5zYWN0aW9uKHtcbiAgICAgICAgICAgIGluc3RydWN0aW9uczogW1xuICAgICAgICAgICAgICAgIEluc3RydWN0aW9uLmNyZWF0ZVNwYXduKHdyaXRlSWQsIENhbHlwc29SZWFkSW5zdGFuY2UuY29udHJhY3RJRCwgW1xuICAgICAgICAgICAgICAgICAgICBuZXcgQXJndW1lbnQoe25hbWU6IENhbHlwc29SZWFkSW5zdGFuY2UuYXJndW1lbnRSZWFkLFxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IEJ1ZmZlci5mcm9tKFJlYWQuZW5jb2RlKHJlYWQpLmZpbmlzaCgpKX0pLFxuICAgICAgICAgICAgICAgIF0pLFxuICAgICAgICAgICAgXSxcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IGN0eFNpZ25lcnMgPSBbc2lnbmVyc107XG4gICAgICAgIGlmIChwYXkpIHtcbiAgICAgICAgICAgIGN0eC5pbnN0cnVjdGlvbnMudW5zaGlmdChwYXkpO1xuICAgICAgICAgICAgY3R4U2lnbmVycy51bnNoaWZ0KHNpZ25lcnMpO1xuICAgICAgICB9XG4gICAgICAgIGF3YWl0IGN0eC51cGRhdGVDb3VudGVyc0FuZFNpZ24oYmMsIGN0eFNpZ25lcnMpO1xuICAgICAgICBhd2FpdCBiYy5zZW5kVHJhbnNhY3Rpb25BbmRXYWl0KGN0eCk7XG5cbiAgICAgICAgcmV0dXJuIENhbHlwc29SZWFkSW5zdGFuY2UuZnJvbUJ5emNvaW4oYmMsIGN0eC5pbnN0cnVjdGlvbnNbY3R4Lmluc3RydWN0aW9ucy5sZW5ndGggLSAxXS5kZXJpdmVJZCgpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBJbml0aWFsaXplcyB1c2luZyBhbiBleGlzdGluZyBDYWx5cHNvUmVhZEluc3RhbmNlIGZyb20gQnl6Q29pblxuICAgICAqIEBwYXJhbSBiYyAgICBUaGUgUlBDIHRvIHVzZVxuICAgICAqIEBwYXJhbSBpaWQgICBUaGUgaW5zdGFuY2UgSURcbiAgICAgKiBAcmV0dXJucyBhIHByb21pc2UgdGhhdCByZXNvbHZlcyB3aXRoIHRoZSBjb2luIGluc3RhbmNlXG4gICAgICovXG4gICAgc3RhdGljIGFzeW5jIGZyb21CeXpjb2luKGJjOiBCeXpDb2luUlBDLCBpaWQ6IEluc3RhbmNlSUQpOiBQcm9taXNlPENhbHlwc29SZWFkSW5zdGFuY2U+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBDYWx5cHNvUmVhZEluc3RhbmNlKGJjLCBhd2FpdCBJbnN0YW5jZS5mcm9tQnl6Y29pbihiYywgaWlkKSk7XG4gICAgfVxuICAgIHJlYWQ6IFJlYWQ7XG5cbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJwYzogQnl6Q29pblJQQywgaW5zdDogSW5zdGFuY2UpIHtcbiAgICAgICAgc3VwZXIoaW5zdCk7XG4gICAgICAgIGlmIChpbnN0LmNvbnRyYWN0SUQudG9TdHJpbmcoKSAhPT0gQ2FseXBzb1JlYWRJbnN0YW5jZS5jb250cmFjdElEKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYG1pc21hdGNoIGNvbnRyYWN0IG5hbWU6ICR7aW5zdC5jb250cmFjdElEfSB2cyAke0NhbHlwc29SZWFkSW5zdGFuY2UuY29udHJhY3RJRH1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMucmVhZCA9IFJlYWQuZGVjb2RlKGluc3QuZGF0YSk7XG4gICAgfVxuXG4gICAgYXN5bmMgZGVjcnlwdChvY3M6IE9uQ2hhaW5TZWNyZXRSUEMsIHByaXY6IFNjYWxhcik6IFByb21pc2U8QnVmZmVyPiB7XG4gICAgICAgIC8vIE5vdGUgdGhhdCB3ZSBzZW5kIHRoZSBmdWxsIHByb29mIGluIHRoYXQgY2FzZSB0byBpbnN1cmUgdGhlIGNvbm9kZXNcbiAgICAgICAgLy8gY2FuIGVhc2lseSB2ZXJpZnkgdGhlIHByb29mLlxuICAgICAgICBjb25zdCB4aGF0ZW5jID0gYXdhaXQgb2NzLnJlZW5jcnlwdEtleShcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucnBjLmdldFByb29mKHRoaXMucmVhZC53cml0ZSksXG4gICAgICAgICAgICBhd2FpdCB0aGlzLnJwYy5nZXRQcm9vZih0aGlzLmlkKSxcbiAgICAgICAgKTtcbiAgICAgICAgcmV0dXJuIHhoYXRlbmMuZGVjcnlwdChwcml2KTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBXcml0ZSBleHRlbmRzIE1lc3NhZ2U8V3JpdGU+IHtcblxuICAgIC8qKlxuICAgICAqIEBzZWUgUkVBRE1FI01lc3NhZ2UgY2xhc3Nlc1xuICAgICAqL1xuICAgIHN0YXRpYyByZWdpc3RlcigpIHtcbiAgICAgICAgcmVnaXN0ZXJNZXNzYWdlKFwiY2FseXBzby5Xcml0ZVwiLCBXcml0ZSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogY3JlYXRlV3JpdGUgcmV0dXJucyBhIG5ldyB3cml0ZSBzdHJ1Y3R1cmUgdGhhdCBjb250YWlucyBhIHByb29mIGZvciB0aGUgcmVhZC1yZXF1ZXN0XG4gICAgICogd2l0aCByZWdhcmQgdG8gdGhlIExUUy1JRCBhbmQgdGhlIHdyaXRlLURhcmMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gbHRzaWQgdGhlIGxvbmctdGVybS1zZWNyZXQgSUQgdGhhdCBjYW4gcmUtZW5jcnlwdCB0aGUga2V5XG4gICAgICogQHBhcmFtIHdyaXRlRGFyYyBhbGxvd2VkIHRvIGFzayBmb3IgYSByZS1lbmNyeXB0aW9uXG4gICAgICogQHBhcmFtIFggdGhlIGFnZ3JlZ2F0ZSBwdWJsaWMga2V5IHVuZGVyIHdoaWNoIHRoZSBzeW1tZXRyaWMga2V5IHdpbGwgYmUgZW5jcnlwdGVkXG4gICAgICogQHBhcmFtIGtleSB0aGUgc3ltbWV0cmljIGtleSB0byBiZSBlbmNyeXB0ZWRcbiAgICAgKi9cbiAgICBzdGF0aWMgYXN5bmMgY3JlYXRlV3JpdGUobHRzaWQ6IEluc3RhbmNlSUQsIHdyaXRlRGFyYzogSW5zdGFuY2VJRCwgWDogUG9pbnQsIGtleTogQnVmZmVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICByYW5kPzogKGxlbmd0aDogbnVtYmVyKSA9PiBCdWZmZXIpOiBQcm9taXNlPFdyaXRlPiB7XG4gICAgICAgIC8vIHdyIDo9ICZXcml0ZXtMVFNJRDogbHRzaWR9XG4gICAgICAgIGNvbnN0IHdyID0gbmV3IFdyaXRlKCk7XG4gICAgICAgIC8vIHIgOj0gc3VpdGUuU2NhbGFyKCkuUGljayhzdWl0ZS5SYW5kb21TdHJlYW0oKSlcbiAgICAgICAgY29uc3QgciA9IGN1cnZlMjU1MTkuc2NhbGFyKCkucGljayhyYW5kKTtcbiAgICAgICAgLy8gQyA6PSBzdWl0ZS5Qb2ludCgpLk11bChyLCBYKVxuICAgICAgICBjb25zdCBDID0gY3VydmUyNTUxOS5wb2ludCgpLm11bChyLCBYKTtcbiAgICAgICAgLy8gd3IuVSA9IHN1aXRlLlBvaW50KCkuTXVsKHIsIG5pbClcbiAgICAgICAgd3IudSA9IGN1cnZlMjU1MTkucG9pbnQoKS5tdWwocikubWFyc2hhbEJpbmFyeSgpO1xuXG4gICAgICAgIC8vIENyZWF0ZSBwcm9vZlxuICAgICAgICAvLyBpZiBsZW4oa2V5KSA+IHN1aXRlLlBvaW50KCkuRW1iZWRMZW4oKSB7XG4gICAgICAgIC8vIFx0cmV0dXJuIG5pbFxuICAgICAgICAvLyB9XG4gICAgICAgIGlmIChrZXkubGVuZ3RoID4gY3VydmUyNTUxOS5wb2ludCgpLmVtYmVkTGVuKCkpIHtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChcImtleSBpcyB0b28gbG9uZ1wiKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBrcCA6PSBzdWl0ZS5Qb2ludCgpLkVtYmVkKGtleSwgc3VpdGUuUmFuZG9tU3RyZWFtKCkpXG4gICAgICAgIGNvbnN0IGtwID0gY3VydmUyNTUxOS5wb2ludCgpLmVtYmVkKGtleSwgcmFuZCk7XG4gICAgICAgIC8vIHdyLkMgPSBzdWl0ZS5Qb2ludCgpLkFkZChDLCBrcClcbiAgICAgICAgd3IuYyA9IGN1cnZlMjU1MTkucG9pbnQoKS5hZGQoQywga3ApLm1hcnNoYWxCaW5hcnkoKTtcblxuICAgICAgICAvLyBnQmFyIDo9IHN1aXRlLlBvaW50KCkuRW1iZWQobHRzaWQuU2xpY2UoKSwga2VjY2FrLk5ldyhsdHNpZC5TbGljZSgpKSlcbiAgICAgICAgY29uc3QgayA9IG5ldyBLZWNjYWsoXCJzaGFrZTI1NlwiKTtcbiAgICAgICAgay51cGRhdGUobHRzaWQpO1xuICAgICAgICBjb25zdCBnQmFyID0gY3VydmUyNTUxOS5wb2ludCgpLmVtYmVkKEJ1ZmZlci5mcm9tKGx0c2lkLnN1YmFycmF5KDAsIGN1cnZlMjU1MTkucG9pbnQoKS5lbWJlZExlbigpKSksXG4gICAgICAgICAgICAobCkgPT4gay5zcXVlZXplKGwpKTtcbiAgICAgICAgLy8gd3IuVWJhciA9IHN1aXRlLlBvaW50KCkuTXVsKHIsIGdCYXIpXG4gICAgICAgIHdyLnViYXIgPSBjdXJ2ZTI1NTE5LnBvaW50KCkubXVsKHIsIGdCYXIpLm1hcnNoYWxCaW5hcnkoKTtcbiAgICAgICAgLy8gcyA6PSBzdWl0ZS5TY2FsYXIoKS5QaWNrKHN1aXRlLlJhbmRvbVN0cmVhbSgpKVxuICAgICAgICBjb25zdCBzID0gY3VydmUyNTUxOS5zY2FsYXIoKS5waWNrKHJhbmQpO1xuICAgICAgICAvLyB3IDo9IHN1aXRlLlBvaW50KCkuTXVsKHMsIG5pbClcbiAgICAgICAgY29uc3QgdyA9IGN1cnZlMjU1MTkucG9pbnQoKS5tdWwocyk7XG4gICAgICAgIC8vIHdCYXIgOj0gc3VpdGUuUG9pbnQoKS5NdWwocywgZ0JhcilcbiAgICAgICAgY29uc3Qgd0JhciA9IGN1cnZlMjU1MTkucG9pbnQoKS5tdWwocywgZ0Jhcik7XG5cbiAgICAgICAgLy8gaGFzaCA6PSBzaGEyNTYuTmV3KClcbiAgICAgICAgY29uc3QgaGFzaCA9IGNyZWF0ZUhhc2goXCJzaGEyNTZcIik7XG4gICAgICAgIC8vIHdyLkMuTWFyc2hhbFRvKGhhc2gpXG4gICAgICAgIGhhc2gudXBkYXRlKHdyLmMpO1xuICAgICAgICAvLyB3ci5VLk1hcnNoYWxUbyhoYXNoKVxuICAgICAgICBoYXNoLnVwZGF0ZSh3ci51KTtcbiAgICAgICAgLy8gd3IuVWJhci5NYXJzaGFsVG8oaGFzaClcbiAgICAgICAgaGFzaC51cGRhdGUod3IudWJhcik7XG4gICAgICAgIC8vIHcuTWFyc2hhbFRvKGhhc2gpXG4gICAgICAgIGhhc2gudXBkYXRlKHcubWFyc2hhbEJpbmFyeSgpKTtcbiAgICAgICAgLy8gd0Jhci5NYXJzaGFsVG8oaGFzaClcbiAgICAgICAgaGFzaC51cGRhdGUod0Jhci5tYXJzaGFsQmluYXJ5KCkpO1xuICAgICAgICAvLyBoYXNoLldyaXRlKHdyaXRlRGFyYylcbiAgICAgICAgaGFzaC51cGRhdGUod3JpdGVEYXJjKTtcbiAgICAgICAgLy8gd3IuRSA9IHN1aXRlLlNjYWxhcigpLlNldEJ5dGVzKGhhc2guU3VtKG5pbCkpXG4gICAgICAgIGNvbnN0IEUgPSBjdXJ2ZTI1NTE5LnNjYWxhcigpLnNldEJ5dGVzKGhhc2guZGlnZXN0KCkpO1xuICAgICAgICB3ci5lID0gRS5tYXJzaGFsQmluYXJ5KCk7XG4gICAgICAgIC8vIHdyLkYgPSBzdWl0ZS5TY2FsYXIoKS5BZGQocywgc3VpdGUuU2NhbGFyKCkuTXVsKHdyLkUsIHIpKVxuICAgICAgICB3ci5mID0gY3VydmUyNTUxOS5zY2FsYXIoKS5hZGQocywgY3VydmUyNTUxOS5zY2FsYXIoKS5tdWwoRSwgcikpLm1hcnNoYWxCaW5hcnkoKTtcbiAgICAgICAgd3IubHRzaWQgPSBsdHNpZDtcbiAgICAgICAgcmV0dXJuIHdyO1xuICAgIH1cbiAgICAvLyBpbiBVIGFuZCBDXG4gICAgZGF0YTogQnVmZmVyO1xuICAgIC8vIFUgaXMgdGhlIGVuY3J5cHRlZCByYW5kb20gdmFsdWUgZm9yIHRoZSBFbEdhbWFsIGVuY3J5cHRpb25cbiAgICB1OiBCdWZmZXI7XG5cbiAgICAvLyBEYXRhIHNob3VsZCBiZSBlbmNyeXB0ZWQgYnkgdGhlIGFwcGxpY2F0aW9uIHVuZGVyIHRoZSBzeW1tZXRyaWMga2V5XG4gICAgLy8gVWJhciBpcyB1c2VkIGZvciB0aGUgbG9nLWVxdWFsaXR5IHByb29mXG4gICAgdWJhcjogQnVmZmVyO1xuICAgIC8vIEUgaXMgdGhlIG5vbi1pbnRlcmFjdGl2ZSBjaGFsbGVuZ2UgYXMgc2NhbGFyXG4gICAgZTogQnVmZmVyO1xuICAgIC8vIFViYXIsIEUgYW5kIGYgd2lsbCBiZSB1c2VkIGJ5IHRoZSBzZXJ2ZXIgdG8gdmVyaWZ5IHRoZSB3cml0ZXIgZGlkXG4gICAgLy8gY29ycmVjdGx5IGVuY3J5cHQgdGhlIGtleS4gSXQgYmluZHMgdGhlIHBvbGljeSAodGhlIGRhcmMpIHdpdGggdGhlXG4gICAgLy8gY3lwaGVydGV4dC5cbiAgICAvLyBmIGlzIHRoZSBwcm9vZlxuICAgIGY6IEJ1ZmZlcjtcbiAgICAvLyBjb250YWluIGFuIElWKVxuICAgIGM6IEJ1ZmZlcjtcbiAgICAvLyBFeHRyYURhdGEgaXMgY2xlYXIgdGV4dCBhbmQgYXBwbGljYXRpb24tc3BlY2lmaWNcbiAgICBleHRyYWRhdGE6IEJ1ZmZlcjtcbiAgICAvLyBDIGlzIHRoZSBFbEdhbWFsIHBhcnRzIGZvciB0aGUgc3ltbWV0cmljIGtleSBtYXRlcmlhbCAobWlnaHQgYWxzb1xuICAgIC8vIExUU0lEIHBvaW50cyB0byB0aGUgaWRlbnRpdHkgb2YgdGhlIGx0cyBncm91cFxuICAgIGx0c2lkOiBJbnN0YW5jZUlEO1xuICAgIC8vIENvc3QgcmVmbGVjdHMgaG93IG1hbnkgY29pbnMgeW91J2xsIGhhdmUgdG8gcGF5IGZvciBhIHJlYWQtcmVxdWVzdFxuICAgIGNvc3Q6IENvaW47XG5cbiAgICBjb25zdHJ1Y3Rvcihwcm9wcz86IFByb3BlcnRpZXM8V3JpdGU+KSB7XG4gICAgICAgIHN1cGVyKHByb3BzKTtcbiAgICB9XG5cbiAgICB0b0J5dGVzKCk6IEJ1ZmZlciB7XG4gICAgICAgIHJldHVybiBCdWZmZXIuZnJvbShXcml0ZS5lbmNvZGUodGhpcykuZmluaXNoKCkpO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFJlYWQgZXh0ZW5kcyBNZXNzYWdlPFJlYWQ+IHtcblxuICAgIC8qKlxuICAgICAqIEBzZWUgUkVBRE1FI01lc3NhZ2UgY2xhc3Nlc1xuICAgICAqL1xuICAgIHN0YXRpYyByZWdpc3RlcigpIHtcbiAgICAgICAgcmVnaXN0ZXJNZXNzYWdlKFwiY2FseXBzby5SZWFkXCIsIFJlYWQpO1xuICAgIH1cbiAgICB3cml0ZTogQnVmZmVyO1xuICAgIHhjOiBCdWZmZXI7XG5cbiAgICBjb25zdHJ1Y3Rvcihwcm9wcz86IFByb3BlcnRpZXM8UmVhZD4pIHtcbiAgICAgICAgc3VwZXIocHJvcHMpO1xuICAgIH1cblxuICAgIHRvQnl0ZXMoKTogQnVmZmVyIHtcbiAgICAgICAgcmV0dXJuIEJ1ZmZlci5mcm9tKFJlYWQuZW5jb2RlKHRoaXMpLmZpbmlzaCgpKTtcbiAgICB9XG59XG5cbi8vIERlY29kZUtleSBjYW4gYmUgdXNlZCBieSB0aGUgcmVhZGVyIG9mIEJ5ekNvaW4gdG8gY29udmVydCB0aGVcbi8vIHJlLWVuY3J5cHRlZCBzZWNyZXQgYmFjayB0byBhIHN5bW1ldHJpYyBrZXkgdGhhdCBjYW4gYmUgdXNlZCBsYXRlciB0byBkZWNvZGVcbi8vIHRoZSBkb2N1bWVudC5cbi8vXG4vLyBJbnB1dDpcbi8vICAgLSBzdWl0ZSAtIHRoZSBjcnlwdG9ncmFwaGljIHN1aXRlIHRvIHVzZVxuLy8gICAtIFggLSB0aGUgYWdncmVnYXRlIHB1YmxpYyBrZXkgb2YgdGhlIERLR1xuLy8gICAtIEMgLSB0aGUgZW5jcnlwdGVkIGtleVxuLy8gICAtIFhoYXRFbmMgLSB0aGUgcmUtZW5jcnlwdGVkIHNjaG5vcnItY29tbWl0XG4vLyAgIC0geGMgLSB0aGUgcHJpdmF0ZSBrZXkgb2YgdGhlIHJlYWRlclxuLy9cbi8vIE91dHB1dDpcbi8vICAgLSBrZXkgLSB0aGUgcmUtYXNzZW1ibGVkIGtleVxuLy8gICAtIGVyciAtIGFuIGV2ZW50dWFsIGVycm9yIHdoZW4gdHJ5aW5nIHRvIHJlY292ZXIgdGhlIGRhdGEgZnJvbSB0aGUgcG9pbnRzXG4vLyBmdW5jIERlY29kZUtleShzdWl0ZSBreWJlci5Hcm91cCwgWCBreWJlci5Qb2ludCwgQyBreWJlci5Qb2ludCwgWGhhdEVuYyBreWJlci5Qb2ludCxcbi8vIFx0eGMga3liZXIuU2NhbGFyKSAoa2V5IFtdYnl0ZSwgZXJyIGVycm9yKSB7XG4vKiB0c2xpbnQ6ZGlzYWJsZTogdmFyaWFibGUtbmFtZSAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIERlY29kZUtleShYOiBQb2ludCwgQzogUG9pbnQsIFhoYXRFbmM6IFBvaW50LCBwcml2OiBTY2FsYXIpOiBQcm9taXNlPEJ1ZmZlcj4ge1xuICAgIC8vIFx0eGNJbnYgOj0gc3VpdGUuU2NhbGFyKCkuTmVnKHhjKVxuICAgIGNvbnN0IHhjSW52ID0gY3VydmUyNTUxOS5zY2FsYXIoKS5uZWcocHJpdik7XG4gICAgLy8gXHRYaGF0RGVjIDo9IHN1aXRlLlBvaW50KCkuTXVsKHhjSW52LCBYKVxuICAgIGNvbnN0IFhoYXREZWMgPSBjdXJ2ZTI1NTE5LnBvaW50KCkubXVsKHhjSW52LCBYKTtcbiAgICAvLyBcdFhoYXQgOj0gc3VpdGUuUG9pbnQoKS5BZGQoWGhhdEVuYywgWGhhdERlYylcbiAgICBjb25zdCBYaGF0ID0gY3VydmUyNTUxOS5wb2ludCgpLmFkZChYaGF0RW5jLCBYaGF0RGVjKTtcbiAgICAvLyBcdFhoYXRJbnYgOj0gc3VpdGUuUG9pbnQoKS5OZWcoWGhhdClcbiAgICBjb25zdCBYaGF0SW52ID0gY3VydmUyNTUxOS5wb2ludCgpLm5lZyhYaGF0KTtcblxuICAgIC8vIERlY3J5cHQgQyB0byBrZXlQb2ludEhhdFxuICAgIC8vIFx0a2V5UG9pbnRIYXQgOj0gc3VpdGUuUG9pbnQoKS5BZGQoQywgWGhhdEludilcbiAgICBjb25zdCBrZXlQb2ludEhhdCA9IGN1cnZlMjU1MTkucG9pbnQoKS5hZGQoQywgWGhhdEludik7XG4gICAgLy8gXHRrZXksIGVyciA9IGtleVBvaW50SGF0LkRhdGEoKVxuICAgIHJldHVybiBCdWZmZXIuZnJvbShrZXlQb2ludEhhdC5kYXRhKCkpO1xufVxuXG5Xcml0ZS5yZWdpc3RlcigpO1xuUmVhZC5yZWdpc3RlcigpO1xuIl19