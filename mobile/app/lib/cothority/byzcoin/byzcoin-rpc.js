"use strict";
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
var darc_1 = require("../darc");
var darc_2 = __importDefault(require("../darc/darc"));
var identity_ed25519_1 = __importDefault(require("../darc/identity-ed25519"));
var connection_1 = require("../network/connection");
var skipchain_rpc_1 = __importDefault(require("../skipchain/skipchain-rpc"));
var config_1 = __importDefault(require("./config"));
var darc_instance_1 = __importDefault(require("./contracts/darc-instance"));
var check_auth_1 = __importStar(require("./proto/check-auth"));
var requests_1 = require("./proto/requests");
exports.currentVersion = 1;
var CONFIG_INSTANCE_ID = Buffer.alloc(32, 0);
var ByzCoinRPC = /** @class */ (function () {
    function ByzCoinRPC() {
    }
    Object.defineProperty(ByzCoinRPC.prototype, "genesisID", {
        get: function () {
            return this.genesis.computeHash();
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Helper to create a genesis darc
     * @param signers       Authorized signers
     * @param roster        Roster that will be used
     * @param description   An optional description for the chain
     */
    ByzCoinRPC.makeGenesisDarc = function (signers, roster, description) {
        if (signers.length === 0) {
            throw new Error("no identities");
        }
        var d = darc_2.default.createBasic(signers, signers, Buffer.from(description || "Genesis darc"));
        roster.list.forEach(function (srvid) {
            d.addIdentity("invoke:config.view_change", identity_ed25519_1.default.fromPoint(srvid.getPublic()), darc_1.Rule.OR);
        });
        signers.forEach(function (signer) {
            d.addIdentity("spawn:darc", signer, darc_1.Rule.OR);
            d.addIdentity("invoke:config.update_config", signer, darc_1.Rule.OR);
        });
        return d;
    };
    /**
     * Recreate a byzcoin RPC from a given roster
     * @param roster        The roster to ask for the config and darc
     * @param skipchainID   The genesis block identifier
     * @param waitMatch how many times to wait for a match - useful if its called just after an addTransactionAndWait.
     * @param interval how long to wait between two attempts in waitMatch.
     * @returns a promise that resolves with the initialized ByzCoin instance
     */
    ByzCoinRPC.fromByzcoin = function (roster, skipchainID, waitMatch, interval) {
        if (waitMatch === void 0) { waitMatch = 0; }
        if (interval === void 0) { interval = 1000; }
        return __awaiter(this, void 0, void 0, function () {
            var rpc, skipchain, _a, ccProof, di;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        rpc = new ByzCoinRPC();
                        rpc.conn = new connection_1.RosterWSConnection(roster, "ByzCoin");
                        skipchain = new skipchain_rpc_1.default(roster);
                        _a = rpc;
                        return [4 /*yield*/, skipchain.getSkipBlock(skipchainID)];
                    case 1:
                        _a.genesis = _b.sent();
                        rpc.latest = rpc.genesis;
                        return [4 /*yield*/, rpc.getProof(CONFIG_INSTANCE_ID, waitMatch, interval)];
                    case 2:
                        ccProof = _b.sent();
                        rpc.config = config_1.default.fromProof(ccProof);
                        return [4 /*yield*/, darc_instance_1.default.fromByzcoin(rpc, ccProof.stateChangeBody.darcID, waitMatch, interval)];
                    case 3:
                        di = _b.sent();
                        rpc.genesisDarc = di.darc;
                        return [2 /*return*/, rpc];
                }
            });
        });
    };
    /**
     * Create a new byzcoin chain and return a associated RPC
     * @param roster        The roster to use to create the genesis block
     * @param darc          The genesis darc
     * @param blockInterval The interval of block creation in nanoseconds
     */
    ByzCoinRPC.newByzCoinRPC = function (roster, darc, blockInterval) {
        return __awaiter(this, void 0, void 0, function () {
            var rpc, req, ret;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        rpc = new ByzCoinRPC();
                        rpc.conn = new connection_1.WebSocketConnection(roster.list[0].getWebSocketAddress(), "ByzCoin");
                        rpc.genesisDarc = darc;
                        rpc.config = new config_1.default({ blockInterval: blockInterval });
                        req = new requests_1.CreateGenesisBlock({
                            blockInterval: blockInterval,
                            darcContractIDs: [darc_instance_1.default.contractID],
                            genesisDarc: darc,
                            roster: roster,
                            version: exports.currentVersion,
                        });
                        return [4 /*yield*/, rpc.conn.send(req, requests_1.CreateGenesisBlockResponse)];
                    case 1:
                        ret = _a.sent();
                        rpc.genesis = ret.skipblock;
                        rpc.latest = ret.skipblock;
                        return [4 /*yield*/, rpc.updateConfig()];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, rpc];
                }
            });
        });
    };
    /**
     * Getter for the genesis darc
     * @returns the genesis darc
     */
    ByzCoinRPC.prototype.getDarc = function () {
        return this.genesisDarc;
    };
    /**
     * Getter for the chain configuration
     * @returns the configuration
     */
    ByzCoinRPC.prototype.getConfig = function () {
        return this.config;
    };
    /**
     * Getter for the genesis block
     * @returns the genesis block
     */
    ByzCoinRPC.prototype.getGenesis = function () {
        return this.genesis;
    };
    /**
     * Sends a transaction to byzcoin and waits for up to 'wait' blocks for the
     * transaction to be included in the global state. If more than 'wait' blocks
     * are created and the transaction is not included, an exception will be raised.
     *
     * @param transaction is the client transaction holding
     * one or more instructions to be sent to byzcoin.
     * @param wait indicates the number of blocks to wait for the
     * transaction to be included
     * @returns a promise that gets resolved if the block has been included
     */
    ByzCoinRPC.prototype.sendTransactionAndWait = function (transaction, wait) {
        if (wait === void 0) { wait = 10; }
        var req = new requests_1.AddTxRequest({
            inclusionwait: wait,
            skipchainID: this.genesis.hash,
            transaction: transaction,
            version: exports.currentVersion,
        });
        return this.conn.send(req, requests_1.AddTxResponse);
    };
    /**
     * Get the latest configuration for the chain and update the local
     * cache
     */
    ByzCoinRPC.prototype.updateConfig = function () {
        return __awaiter(this, void 0, void 0, function () {
            var pr, darcIID, genesisDarcInstance;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getProofFromLatest(CONFIG_INSTANCE_ID)];
                    case 1:
                        pr = _a.sent();
                        this.config = config_1.default.fromProof(pr);
                        darcIID = pr.stateChangeBody.darcID;
                        return [4 /*yield*/, darc_instance_1.default.fromByzcoin(this, darcIID)];
                    case 2:
                        genesisDarcInstance = _a.sent();
                        this.genesisDarc = genesisDarcInstance.darc;
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Gets a proof from byzcoin to show that a given instance is in the
     * global state. The proof always starts from the genesis block.
     *
     * @param id the instance key
     * @param waitMatch number of milliseconds to wait if the proof is false
     * @param interval how long to wait before checking for a match again
     * @return a promise that resolves with the proof, rejecting otherwise
     */
    ByzCoinRPC.prototype.getProof = function (id, waitMatch, interval) {
        if (waitMatch === void 0) { waitMatch = 0; }
        if (interval === void 0) { interval = 1000; }
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (!this.genesis) {
                    throw new Error("RPC not initialized with the genesis block");
                }
                return [2 /*return*/, this.getProofFrom(this.genesis, id, waitMatch, interval)];
            });
        });
    };
    /**
     * Gets a proof from byzcoin to show that a given instance is in the
     * global state. The proof starts from the latest known block.
     * Caution: If you need to pass the Proof onwards to another server,
     * you must use getProof in order to create a complete standalone
     * proof starting from the genesis block.
     *
     * @param id the instance key
     * @param waitMatch number of milliseconds to wait if the proof is false
     * @param interval how long to wait before checking for a match again
     * @return a promise that resolves with the proof, rejecting otherwise
     */
    ByzCoinRPC.prototype.getProofFromLatest = function (id, waitMatch, interval) {
        if (waitMatch === void 0) { waitMatch = 0; }
        if (interval === void 0) { interval = 1000; }
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (!this.latest) {
                    throw new Error("no latest block found");
                }
                return [2 /*return*/, this.getProofFrom(this.latest, id, waitMatch, interval)];
            });
        });
    };
    /**
     * Gets a proof from byzcoin to show that a given instance is in the
     * global state. The proof starts from the block given in parameter.
     * Caution: If you need to pass the Proof onwards to another server,
     * you must use getProof in order to create a complete standalone
     * proof starting from the genesis block.
     *
     * @param id the instance key
     * @param waitMatch number of milliseconds to wait if the proof is false
     * @param interval how long to wait before checking for a match again
     * @return a promise that resolves with the proof, rejecting otherwise
     */
    ByzCoinRPC.prototype.getProofFrom = function (from, id, waitMatch, interval) {
        if (waitMatch === void 0) { waitMatch = 0; }
        if (interval === void 0) { interval = 1000; }
        return __awaiter(this, void 0, void 0, function () {
            var req, reply, err;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        req = new requests_1.GetProof({
                            id: from.hash,
                            key: id,
                            version: exports.currentVersion,
                        });
                        return [4 /*yield*/, this.conn.send(req, requests_1.GetProofResponse)];
                    case 1:
                        reply = _a.sent();
                        if (waitMatch > 0 && !reply.proof.exists(id)) {
                            return [2 /*return*/, new Promise(function (resolve, reject) {
                                    setTimeout(function () {
                                        _this.getProofFrom(from, id, waitMatch - interval, interval).then(resolve, reject);
                                    }, interval);
                                })];
                        }
                        err = reply.proof.verifyFrom(from);
                        if (err) {
                            throw err;
                        }
                        this.latest = reply.proof.latest;
                        return [2 /*return*/, reply.proof];
                }
            });
        });
    };
    /**
     * Get the latest counter for the given signers and increase it with a given value
     *
     * @param ids The identifiers of the signers
     * @param add The increment
     * @returns the ordered list of counters
     */
    ByzCoinRPC.prototype.getSignerCounters = function (ids, add) {
        if (add === void 0) { add = 0; }
        return __awaiter(this, void 0, void 0, function () {
            var req, rep;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        req = new requests_1.GetSignerCounters({
                            signerIDs: ids.map(function (id) { return id.toString(); }),
                            skipchainID: this.genesis.hash,
                        });
                        return [4 /*yield*/, this.conn.send(req, requests_1.GetSignerCountersResponse)];
                    case 1:
                        rep = _a.sent();
                        return [2 /*return*/, rep.counters.map(function (c) { return c.add(add); })];
                }
            });
        });
    };
    /**
     * checks the authorization of a set of identities with respect to a given darc. This calls
     * an OmniLedger node and trusts it to return the name of the actions that a hypotethic set of
     * signatures from the given identities can execute using the given darc.
     *
     * This is useful if a darc delegates one or more actions to other darc, who delegate also, so
     * this call will test what actions are possible to be executed.
     *
     * @param darcID the base darc whose actions are verified
     * @param identities the set of identities that are hypothetically signing
     */
    ByzCoinRPC.prototype.checkAuthorization = function (byzCoinID, darcID) {
        var identities = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            identities[_i - 2] = arguments[_i];
        }
        return __awaiter(this, void 0, void 0, function () {
            var req, reply;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        req = new check_auth_1.default({
                            byzcoinID: byzCoinID,
                            darcID: darcID,
                            identities: identities,
                            version: exports.currentVersion,
                        });
                        return [4 /*yield*/, this.conn.send(req, check_auth_1.CheckAuthorizationResponse)];
                    case 1:
                        reply = _a.sent();
                        return [2 /*return*/, reply.actions];
                }
            });
        });
    };
    return ByzCoinRPC;
}());
exports.default = ByzCoinRPC;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnl6Y29pbi1ycGMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJieXpjb2luLXJwYy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVBLGdDQUErQjtBQUMvQixzREFBZ0M7QUFDaEMsOEVBQXVEO0FBRXZELG9EQUE2RjtBQUc3Riw2RUFBc0Q7QUFFdEQsb0RBQW1DO0FBQ25DLDRFQUFxRDtBQUdyRCwrREFBb0Y7QUFDcEYsNkNBUzBCO0FBRWIsUUFBQSxjQUFjLEdBQUcsQ0FBQyxDQUFDO0FBRWhDLElBQU0sa0JBQWtCLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFFL0M7SUEwRkk7SUFBeUIsQ0FBQztJQXhGMUIsc0JBQUksaUNBQVM7YUFBYjtZQUNJLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUN0QyxDQUFDOzs7T0FBQTtJQUVEOzs7OztPQUtHO0lBQ0ksMEJBQWUsR0FBdEIsVUFBdUIsT0FBb0IsRUFBRSxNQUFjLEVBQUUsV0FBb0I7UUFDN0UsSUFBSSxPQUFPLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtZQUN0QixNQUFNLElBQUksS0FBSyxDQUFDLGVBQWUsQ0FBQyxDQUFDO1NBQ3BDO1FBRUQsSUFBTSxDQUFDLEdBQUcsY0FBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxJQUFJLGNBQWMsQ0FBQyxDQUFDLENBQUM7UUFDekYsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBQyxLQUFLO1lBQ3RCLENBQUMsQ0FBQyxXQUFXLENBQUMsMkJBQTJCLEVBQUUsMEJBQWUsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDLEVBQUUsV0FBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FB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Ozt3QkFBckYsR0FBRyxHQUFHLFNBQStFO3dCQUMzRixzQkFBTyxHQUFHLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxVQUFDLENBQUMsSUFBSyxPQUFBLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQVYsQ0FBVSxDQUFDLEVBQUM7Ozs7S0FDOUM7SUFFRDs7Ozs7Ozs7OztPQVVHO0lBQ0csdUNBQWtCLEdBQXhCLFVBQXlCLFNBQXFCLEVBQUUsTUFBa0I7UUFBRSxvQkFBZ0M7YUFBaEMsVUFBZ0MsRUFBaEMscUJBQWdDLEVBQWhDLElBQWdDO1lBQWhDLG1DQUFnQzs7Ozs7Ozt3QkFFMUYsR0FBRyxHQUFHLElBQUksb0JBQWtCLENBQUM7NEJBQy9CLFNBQVMsRUFBRSxTQUFTOzRCQUNwQixNQUFNLFFBQUE7NEJBQ04sVUFBVSxZQUFBOzRCQUNWLE9BQU8sRUFBRSxzQkFBYzt5QkFDMUIsQ0FBQyxDQUFDO3dCQUVXLHFCQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUE2QixHQUFHLEVBQUUsdUNBQTBCLENBQUMsRUFBQTs7d0JBQXpGLEtBQUssR0FBRyxTQUFpRjt3QkFDL0Ysc0JBQU8sS0FBSyxDQUFDLE9BQU8sRUFBQzs7OztLQUN4QjtJQUNMLGlCQUFDO0FBQUQsQ0FBQyxBQTNRRCxJQTJRQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBMb2cgZnJvbSBcIn4vbGliL2NvdGhvcml0eS9sb2dcIjtcbmltcG9ydCBMb25nIGZyb20gXCJsb25nXCI7XG5pbXBvcnQgeyBSdWxlIH0gZnJvbSBcIi4uL2RhcmNcIjtcbmltcG9ydCBEYXJjIGZyb20gXCIuLi9kYXJjL2RhcmNcIjtcbmltcG9ydCBJZGVudGl0eUVkMjU1MTkgZnJvbSBcIi4uL2RhcmMvaWRlbnRpdHktZWQyNTUxOVwiO1xuaW1wb3J0IElkZW50aXR5V3JhcHBlciwgeyBJSWRlbnRpdHkgfSBmcm9tIFwiLi4vZGFyYy9pZGVudGl0eS13cmFwcGVyXCI7XG5pbXBvcnQgeyBJQ29ubmVjdGlvbiwgUm9zdGVyV1NDb25uZWN0aW9uLCBXZWJTb2NrZXRDb25uZWN0aW9uIH0gZnJvbSBcIi4uL25ldHdvcmsvY29ubmVjdGlvblwiO1xuaW1wb3J0IHsgUm9zdGVyIH0gZnJvbSBcIi4uL25ldHdvcmsvcHJvdG9cIjtcbmltcG9ydCB7IFNraXBCbG9jayB9IGZyb20gXCIuLi9za2lwY2hhaW4vc2tpcGJsb2NrXCI7XG5pbXBvcnQgU2tpcGNoYWluUlBDIGZyb20gXCIuLi9za2lwY2hhaW4vc2tpcGNoYWluLXJwY1wiO1xuaW1wb3J0IENsaWVudFRyYW5zYWN0aW9uLCB7IElDb3VudGVyVXBkYXRlciB9IGZyb20gXCIuL2NsaWVudC10cmFuc2FjdGlvblwiO1xuaW1wb3J0IENoYWluQ29uZmlnIGZyb20gXCIuL2NvbmZpZ1wiO1xuaW1wb3J0IERhcmNJbnN0YW5jZSBmcm9tIFwiLi9jb250cmFjdHMvZGFyYy1pbnN0YW5jZVwiO1xuaW1wb3J0IHsgSW5zdGFuY2VJRCB9IGZyb20gXCIuL2luc3RhbmNlXCI7XG5pbXBvcnQgUHJvb2YgZnJvbSBcIi4vcHJvb2ZcIjtcbmltcG9ydCBDaGVja0F1dGhvcml6YXRpb24sIHsgQ2hlY2tBdXRob3JpemF0aW9uUmVzcG9uc2UgfSBmcm9tIFwiLi9wcm90by9jaGVjay1hdXRoXCI7XG5pbXBvcnQge1xuICAgIEFkZFR4UmVxdWVzdCxcbiAgICBBZGRUeFJlc3BvbnNlLFxuICAgIENyZWF0ZUdlbmVzaXNCbG9jayxcbiAgICBDcmVhdGVHZW5lc2lzQmxvY2tSZXNwb25zZSxcbiAgICBHZXRQcm9vZixcbiAgICBHZXRQcm9vZlJlc3BvbnNlLFxuICAgIEdldFNpZ25lckNvdW50ZXJzLFxuICAgIEdldFNpZ25lckNvdW50ZXJzUmVzcG9uc2UsXG59IGZyb20gXCIuL3Byb3RvL3JlcXVlc3RzXCI7XG5cbmV4cG9ydCBjb25zdCBjdXJyZW50VmVyc2lvbiA9IDE7XG5cbmNvbnN0IENPTkZJR19JTlNUQU5DRV9JRCA9IEJ1ZmZlci5hbGxvYygzMiwgMCk7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEJ5ekNvaW5SUEMgaW1wbGVtZW50cyBJQ291bnRlclVwZGF0ZXIge1xuXG4gICAgZ2V0IGdlbmVzaXNJRCgpOiBJbnN0YW5jZUlEIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2VuZXNpcy5jb21wdXRlSGFzaCgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEhlbHBlciB0byBjcmVhdGUgYSBnZW5lc2lzIGRhcmNcbiAgICAgKiBAcGFyYW0gc2lnbmVycyAgICAgICBBdXRob3JpemVkIHNpZ25lcnNcbiAgICAgKiBAcGFyYW0gcm9zdGVyICAgICAgICBSb3N0ZXIgdGhhdCB3aWxsIGJlIHVzZWRcbiAgICAgKiBAcGFyYW0gZGVzY3JpcHRpb24gICBBbiBvcHRpb25hbCBkZXNjcmlwdGlvbiBmb3IgdGhlIGNoYWluXG4gICAgICovXG4gICAgc3RhdGljIG1ha2VHZW5lc2lzRGFyYyhzaWduZXJzOiBJSWRlbnRpdHlbXSwgcm9zdGVyOiBSb3N0ZXIsIGRlc2NyaXB0aW9uPzogc3RyaW5nKTogRGFyYyB7XG4gICAgICAgIGlmIChzaWduZXJzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwibm8gaWRlbnRpdGllc1wiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGQgPSBEYXJjLmNyZWF0ZUJhc2ljKHNpZ25lcnMsIHNpZ25lcnMsIEJ1ZmZlci5mcm9tKGRlc2NyaXB0aW9uIHx8IFwiR2VuZXNpcyBkYXJjXCIpKTtcbiAgICAgICAgcm9zdGVyLmxpc3QuZm9yRWFjaCgoc3J2aWQpID0+IHtcbiAgICAgICAgICAgIGQuYWRkSWRlbnRpdHkoXCJpbnZva2U6Y29uZmlnLnZpZXdfY2hhbmdlXCIsIElkZW50aXR5RWQyNTUxOS5mcm9tUG9pbnQoc3J2aWQuZ2V0UHVibGljKCkpLCBSdWxlLk9SKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgc2lnbmVycy5mb3JFYWNoKChzaWduZXIpID0+IHtcbiAgICAgICAgICAgIGQuYWRkSWRlbnRpdHkoXCJzcGF3bjpkYXJjXCIsIHNpZ25lciwgUnVsZS5PUik7XG4gICAgICAgICAgICBkLmFkZElkZW50aXR5KFwiaW52b2tlOmNvbmZpZy51cGRhdGVfY29uZmlnXCIsIHNpZ25lciwgUnVsZS5PUik7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBkO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlY3JlYXRlIGEgYnl6Y29pbiBSUEMgZnJvbSBhIGdpdmVuIHJvc3RlclxuICAgICAqIEBwYXJhbSByb3N0ZXIgICAgICAgIFRoZSByb3N0ZXIgdG8gYXNrIGZvciB0aGUgY29uZmlnIGFuZCBkYXJjXG4gICAgICogQHBhcmFtIHNraXBjaGFpbklEICAgVGhlIGdlbmVzaXMgYmxvY2sgaWRlbnRpZmllclxuICAgICAqIEBwYXJhbSB3YWl0TWF0Y2ggaG93IG1hbnkgdGltZXMgdG8gd2FpdCBmb3IgYSBtYXRjaCAtIHVzZWZ1bCBpZiBpdHMgY2FsbGVkIGp1c3QgYWZ0ZXIgYW4gYWRkVHJhbnNhY3Rpb25BbmRXYWl0LlxuICAgICAqIEBwYXJhbSBpbnRlcnZhbCBob3cgbG9uZyB0byB3YWl0IGJldHdlZW4gdHdvIGF0dGVtcHRzIGluIHdhaXRNYXRjaC5cbiAgICAgKiBAcmV0dXJucyBhIHByb21pc2UgdGhhdCByZXNvbHZlcyB3aXRoIHRoZSBpbml0aWFsaXplZCBCeXpDb2luIGluc3RhbmNlXG4gICAgICovXG4gICAgc3RhdGljIGFzeW5jIGZyb21CeXpjb2luKHJvc3RlcjogUm9zdGVyLCBza2lwY2hhaW5JRDogQnVmZmVyLCB3YWl0TWF0Y2g6IG51bWJlciA9IDAsIGludGVydmFsOiBudW1iZXIgPSAxMDAwKTpcbiAgICAgICAgUHJvbWlzZTxCeXpDb2luUlBDPiB7XG4gICAgICAgIGNvbnN0IHJwYyA9IG5ldyBCeXpDb2luUlBDKCk7XG4gICAgICAgIHJwYy5jb25uID0gbmV3IFJvc3RlcldTQ29ubmVjdGlvbihyb3N0ZXIsIFwiQnl6Q29pblwiKTtcblxuICAgICAgICBjb25zdCBza2lwY2hhaW4gPSBuZXcgU2tpcGNoYWluUlBDKHJvc3Rlcik7XG4gICAgICAgIHJwYy5nZW5lc2lzID0gYXdhaXQgc2tpcGNoYWluLmdldFNraXBCbG9jayhza2lwY2hhaW5JRCk7XG4gICAgICAgIHJwYy5sYXRlc3QgPSBycGMuZ2VuZXNpcztcblxuICAgICAgICBjb25zdCBjY1Byb29mID0gYXdhaXQgcnBjLmdldFByb29mKENPTkZJR19JTlNUQU5DRV9JRCwgd2FpdE1hdGNoLCBpbnRlcnZhbCk7XG4gICAgICAgIHJwYy5jb25maWcgPSBDaGFpbkNvbmZpZy5mcm9tUHJvb2YoY2NQcm9vZik7XG5cbiAgICAgICAgY29uc3QgZGkgPSBhd2FpdCBEYXJjSW5zdGFuY2UuZnJvbUJ5emNvaW4ocnBjLCBjY1Byb29mLnN0YXRlQ2hhbmdlQm9keS5kYXJjSUQsIHdhaXRNYXRjaCwgaW50ZXJ2YWwpO1xuICAgICAgICBycGMuZ2VuZXNpc0RhcmMgPSBkaS5kYXJjO1xuXG4gICAgICAgIHJldHVybiBycGM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGEgbmV3IGJ5emNvaW4gY2hhaW4gYW5kIHJldHVybiBhIGFzc29jaWF0ZWQgUlBDXG4gICAgICogQHBhcmFtIHJvc3RlciAgICAgICAgVGhlIHJvc3RlciB0byB1c2UgdG8gY3JlYXRlIHRoZSBnZW5lc2lzIGJsb2NrXG4gICAgICogQHBhcmFtIGRhcmMgICAgICAgICAgVGhlIGdlbmVzaXMgZGFyY1xuICAgICAqIEBwYXJhbSBibG9ja0ludGVydmFsIFRoZSBpbnRlcnZhbCBvZiBibG9jayBjcmVhdGlvbiBpbiBuYW5vc2Vjb25kc1xuICAgICAqL1xuICAgIHN0YXRpYyBhc3luYyBuZXdCeXpDb2luUlBDKHJvc3RlcjogUm9zdGVyLCBkYXJjOiBEYXJjLCBibG9ja0ludGVydmFsOiBMb25nKTogUHJvbWlzZTxCeXpDb2luUlBDPiB7XG4gICAgICAgIGNvbnN0IHJwYyA9IG5ldyBCeXpDb2luUlBDKCk7XG4gICAgICAgIHJwYy5jb25uID0gbmV3IFdlYlNvY2tldENvbm5lY3Rpb24ocm9zdGVyLmxpc3RbMF0uZ2V0V2ViU29ja2V0QWRkcmVzcygpLCBcIkJ5ekNvaW5cIik7XG4gICAgICAgIHJwYy5nZW5lc2lzRGFyYyA9IGRhcmM7XG4gICAgICAgIHJwYy5jb25maWcgPSBuZXcgQ2hhaW5Db25maWcoe2Jsb2NrSW50ZXJ2YWx9KTtcblxuICAgICAgICBjb25zdCByZXEgPSBuZXcgQ3JlYXRlR2VuZXNpc0Jsb2NrKHtcbiAgICAgICAgICAgIGJsb2NrSW50ZXJ2YWwsXG4gICAgICAgICAgICBkYXJjQ29udHJhY3RJRHM6IFtEYXJjSW5zdGFuY2UuY29udHJhY3RJRF0sXG4gICAgICAgICAgICBnZW5lc2lzRGFyYzogZGFyYyxcbiAgICAgICAgICAgIHJvc3RlcixcbiAgICAgICAgICAgIHZlcnNpb246IGN1cnJlbnRWZXJzaW9uLFxuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCByZXQgPSBhd2FpdCBycGMuY29ubi5zZW5kPENyZWF0ZUdlbmVzaXNCbG9ja1Jlc3BvbnNlPihyZXEsIENyZWF0ZUdlbmVzaXNCbG9ja1Jlc3BvbnNlKTtcbiAgICAgICAgcnBjLmdlbmVzaXMgPSByZXQuc2tpcGJsb2NrO1xuICAgICAgICBycGMubGF0ZXN0ID0gcmV0LnNraXBibG9jaztcbiAgICAgICAgYXdhaXQgcnBjLnVwZGF0ZUNvbmZpZygpO1xuXG4gICAgICAgIHJldHVybiBycGM7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZW5lc2lzRGFyYzogRGFyYztcbiAgICBwcml2YXRlIGNvbmZpZzogQ2hhaW5Db25maWc7XG4gICAgcHJpdmF0ZSBnZW5lc2lzOiBTa2lwQmxvY2s7XG4gICAgcHJpdmF0ZSBsYXRlc3Q6IFNraXBCbG9jaztcbiAgICBwcml2YXRlIGNvbm46IElDb25uZWN0aW9uO1xuXG4gICAgcHJvdGVjdGVkIGNvbnN0cnVjdG9yKCkge31cblxuICAgIC8qKlxuICAgICAqIEdldHRlciBmb3IgdGhlIGdlbmVzaXMgZGFyY1xuICAgICAqIEByZXR1cm5zIHRoZSBnZW5lc2lzIGRhcmNcbiAgICAgKi9cbiAgICBnZXREYXJjKCk6IERhcmMge1xuICAgICAgICByZXR1cm4gdGhpcy5nZW5lc2lzRGFyYztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXR0ZXIgZm9yIHRoZSBjaGFpbiBjb25maWd1cmF0aW9uXG4gICAgICogQHJldHVybnMgdGhlIGNvbmZpZ3VyYXRpb25cbiAgICAgKi9cbiAgICBnZXRDb25maWcoKTogQ2hhaW5Db25maWcge1xuICAgICAgICByZXR1cm4gdGhpcy5jb25maWc7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0dGVyIGZvciB0aGUgZ2VuZXNpcyBibG9ja1xuICAgICAqIEByZXR1cm5zIHRoZSBnZW5lc2lzIGJsb2NrXG4gICAgICovXG4gICAgZ2V0R2VuZXNpcygpOiBTa2lwQmxvY2sge1xuICAgICAgICByZXR1cm4gdGhpcy5nZW5lc2lzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNlbmRzIGEgdHJhbnNhY3Rpb24gdG8gYnl6Y29pbiBhbmQgd2FpdHMgZm9yIHVwIHRvICd3YWl0JyBibG9ja3MgZm9yIHRoZVxuICAgICAqIHRyYW5zYWN0aW9uIHRvIGJlIGluY2x1ZGVkIGluIHRoZSBnbG9iYWwgc3RhdGUuIElmIG1vcmUgdGhhbiAnd2FpdCcgYmxvY2tzXG4gICAgICogYXJlIGNyZWF0ZWQgYW5kIHRoZSB0cmFuc2FjdGlvbiBpcyBub3QgaW5jbHVkZWQsIGFuIGV4Y2VwdGlvbiB3aWxsIGJlIHJhaXNlZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB0cmFuc2FjdGlvbiBpcyB0aGUgY2xpZW50IHRyYW5zYWN0aW9uIGhvbGRpbmdcbiAgICAgKiBvbmUgb3IgbW9yZSBpbnN0cnVjdGlvbnMgdG8gYmUgc2VudCB0byBieXpjb2luLlxuICAgICAqIEBwYXJhbSB3YWl0IGluZGljYXRlcyB0aGUgbnVtYmVyIG9mIGJsb2NrcyB0byB3YWl0IGZvciB0aGVcbiAgICAgKiB0cmFuc2FjdGlvbiB0byBiZSBpbmNsdWRlZFxuICAgICAqIEByZXR1cm5zIGEgcHJvbWlzZSB0aGF0IGdldHMgcmVzb2x2ZWQgaWYgdGhlIGJsb2NrIGhhcyBiZWVuIGluY2x1ZGVkXG4gICAgICovXG4gICAgc2VuZFRyYW5zYWN0aW9uQW5kV2FpdCh0cmFuc2FjdGlvbjogQ2xpZW50VHJhbnNhY3Rpb24sIHdhaXQ6IG51bWJlciA9IDEwKTogUHJvbWlzZTxBZGRUeFJlc3BvbnNlPiB7XG4gICAgICAgIGNvbnN0IHJlcSA9IG5ldyBBZGRUeFJlcXVlc3Qoe1xuICAgICAgICAgICAgaW5jbHVzaW9ud2FpdDogd2FpdCxcbiAgICAgICAgICAgIHNraXBjaGFpbklEOiB0aGlzLmdlbmVzaXMuaGFzaCxcbiAgICAgICAgICAgIHRyYW5zYWN0aW9uLFxuICAgICAgICAgICAgdmVyc2lvbjogY3VycmVudFZlcnNpb24sXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiB0aGlzLmNvbm4uc2VuZChyZXEsIEFkZFR4UmVzcG9uc2UpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgbGF0ZXN0IGNvbmZpZ3VyYXRpb24gZm9yIHRoZSBjaGFpbiBhbmQgdXBkYXRlIHRoZSBsb2NhbFxuICAgICAqIGNhY2hlXG4gICAgICovXG4gICAgYXN5bmMgdXBkYXRlQ29uZmlnKCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBjb25zdCBwciA9IGF3YWl0IHRoaXMuZ2V0UHJvb2ZGcm9tTGF0ZXN0KENPTkZJR19JTlNUQU5DRV9JRCk7XG4gICAgICAgIHRoaXMuY29uZmlnID0gQ2hhaW5Db25maWcuZnJvbVByb29mKHByKTtcblxuICAgICAgICBjb25zdCBkYXJjSUlEID0gcHIuc3RhdGVDaGFuZ2VCb2R5LmRhcmNJRDtcbiAgICAgICAgY29uc3QgZ2VuZXNpc0RhcmNJbnN0YW5jZSA9IGF3YWl0IERhcmNJbnN0YW5jZS5mcm9tQnl6Y29pbih0aGlzLCBkYXJjSUlEKTtcblxuICAgICAgICB0aGlzLmdlbmVzaXNEYXJjID0gZ2VuZXNpc0RhcmNJbnN0YW5jZS5kYXJjO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldHMgYSBwcm9vZiBmcm9tIGJ5emNvaW4gdG8gc2hvdyB0aGF0IGEgZ2l2ZW4gaW5zdGFuY2UgaXMgaW4gdGhlXG4gICAgICogZ2xvYmFsIHN0YXRlLiBUaGUgcHJvb2YgYWx3YXlzIHN0YXJ0cyBmcm9tIHRoZSBnZW5lc2lzIGJsb2NrLlxuICAgICAqXG4gICAgICogQHBhcmFtIGlkIHRoZSBpbnN0YW5jZSBrZXlcbiAgICAgKiBAcGFyYW0gd2FpdE1hdGNoIG51bWJlciBvZiBtaWxsaXNlY29uZHMgdG8gd2FpdCBpZiB0aGUgcHJvb2YgaXMgZmFsc2VcbiAgICAgKiBAcGFyYW0gaW50ZXJ2YWwgaG93IGxvbmcgdG8gd2FpdCBiZWZvcmUgY2hlY2tpbmcgZm9yIGEgbWF0Y2ggYWdhaW5cbiAgICAgKiBAcmV0dXJuIGEgcHJvbWlzZSB0aGF0IHJlc29sdmVzIHdpdGggdGhlIHByb29mLCByZWplY3Rpbmcgb3RoZXJ3aXNlXG4gICAgICovXG4gICAgYXN5bmMgZ2V0UHJvb2YoaWQ6IEJ1ZmZlciwgd2FpdE1hdGNoOiBudW1iZXIgPSAwLCBpbnRlcnZhbDogbnVtYmVyID0gMTAwMCk6IFByb21pc2U8UHJvb2Y+IHtcbiAgICAgICAgaWYgKCF0aGlzLmdlbmVzaXMpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlJQQyBub3QgaW5pdGlhbGl6ZWQgd2l0aCB0aGUgZ2VuZXNpcyBibG9ja1wiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLmdldFByb29mRnJvbSh0aGlzLmdlbmVzaXMsIGlkLCB3YWl0TWF0Y2gsIGludGVydmFsKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXRzIGEgcHJvb2YgZnJvbSBieXpjb2luIHRvIHNob3cgdGhhdCBhIGdpdmVuIGluc3RhbmNlIGlzIGluIHRoZVxuICAgICAqIGdsb2JhbCBzdGF0ZS4gVGhlIHByb29mIHN0YXJ0cyBmcm9tIHRoZSBsYXRlc3Qga25vd24gYmxvY2suXG4gICAgICogQ2F1dGlvbjogSWYgeW91IG5lZWQgdG8gcGFzcyB0aGUgUHJvb2Ygb253YXJkcyB0byBhbm90aGVyIHNlcnZlcixcbiAgICAgKiB5b3UgbXVzdCB1c2UgZ2V0UHJvb2YgaW4gb3JkZXIgdG8gY3JlYXRlIGEgY29tcGxldGUgc3RhbmRhbG9uZVxuICAgICAqIHByb29mIHN0YXJ0aW5nIGZyb20gdGhlIGdlbmVzaXMgYmxvY2suXG4gICAgICpcbiAgICAgKiBAcGFyYW0gaWQgdGhlIGluc3RhbmNlIGtleVxuICAgICAqIEBwYXJhbSB3YWl0TWF0Y2ggbnVtYmVyIG9mIG1pbGxpc2Vjb25kcyB0byB3YWl0IGlmIHRoZSBwcm9vZiBpcyBmYWxzZVxuICAgICAqIEBwYXJhbSBpbnRlcnZhbCBob3cgbG9uZyB0byB3YWl0IGJlZm9yZSBjaGVja2luZyBmb3IgYSBtYXRjaCBhZ2FpblxuICAgICAqIEByZXR1cm4gYSBwcm9taXNlIHRoYXQgcmVzb2x2ZXMgd2l0aCB0aGUgcHJvb2YsIHJlamVjdGluZyBvdGhlcndpc2VcbiAgICAgKi9cbiAgICBhc3luYyBnZXRQcm9vZkZyb21MYXRlc3QoaWQ6IEJ1ZmZlciwgd2FpdE1hdGNoOiBudW1iZXIgPSAwLCBpbnRlcnZhbDogbnVtYmVyID0gMTAwMCk6IFByb21pc2U8UHJvb2Y+IHtcbiAgICAgICAgaWYgKCF0aGlzLmxhdGVzdCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwibm8gbGF0ZXN0IGJsb2NrIGZvdW5kXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0UHJvb2ZGcm9tKHRoaXMubGF0ZXN0LCBpZCwgd2FpdE1hdGNoLCBpbnRlcnZhbCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0cyBhIHByb29mIGZyb20gYnl6Y29pbiB0byBzaG93IHRoYXQgYSBnaXZlbiBpbnN0YW5jZSBpcyBpbiB0aGVcbiAgICAgKiBnbG9iYWwgc3RhdGUuIFRoZSBwcm9vZiBzdGFydHMgZnJvbSB0aGUgYmxvY2sgZ2l2ZW4gaW4gcGFyYW1ldGVyLlxuICAgICAqIENhdXRpb246IElmIHlvdSBuZWVkIHRvIHBhc3MgdGhlIFByb29mIG9ud2FyZHMgdG8gYW5vdGhlciBzZXJ2ZXIsXG4gICAgICogeW91IG11c3QgdXNlIGdldFByb29mIGluIG9yZGVyIHRvIGNyZWF0ZSBhIGNvbXBsZXRlIHN0YW5kYWxvbmVcbiAgICAgKiBwcm9vZiBzdGFydGluZyBmcm9tIHRoZSBnZW5lc2lzIGJsb2NrLlxuICAgICAqXG4gICAgICogQHBhcmFtIGlkIHRoZSBpbnN0YW5jZSBrZXlcbiAgICAgKiBAcGFyYW0gd2FpdE1hdGNoIG51bWJlciBvZiBtaWxsaXNlY29uZHMgdG8gd2FpdCBpZiB0aGUgcHJvb2YgaXMgZmFsc2VcbiAgICAgKiBAcGFyYW0gaW50ZXJ2YWwgaG93IGxvbmcgdG8gd2FpdCBiZWZvcmUgY2hlY2tpbmcgZm9yIGEgbWF0Y2ggYWdhaW5cbiAgICAgKiBAcmV0dXJuIGEgcHJvbWlzZSB0aGF0IHJlc29sdmVzIHdpdGggdGhlIHByb29mLCByZWplY3Rpbmcgb3RoZXJ3aXNlXG4gICAgICovXG4gICAgYXN5bmMgZ2V0UHJvb2ZGcm9tKGZyb206IFNraXBCbG9jaywgaWQ6IEJ1ZmZlciwgd2FpdE1hdGNoOiBudW1iZXIgPSAwLCBpbnRlcnZhbDogbnVtYmVyID0gMTAwMCk6IFByb21pc2U8UHJvb2Y+IHtcbiAgICAgICAgY29uc3QgcmVxID0gbmV3IEdldFByb29mKHtcbiAgICAgICAgICAgIGlkOiBmcm9tLmhhc2gsXG4gICAgICAgICAgICBrZXk6IGlkLFxuICAgICAgICAgICAgdmVyc2lvbjogY3VycmVudFZlcnNpb24sXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IHJlcGx5ID0gYXdhaXQgdGhpcy5jb25uLnNlbmQ8R2V0UHJvb2ZSZXNwb25zZT4ocmVxLCBHZXRQcm9vZlJlc3BvbnNlKTtcbiAgICAgICAgaWYgKHdhaXRNYXRjaCA+IDAgJiYgIXJlcGx5LnByb29mLmV4aXN0cyhpZCkpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZ2V0UHJvb2ZGcm9tKGZyb20sIGlkLCB3YWl0TWF0Y2ggLSBpbnRlcnZhbCwgaW50ZXJ2YWwpLnRoZW4ocmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgICAgICAgICB9LCBpbnRlcnZhbCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGVyciA9IHJlcGx5LnByb29mLnZlcmlmeUZyb20oZnJvbSk7XG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMubGF0ZXN0ID0gcmVwbHkucHJvb2YubGF0ZXN0O1xuXG4gICAgICAgIHJldHVybiByZXBseS5wcm9vZjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIGxhdGVzdCBjb3VudGVyIGZvciB0aGUgZ2l2ZW4gc2lnbmVycyBhbmQgaW5jcmVhc2UgaXQgd2l0aCBhIGdpdmVuIHZhbHVlXG4gICAgICpcbiAgICAgKiBAcGFyYW0gaWRzIFRoZSBpZGVudGlmaWVycyBvZiB0aGUgc2lnbmVyc1xuICAgICAqIEBwYXJhbSBhZGQgVGhlIGluY3JlbWVudFxuICAgICAqIEByZXR1cm5zIHRoZSBvcmRlcmVkIGxpc3Qgb2YgY291bnRlcnNcbiAgICAgKi9cbiAgICBhc3luYyBnZXRTaWduZXJDb3VudGVycyhpZHM6IElJZGVudGl0eVtdLCBhZGQ6IG51bWJlciA9IDApOiBQcm9taXNlPExvbmdbXT4ge1xuICAgICAgICBjb25zdCByZXEgPSBuZXcgR2V0U2lnbmVyQ291bnRlcnMoe1xuICAgICAgICAgICAgc2lnbmVySURzOiBpZHMubWFwKChpZCkgPT4gaWQudG9TdHJpbmcoKSksXG4gICAgICAgICAgICBza2lwY2hhaW5JRDogdGhpcy5nZW5lc2lzLmhhc2gsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IHJlcCA9IGF3YWl0IHRoaXMuY29ubi5zZW5kPEdldFNpZ25lckNvdW50ZXJzUmVzcG9uc2U+KHJlcSwgR2V0U2lnbmVyQ291bnRlcnNSZXNwb25zZSk7XG4gICAgICAgIHJldHVybiByZXAuY291bnRlcnMubWFwKChjKSA9PiBjLmFkZChhZGQpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBjaGVja3MgdGhlIGF1dGhvcml6YXRpb24gb2YgYSBzZXQgb2YgaWRlbnRpdGllcyB3aXRoIHJlc3BlY3QgdG8gYSBnaXZlbiBkYXJjLiBUaGlzIGNhbGxzXG4gICAgICogYW4gT21uaUxlZGdlciBub2RlIGFuZCB0cnVzdHMgaXQgdG8gcmV0dXJuIHRoZSBuYW1lIG9mIHRoZSBhY3Rpb25zIHRoYXQgYSBoeXBvdGV0aGljIHNldCBvZlxuICAgICAqIHNpZ25hdHVyZXMgZnJvbSB0aGUgZ2l2ZW4gaWRlbnRpdGllcyBjYW4gZXhlY3V0ZSB1c2luZyB0aGUgZ2l2ZW4gZGFyYy5cbiAgICAgKlxuICAgICAqIFRoaXMgaXMgdXNlZnVsIGlmIGEgZGFyYyBkZWxlZ2F0ZXMgb25lIG9yIG1vcmUgYWN0aW9ucyB0byBvdGhlciBkYXJjLCB3aG8gZGVsZWdhdGUgYWxzbywgc29cbiAgICAgKiB0aGlzIGNhbGwgd2lsbCB0ZXN0IHdoYXQgYWN0aW9ucyBhcmUgcG9zc2libGUgdG8gYmUgZXhlY3V0ZWQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gZGFyY0lEIHRoZSBiYXNlIGRhcmMgd2hvc2UgYWN0aW9ucyBhcmUgdmVyaWZpZWRcbiAgICAgKiBAcGFyYW0gaWRlbnRpdGllcyB0aGUgc2V0IG9mIGlkZW50aXRpZXMgdGhhdCBhcmUgaHlwb3RoZXRpY2FsbHkgc2lnbmluZ1xuICAgICAqL1xuICAgIGFzeW5jIGNoZWNrQXV0aG9yaXphdGlvbihieXpDb2luSUQ6IEluc3RhbmNlSUQsIGRhcmNJRDogSW5zdGFuY2VJRCwgLi4uaWRlbnRpdGllczogSWRlbnRpdHlXcmFwcGVyW10pXG4gICAgICAgIDogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgICAgICBjb25zdCByZXEgPSBuZXcgQ2hlY2tBdXRob3JpemF0aW9uKHtcbiAgICAgICAgICAgIGJ5emNvaW5JRDogYnl6Q29pbklELFxuICAgICAgICAgICAgZGFyY0lELFxuICAgICAgICAgICAgaWRlbnRpdGllcyxcbiAgICAgICAgICAgIHZlcnNpb246IGN1cnJlbnRWZXJzaW9uLFxuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCByZXBseSA9IGF3YWl0IHRoaXMuY29ubi5zZW5kPENoZWNrQXV0aG9yaXphdGlvblJlc3BvbnNlPihyZXEsIENoZWNrQXV0aG9yaXphdGlvblJlc3BvbnNlKTtcbiAgICAgICAgcmV0dXJuIHJlcGx5LmFjdGlvbnM7XG4gICAgfVxufVxuIl19