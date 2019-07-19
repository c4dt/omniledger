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
Object.defineProperty(exports, "__esModule", { value: true });
var kyber_1 = require("@dedis/kyber");
var protobufjs_1 = require("protobufjs");
var byzcoin_1 = require("../byzcoin");
var connection_1 = require("../network/connection");
var protobuf_1 = require("../protobuf");
var calypso_instance_1 = require("./calypso-instance");
/**
 * OnChainSecretRPC is used to contact the OnChainSecret service of the cothority.
 * With it you can set up a new long-term onchain-secret, give it a policy to accept
 * new requests, and ask for re-encryption requests.
 */
var OnChainSecretRPC = /** @class */ (function () {
    function OnChainSecretRPC(bc, roster) {
        this.bc = bc;
        this.socket = new connection_1.RosterWSConnection(bc.getConfig().roster, OnChainSecretRPC.serviceID);
        if (roster) {
            this.list = roster.list;
        }
        else {
            this.list = this.bc.getConfig().roster.list;
        }
    }
    // CreateLTS creates a random LTSID that can be used to reference the LTS group
    // created. It first sends a transaction to ByzCoin to spawn a LTS instance,
    // then it asks the Calypso cothority to start the DKG.
    OnChainSecretRPC.prototype.createLTS = function (r, darcID, signers) {
        return __awaiter(this, void 0, void 0, function () {
            var buf, ctx, p;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        buf = Buffer.from(LtsInstanceInfo.encode(new LtsInstanceInfo({ roster: r })).finish());
                        ctx = new byzcoin_1.ClientTransaction({
                            instructions: [
                                byzcoin_1.Instruction.createSpawn(darcID, calypso_instance_1.OnChainSecretInstance.contractID, [
                                    new byzcoin_1.Argument({ name: "lts_instance_info", value: buf }),
                                ]),
                            ],
                        });
                        return [4 /*yield*/, ctx.updateCountersAndSign(this.bc, [signers])];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.bc.sendTransactionAndWait(ctx)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, this.bc.getProof(ctx.instructions[0].deriveId())];
                    case 3:
                        p = _a.sent();
                        return [2 /*return*/, new connection_1.WebSocketConnection(r.list[0].getWebSocketAddress(), OnChainSecretRPC.serviceID)
                                .send(new CreateLTS({ proof: p }), CreateLTSReply)];
                }
            });
        });
    };
    // authorize adds a ByzCoinID to the list of authorized IDs for each
    // server in the roster. The authorize endpoint refuses requests
    // that do not come from localhost for security reasons.
    //
    // It should be called by the administrator at the beginning, before any other
    // API calls are made. A ByzCoinID that is not authorized will not be allowed to
    // call the other APIs.
    OnChainSecretRPC.prototype.authorize = function (who, bcid) {
        return __awaiter(this, void 0, void 0, function () {
            var sock;
            return __generator(this, function (_a) {
                sock = new connection_1.WebSocketConnection(who.getWebSocketAddress(), OnChainSecretRPC.serviceID);
                return [2 /*return*/, sock.send(new Authorize({ byzcoinid: bcid }), AuthorizeReply)];
            });
        });
    };
    /**
     * authorizeRoster is a convenience method that authorizes all nodes in the bc-roster
     * to create new LTS. For this to work, the nodes must have been started with
     * COTHORITY_ALLOW_INSECURE_ADMIN=true
     *
     * @param roster if given, this roster is used instead of the bc-roster
     */
    OnChainSecretRPC.prototype.authorizeRoster = function (roster) {
        return __awaiter(this, void 0, void 0, function () {
            var _i, _a, node;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!roster) {
                            roster = this.bc.getConfig().roster;
                        }
                        _i = 0, _a = roster.list;
                        _b.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 4];
                        node = _a[_i];
                        return [4 /*yield*/, this.authorize(node, this.bc.genesisID)];
                    case 2:
                        _b.sent();
                        _b.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    // reencryptKey takes as input Read- and Write- Proofs. It verifies that
    // the read/write requests match and then re-encrypts the secret
    // given the public key information of the reader.
    OnChainSecretRPC.prototype.reencryptKey = function (write, read) {
        return __awaiter(this, void 0, void 0, function () {
            var sock;
            return __generator(this, function (_a) {
                sock = new connection_1.WebSocketConnection(this.list[0].getWebSocketAddress(), OnChainSecretRPC.serviceID);
                return [2 /*return*/, sock.send(new DecryptKey({ read: read, write: write }), DecryptKeyReply)];
            });
        });
    };
    OnChainSecretRPC.serviceID = "Calypso";
    return OnChainSecretRPC;
}());
exports.OnChainSecretRPC = OnChainSecretRPC;
/**
 * LongTermSecret extends the OnChainSecretRPC and also holds the id and the X.
 */
var LongTermSecret = /** @class */ (function (_super) {
    __extends(LongTermSecret, _super);
    function LongTermSecret(bc, id, X, roster) {
        var _this = _super.call(this, bc, roster) || this;
        _this.id = id;
        _this.X = X;
        return _this;
    }
    /**
     * spawn creates a new longtermsecret by spawning a longTermSecret instance, and then performing
     * a DKG using the full roster of bc.
     *
     * @param bc a valid ByzCoin instance
     * @param darcID id of a darc allowed to spawn longTermSecret
     * @param signers needed to authenticate longTermSecret spawns
     * @param roster if given, the roster for the DKG, if null, the full roster of bc will be used
     */
    LongTermSecret.spawn = function (bc, darcID, signers, roster) {
        return __awaiter(this, void 0, void 0, function () {
            var ocs, lr;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!roster) {
                            roster = bc.getConfig().roster;
                        }
                        ocs = new OnChainSecretRPC(bc);
                        return [4 /*yield*/, ocs.authorizeRoster(roster)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, ocs.createLTS(roster, darcID, signers)];
                    case 2:
                        lr = _a.sent();
                        return [2 /*return*/, new LongTermSecret(bc, lr.instanceid, lr.X, roster)];
                }
            });
        });
    };
    return LongTermSecret;
}(OnChainSecretRPC));
exports.LongTermSecret = LongTermSecret;
/**
 * Authorize is used to add the given ByzCoinID into the list of authorized IDs.
 */
var Authorize = /** @class */ (function (_super) {
    __extends(Authorize, _super);
    function Authorize(props) {
        return _super.call(this, props) || this;
    }
    /**
     * @see README#Message classes
     */
    Authorize.register = function () {
        protobuf_1.registerMessage("Authorize", Authorize);
    };
    return Authorize;
}(protobufjs_1.Message));
exports.Authorize = Authorize;
/**
 * AuthorizeReply is returned upon successful authorisation.
 */
var AuthorizeReply = /** @class */ (function (_super) {
    __extends(AuthorizeReply, _super);
    function AuthorizeReply() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * @see README#Message classes
     */
    AuthorizeReply.register = function () {
        protobuf_1.registerMessage("AuthorizeReply", AuthorizeReply);
    };
    return AuthorizeReply;
}(protobufjs_1.Message));
exports.AuthorizeReply = AuthorizeReply;
//
/**
 * CreateLTS is used to start a DKG and store the private keys in each node.
 * Prior to using this request, the Calypso roster must be recorded on the
 * ByzCoin blockchain in the instance specified by InstanceID.
 */
var CreateLTS = /** @class */ (function (_super) {
    __extends(CreateLTS, _super);
    function CreateLTS(props) {
        return _super.call(this, props) || this;
    }
    /**
     * @see README#Message classes
     */
    CreateLTS.register = function () {
        protobuf_1.registerMessage("CreateLTS", CreateLTS);
    };
    return CreateLTS;
}(protobufjs_1.Message));
exports.CreateLTS = CreateLTS;
/**
 * CreateLTSReply is returned upon successfully setting up the distributed
 * key.
 */
var CreateLTSReply = /** @class */ (function (_super) {
    __extends(CreateLTSReply, _super);
    function CreateLTSReply() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(CreateLTSReply.prototype, "X", {
        get: function () {
            return kyber_1.PointFactory.fromProto(this.x);
        },
        enumerable: true,
        configurable: true
    });
    /**
     * @see README#Message classes
     */
    CreateLTSReply.register = function () {
        protobuf_1.registerMessage("CreateLTSReply", CreateLTSReply);
    };
    return CreateLTSReply;
}(protobufjs_1.Message));
exports.CreateLTSReply = CreateLTSReply;
/**
 * DecryptKey is sent by a reader after he successfully stored a 'Read' request
 * in byzcoin Client.
 */
var DecryptKey = /** @class */ (function (_super) {
    __extends(DecryptKey, _super);
    function DecryptKey(props) {
        return _super.call(this, props) || this;
    }
    /**
     * @see README#Message classes
     */
    DecryptKey.register = function () {
        protobuf_1.registerMessage("DecryptKey", DecryptKey);
    };
    return DecryptKey;
}(protobufjs_1.Message));
exports.DecryptKey = DecryptKey;
/**
 * DecryptKeyReply is returned if the service verified successfully that the
 * decryption request is valid.
 */
var DecryptKeyReply = /** @class */ (function (_super) {
    __extends(DecryptKeyReply, _super);
    function DecryptKeyReply() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * @see README#Message classes
     */
    DecryptKeyReply.register = function () {
        protobuf_1.registerMessage("DecryptKeyReply", DecryptKeyReply);
    };
    DecryptKeyReply.prototype.decrypt = function (priv) {
        return __awaiter(this, void 0, void 0, function () {
            var X, C, XhatEnc;
            return __generator(this, function (_a) {
                X = kyber_1.PointFactory.fromProto(this.x);
                C = kyber_1.PointFactory.fromProto(this.c);
                XhatEnc = kyber_1.PointFactory.fromProto(this.xhatenc);
                return [2 /*return*/, calypso_instance_1.DecodeKey(X, C, XhatEnc, priv)];
            });
        });
    };
    return DecryptKeyReply;
}(protobufjs_1.Message));
exports.DecryptKeyReply = DecryptKeyReply;
/**
 * LtsInstanceInfo is the information stored in an LTS instance.
 */
var LtsInstanceInfo = /** @class */ (function (_super) {
    __extends(LtsInstanceInfo, _super);
    function LtsInstanceInfo(props) {
        return _super.call(this, props) || this;
    }
    /**
     * @see README#Message classes
     */
    LtsInstanceInfo.register = function () {
        protobuf_1.registerMessage("LtsInstanceInfo", LtsInstanceInfo);
    };
    return LtsInstanceInfo;
}(protobufjs_1.Message));
exports.LtsInstanceInfo = LtsInstanceInfo;
Authorize.register();
AuthorizeReply.register();
CreateLTS.register();
CreateLTSReply.register();
DecryptKey.register();
DecryptKeyReply.register();
LtsInstanceInfo.register();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FseXBzby1ycGMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJjYWx5cHNvLXJwYy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLHNDQUEyRDtBQUMzRCx5Q0FBaUQ7QUFDakQsc0NBQXlGO0FBS3pGLG9EQUE2RjtBQUM3Rix3Q0FBOEM7QUFDOUMsdURBQXNFO0FBRXRFOzs7O0dBSUc7QUFDSDtJQUtJLDBCQUFtQixFQUFjLEVBQUUsTUFBZTtRQUEvQixPQUFFLEdBQUYsRUFBRSxDQUFZO1FBQzdCLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSwrQkFBa0IsQ0FBQyxFQUFFLENBQUMsU0FBUyxFQUFFLENBQUMsTUFBTSxFQUFFLGdCQUFnQixDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3hGLElBQUksTUFBTSxFQUFFO1lBQ1IsSUFBSSxDQUFDLElBQUksR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDO1NBQzNCO2FBQU07WUFDSCxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsU0FBUyxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQztTQUMvQztJQUNMLENBQUM7SUFFRCwrRUFBK0U7SUFDL0UsNEVBQTRFO0lBQzVFLHVEQUF1RDtJQUNqRCxvQ0FBUyxHQUFmLFVBQWdCLENBQVMsRUFBRSxNQUFrQixFQUFFLE9BQWlCOzs7Ozs7d0JBQ3RELEdBQUcsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsSUFBSSxlQUFlLENBQUMsRUFBQyxNQUFNLEVBQUUsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7d0JBQ3JGLEdBQUcsR0FBRyxJQUFJLDJCQUFpQixDQUFDOzRCQUM5QixZQUFZLEVBQUU7Z0NBQ1YscUJBQVcsQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLHdDQUFxQixDQUFDLFVBQVUsRUFBRTtvQ0FDOUQsSUFBSSxrQkFBUSxDQUFDLEVBQUMsSUFBSSxFQUFFLG1CQUFtQixFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUMsQ0FBQztpQ0FDeEQsQ0FBQzs2QkFDTDt5QkFDSixDQUFDLENBQUM7d0JBQ0gscUJBQU0sR0FBRyxDQUFDLHFCQUFxQixDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFBOzt3QkFBbkQsU0FBbUQsQ0FBQzt3QkFDcEQscUJBQU0sSUFBSSxDQUFDLEVBQUUsQ0FBQyxzQkFBc0IsQ0FBQyxHQUFHLENBQUMsRUFBQTs7d0JBQXpDLFNBQXlDLENBQUM7d0JBRWhDLHFCQUFNLElBQUksQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUMsRUFBQTs7d0JBQTFELENBQUMsR0FBRyxTQUFzRDt3QkFFaEUsc0JBQU8sSUFBSSxnQ0FBbUIsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLG1CQUFtQixFQUFFLEVBQUUsZ0JBQWdCLENBQUMsU0FBUyxDQUFDO2lDQUN0RixJQUFJLENBQUMsSUFBSSxTQUFTLENBQUMsRUFBQyxLQUFLLEVBQUUsQ0FBQyxFQUFDLENBQUMsRUFBRSxjQUFjLENBQUMsRUFBQzs7OztLQUN4RDtJQUVELG9FQUFvRTtJQUNwRSxnRUFBZ0U7SUFDaEUsd0RBQXdEO0lBQ3hELEVBQUU7SUFDRiw4RUFBOEU7SUFDOUUsZ0ZBQWdGO0lBQ2hGLHVCQUF1QjtJQUNqQixvQ0FBUyxHQUFmLFVBQWdCLEdBQW1CLEVBQUUsSUFBZ0I7Ozs7Z0JBQzNDLElBQUksR0FBRyxJQUFJLGdDQUFtQixDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsRUFBRSxFQUFFLGdCQUFnQixDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUM1RixzQkFBTyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksU0FBUyxDQUFDLEVBQUMsU0FBUyxFQUFFLElBQUksRUFBQyxDQUFDLEVBQUUsY0FBYyxDQUFDLEVBQUM7OztLQUN0RTtJQUVEOzs7Ozs7T0FNRztJQUNHLDBDQUFlLEdBQXJCLFVBQXNCLE1BQWU7Ozs7Ozt3QkFDakMsSUFBSSxDQUFDLE1BQU0sRUFBRTs0QkFDVCxNQUFNLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxNQUFNLENBQUM7eUJBQ3ZDOzhCQUM2QixFQUFYLEtBQUEsTUFBTSxDQUFDLElBQUk7Ozs2QkFBWCxDQUFBLGNBQVcsQ0FBQTt3QkFBbkIsSUFBSTt3QkFDWCxxQkFBTSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxFQUFBOzt3QkFBN0MsU0FBNkMsQ0FBQzs7O3dCQUQvQixJQUFXLENBQUE7Ozs7OztLQUdqQztJQUVELHdFQUF3RTtJQUN4RSxnRUFBZ0U7SUFDaEUsa0RBQWtEO0lBQzVDLHVDQUFZLEdBQWxCLFVBQW1CLEtBQVksRUFBRSxJQUFXOzs7O2dCQUNsQyxJQUFJLEdBQUcsSUFBSSxnQ0FBbUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLG1CQUFtQixFQUFFLEVBQUUsZ0JBQWdCLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBQ3JHLHNCQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxVQUFVLENBQUMsRUFBQyxJQUFJLE1BQUEsRUFBRSxLQUFLLE9BQUEsRUFBQyxDQUFDLEVBQUUsZUFBZSxDQUFDLEVBQUM7OztLQUNwRTtJQXBFTSwwQkFBUyxHQUFHLFNBQVMsQ0FBQztJQXFFakMsdUJBQUM7Q0FBQSxBQXRFRCxJQXNFQztBQXRFWSw0Q0FBZ0I7QUF3RTdCOztHQUVHO0FBQ0g7SUFBb0Msa0NBQWdCO0lBc0JoRCx3QkFBWSxFQUFjLEVBQVMsRUFBYyxFQUFTLENBQVEsRUFBRSxNQUFlO1FBQW5GLFlBQ0ksa0JBQU0sRUFBRSxFQUFFLE1BQU0sQ0FBQyxTQUNwQjtRQUZrQyxRQUFFLEdBQUYsRUFBRSxDQUFZO1FBQVMsT0FBQyxHQUFELENBQUMsQ0FBTzs7SUFFbEUsQ0FBQztJQXRCRDs7Ozs7Ozs7T0FRRztJQUNVLG9CQUFLLEdBQWxCLFVBQW1CLEVBQWMsRUFBRSxNQUFrQixFQUFFLE9BQWlCLEVBQUUsTUFBZTs7Ozs7O3dCQUVyRixJQUFJLENBQUMsTUFBTSxFQUFFOzRCQUNULE1BQU0sR0FBRyxFQUFFLENBQUMsU0FBUyxFQUFFLENBQUMsTUFBTSxDQUFDO3lCQUNsQzt3QkFDSyxHQUFHLEdBQUcsSUFBSSxnQkFBZ0IsQ0FBQyxFQUFFLENBQUMsQ0FBQzt3QkFDckMscUJBQU0sR0FBRyxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsRUFBQTs7d0JBQWpDLFNBQWlDLENBQUM7d0JBQ3ZCLHFCQUFNLEdBQUcsQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUMsRUFBQTs7d0JBQWpELEVBQUUsR0FBRyxTQUE0Qzt3QkFDdkQsc0JBQU8sSUFBSSxjQUFjLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxVQUFVLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsRUFBQzs7OztLQUM5RDtJQUtMLHFCQUFDO0FBQUQsQ0FBQyxBQXpCRCxDQUFvQyxnQkFBZ0IsR0F5Qm5EO0FBekJZLHdDQUFjO0FBMkIzQjs7R0FFRztBQUNIO0lBQStCLDZCQUFrQjtJQVc3QyxtQkFBWSxLQUE2QjtlQUNyQyxrQkFBTSxLQUFLLENBQUM7SUFDaEIsQ0FBQztJQVhEOztPQUVHO0lBQ0ksa0JBQVEsR0FBZjtRQUNJLDBCQUFlLENBQUMsV0FBVyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQzVDLENBQUM7SUFPTCxnQkFBQztBQUFELENBQUMsQUFkRCxDQUErQixvQkFBTyxHQWNyQztBQWRZLDhCQUFTO0FBZ0J0Qjs7R0FFRztBQUNIO0lBQW9DLGtDQUF1QjtJQUEzRDs7SUFPQSxDQUFDO0lBTkc7O09BRUc7SUFDSSx1QkFBUSxHQUFmO1FBQ0ksMEJBQWUsQ0FBQyxnQkFBZ0IsRUFBRSxjQUFjLENBQUMsQ0FBQztJQUN0RCxDQUFDO0lBQ0wscUJBQUM7QUFBRCxDQUFDLEFBUEQsQ0FBb0Msb0JBQU8sR0FPMUM7QUFQWSx3Q0FBYztBQVMzQixFQUFFO0FBQ0Y7Ozs7R0FJRztBQUNIO0lBQStCLDZCQUFrQjtJQVc3QyxtQkFBWSxLQUE2QjtlQUNyQyxrQkFBTSxLQUFLLENBQUM7SUFDaEIsQ0FBQztJQVhEOztPQUVHO0lBQ0ksa0JBQVEsR0FBZjtRQUNJLDBCQUFlLENBQUMsV0FBVyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQzVDLENBQUM7SUFPTCxnQkFBQztBQUFELENBQUMsQUFkRCxDQUErQixvQkFBTyxHQWNyQztBQWRZLDhCQUFTO0FBZ0J0Qjs7O0dBR0c7QUFDSDtJQUFvQyxrQ0FBdUI7SUFBM0Q7O0lBZ0JBLENBQUM7SUFkRyxzQkFBSSw2QkFBQzthQUFMO1lBQ0ksT0FBTyxvQkFBWSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDMUMsQ0FBQzs7O09BQUE7SUFFRDs7T0FFRztJQUNJLHVCQUFRLEdBQWY7UUFDSSwwQkFBZSxDQUFDLGdCQUFnQixFQUFFLGNBQWMsQ0FBQyxDQUFDO0lBQ3RELENBQUM7SUFLTCxxQkFBQztBQUFELENBQUMsQUFoQkQsQ0FBb0Msb0JBQU8sR0FnQjFDO0FBaEJZLHdDQUFjO0FBa0IzQjs7O0dBR0c7QUFDSDtJQUFnQyw4QkFBbUI7SUFZL0Msb0JBQVksS0FBOEI7ZUFDdEMsa0JBQU0sS0FBSyxDQUFDO0lBQ2hCLENBQUM7SUFaRDs7T0FFRztJQUNJLG1CQUFRLEdBQWY7UUFDSSwwQkFBZSxDQUFDLFlBQVksRUFBRSxVQUFVLENBQUMsQ0FBQztJQUM5QyxDQUFDO0lBUUwsaUJBQUM7QUFBRCxDQUFDLEFBZkQsQ0FBZ0Msb0JBQU8sR0FldEM7QUFmWSxnQ0FBVTtBQWlCdkI7OztHQUdHO0FBQ0g7SUFBcUMsbUNBQXdCO0lBQTdEOztJQW1CQSxDQUFDO0lBakJHOztPQUVHO0lBQ0ksd0JBQVEsR0FBZjtRQUNJLDBCQUFlLENBQUMsaUJBQWlCLEVBQUUsZUFBZSxDQUFDLENBQUM7SUFDeEQsQ0FBQztJQUtLLGlDQUFPLEdBQWIsVUFBYyxJQUFZOzs7O2dCQUNoQixDQUFDLEdBQUcsb0JBQVksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNuQyxDQUFDLEdBQUcsb0JBQVksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUVuQyxPQUFPLEdBQUcsb0JBQVksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUNyRCxzQkFBTyw0QkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxFQUFDOzs7S0FDekM7SUFDTCxzQkFBQztBQUFELENBQUMsQUFuQkQsQ0FBcUMsb0JBQU8sR0FtQjNDO0FBbkJZLDBDQUFlO0FBcUI1Qjs7R0FFRztBQUNIO0lBQXFDLG1DQUF3QjtJQVd6RCx5QkFBWSxLQUFtQztlQUMzQyxrQkFBTSxLQUFLLENBQUM7SUFDaEIsQ0FBQztJQVhEOztPQUVHO0lBQ0ksd0JBQVEsR0FBZjtRQUNJLDBCQUFlLENBQUMsaUJBQWlCLEVBQUUsZUFBZSxDQUFDLENBQUM7SUFDeEQsQ0FBQztJQU9MLHNCQUFDO0FBQUQsQ0FBQyxBQWRELENBQXFDLG9CQUFPLEdBYzNDO0FBZFksMENBQWU7QUFnQjVCLFNBQVMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztBQUNyQixjQUFjLENBQUMsUUFBUSxFQUFFLENBQUM7QUFDMUIsU0FBUyxDQUFDLFFBQVEsRUFBRSxDQUFDO0FBQ3JCLGNBQWMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztBQUMxQixVQUFVLENBQUMsUUFBUSxFQUFFLENBQUM7QUFDdEIsZUFBZSxDQUFDLFFBQVEsRUFBRSxDQUFDO0FBQzNCLGVBQWUsQ0FBQyxRQUFRLEVBQUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFBvaW50LCBQb2ludEZhY3RvcnksIFNjYWxhciB9IGZyb20gXCJAZGVkaXMva3liZXJcIjtcbmltcG9ydCB7IE1lc3NhZ2UsIFByb3BlcnRpZXMgfSBmcm9tIFwicHJvdG9idWZqc1wiO1xuaW1wb3J0IHsgQXJndW1lbnQsIENsaWVudFRyYW5zYWN0aW9uLCBJbnN0YW5jZUlELCBJbnN0cnVjdGlvbiwgUHJvb2YgfSBmcm9tIFwiLi4vYnl6Y29pblwiO1xuaW1wb3J0IEJ5ekNvaW5SUEMgZnJvbSBcIi4uL2J5emNvaW4vYnl6Y29pbi1ycGNcIjtcbmltcG9ydCB7IFNpZ25lciB9IGZyb20gXCIuLi9kYXJjXCI7XG5pbXBvcnQgTG9nIGZyb20gXCIuLi9sb2dcIjtcbmltcG9ydCB7IFJvc3RlciwgU2VydmVySWRlbnRpdHkgfSBmcm9tIFwiLi4vbmV0d29ya1wiO1xuaW1wb3J0IHsgSUNvbm5lY3Rpb24sIFJvc3RlcldTQ29ubmVjdGlvbiwgV2ViU29ja2V0Q29ubmVjdGlvbiB9IGZyb20gXCIuLi9uZXR3b3JrL2Nvbm5lY3Rpb25cIjtcbmltcG9ydCB7IHJlZ2lzdGVyTWVzc2FnZSB9IGZyb20gXCIuLi9wcm90b2J1ZlwiO1xuaW1wb3J0IHsgRGVjb2RlS2V5LCBPbkNoYWluU2VjcmV0SW5zdGFuY2UgfSBmcm9tIFwiLi9jYWx5cHNvLWluc3RhbmNlXCI7XG5cbi8qKlxuICogT25DaGFpblNlY3JldFJQQyBpcyB1c2VkIHRvIGNvbnRhY3QgdGhlIE9uQ2hhaW5TZWNyZXQgc2VydmljZSBvZiB0aGUgY290aG9yaXR5LlxuICogV2l0aCBpdCB5b3UgY2FuIHNldCB1cCBhIG5ldyBsb25nLXRlcm0gb25jaGFpbi1zZWNyZXQsIGdpdmUgaXQgYSBwb2xpY3kgdG8gYWNjZXB0XG4gKiBuZXcgcmVxdWVzdHMsIGFuZCBhc2sgZm9yIHJlLWVuY3J5cHRpb24gcmVxdWVzdHMuXG4gKi9cbmV4cG9ydCBjbGFzcyBPbkNoYWluU2VjcmV0UlBDIHtcbiAgICBzdGF0aWMgc2VydmljZUlEID0gXCJDYWx5cHNvXCI7XG4gICAgcHJpdmF0ZSBzb2NrZXQ6IElDb25uZWN0aW9uO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgbGlzdDogU2VydmVySWRlbnRpdHlbXTtcblxuICAgIGNvbnN0cnVjdG9yKHB1YmxpYyBiYzogQnl6Q29pblJQQywgcm9zdGVyPzogUm9zdGVyKSB7XG4gICAgICAgIHRoaXMuc29ja2V0ID0gbmV3IFJvc3RlcldTQ29ubmVjdGlvbihiYy5nZXRDb25maWcoKS5yb3N0ZXIsIE9uQ2hhaW5TZWNyZXRSUEMuc2VydmljZUlEKTtcbiAgICAgICAgaWYgKHJvc3Rlcikge1xuICAgICAgICAgICAgdGhpcy5saXN0ID0gcm9zdGVyLmxpc3Q7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmxpc3QgPSB0aGlzLmJjLmdldENvbmZpZygpLnJvc3Rlci5saXN0O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gQ3JlYXRlTFRTIGNyZWF0ZXMgYSByYW5kb20gTFRTSUQgdGhhdCBjYW4gYmUgdXNlZCB0byByZWZlcmVuY2UgdGhlIExUUyBncm91cFxuICAgIC8vIGNyZWF0ZWQuIEl0IGZpcnN0IHNlbmRzIGEgdHJhbnNhY3Rpb24gdG8gQnl6Q29pbiB0byBzcGF3biBhIExUUyBpbnN0YW5jZSxcbiAgICAvLyB0aGVuIGl0IGFza3MgdGhlIENhbHlwc28gY290aG9yaXR5IHRvIHN0YXJ0IHRoZSBES0cuXG4gICAgYXN5bmMgY3JlYXRlTFRTKHI6IFJvc3RlciwgZGFyY0lEOiBJbnN0YW5jZUlELCBzaWduZXJzOiBTaWduZXJbXSk6IFByb21pc2U8Q3JlYXRlTFRTUmVwbHk+IHtcbiAgICAgICAgY29uc3QgYnVmID0gQnVmZmVyLmZyb20oTHRzSW5zdGFuY2VJbmZvLmVuY29kZShuZXcgTHRzSW5zdGFuY2VJbmZvKHtyb3N0ZXI6IHJ9KSkuZmluaXNoKCkpO1xuICAgICAgICBjb25zdCBjdHggPSBuZXcgQ2xpZW50VHJhbnNhY3Rpb24oe1xuICAgICAgICAgICAgaW5zdHJ1Y3Rpb25zOiBbXG4gICAgICAgICAgICAgICAgSW5zdHJ1Y3Rpb24uY3JlYXRlU3Bhd24oZGFyY0lELCBPbkNoYWluU2VjcmV0SW5zdGFuY2UuY29udHJhY3RJRCwgW1xuICAgICAgICAgICAgICAgICAgICBuZXcgQXJndW1lbnQoe25hbWU6IFwibHRzX2luc3RhbmNlX2luZm9cIiwgdmFsdWU6IGJ1Zn0pLFxuICAgICAgICAgICAgICAgIF0pLFxuICAgICAgICAgICAgXSxcbiAgICAgICAgfSk7XG4gICAgICAgIGF3YWl0IGN0eC51cGRhdGVDb3VudGVyc0FuZFNpZ24odGhpcy5iYywgW3NpZ25lcnNdKTtcbiAgICAgICAgYXdhaXQgdGhpcy5iYy5zZW5kVHJhbnNhY3Rpb25BbmRXYWl0KGN0eCk7XG4gICAgICAgIC8vIEFzayBmb3IgdGhlIGZ1bGwgcHJvb2Ygd2hpY2ggaXMgZWFzaWVyIHRvIHZlcmlmeS5cbiAgICAgICAgY29uc3QgcCA9IGF3YWl0IHRoaXMuYmMuZ2V0UHJvb2YoY3R4Lmluc3RydWN0aW9uc1swXS5kZXJpdmVJZCgpKTtcblxuICAgICAgICByZXR1cm4gbmV3IFdlYlNvY2tldENvbm5lY3Rpb24oci5saXN0WzBdLmdldFdlYlNvY2tldEFkZHJlc3MoKSwgT25DaGFpblNlY3JldFJQQy5zZXJ2aWNlSUQpXG4gICAgICAgICAgICAuc2VuZChuZXcgQ3JlYXRlTFRTKHtwcm9vZjogcH0pLCBDcmVhdGVMVFNSZXBseSk7XG4gICAgfVxuXG4gICAgLy8gYXV0aG9yaXplIGFkZHMgYSBCeXpDb2luSUQgdG8gdGhlIGxpc3Qgb2YgYXV0aG9yaXplZCBJRHMgZm9yIGVhY2hcbiAgICAvLyBzZXJ2ZXIgaW4gdGhlIHJvc3Rlci4gVGhlIGF1dGhvcml6ZSBlbmRwb2ludCByZWZ1c2VzIHJlcXVlc3RzXG4gICAgLy8gdGhhdCBkbyBub3QgY29tZSBmcm9tIGxvY2FsaG9zdCBmb3Igc2VjdXJpdHkgcmVhc29ucy5cbiAgICAvL1xuICAgIC8vIEl0IHNob3VsZCBiZSBjYWxsZWQgYnkgdGhlIGFkbWluaXN0cmF0b3IgYXQgdGhlIGJlZ2lubmluZywgYmVmb3JlIGFueSBvdGhlclxuICAgIC8vIEFQSSBjYWxscyBhcmUgbWFkZS4gQSBCeXpDb2luSUQgdGhhdCBpcyBub3QgYXV0aG9yaXplZCB3aWxsIG5vdCBiZSBhbGxvd2VkIHRvXG4gICAgLy8gY2FsbCB0aGUgb3RoZXIgQVBJcy5cbiAgICBhc3luYyBhdXRob3JpemUod2hvOiBTZXJ2ZXJJZGVudGl0eSwgYmNpZDogSW5zdGFuY2VJRCk6IFByb21pc2U8QXV0aG9yaXplUmVwbHk+IHtcbiAgICAgICAgY29uc3Qgc29jayA9IG5ldyBXZWJTb2NrZXRDb25uZWN0aW9uKHdoby5nZXRXZWJTb2NrZXRBZGRyZXNzKCksIE9uQ2hhaW5TZWNyZXRSUEMuc2VydmljZUlEKTtcbiAgICAgICAgcmV0dXJuIHNvY2suc2VuZChuZXcgQXV0aG9yaXplKHtieXpjb2luaWQ6IGJjaWR9KSwgQXV0aG9yaXplUmVwbHkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIGF1dGhvcml6ZVJvc3RlciBpcyBhIGNvbnZlbmllbmNlIG1ldGhvZCB0aGF0IGF1dGhvcml6ZXMgYWxsIG5vZGVzIGluIHRoZSBiYy1yb3N0ZXJcbiAgICAgKiB0byBjcmVhdGUgbmV3IExUUy4gRm9yIHRoaXMgdG8gd29yaywgdGhlIG5vZGVzIG11c3QgaGF2ZSBiZWVuIHN0YXJ0ZWQgd2l0aFxuICAgICAqIENPVEhPUklUWV9BTExPV19JTlNFQ1VSRV9BRE1JTj10cnVlXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcm9zdGVyIGlmIGdpdmVuLCB0aGlzIHJvc3RlciBpcyB1c2VkIGluc3RlYWQgb2YgdGhlIGJjLXJvc3RlclxuICAgICAqL1xuICAgIGFzeW5jIGF1dGhvcml6ZVJvc3Rlcihyb3N0ZXI/OiBSb3N0ZXIpIHtcbiAgICAgICAgaWYgKCFyb3N0ZXIpIHtcbiAgICAgICAgICAgIHJvc3RlciA9IHRoaXMuYmMuZ2V0Q29uZmlnKCkucm9zdGVyO1xuICAgICAgICB9XG4gICAgICAgIGZvciAoY29uc3Qgbm9kZSBvZiByb3N0ZXIubGlzdCkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5hdXRob3JpemUobm9kZSwgdGhpcy5iYy5nZW5lc2lzSUQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gcmVlbmNyeXB0S2V5IHRha2VzIGFzIGlucHV0IFJlYWQtIGFuZCBXcml0ZS0gUHJvb2ZzLiBJdCB2ZXJpZmllcyB0aGF0XG4gICAgLy8gdGhlIHJlYWQvd3JpdGUgcmVxdWVzdHMgbWF0Y2ggYW5kIHRoZW4gcmUtZW5jcnlwdHMgdGhlIHNlY3JldFxuICAgIC8vIGdpdmVuIHRoZSBwdWJsaWMga2V5IGluZm9ybWF0aW9uIG9mIHRoZSByZWFkZXIuXG4gICAgYXN5bmMgcmVlbmNyeXB0S2V5KHdyaXRlOiBQcm9vZiwgcmVhZDogUHJvb2YpOiBQcm9taXNlPERlY3J5cHRLZXlSZXBseT4ge1xuICAgICAgICBjb25zdCBzb2NrID0gbmV3IFdlYlNvY2tldENvbm5lY3Rpb24odGhpcy5saXN0WzBdLmdldFdlYlNvY2tldEFkZHJlc3MoKSwgT25DaGFpblNlY3JldFJQQy5zZXJ2aWNlSUQpO1xuICAgICAgICByZXR1cm4gc29jay5zZW5kKG5ldyBEZWNyeXB0S2V5KHtyZWFkLCB3cml0ZX0pLCBEZWNyeXB0S2V5UmVwbHkpO1xuICAgIH1cbn1cblxuLyoqXG4gKiBMb25nVGVybVNlY3JldCBleHRlbmRzIHRoZSBPbkNoYWluU2VjcmV0UlBDIGFuZCBhbHNvIGhvbGRzIHRoZSBpZCBhbmQgdGhlIFguXG4gKi9cbmV4cG9ydCBjbGFzcyBMb25nVGVybVNlY3JldCBleHRlbmRzIE9uQ2hhaW5TZWNyZXRSUEMge1xuXG4gICAgLyoqXG4gICAgICogc3Bhd24gY3JlYXRlcyBhIG5ldyBsb25ndGVybXNlY3JldCBieSBzcGF3bmluZyBhIGxvbmdUZXJtU2VjcmV0IGluc3RhbmNlLCBhbmQgdGhlbiBwZXJmb3JtaW5nXG4gICAgICogYSBES0cgdXNpbmcgdGhlIGZ1bGwgcm9zdGVyIG9mIGJjLlxuICAgICAqXG4gICAgICogQHBhcmFtIGJjIGEgdmFsaWQgQnl6Q29pbiBpbnN0YW5jZVxuICAgICAqIEBwYXJhbSBkYXJjSUQgaWQgb2YgYSBkYXJjIGFsbG93ZWQgdG8gc3Bhd24gbG9uZ1Rlcm1TZWNyZXRcbiAgICAgKiBAcGFyYW0gc2lnbmVycyBuZWVkZWQgdG8gYXV0aGVudGljYXRlIGxvbmdUZXJtU2VjcmV0IHNwYXduc1xuICAgICAqIEBwYXJhbSByb3N0ZXIgaWYgZ2l2ZW4sIHRoZSByb3N0ZXIgZm9yIHRoZSBES0csIGlmIG51bGwsIHRoZSBmdWxsIHJvc3RlciBvZiBiYyB3aWxsIGJlIHVzZWRcbiAgICAgKi9cbiAgICBzdGF0aWMgYXN5bmMgc3Bhd24oYmM6IEJ5ekNvaW5SUEMsIGRhcmNJRDogSW5zdGFuY2VJRCwgc2lnbmVyczogW1NpZ25lcl0sIHJvc3Rlcj86IFJvc3Rlcik6XG4gICAgICAgIFByb21pc2U8TG9uZ1Rlcm1TZWNyZXQ+IHtcbiAgICAgICAgaWYgKCFyb3N0ZXIpIHtcbiAgICAgICAgICAgIHJvc3RlciA9IGJjLmdldENvbmZpZygpLnJvc3RlcjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBvY3MgPSBuZXcgT25DaGFpblNlY3JldFJQQyhiYyk7XG4gICAgICAgIGF3YWl0IG9jcy5hdXRob3JpemVSb3N0ZXIocm9zdGVyKTtcbiAgICAgICAgY29uc3QgbHIgPSBhd2FpdCBvY3MuY3JlYXRlTFRTKHJvc3RlciwgZGFyY0lELCBzaWduZXJzKTtcbiAgICAgICAgcmV0dXJuIG5ldyBMb25nVGVybVNlY3JldChiYywgbHIuaW5zdGFuY2VpZCwgbHIuWCwgcm9zdGVyKTtcbiAgICB9XG5cbiAgICBjb25zdHJ1Y3RvcihiYzogQnl6Q29pblJQQywgcHVibGljIGlkOiBJbnN0YW5jZUlELCBwdWJsaWMgWDogUG9pbnQsIHJvc3Rlcj86IFJvc3Rlcikge1xuICAgICAgICBzdXBlcihiYywgcm9zdGVyKTtcbiAgICB9XG59XG5cbi8qKlxuICogQXV0aG9yaXplIGlzIHVzZWQgdG8gYWRkIHRoZSBnaXZlbiBCeXpDb2luSUQgaW50byB0aGUgbGlzdCBvZiBhdXRob3JpemVkIElEcy5cbiAqL1xuZXhwb3J0IGNsYXNzIEF1dGhvcml6ZSBleHRlbmRzIE1lc3NhZ2U8QXV0aG9yaXplPiB7XG5cbiAgICAvKipcbiAgICAgKiBAc2VlIFJFQURNRSNNZXNzYWdlIGNsYXNzZXNcbiAgICAgKi9cbiAgICBzdGF0aWMgcmVnaXN0ZXIoKSB7XG4gICAgICAgIHJlZ2lzdGVyTWVzc2FnZShcIkF1dGhvcml6ZVwiLCBBdXRob3JpemUpO1xuICAgIH1cblxuICAgIHJlYWRvbmx5IGJ5emNvaW5pZDogSW5zdGFuY2VJRDtcblxuICAgIGNvbnN0cnVjdG9yKHByb3BzPzogUHJvcGVydGllczxBdXRob3JpemU+KSB7XG4gICAgICAgIHN1cGVyKHByb3BzKTtcbiAgICB9XG59XG5cbi8qKlxuICogQXV0aG9yaXplUmVwbHkgaXMgcmV0dXJuZWQgdXBvbiBzdWNjZXNzZnVsIGF1dGhvcmlzYXRpb24uXG4gKi9cbmV4cG9ydCBjbGFzcyBBdXRob3JpemVSZXBseSBleHRlbmRzIE1lc3NhZ2U8QXV0aG9yaXplUmVwbHk+IHtcbiAgICAvKipcbiAgICAgKiBAc2VlIFJFQURNRSNNZXNzYWdlIGNsYXNzZXNcbiAgICAgKi9cbiAgICBzdGF0aWMgcmVnaXN0ZXIoKSB7XG4gICAgICAgIHJlZ2lzdGVyTWVzc2FnZShcIkF1dGhvcml6ZVJlcGx5XCIsIEF1dGhvcml6ZVJlcGx5KTtcbiAgICB9XG59XG5cbi8vXG4vKipcbiAqIENyZWF0ZUxUUyBpcyB1c2VkIHRvIHN0YXJ0IGEgREtHIGFuZCBzdG9yZSB0aGUgcHJpdmF0ZSBrZXlzIGluIGVhY2ggbm9kZS5cbiAqIFByaW9yIHRvIHVzaW5nIHRoaXMgcmVxdWVzdCwgdGhlIENhbHlwc28gcm9zdGVyIG11c3QgYmUgcmVjb3JkZWQgb24gdGhlXG4gKiBCeXpDb2luIGJsb2NrY2hhaW4gaW4gdGhlIGluc3RhbmNlIHNwZWNpZmllZCBieSBJbnN0YW5jZUlELlxuICovXG5leHBvcnQgY2xhc3MgQ3JlYXRlTFRTIGV4dGVuZHMgTWVzc2FnZTxDcmVhdGVMVFM+IHtcblxuICAgIC8qKlxuICAgICAqIEBzZWUgUkVBRE1FI01lc3NhZ2UgY2xhc3Nlc1xuICAgICAqL1xuICAgIHN0YXRpYyByZWdpc3RlcigpIHtcbiAgICAgICAgcmVnaXN0ZXJNZXNzYWdlKFwiQ3JlYXRlTFRTXCIsIENyZWF0ZUxUUyk7XG4gICAgfVxuXG4gICAgcmVhZG9ubHkgcHJvb2Y6IFByb29mO1xuXG4gICAgY29uc3RydWN0b3IocHJvcHM/OiBQcm9wZXJ0aWVzPENyZWF0ZUxUUz4pIHtcbiAgICAgICAgc3VwZXIocHJvcHMpO1xuICAgIH1cbn1cblxuLyoqXG4gKiBDcmVhdGVMVFNSZXBseSBpcyByZXR1cm5lZCB1cG9uIHN1Y2Nlc3NmdWxseSBzZXR0aW5nIHVwIHRoZSBkaXN0cmlidXRlZFxuICoga2V5LlxuICovXG5leHBvcnQgY2xhc3MgQ3JlYXRlTFRTUmVwbHkgZXh0ZW5kcyBNZXNzYWdlPENyZWF0ZUxUU1JlcGx5PiB7XG5cbiAgICBnZXQgWCgpOiBQb2ludCB7XG4gICAgICAgIHJldHVybiBQb2ludEZhY3RvcnkuZnJvbVByb3RvKHRoaXMueCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQHNlZSBSRUFETUUjTWVzc2FnZSBjbGFzc2VzXG4gICAgICovXG4gICAgc3RhdGljIHJlZ2lzdGVyKCkge1xuICAgICAgICByZWdpc3Rlck1lc3NhZ2UoXCJDcmVhdGVMVFNSZXBseVwiLCBDcmVhdGVMVFNSZXBseSk7XG4gICAgfVxuXG4gICAgcmVhZG9ubHkgYnl6Y29pbmlkOiBJbnN0YW5jZUlEO1xuICAgIHJlYWRvbmx5IGluc3RhbmNlaWQ6IEluc3RhbmNlSUQ7XG4gICAgcmVhZG9ubHkgeDogQnVmZmVyO1xufVxuXG4vKipcbiAqIERlY3J5cHRLZXkgaXMgc2VudCBieSBhIHJlYWRlciBhZnRlciBoZSBzdWNjZXNzZnVsbHkgc3RvcmVkIGEgJ1JlYWQnIHJlcXVlc3RcbiAqIGluIGJ5emNvaW4gQ2xpZW50LlxuICovXG5leHBvcnQgY2xhc3MgRGVjcnlwdEtleSBleHRlbmRzIE1lc3NhZ2U8RGVjcnlwdEtleT4ge1xuXG4gICAgLyoqXG4gICAgICogQHNlZSBSRUFETUUjTWVzc2FnZSBjbGFzc2VzXG4gICAgICovXG4gICAgc3RhdGljIHJlZ2lzdGVyKCkge1xuICAgICAgICByZWdpc3Rlck1lc3NhZ2UoXCJEZWNyeXB0S2V5XCIsIERlY3J5cHRLZXkpO1xuICAgIH1cblxuICAgIHJlYWRvbmx5IHJlYWQ6IFByb29mO1xuICAgIHJlYWRvbmx5IHdyaXRlOiBQcm9vZjtcblxuICAgIGNvbnN0cnVjdG9yKHByb3BzPzogUHJvcGVydGllczxEZWNyeXB0S2V5Pikge1xuICAgICAgICBzdXBlcihwcm9wcyk7XG4gICAgfVxufVxuXG4vKipcbiAqIERlY3J5cHRLZXlSZXBseSBpcyByZXR1cm5lZCBpZiB0aGUgc2VydmljZSB2ZXJpZmllZCBzdWNjZXNzZnVsbHkgdGhhdCB0aGVcbiAqIGRlY3J5cHRpb24gcmVxdWVzdCBpcyB2YWxpZC5cbiAqL1xuZXhwb3J0IGNsYXNzIERlY3J5cHRLZXlSZXBseSBleHRlbmRzIE1lc3NhZ2U8RGVjcnlwdEtleVJlcGx5PiB7XG5cbiAgICAvKipcbiAgICAgKiBAc2VlIFJFQURNRSNNZXNzYWdlIGNsYXNzZXNcbiAgICAgKi9cbiAgICBzdGF0aWMgcmVnaXN0ZXIoKSB7XG4gICAgICAgIHJlZ2lzdGVyTWVzc2FnZShcIkRlY3J5cHRLZXlSZXBseVwiLCBEZWNyeXB0S2V5UmVwbHkpO1xuICAgIH1cbiAgICByZWFkb25seSBjOiBCdWZmZXI7XG4gICAgcmVhZG9ubHkgeGhhdGVuYzogQnVmZmVyO1xuICAgIHJlYWRvbmx5IHg6IEJ1ZmZlcjtcblxuICAgIGFzeW5jIGRlY3J5cHQocHJpdjogU2NhbGFyKTogUHJvbWlzZTxCdWZmZXI+IHtcbiAgICAgICAgY29uc3QgWCA9IFBvaW50RmFjdG9yeS5mcm9tUHJvdG8odGhpcy54KTtcbiAgICAgICAgY29uc3QgQyA9IFBvaW50RmFjdG9yeS5mcm9tUHJvdG8odGhpcy5jKTtcbiAgICAgICAgLyogdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOiB2YXJpYWJsZS1uYW1lICovXG4gICAgICAgIGNvbnN0IFhoYXRFbmMgPSBQb2ludEZhY3RvcnkuZnJvbVByb3RvKHRoaXMueGhhdGVuYyk7XG4gICAgICAgIHJldHVybiBEZWNvZGVLZXkoWCwgQywgWGhhdEVuYywgcHJpdik7XG4gICAgfVxufVxuXG4vKipcbiAqIEx0c0luc3RhbmNlSW5mbyBpcyB0aGUgaW5mb3JtYXRpb24gc3RvcmVkIGluIGFuIExUUyBpbnN0YW5jZS5cbiAqL1xuZXhwb3J0IGNsYXNzIEx0c0luc3RhbmNlSW5mbyBleHRlbmRzIE1lc3NhZ2U8THRzSW5zdGFuY2VJbmZvPiB7XG5cbiAgICAvKipcbiAgICAgKiBAc2VlIFJFQURNRSNNZXNzYWdlIGNsYXNzZXNcbiAgICAgKi9cbiAgICBzdGF0aWMgcmVnaXN0ZXIoKSB7XG4gICAgICAgIHJlZ2lzdGVyTWVzc2FnZShcIkx0c0luc3RhbmNlSW5mb1wiLCBMdHNJbnN0YW5jZUluZm8pO1xuICAgIH1cblxuICAgIHJlYWRvbmx5IHJvc3RlcjogUm9zdGVyO1xuXG4gICAgY29uc3RydWN0b3IocHJvcHM/OiBQcm9wZXJ0aWVzPEx0c0luc3RhbmNlSW5mbz4pIHtcbiAgICAgICAgc3VwZXIocHJvcHMpO1xuICAgIH1cbn1cblxuQXV0aG9yaXplLnJlZ2lzdGVyKCk7XG5BdXRob3JpemVSZXBseS5yZWdpc3RlcigpO1xuQ3JlYXRlTFRTLnJlZ2lzdGVyKCk7XG5DcmVhdGVMVFNSZXBseS5yZWdpc3RlcigpO1xuRGVjcnlwdEtleS5yZWdpc3RlcigpO1xuRGVjcnlwdEtleVJlcGx5LnJlZ2lzdGVyKCk7XG5MdHNJbnN0YW5jZUluZm8ucmVnaXN0ZXIoKTtcbiJdfQ==