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
var byzcoin_rpc_1 = __importDefault(require("../byzcoin/byzcoin-rpc"));
var client_transaction_1 = __importStar(require("../byzcoin/client-transaction"));
var coin_instance_1 = __importStar(require("../byzcoin/contracts/coin-instance"));
var darc_instance_1 = __importDefault(require("../byzcoin/contracts/darc-instance"));
var instance_1 = __importDefault(require("../byzcoin/instance"));
var calypso_1 = require("../calypso");
var calypso_instance_1 = require("../calypso/calypso-instance");
var darc_1 = __importDefault(require("../darc/darc"));
var rules_1 = require("../darc/rules");
var log_1 = __importDefault(require("../log"));
var protobuf_1 = require("../protobuf");
var credentials_instance_1 = __importDefault(require("./credentials-instance"));
var pop_party_instance_1 = require("./pop-party-instance");
var ro_pa_sci_instance_1 = __importStar(require("./ro-pa-sci-instance"));
exports.SPAWNER_COIN = Buffer.alloc(32, 0);
exports.SPAWNER_COIN.write("SpawnerCoin");
var SpawnerInstance = /** @class */ (function (_super) {
    __extends(SpawnerInstance, _super);
    /**
     * Creates a new SpawnerInstance
     * @param bc        The ByzCoinRPC instance
     * @param iid       The instance ID
     * @param spawner   Parameters for the spawner: costs and names
     */
    function SpawnerInstance(rpc, inst) {
        var _this = _super.call(this, inst) || this;
        _this.rpc = rpc;
        if (inst.contractID.toString() !== SpawnerInstance.contractID) {
            throw new Error("mismatch contract name: " + inst.contractID + " vs " + SpawnerInstance.contractID);
        }
        _this.struct = SpawnerStruct.decode(inst.data);
        return _this;
    }
    Object.defineProperty(SpawnerInstance.prototype, "signupCost", {
        /**
         * Get the total cost required to sign up
         *
         * @returns the cost
         */
        get: function () {
            return this.struct.costCoin.value
                .add(this.struct.costDarc.value)
                .add(this.struct.costCredential.value);
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Spawn a spawner instance. It takes either an ICreateSpawner as single argument, or all the arguments
     * separated.
     *
     * @param params The ByzCoinRPC to use or an ICreateSpawner
     * @param darcID The darc instance ID
     * @param signers The list of signers
     * @param costs The different cost for new instances
     * @param beneficiary The beneficiary of the costs
     */
    SpawnerInstance.spawn = function (params, darcID, signers, costs, beneficiary) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, bc, args, inst, ctx;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (params instanceof byzcoin_rpc_1.default) {
                            bc = params;
                        }
                        else {
                            (_a = params, bc = _a.bc, darcID = _a.darcID, signers = _a.signers, costs = _a.costs, beneficiary = _a.beneficiary);
                        }
                        args = Object.keys(costs).map(function (k) {
                            var value = new coin_instance_1.Coin({ name: exports.SPAWNER_COIN, value: costs[k] }).toBytes();
                            return new client_transaction_1.Argument({ name: k, value: value });
                        }).concat([
                            new client_transaction_1.Argument({ name: "beneficiary", value: beneficiary }),
                        ]);
                        inst = client_transaction_1.Instruction.createSpawn(darcID, this.contractID, args);
                        ctx = new client_transaction_1.default({ instructions: [inst] });
                        return [4 /*yield*/, ctx.updateCountersAndSign(bc, [signers])];
                    case 1:
                        _b.sent();
                        return [4 /*yield*/, bc.sendTransactionAndWait(ctx)];
                    case 2:
                        _b.sent();
                        return [2 /*return*/, this.fromByzcoin(bc, inst.deriveId())];
                }
            });
        });
    };
    /**
     * Initializes using an existing coinInstance from ByzCoin
     *
     * @param bc an initialized byzcoin RPC instance
     * @param iid the instance-ID of the spawn-instance
     * @param waitMatch how many times to wait for a match - useful if its called just after an addTransactionAndWait.
     * @param interval how long to wait between two attempts in waitMatch.
     */
    SpawnerInstance.fromByzcoin = function (bc, iid, waitMatch, interval) {
        if (waitMatch === void 0) { waitMatch = 0; }
        if (interval === void 0) { interval = 1000; }
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _a = SpawnerInstance.bind;
                        _b = [void 0, bc];
                        return [4 /*yield*/, instance_1.default.fromByzcoin(bc, iid, waitMatch, interval)];
                    case 1: return [2 /*return*/, new (_a.apply(SpawnerInstance, _b.concat([_c.sent()])))()];
                }
            });
        });
    };
    /**
     * Update the data of this instance
     *
     * @returns a promise that resolves once the data is up-to-date
     */
    SpawnerInstance.prototype.update = function () {
        return __awaiter(this, void 0, void 0, function () {
            var proof;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.rpc.getProofFromLatest(this.id)];
                    case 1:
                        proof = _a.sent();
                        this.struct = SpawnerStruct.decode(proof.value);
                        return [2 /*return*/, this];
                }
            });
        });
    };
    /**
     * Create the instructions necessary to spawn one or more darcs. This is separated from the
     * spanDarcs method itself, so that a caller can create a bigger ClientTransaction with
     * multiple sets of instructions inside.
     *
     * @param coin where to take the coins from
     * @param darcs the darcs to create
     */
    SpawnerInstance.prototype.spawnDarcInstructions = function (coin) {
        var _this = this;
        var darcs = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            darcs[_i - 1] = arguments[_i];
        }
        var cost = this.struct.costDarc.value.mul(darcs.length);
        var ret = [
            client_transaction_1.Instruction.createInvoke(coin.id, coin_instance_1.default.contractID, coin_instance_1.default.commandFetch, [new client_transaction_1.Argument({ name: coin_instance_1.default.argumentCoins, value: Buffer.from(cost.toBytesLE()) })])
        ].concat(darcs.map(function (darc) {
            return client_transaction_1.Instruction.createSpawn(_this.id, darc_instance_1.default.contractID, [new client_transaction_1.Argument({ name: SpawnerInstance.argumentDarc, value: darc.toBytes() })]);
        }));
        return ret;
    };
    /**
     * Spawns one or more darc and returns an array of all the spawned darcs.
     *
     * @param coin      The coin instance to take coins from
     * @param signers   The signers for the transaction
     * @param darcs... All the darcs to spawn using the spawner. The coin instance must have enough
     * coins to pay for all darcs.
     * @returns a promise that resolves with the new array of the instantiated darc instances
     */
    SpawnerInstance.prototype.spawnDarcs = function (coin, signers) {
        var darcs = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            darcs[_i - 2] = arguments[_i];
        }
        return __awaiter(this, void 0, void 0, function () {
            var ctx, dis, _a, darcs_1, da, _b, _c, e_1;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        ctx = new client_transaction_1.default({ instructions: this.spawnDarcInstructions.apply(this, [coin].concat(darcs)) });
                        return [4 /*yield*/, ctx.updateCountersAndSign(this.rpc, [signers])];
                    case 1:
                        _d.sent();
                        return [4 /*yield*/, this.rpc.sendTransactionAndWait(ctx)];
                    case 2:
                        _d.sent();
                        dis = [];
                        _a = 0, darcs_1 = darcs;
                        _d.label = 3;
                    case 3:
                        if (!(_a < darcs_1.length)) return [3 /*break*/, 8];
                        da = darcs_1[_a];
                        _d.label = 4;
                    case 4:
                        _d.trys.push([4, 6, , 7]);
                        // Because this call is directly after the sendTransactionAndWait, the new block might not be
                        // applied to all nodes yet.
                        _c = (_b = dis).push;
                        return [4 /*yield*/, darc_instance_1.default.fromByzcoin(this.rpc, da.getBaseID(), 2, 1000)];
                    case 5:
                        // Because this call is directly after the sendTransactionAndWait, the new block might not be
                        // applied to all nodes yet.
                        _c.apply(_b, [_d.sent()]);
                        return [3 /*break*/, 8];
                    case 6:
                        e_1 = _d.sent();
                        log_1.default.warn("couldn't get proof - perhaps still updating?");
                        return [3 /*break*/, 7];
                    case 7:
                        _a++;
                        return [3 /*break*/, 3];
                    case 8: return [2 /*return*/, dis];
                }
            });
        });
    };
    /**
     * Creates all the necessary instruction to create a new coin - either with a 0 balance, or with
     * a given balance by the caller.
     *
     * @param coin where to take the coins to create the instance
     * @param darcID the responsible darc for the new coin
     * @param coinID the type of coin - must be the same as the `coin` in case of balance > 0
     * @param balance how many coins to transfer to the new coin
     */
    SpawnerInstance.prototype.spawnCoinInstructions = function (coin, darcID, coinID, balance) {
        balance = balance || long_1.default.fromNumber(0);
        var valueBuf = this.struct.costCoin.value.add(balance).toBytesLE();
        return [
            client_transaction_1.Instruction.createInvoke(coin.id, coin_instance_1.default.contractID, coin_instance_1.default.commandFetch, [new client_transaction_1.Argument({ name: coin_instance_1.default.argumentCoins, value: Buffer.from(valueBuf) })]),
            client_transaction_1.Instruction.createSpawn(this.id, coin_instance_1.default.contractID, [
                new client_transaction_1.Argument({ name: SpawnerInstance.argumentCoinName, value: exports.SPAWNER_COIN }),
                new client_transaction_1.Argument({ name: SpawnerInstance.argumentCoinID, value: coinID }),
                new client_transaction_1.Argument({ name: SpawnerInstance.argumentDarcID, value: darcID }),
            ]),
        ];
    };
    /**
     * Create a coin instance for a given darc
     *
     * @param coin      The coin instance to take the coins from
     * @param signers   The signers for the transaction
     * @param darcID    The darc responsible for this coin
     * @param coinID    The instance-ID for the coin - will be calculated as sha256("coin" | coinID)
     * @param balance   The starting balance
     * @returns a promise that resolves with the new coin instance
     */
    SpawnerInstance.prototype.spawnCoin = function (coin, signers, darcID, coinID, balance) {
        return __awaiter(this, void 0, void 0, function () {
            var ctx;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        ctx = new client_transaction_1.default({
                            instructions: this.spawnCoinInstructions(coin, darcID, coinID, balance),
                        });
                        return [4 /*yield*/, ctx.updateCountersAndSign(this.rpc, [signers, []])];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.rpc.sendTransactionAndWait(ctx)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, coin_instance_1.default.fromByzcoin(this.rpc, coin_instance_1.default.coinIID(coinID), 2)];
                }
            });
        });
    };
    /**
     * Creates the instructions necessary to create a credential. This is separated from the spawnCredential
     * method, so that a caller can get the instructions separated and then put all the instructions
     * together in a big ClientTransaction.
     *
     * @param coin coin-instance to pay for the credential
     * @param darcID responsible darc for the credential
     * @param cred the credential structure
     * @param credID if given, used to calculate the iid of the credential, else the darcID will be used
     */
    SpawnerInstance.prototype.spawnCredentialInstruction = function (coin, darcID, cred, credID) {
        if (credID === void 0) { credID = null; }
        var valueBuf = this.struct.costCredential.value.toBytesLE();
        var credArgs = [
            new client_transaction_1.Argument({ name: SpawnerInstance.argumentDarcID, value: darcID }),
            new client_transaction_1.Argument({ name: SpawnerInstance.argumentCredential, value: cred.toBytes() }),
        ];
        if (credID) {
            credArgs.push(new client_transaction_1.Argument({ name: SpawnerInstance.argumentCredID, value: credID }));
        }
        return [
            client_transaction_1.Instruction.createInvoke(coin.id, coin_instance_1.default.contractID, coin_instance_1.default.commandFetch, [new client_transaction_1.Argument({ name: coin_instance_1.default.argumentCoins, value: Buffer.from(valueBuf) })]),
            client_transaction_1.Instruction.createSpawn(this.id, credentials_instance_1.default.contractID, credArgs),
        ];
    };
    /**
     * Create a credential instance for the given darc
     *
     * @param coin      The coin instance to take coins from
     * @param signers   The signers for the transaction
     * @param darcID    The darc instance ID
     * @param cred      The starting credentials
     * @param credID    The instance-ID for this credential - will be calculated as sha256("credential" | credID)
     * @returns a promise that resolves with the new credential instance
     */
    SpawnerInstance.prototype.spawnCredential = function (coin, signers, darcID, cred, credID) {
        if (credID === void 0) { credID = null; }
        return __awaiter(this, void 0, void 0, function () {
            var ctx, finalCredID;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        ctx = new client_transaction_1.default({
                            instructions: this.spawnCredentialInstruction(coin, darcID, cred, credID),
                        });
                        return [4 /*yield*/, ctx.updateCountersAndSign(this.rpc, [signers, []])];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.rpc.sendTransactionAndWait(ctx)];
                    case 2:
                        _a.sent();
                        finalCredID = credentials_instance_1.default.credentialIID(credID || darcID);
                        return [2 /*return*/, credentials_instance_1.default.fromByzcoin(this.rpc, finalCredID, 2)];
                }
            });
        });
    };
    /**
     * Create a PoP party
     *
     * @param coin The coin instance to take coins from
     * @param signers The signers for the transaction
     * @param orgs The list fo organisers
     * @param descr The data for the PoP party
     * @param reward The reward of an attendee
     * @returns a promise tha resolves with the new pop party instance
     */
    SpawnerInstance.prototype.spawnPopParty = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var coin, signers, orgs, desc, reward, _i, orgs_1, org, orgDarcIDs, valueBuf, orgDarc, ctx;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        coin = params.coin, signers = params.signers, orgs = params.orgs, desc = params.desc, reward = params.reward;
                        // Verify that all organizers have published their personhood public key
                        for (_i = 0, orgs_1 = orgs; _i < orgs_1.length; _i++) {
                            org = orgs_1[_i];
                            if (!org.getAttribute("personhood", "ed25519")) {
                                throw new Error("One of the organisers didn't publish his personhood key");
                            }
                        }
                        orgDarcIDs = orgs.map(function (org) { return org.darcID; });
                        valueBuf = this.struct.costDarc.value.add(this.struct.costParty.value).toBytesLE();
                        orgDarc = pop_party_instance_1.PopPartyInstance.preparePartyDarc(orgDarcIDs, "party-darc " + desc.name);
                        ctx = new client_transaction_1.default({
                            instructions: [
                                client_transaction_1.Instruction.createInvoke(coin.id, coin_instance_1.default.contractID, coin_instance_1.default.commandFetch, [new client_transaction_1.Argument({ name: coin_instance_1.default.argumentCoins, value: Buffer.from(valueBuf) })]),
                                client_transaction_1.Instruction.createSpawn(this.id, darc_instance_1.default.contractID, [new client_transaction_1.Argument({ name: SpawnerInstance.argumentDarc, value: orgDarc.toBytes() })]),
                                client_transaction_1.Instruction.createSpawn(this.id, pop_party_instance_1.PopPartyInstance.contractID, [
                                    new client_transaction_1.Argument({ name: "darcID", value: orgDarc.getBaseID() }),
                                    new client_transaction_1.Argument({ name: "description", value: desc.toBytes() }),
                                    new client_transaction_1.Argument({ name: "miningReward", value: Buffer.from(reward.toBytesLE()) }),
                                ]),
                            ],
                        });
                        return [4 /*yield*/, ctx.updateCountersAndSign(this.rpc, [signers, [], []])];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.rpc.sendTransactionAndWait(ctx)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, pop_party_instance_1.PopPartyInstance.fromByzcoin(this.rpc, ctx.instructions[2].deriveId(), 2)];
                }
            });
        });
    };
    /**
     * Create a Rock-Paper-scissors game instance
     *
     * @param desc      The description of the game
     * @param coin      The coin instance to take coins from
     * @param signers   The list of signers
     * @param stake     The reward for the winner
     * @param choice    The choice of the first player
     * @param fillup    Data that will be hash with the choice
     * @returns a promise that resolves with the new instance
     */
    SpawnerInstance.prototype.spawnRoPaSci = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var desc, coin, signers, stake, choice, fillup, c, fph, rps, ctx, rpsi;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        desc = params.desc, coin = params.coin, signers = params.signers, stake = params.stake, choice = params.choice, fillup = params.fillup;
                        if (fillup.length !== 31) {
                            throw new Error("need exactly 31 bytes for fillUp");
                        }
                        c = new coin_instance_1.Coin({ name: coin.name, value: stake.add(this.struct.costRoPaSci.value) });
                        if (coin.value.lessThan(c.value)) {
                            throw new Error("account balance not high enough for that stake");
                        }
                        fph = crypto_browserify_1.createHash("sha256");
                        fph.update(Buffer.from([choice % 3]));
                        fph.update(fillup);
                        rps = new ro_pa_sci_instance_1.RoPaSciStruct({
                            description: desc,
                            firstPlayer: -1,
                            firstPlayerHash: fph.digest(),
                            secondPlayer: -1,
                            secondPlayerAccount: Buffer.alloc(32),
                            stake: c,
                        });
                        ctx = new client_transaction_1.default({
                            instructions: [
                                client_transaction_1.Instruction.createInvoke(coin.id, coin_instance_1.default.contractID, coin_instance_1.default.commandFetch, [new client_transaction_1.Argument({ name: coin_instance_1.default.argumentCoins, value: Buffer.from(c.value.toBytesLE()) })]),
                                client_transaction_1.Instruction.createSpawn(this.id, ro_pa_sci_instance_1.default.contractID, [new client_transaction_1.Argument({ name: "struct", value: rps.toBytes() })]),
                            ],
                        });
                        return [4 /*yield*/, ctx.updateCountersAndSign(this.rpc, [signers, []])];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.rpc.sendTransactionAndWait(ctx)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, ro_pa_sci_instance_1.default.fromByzcoin(this.rpc, ctx.instructions[1].deriveId(), 2)];
                    case 3:
                        rpsi = _a.sent();
                        rpsi.setChoice(choice, fillup);
                        return [2 /*return*/, rpsi];
                }
            });
        });
    };
    /**
     * Creates a new calypso write instance for a given key. The key will be encrypted under the
     * aggregated public key. This method creates both the darc that will be protecting the
     * calypsoWrite, as well as the calypsoWrite instance.
     *
     * @param coinInst this coin instance will pay for spawning the calypso write
     * @param signers allow the `invoke:coin.fetch` call on the coinInstance
     * @param lts the id of the long-term-secret that will re-encrypt the key
     * @param key the symmetric key that will be stored encrypted on-chain - not more than 31 bytes.
     * @param ident allowed to re-encrypt the symmetric key
     * @param data additionl data that will be stored AS-IS on chain! So it must be either encrypted using
     * the symmetric 'key', or meta data that is public.
     */
    SpawnerInstance.prototype.spawnCalypsoWrite = function (coinInst, signers, lts, key, ident, data) {
        return __awaiter(this, void 0, void 0, function () {
            var cwDarc, d, write, ctx;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (coinInst.value.lessThan(this.struct.costDarc.value.add(this.struct.costCWrite.value))) {
                            throw new Error("account balance not high enough for spawning a darc + calypso writer");
                        }
                        cwDarc = darc_1.default.createBasic([ident[0]], [ident[0]], Buffer.from("calypso write protection " + crypto_browserify_1.randomBytes(8).toString("hex")), ["spawn:" + calypso_1.CalypsoReadInstance.contractID]);
                        ident.slice(1).forEach(function (id) { return cwDarc.rules.appendToRule("spawn:calypsoRead", id, rules_1.Rule.OR); });
                        return [4 /*yield*/, this.spawnDarcs(coinInst, signers, cwDarc)];
                    case 1:
                        d = _a.sent();
                        return [4 /*yield*/, calypso_instance_1.Write.createWrite(lts.id, d[0].id, lts.X, key)];
                    case 2:
                        write = _a.sent();
                        write.cost = this.struct.costCRead;
                        if (data) {
                            write.data = data;
                        }
                        ctx = new client_transaction_1.default({
                            instructions: [
                                client_transaction_1.Instruction.createInvoke(coinInst.id, coin_instance_1.default.contractID, coin_instance_1.default.commandFetch, [
                                    new client_transaction_1.Argument({
                                        name: coin_instance_1.default.argumentCoins,
                                        value: Buffer.from(this.struct.costCWrite.value.toBytesLE()),
                                    }),
                                ]),
                                client_transaction_1.Instruction.createSpawn(this.id, calypso_instance_1.CalypsoWriteInstance.contractID, [
                                    new client_transaction_1.Argument({
                                        name: calypso_instance_1.CalypsoWriteInstance.argumentWrite,
                                        value: Buffer.from(calypso_instance_1.Write.encode(write).finish()),
                                    }),
                                    new client_transaction_1.Argument({ name: "darcID", value: d[0].id }),
                                ]),
                            ],
                        });
                        return [4 /*yield*/, ctx.updateCountersAndSign(this.rpc, [signers, []])];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, this.rpc.sendTransactionAndWait(ctx)];
                    case 4:
                        _a.sent();
                        return [2 /*return*/, calypso_instance_1.CalypsoWriteInstance.fromByzcoin(this.rpc, ctx.instructions[1].deriveId(), 2)];
                }
            });
        });
    };
    SpawnerInstance.contractID = "spawner";
    SpawnerInstance.argumentCredential = "credential";
    SpawnerInstance.argumentCredID = "credID";
    SpawnerInstance.argumentDarc = "darc";
    SpawnerInstance.argumentDarcID = "darcID";
    SpawnerInstance.argumentCoinID = "coinID";
    SpawnerInstance.argumentCoinName = "coinName";
    return SpawnerInstance;
}(instance_1.default));
exports.default = SpawnerInstance;
/**
 * Data of a spawner instance
 */
var SpawnerStruct = /** @class */ (function (_super) {
    __extends(SpawnerStruct, _super);
    function SpawnerStruct(props) {
        var _this = _super.call(this, props) || this;
        /* Protobuf aliases */
        Object.defineProperty(_this, "costdarc", {
            get: function () {
                return this.costDarc;
            },
            set: function (value) {
                this.costDarc = value;
            },
        });
        Object.defineProperty(_this, "costcoin", {
            get: function () {
                return this.costCoin;
            },
            set: function (value) {
                this.costCoin = value;
            },
        });
        Object.defineProperty(_this, "costcredential", {
            get: function () {
                return this.costCredential;
            },
            set: function (value) {
                this.costCredential = value;
            },
        });
        Object.defineProperty(_this, "costparty", {
            get: function () {
                return this.costParty;
            },
            set: function (value) {
                this.costParty = value;
            },
        });
        Object.defineProperty(_this, "costropasci", {
            get: function () {
                return this.costRoPaSci;
            },
            set: function (value) {
                this.costRoPaSci = value;
            },
        });
        Object.defineProperty(_this, "costcread", {
            get: function () {
                return this.costCRead;
            },
            set: function (value) {
                this.costCRead = value;
            },
        });
        Object.defineProperty(_this, "costcwrite", {
            get: function () {
                return this.costCWrite;
            },
            set: function (value) {
                this.costCWrite = value;
            },
        });
        return _this;
    }
    /**
     * @see README#Message classes
     */
    SpawnerStruct.register = function () {
        protobuf_1.registerMessage("personhood.SpawnerStruct", SpawnerStruct, coin_instance_1.Coin);
    };
    return SpawnerStruct;
}(light_1.Message));
exports.SpawnerStruct = SpawnerStruct;
SpawnerStruct.register();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3Bhd25lci1pbnN0YW5jZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNwYXduZXItaW5zdGFuY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsdURBQTREO0FBQzVELDhDQUF3QjtBQUN4QiwwQ0FBdUQ7QUFDdkQsdUVBQWdEO0FBQ2hELGtGQUF5RjtBQUN6RixrRkFBd0U7QUFDeEUscUZBQThEO0FBQzlELGlFQUEyRDtBQUMzRCxzQ0FBaUQ7QUFDakQsZ0VBQTBFO0FBRzFFLHNEQUFnQztBQUNoQyx1Q0FBcUM7QUFHckMsK0NBQXlCO0FBQ3pCLHdDQUE4QztBQUM5QyxnRkFBeUQ7QUFFekQsMkRBQXdEO0FBRXhELHlFQUFzRTtBQUV6RCxRQUFBLFlBQVksR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUNoRCxvQkFBWSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQztBQUVsQztJQUE2QyxtQ0FBUTtJQXdFakQ7Ozs7O09BS0c7SUFDSCx5QkFBb0IsR0FBZSxFQUFFLElBQWM7UUFBbkQsWUFDSSxrQkFBTSxJQUFJLENBQUMsU0FNZDtRQVBtQixTQUFHLEdBQUgsR0FBRyxDQUFZO1FBRS9CLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxRQUFRLEVBQUUsS0FBSyxlQUFlLENBQUMsVUFBVSxFQUFFO1lBQzNELE1BQU0sSUFBSSxLQUFLLENBQUMsNkJBQTJCLElBQUksQ0FBQyxVQUFVLFlBQU8sZUFBZSxDQUFDLFVBQVksQ0FBQyxDQUFDO1NBQ2xHO1FBRUQsS0FBSSxDQUFDLE1BQU0sR0FBRyxhQUFhLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQzs7SUFDbEQsQ0FBQztJQTlFRCxzQkFBSSx1Q0FBVTtRQUxkOzs7O1dBSUc7YUFDSDtZQUNJLE9BQU8s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SUFDSSxzQkFBUSxHQUFmO1FBQ0ksMEJBQWUsQ0FBQywwQkFBMEIsRUFBRSxhQUFhLEVBQUUsb0JBQUksQ0FBQyxDQUFDO0lBQ3JFLENBQUM7SUE4RUwsb0JBQUM7QUFBRCxDQUFDLEFBckZELENBQW1DLGVBQU8sR0FxRnpDO0FBckZZLHNDQUFhO0FBMEoxQixhQUFhLENBQUMsUUFBUSxFQUFFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBjcmVhdGVIYXNoLCByYW5kb21CeXRlcyB9IGZyb20gXCJjcnlwdG8tYnJvd3NlcmlmeVwiO1xuaW1wb3J0IExvbmcgZnJvbSBcImxvbmdcIjtcbmltcG9ydCB7IE1lc3NhZ2UsIFByb3BlcnRpZXMgfSBmcm9tIFwicHJvdG9idWZqcy9saWdodFwiO1xuaW1wb3J0IEJ5ekNvaW5SUEMgZnJvbSBcIi4uL2J5emNvaW4vYnl6Y29pbi1ycGNcIjtcbmltcG9ydCBDbGllbnRUcmFuc2FjdGlvbiwgeyBBcmd1bWVudCwgSW5zdHJ1Y3Rpb24gfSBmcm9tIFwiLi4vYnl6Y29pbi9jbGllbnQtdHJhbnNhY3Rpb25cIjtcbmltcG9ydCBDb2luSW5zdGFuY2UsIHsgQ29pbiB9IGZyb20gXCIuLi9ieXpjb2luL2NvbnRyYWN0cy9jb2luLWluc3RhbmNlXCI7XG5pbXBvcnQgRGFyY0luc3RhbmNlIGZyb20gXCIuLi9ieXpjb2luL2NvbnRyYWN0cy9kYXJjLWluc3RhbmNlXCI7XG5pbXBvcnQgSW5zdGFuY2UsIHsgSW5zdGFuY2VJRCB9IGZyb20gXCIuLi9ieXpjb2luL2luc3RhbmNlXCI7XG5pbXBvcnQgeyBDYWx5cHNvUmVhZEluc3RhbmNlIH0gZnJvbSBcIi4uL2NhbHlwc29cIjtcbmltcG9ydCB7IENhbHlwc29Xcml0ZUluc3RhbmNlLCBXcml0ZSB9IGZyb20gXCIuLi9jYWx5cHNvL2NhbHlwc28taW5zdGFuY2VcIjtcbmltcG9ydCB7IExvbmdUZXJtU2VjcmV0IH0gZnJvbSBcIi4uL2NhbHlwc28vY2FseXBzby1ycGNcIjtcbmltcG9ydCB7IElJZGVudGl0eSB9IGZyb20gXCIuLi9kYXJjXCI7XG5pbXBvcnQgRGFyYyBmcm9tIFwiLi4vZGFyYy9kYXJjXCI7XG5pbXBvcnQgeyBSdWxlIH0gZnJvbSBcIi4uL2RhcmMvcnVsZXNcIjtcbmltcG9ydCBTaWduZXIgZnJvbSBcIi4uL2RhcmMvc2lnbmVyXCI7XG5pbXBvcnQgSVNpZ25lciBmcm9tIFwiLi4vZGFyYy9zaWduZXJcIjtcbmltcG9ydCBMb2cgZnJvbSBcIi4uL2xvZ1wiO1xuaW1wb3J0IHsgcmVnaXN0ZXJNZXNzYWdlIH0gZnJvbSBcIi4uL3Byb3RvYnVmXCI7XG5pbXBvcnQgQ3JlZGVudGlhbHNJbnN0YW5jZSBmcm9tIFwiLi9jcmVkZW50aWFscy1pbnN0YW5jZVwiO1xuaW1wb3J0IHsgQ3JlZGVudGlhbFN0cnVjdCB9IGZyb20gXCIuL2NyZWRlbnRpYWxzLWluc3RhbmNlXCI7XG5pbXBvcnQgeyBQb3BQYXJ0eUluc3RhbmNlIH0gZnJvbSBcIi4vcG9wLXBhcnR5LWluc3RhbmNlXCI7XG5pbXBvcnQgeyBQb3BEZXNjIH0gZnJvbSBcIi4vcHJvdG9cIjtcbmltcG9ydCBSb1BhU2NpSW5zdGFuY2UsIHsgUm9QYVNjaVN0cnVjdCB9IGZyb20gXCIuL3JvLXBhLXNjaS1pbnN0YW5jZVwiO1xuXG5leHBvcnQgY29uc3QgU1BBV05FUl9DT0lOID0gQnVmZmVyLmFsbG9jKDMyLCAwKTtcblNQQVdORVJfQ09JTi53cml0ZShcIlNwYXduZXJDb2luXCIpO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBTcGF3bmVySW5zdGFuY2UgZXh0ZW5kcyBJbnN0YW5jZSB7XG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIHRvdGFsIGNvc3QgcmVxdWlyZWQgdG8gc2lnbiB1cFxuICAgICAqXG4gICAgICogQHJldHVybnMgdGhlIGNvc3RcbiAgICAgKi9cbiAgICBnZXQgc2lnbnVwQ29zdCgpOiBMb25nIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3RydWN0LmNvc3RDb2luLnZhbHVlXG4gICAgICAgICAgICAuYWRkKHRoaXMuc3RydWN0LmNvc3REYXJjLnZhbHVlKVxuICAgICAgICAgICAgLmFkZCh0aGlzLnN0cnVjdC5jb3N0Q3JlZGVudGlhbC52YWx1ZSk7XG4gICAgfVxuXG4gICAgc3RhdGljIHJlYWRvbmx5IGNvbnRyYWN0SUQgPSBcInNwYXduZXJcIjtcbiAgICBzdGF0aWMgcmVhZG9ubHkgYXJndW1lbnRDcmVkZW50aWFsID0gXCJjcmVkZW50aWFsXCI7XG4gICAgc3RhdGljIHJlYWRvbmx5IGFyZ3VtZW50Q3JlZElEID0gXCJjcmVkSURcIjtcbiAgICBzdGF0aWMgcmVhZG9ubHkgYXJndW1lbnREYXJjID0gXCJkYXJjXCI7XG4gICAgc3RhdGljIHJlYWRvbmx5IGFyZ3VtZW50RGFyY0lEID0gXCJkYXJjSURcIjtcbiAgICBzdGF0aWMgcmVhZG9ubHkgYXJndW1lbnRDb2luSUQgPSBcImNvaW5JRFwiO1xuICAgIHN0YXRpYyByZWFkb25seSBhcmd1bWVudENvaW5OYW1lID0gXCJjb2luTmFtZVwiO1xuXG4gICAgLyoqXG4gICAgICogU3Bhd24gYSBzcGF3bmVyIGluc3RhbmNlLiBJdCB0YWtlcyBlaXRoZXIgYW4gSUNyZWF0ZVNwYXduZXIgYXMgc2luZ2xlIGFyZ3VtZW50LCBvciBhbGwgdGhlIGFyZ3VtZW50c1xuICAgICAqIHNlcGFyYXRlZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBwYXJhbXMgVGhlIEJ5ekNvaW5SUEMgdG8gdXNlIG9yIGFuIElDcmVhdGVTcGF3bmVyXG4gICAgICogQHBhcmFtIGRhcmNJRCBUaGUgZGFyYyBpbnN0YW5jZSBJRFxuICAgICAqIEBwYXJhbSBzaWduZXJzIFRoZSBsaXN0IG9mIHNpZ25lcnNcbiAgICAgKiBAcGFyYW0gY29zdHMgVGhlIGRpZmZlcmVudCBjb3N0IGZvciBuZXcgaW5zdGFuY2VzXG4gICAgICogQHBhcmFtIGJlbmVmaWNpYXJ5IFRoZSBiZW5lZmljaWFyeSBvZiB0aGUgY29zdHNcbiAgICAgKi9cbiAgICBzdGF0aWMgYXN5bmMgc3Bhd24ocGFyYW1zOiBJQ3JlYXRlU3Bhd25lciB8IEJ5ekNvaW5SUEMsIGRhcmNJRD86IEluc3RhbmNlSUQsIHNpZ25lcnM/OiBTaWduZXJbXSxcbiAgICAgICAgICAgICAgICAgICAgICAgY29zdHM/OiBJQ3JlYXRlQ29zdCxcbiAgICAgICAgICAgICAgICAgICAgICAgYmVuZWZpY2lhcnk/OiBJbnN0YW5jZUlEKTogUHJvbWlzZTxTcGF3bmVySW5zdGFuY2U+IHtcbiAgICAgICAgbGV0IGJjOiBCeXpDb2luUlBDO1xuICAgICAgICBpZiAocGFyYW1zIGluc3RhbmNlb2YgQnl6Q29pblJQQykge1xuICAgICAgICAgICAgYmMgPSBwYXJhbXMgYXMgQnl6Q29pblJQQztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICh7YmMsIGRhcmNJRCwgc2lnbmVycywgY29zdHMsIGJlbmVmaWNpYXJ5fSA9IHBhcmFtcyBhcyBJQ3JlYXRlU3Bhd25lcik7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBhcmdzID0gW1xuICAgICAgICAgICAgLi4uT2JqZWN0LmtleXMoY29zdHMpLm1hcCgoazogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgdmFsdWUgPSBuZXcgQ29pbih7bmFtZTogU1BBV05FUl9DT0lOLCB2YWx1ZTogY29zdHNba119KS50b0J5dGVzKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBBcmd1bWVudCh7bmFtZTogaywgdmFsdWV9KTtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgbmV3IEFyZ3VtZW50KHtuYW1lOiBcImJlbmVmaWNpYXJ5XCIsIHZhbHVlOiBiZW5lZmljaWFyeX0pLFxuICAgICAgICBdO1xuXG4gICAgICAgIGNvbnN0IGluc3QgPSBJbnN0cnVjdGlvbi5jcmVhdGVTcGF3bihkYXJjSUQsIHRoaXMuY29udHJhY3RJRCwgYXJncyk7XG4gICAgICAgIGNvbnN0IGN0eCA9IG5ldyBDbGllbnRUcmFuc2FjdGlvbih7aW5zdHJ1Y3Rpb25zOiBbaW5zdF19KTtcbiAgICAgICAgYXdhaXQgY3R4LnVwZGF0ZUNvdW50ZXJzQW5kU2lnbihiYywgW3NpZ25lcnNdKTtcblxuICAgICAgICBhd2FpdCBiYy5zZW5kVHJhbnNhY3Rpb25BbmRXYWl0KGN0eCk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuZnJvbUJ5emNvaW4oYmMsIGluc3QuZGVyaXZlSWQoKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSW5pdGlhbGl6ZXMgdXNpbmcgYW4gZXhpc3RpbmcgY29pbkluc3RhbmNlIGZyb20gQnl6Q29pblxuICAgICAqXG4gICAgICogQHBhcmFtIGJjIGFuIGluaXRpYWxpemVkIGJ5emNvaW4gUlBDIGluc3RhbmNlXG4gICAgICogQHBhcmFtIGlpZCB0aGUgaW5zdGFuY2UtSUQgb2YgdGhlIHNwYXduLWluc3RhbmNlXG4gICAgICogQHBhcmFtIHdhaXRNYXRjaCBob3cgbWFueSB0aW1lcyB0byB3YWl0IGZvciBhIG1hdGNoIC0gdXNlZnVsIGlmIGl0cyBjYWxsZWQganVzdCBhZnRlciBhbiBhZGRUcmFuc2FjdGlvbkFuZFdhaXQuXG4gICAgICogQHBhcmFtIGludGVydmFsIGhvdyBsb25nIHRvIHdhaXQgYmV0d2VlbiB0d28gYXR0ZW1wdHMgaW4gd2FpdE1hdGNoLlxuICAgICAqL1xuICAgIHN0YXRpYyBhc3luYyBmcm9tQnl6Y29pbihiYzogQnl6Q29pblJQQywgaWlkOiBJbnN0YW5jZUlELCB3YWl0TWF0Y2g6IG51bWJlciA9IDAsIGludGVydmFsOiBudW1iZXIgPSAxMDAwKTpcbiAgICAgICAgUHJvbWlzZTxTcGF3bmVySW5zdGFuY2U+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBTcGF3bmVySW5zdGFuY2UoYmMsIGF3YWl0IEluc3RhbmNlLmZyb21CeXpjb2luKGJjLCBpaWQsIHdhaXRNYXRjaCwgaW50ZXJ2YWwpKTtcbiAgICB9XG4gICAgc3RydWN0OiBTcGF3bmVyU3RydWN0O1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIG5ldyBTcGF3bmVySW5zdGFuY2VcbiAgICAgKiBAcGFyYW0gYmMgICAgICAgIFRoZSBCeXpDb2luUlBDIGluc3RhbmNlXG4gICAgICogQHBhcmFtIGlpZCAgICAgICBUaGUgaW5zdGFuY2UgSURcbiAgICAgKiBAcGFyYW0gc3Bhd25lciAgIFBhcmFtZXRlcnMgZm9yIHRoZSBzcGF3bmVyOiBjb3N0cyBhbmQgbmFtZXNcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJwYzogQnl6Q29pblJQQywgaW5zdDogSW5zdGFuY2UpIHtcbiAgICAgICAgc3VwZXIoaW5zdCk7XG4gICAgICAgIGlmIChpbnN0LmNvbnRyYWN0SUQudG9TdHJpbmcoKSAhPT0gU3Bhd25lckluc3RhbmNlLmNvbnRyYWN0SUQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgbWlzbWF0Y2ggY29udHJhY3QgbmFtZTogJHtpbnN0LmNvbnRyYWN0SUR9IHZzICR7U3Bhd25lckluc3RhbmNlLmNvbnRyYWN0SUR9YCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnN0cnVjdCA9IFNwYXduZXJTdHJ1Y3QuZGVjb2RlKGluc3QuZGF0YSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXBkYXRlIHRoZSBkYXRhIG9mIHRoaXMgaW5zdGFuY2VcbiAgICAgKlxuICAgICAqIEByZXR1cm5zIGEgcHJvbWlzZSB0aGF0IHJlc29sdmVzIG9uY2UgdGhlIGRhdGEgaXMgdXAtdG8tZGF0ZVxuICAgICAqL1xuICAgIGFzeW5jIHVwZGF0ZSgpOiBQcm9taXNlPFNwYXduZXJJbnN0YW5jZT4ge1xuICAgICAgICBjb25zdCBwcm9vZiA9IGF3YWl0IHRoaXMucnBjLmdldFByb29mRnJvbUxhdGVzdCh0aGlzLmlkKTtcbiAgICAgICAgdGhpcy5zdHJ1Y3QgPSBTcGF3bmVyU3RydWN0LmRlY29kZShwcm9vZi52YWx1ZSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSB0aGUgaW5zdHJ1Y3Rpb25zIG5lY2Vzc2FyeSB0byBzcGF3biBvbmUgb3IgbW9yZSBkYXJjcy4gVGhpcyBpcyBzZXBhcmF0ZWQgZnJvbSB0aGVcbiAgICAgKiBzcGFuRGFyY3MgbWV0aG9kIGl0c2VsZiwgc28gdGhhdCBhIGNhbGxlciBjYW4gY3JlYXRlIGEgYmlnZ2VyIENsaWVudFRyYW5zYWN0aW9uIHdpdGhcbiAgICAgKiBtdWx0aXBsZSBzZXRzIG9mIGluc3RydWN0aW9ucyBpbnNpZGUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY29pbiB3aGVyZSB0byB0YWtlIHRoZSBjb2lucyBmcm9tXG4gICAgICogQHBhcmFtIGRhcmNzIHRoZSBkYXJjcyB0byBjcmVhdGVcbiAgICAgKi9cbiAgICBzcGF3bkRhcmNJbnN0cnVjdGlvbnMoY29pbjogQ29pbkluc3RhbmNlLCAuLi5kYXJjczogRGFyY1tdKTogSW5zdHJ1Y3Rpb25bXSB7XG4gICAgICAgIGNvbnN0IGNvc3QgPSB0aGlzLnN0cnVjdC5jb3N0RGFyYy52YWx1ZS5tdWwoZGFyY3MubGVuZ3RoKTtcbiAgICAgICAgY29uc3QgcmV0OiBJbnN0cnVjdGlvbltdID0gW1xuICAgICAgICAgICAgSW5zdHJ1Y3Rpb24uY3JlYXRlSW52b2tlKFxuICAgICAgICAgICAgICAgIGNvaW4uaWQsXG4gICAgICAgICAgICAgICAgQ29pbkluc3RhbmNlLmNvbnRyYWN0SUQsXG4gICAgICAgICAgICAgICAgQ29pbkluc3RhbmNlLmNvbW1hbmRGZXRjaCxcbiAgICAgICAgICAgICAgICBbbmV3IEFyZ3VtZW50KHtuYW1lOiBDb2luSW5zdGFuY2UuYXJndW1lbnRDb2lucywgdmFsdWU6IEJ1ZmZlci5mcm9tKGNvc3QudG9CeXRlc0xFKCkpfSldLFxuICAgICAgICAgICAgKSxcbiAgICAgICAgICAgIC4uLmRhcmNzLm1hcCgoZGFyYykgPT5cbiAgICAgICAgICAgICAgICBJbnN0cnVjdGlvbi5jcmVhdGVTcGF3bihcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pZCxcbiAgICAgICAgICAgICAgICAgICAgRGFyY0luc3RhbmNlLmNvbnRyYWN0SUQsXG4gICAgICAgICAgICAgICAgICAgIFtuZXcgQXJndW1lbnQoe25hbWU6IFNwYXduZXJJbnN0YW5jZS5hcmd1bWVudERhcmMsIHZhbHVlOiBkYXJjLnRvQnl0ZXMoKX0pXSxcbiAgICAgICAgICAgICAgICApKSxcbiAgICAgICAgXTtcbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTcGF3bnMgb25lIG9yIG1vcmUgZGFyYyBhbmQgcmV0dXJucyBhbiBhcnJheSBvZiBhbGwgdGhlIHNwYXduZWQgZGFyY3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY29pbiAgICAgIFRoZSBjb2luIGluc3RhbmNlIHRvIHRha2UgY29pbnMgZnJvbVxuICAgICAqIEBwYXJhbSBzaWduZXJzICAgVGhlIHNpZ25lcnMgZm9yIHRoZSB0cmFuc2FjdGlvblxuICAgICAqIEBwYXJhbSBkYXJjcy4uLiBBbGwgdGhlIGRhcmNzIHRvIHNwYXduIHVzaW5nIHRoZSBzcGF3bmVyLiBUaGUgY29pbiBpbnN0YW5jZSBtdXN0IGhhdmUgZW5vdWdoXG4gICAgICogY29pbnMgdG8gcGF5IGZvciBhbGwgZGFyY3MuXG4gICAgICogQHJldHVybnMgYSBwcm9taXNlIHRoYXQgcmVzb2x2ZXMgd2l0aCB0aGUgbmV3IGFycmF5IG9mIHRoZSBpbnN0YW50aWF0ZWQgZGFyYyBpbnN0YW5jZXNcbiAgICAgKi9cbiAgICBhc3luYyBzcGF3bkRhcmNzKGNvaW46IENvaW5JbnN0YW5jZSwgc2lnbmVyczogU2lnbmVyW10sIC4uLmRhcmNzOiBEYXJjW10pOiBQcm9taXNlPERhcmNJbnN0YW5jZVtdPiB7XG4gICAgICAgIGNvbnN0IGN0eCA9IG5ldyBDbGllbnRUcmFuc2FjdGlvbih7aW5zdHJ1Y3Rpb25zOiB0aGlzLnNwYXduRGFyY0luc3RydWN0aW9ucyhjb2luLCAuLi5kYXJjcyl9KTtcbiAgICAgICAgYXdhaXQgY3R4LnVwZGF0ZUNvdW50ZXJzQW5kU2lnbih0aGlzLnJwYywgW3NpZ25lcnNdKTtcblxuICAgICAgICBhd2FpdCB0aGlzLnJwYy5zZW5kVHJhbnNhY3Rpb25BbmRXYWl0KGN0eCk7XG5cbiAgICAgICAgY29uc3QgZGlzID0gW107XG4gICAgICAgIGZvciAoY29uc3QgZGEgb2YgZGFyY3MpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgLy8gQmVjYXVzZSB0aGlzIGNhbGwgaXMgZGlyZWN0bHkgYWZ0ZXIgdGhlIHNlbmRUcmFuc2FjdGlvbkFuZFdhaXQsIHRoZSBuZXcgYmxvY2sgbWlnaHQgbm90IGJlXG4gICAgICAgICAgICAgICAgLy8gYXBwbGllZCB0byBhbGwgbm9kZXMgeWV0LlxuICAgICAgICAgICAgICAgIGRpcy5wdXNoKGF3YWl0IERhcmNJbnN0YW5jZS5mcm9tQnl6Y29pbih0aGlzLnJwYywgZGEuZ2V0QmFzZUlEKCksIDIsIDEwMDApKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICBMb2cud2FybihcImNvdWxkbid0IGdldCBwcm9vZiAtIHBlcmhhcHMgc3RpbGwgdXBkYXRpbmc/XCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBkaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhbGwgdGhlIG5lY2Vzc2FyeSBpbnN0cnVjdGlvbiB0byBjcmVhdGUgYSBuZXcgY29pbiAtIGVpdGhlciB3aXRoIGEgMCBiYWxhbmNlLCBvciB3aXRoXG4gICAgICogYSBnaXZlbiBiYWxhbmNlIGJ5IHRoZSBjYWxsZXIuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY29pbiB3aGVyZSB0byB0YWtlIHRoZSBjb2lucyB0byBjcmVhdGUgdGhlIGluc3RhbmNlXG4gICAgICogQHBhcmFtIGRhcmNJRCB0aGUgcmVzcG9uc2libGUgZGFyYyBmb3IgdGhlIG5ldyBjb2luXG4gICAgICogQHBhcmFtIGNvaW5JRCB0aGUgdHlwZSBvZiBjb2luIC0gbXVzdCBiZSB0aGUgc2FtZSBhcyB0aGUgYGNvaW5gIGluIGNhc2Ugb2YgYmFsYW5jZSA+IDBcbiAgICAgKiBAcGFyYW0gYmFsYW5jZSBob3cgbWFueSBjb2lucyB0byB0cmFuc2ZlciB0byB0aGUgbmV3IGNvaW5cbiAgICAgKi9cbiAgICBzcGF3bkNvaW5JbnN0cnVjdGlvbnMoY29pbjogQ29pbkluc3RhbmNlLCBkYXJjSUQ6IEluc3RhbmNlSUQsIGNvaW5JRDogQnVmZmVyLCBiYWxhbmNlPzogTG9uZyk6IEluc3RydWN0aW9uW10ge1xuICAgICAgICBiYWxhbmNlID0gYmFsYW5jZSB8fCBMb25nLmZyb21OdW1iZXIoMCk7XG4gICAgICAgIGNvbnN0IHZhbHVlQnVmID0gdGhpcy5zdHJ1Y3QuY29zdENvaW4udmFsdWUuYWRkKGJhbGFuY2UpLnRvQnl0ZXNMRSgpO1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgSW5zdHJ1Y3Rpb24uY3JlYXRlSW52b2tlKFxuICAgICAgICAgICAgICAgIGNvaW4uaWQsXG4gICAgICAgICAgICAgICAgQ29pbkluc3RhbmNlLmNvbnRyYWN0SUQsXG4gICAgICAgICAgICAgICAgQ29pbkluc3RhbmNlLmNvbW1hbmRGZXRjaCxcbiAgICAgICAgICAgICAgICBbbmV3IEFyZ3VtZW50KHtuYW1lOiBDb2luSW5zdGFuY2UuYXJndW1lbnRDb2lucywgdmFsdWU6IEJ1ZmZlci5mcm9tKHZhbHVlQnVmKX0pXSxcbiAgICAgICAgICAgICksXG4gICAgICAgICAgICBJbnN0cnVjdGlvbi5jcmVhdGVTcGF3bihcbiAgICAgICAgICAgICAgICB0aGlzLmlkLFxuICAgICAgICAgICAgICAgIENvaW5JbnN0YW5jZS5jb250cmFjdElELFxuICAgICAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICAgICAgbmV3IEFyZ3VtZW50KHtuYW1lOiBTcGF3bmVySW5zdGFuY2UuYXJndW1lbnRDb2luTmFtZSwgdmFsdWU6IFNQQVdORVJfQ09JTn0pLFxuICAgICAgICAgICAgICAgICAgICBuZXcgQXJndW1lbnQoe25hbWU6IFNwYXduZXJJbnN0YW5jZS5hcmd1bWVudENvaW5JRCwgdmFsdWU6IGNvaW5JRH0pLFxuICAgICAgICAgICAgICAgICAgICBuZXcgQXJndW1lbnQoe25hbWU6IFNwYXduZXJJbnN0YW5jZS5hcmd1bWVudERhcmNJRCwgdmFsdWU6IGRhcmNJRH0pLFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICApLFxuICAgICAgICBdO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhIGNvaW4gaW5zdGFuY2UgZm9yIGEgZ2l2ZW4gZGFyY1xuICAgICAqXG4gICAgICogQHBhcmFtIGNvaW4gICAgICBUaGUgY29pbiBpbnN0YW5jZSB0byB0YWtlIHRoZSBjb2lucyBmcm9tXG4gICAgICogQHBhcmFtIHNpZ25lcnMgICBUaGUgc2lnbmVycyBmb3IgdGhlIHRyYW5zYWN0aW9uXG4gICAgICogQHBhcmFtIGRhcmNJRCAgICBUaGUgZGFyYyByZXNwb25zaWJsZSBmb3IgdGhpcyBjb2luXG4gICAgICogQHBhcmFtIGNvaW5JRCAgICBUaGUgaW5zdGFuY2UtSUQgZm9yIHRoZSBjb2luIC0gd2lsbCBiZSBjYWxjdWxhdGVkIGFzIHNoYTI1NihcImNvaW5cIiB8IGNvaW5JRClcbiAgICAgKiBAcGFyYW0gYmFsYW5jZSAgIFRoZSBzdGFydGluZyBiYWxhbmNlXG4gICAgICogQHJldHVybnMgYSBwcm9taXNlIHRoYXQgcmVzb2x2ZXMgd2l0aCB0aGUgbmV3IGNvaW4gaW5zdGFuY2VcbiAgICAgKi9cbiAgICBhc3luYyBzcGF3bkNvaW4oY29pbjogQ29pbkluc3RhbmNlLCBzaWduZXJzOiBTaWduZXJbXSwgZGFyY0lEOiBJbnN0YW5jZUlELCBjb2luSUQ6IEJ1ZmZlciwgYmFsYW5jZT86IExvbmcpOlxuICAgICAgICBQcm9taXNlPENvaW5JbnN0YW5jZT4ge1xuXG4gICAgICAgIGNvbnN0IGN0eCA9IG5ldyBDbGllbnRUcmFuc2FjdGlvbih7XG4gICAgICAgICAgICBpbnN0cnVjdGlvbnM6IHRoaXMuc3Bhd25Db2luSW5zdHJ1Y3Rpb25zKGNvaW4sIGRhcmNJRCwgY29pbklELCBiYWxhbmNlKSxcbiAgICAgICAgfSk7XG4gICAgICAgIGF3YWl0IGN0eC51cGRhdGVDb3VudGVyc0FuZFNpZ24odGhpcy5ycGMsIFtzaWduZXJzLCBbXV0pO1xuICAgICAgICBhd2FpdCB0aGlzLnJwYy5zZW5kVHJhbnNhY3Rpb25BbmRXYWl0KGN0eCk7XG5cbiAgICAgICAgcmV0dXJuIENvaW5JbnN0YW5jZS5mcm9tQnl6Y29pbih0aGlzLnJwYywgQ29pbkluc3RhbmNlLmNvaW5JSUQoY29pbklEKSwgMik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyB0aGUgaW5zdHJ1Y3Rpb25zIG5lY2Vzc2FyeSB0byBjcmVhdGUgYSBjcmVkZW50aWFsLiBUaGlzIGlzIHNlcGFyYXRlZCBmcm9tIHRoZSBzcGF3bkNyZWRlbnRpYWxcbiAgICAgKiBtZXRob2QsIHNvIHRoYXQgYSBjYWxsZXIgY2FuIGdldCB0aGUgaW5zdHJ1Y3Rpb25zIHNlcGFyYXRlZCBhbmQgdGhlbiBwdXQgYWxsIHRoZSBpbnN0cnVjdGlvbnNcbiAgICAgKiB0b2dldGhlciBpbiBhIGJpZyBDbGllbnRUcmFuc2FjdGlvbi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBjb2luIGNvaW4taW5zdGFuY2UgdG8gcGF5IGZvciB0aGUgY3JlZGVudGlhbFxuICAgICAqIEBwYXJhbSBkYXJjSUQgcmVzcG9uc2libGUgZGFyYyBmb3IgdGhlIGNyZWRlbnRpYWxcbiAgICAgKiBAcGFyYW0gY3JlZCB0aGUgY3JlZGVudGlhbCBzdHJ1Y3R1cmVcbiAgICAgKiBAcGFyYW0gY3JlZElEIGlmIGdpdmVuLCB1c2VkIHRvIGNhbGN1bGF0ZSB0aGUgaWlkIG9mIHRoZSBjcmVkZW50aWFsLCBlbHNlIHRoZSBkYXJjSUQgd2lsbCBiZSB1c2VkXG4gICAgICovXG4gICAgc3Bhd25DcmVkZW50aWFsSW5zdHJ1Y3Rpb24oY29pbjogQ29pbkluc3RhbmNlLCBkYXJjSUQ6IEJ1ZmZlciwgY3JlZDogQ3JlZGVudGlhbFN0cnVjdCwgY3JlZElEOiBCdWZmZXIgPSBudWxsKTpcbiAgICAgICAgSW5zdHJ1Y3Rpb25bXSB7XG4gICAgICAgIGNvbnN0IHZhbHVlQnVmID0gdGhpcy5zdHJ1Y3QuY29zdENyZWRlbnRpYWwudmFsdWUudG9CeXRlc0xFKCk7XG4gICAgICAgIGNvbnN0IGNyZWRBcmdzID0gW1xuICAgICAgICAgICAgbmV3IEFyZ3VtZW50KHtuYW1lOiBTcGF3bmVySW5zdGFuY2UuYXJndW1lbnREYXJjSUQsIHZhbHVlOiBkYXJjSUR9KSxcbiAgICAgICAgICAgIG5ldyBBcmd1bWVudCh7bmFtZTogU3Bhd25lckluc3RhbmNlLmFyZ3VtZW50Q3JlZGVudGlhbCwgdmFsdWU6IGNyZWQudG9CeXRlcygpfSksXG4gICAgICAgIF07XG4gICAgICAgIGlmIChjcmVkSUQpIHtcbiAgICAgICAgICAgIGNyZWRBcmdzLnB1c2gobmV3IEFyZ3VtZW50KHtuYW1lOiBTcGF3bmVySW5zdGFuY2UuYXJndW1lbnRDcmVkSUQsIHZhbHVlOiBjcmVkSUR9KSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIEluc3RydWN0aW9uLmNyZWF0ZUludm9rZShcbiAgICAgICAgICAgICAgICBjb2luLmlkLFxuICAgICAgICAgICAgICAgIENvaW5JbnN0YW5jZS5jb250cmFjdElELFxuICAgICAgICAgICAgICAgIENvaW5JbnN0YW5jZS5jb21tYW5kRmV0Y2gsXG4gICAgICAgICAgICAgICAgW25ldyBBcmd1bWVudCh7bmFtZTogQ29pbkluc3RhbmNlLmFyZ3VtZW50Q29pbnMsIHZhbHVlOiBCdWZmZXIuZnJvbSh2YWx1ZUJ1Zil9KV0sXG4gICAgICAgICAgICApLFxuICAgICAgICAgICAgSW5zdHJ1Y3Rpb24uY3JlYXRlU3Bhd24oXG4gICAgICAgICAgICAgICAgdGhpcy5pZCxcbiAgICAgICAgICAgICAgICBDcmVkZW50aWFsc0luc3RhbmNlLmNvbnRyYWN0SUQsXG4gICAgICAgICAgICAgICAgY3JlZEFyZ3MsXG4gICAgICAgICAgICApLFxuICAgICAgICBdO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhIGNyZWRlbnRpYWwgaW5zdGFuY2UgZm9yIHRoZSBnaXZlbiBkYXJjXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY29pbiAgICAgIFRoZSBjb2luIGluc3RhbmNlIHRvIHRha2UgY29pbnMgZnJvbVxuICAgICAqIEBwYXJhbSBzaWduZXJzICAgVGhlIHNpZ25lcnMgZm9yIHRoZSB0cmFuc2FjdGlvblxuICAgICAqIEBwYXJhbSBkYXJjSUQgICAgVGhlIGRhcmMgaW5zdGFuY2UgSURcbiAgICAgKiBAcGFyYW0gY3JlZCAgICAgIFRoZSBzdGFydGluZyBjcmVkZW50aWFsc1xuICAgICAqIEBwYXJhbSBjcmVkSUQgICAgVGhlIGluc3RhbmNlLUlEIGZvciB0aGlzIGNyZWRlbnRpYWwgLSB3aWxsIGJlIGNhbGN1bGF0ZWQgYXMgc2hhMjU2KFwiY3JlZGVudGlhbFwiIHwgY3JlZElEKVxuICAgICAqIEByZXR1cm5zIGEgcHJvbWlzZSB0aGF0IHJlc29sdmVzIHdpdGggdGhlIG5ldyBjcmVkZW50aWFsIGluc3RhbmNlXG4gICAgICovXG4gICAgYXN5bmMgc3Bhd25DcmVkZW50aWFsKFxuICAgICAgICBjb2luOiBDb2luSW5zdGFuY2UsXG4gICAgICAgIHNpZ25lcnM6IElTaWduZXJbXSxcbiAgICAgICAgZGFyY0lEOiBCdWZmZXIsXG4gICAgICAgIGNyZWQ6IENyZWRlbnRpYWxTdHJ1Y3QsXG4gICAgICAgIGNyZWRJRDogQnVmZmVyID0gbnVsbCxcbiAgICApOiBQcm9taXNlPENyZWRlbnRpYWxzSW5zdGFuY2U+IHtcbiAgICAgICAgY29uc3QgY3R4ID0gbmV3IENsaWVudFRyYW5zYWN0aW9uKHtcbiAgICAgICAgICAgIGluc3RydWN0aW9uczogdGhpcy5zcGF3bkNyZWRlbnRpYWxJbnN0cnVjdGlvbihjb2luLCBkYXJjSUQsIGNyZWQsIGNyZWRJRCksXG4gICAgICAgIH0pO1xuICAgICAgICBhd2FpdCBjdHgudXBkYXRlQ291bnRlcnNBbmRTaWduKHRoaXMucnBjLCBbc2lnbmVycywgW11dKTtcbiAgICAgICAgYXdhaXQgdGhpcy5ycGMuc2VuZFRyYW5zYWN0aW9uQW5kV2FpdChjdHgpO1xuXG4gICAgICAgIGNvbnN0IGZpbmFsQ3JlZElEID0gQ3JlZGVudGlhbHNJbnN0YW5jZS5jcmVkZW50aWFsSUlEKGNyZWRJRCB8fCBkYXJjSUQpO1xuICAgICAgICByZXR1cm4gQ3JlZGVudGlhbHNJbnN0YW5jZS5mcm9tQnl6Y29pbih0aGlzLnJwYywgZmluYWxDcmVkSUQsIDIpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhIFBvUCBwYXJ0eVxuICAgICAqXG4gICAgICogQHBhcmFtIGNvaW4gVGhlIGNvaW4gaW5zdGFuY2UgdG8gdGFrZSBjb2lucyBmcm9tXG4gICAgICogQHBhcmFtIHNpZ25lcnMgVGhlIHNpZ25lcnMgZm9yIHRoZSB0cmFuc2FjdGlvblxuICAgICAqIEBwYXJhbSBvcmdzIFRoZSBsaXN0IGZvIG9yZ2FuaXNlcnNcbiAgICAgKiBAcGFyYW0gZGVzY3IgVGhlIGRhdGEgZm9yIHRoZSBQb1AgcGFydHlcbiAgICAgKiBAcGFyYW0gcmV3YXJkIFRoZSByZXdhcmQgb2YgYW4gYXR0ZW5kZWVcbiAgICAgKiBAcmV0dXJucyBhIHByb21pc2UgdGhhIHJlc29sdmVzIHdpdGggdGhlIG5ldyBwb3AgcGFydHkgaW5zdGFuY2VcbiAgICAgKi9cbiAgICBhc3luYyBzcGF3blBvcFBhcnR5KHBhcmFtczogSUNyZWF0ZVBvcFBhcnR5KTogUHJvbWlzZTxQb3BQYXJ0eUluc3RhbmNlPiB7XG4gICAgICAgIGNvbnN0IHtjb2luLCBzaWduZXJzLCBvcmdzLCBkZXNjLCByZXdhcmR9ID0gcGFyYW1zO1xuXG4gICAgICAgIC8vIFZlcmlmeSB0aGF0IGFsbCBvcmdhbml6ZXJzIGhhdmUgcHVibGlzaGVkIHRoZWlyIHBlcnNvbmhvb2QgcHVibGljIGtleVxuICAgICAgICBmb3IgKGNvbnN0IG9yZyBvZiBvcmdzKSB7XG4gICAgICAgICAgICBpZiAoIW9yZy5nZXRBdHRyaWJ1dGUoXCJwZXJzb25ob29kXCIsIFwiZWQyNTUxOVwiKSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgT25lIG9mIHRoZSBvcmdhbmlzZXJzIGRpZG4ndCBwdWJsaXNoIGhpcyBwZXJzb25ob29kIGtleWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgb3JnRGFyY0lEcyA9IG9yZ3MubWFwKChvcmcpID0+IG9yZy5kYXJjSUQpO1xuICAgICAgICBjb25zdCB2YWx1ZUJ1ZiA9IHRoaXMuc3RydWN0LmNvc3REYXJjLnZhbHVlLmFkZCh0aGlzLnN0cnVjdC5jb3N0UGFydHkudmFsdWUpLnRvQnl0ZXNMRSgpO1xuICAgICAgICBjb25zdCBvcmdEYXJjID0gUG9wUGFydHlJbnN0YW5jZS5wcmVwYXJlUGFydHlEYXJjKG9yZ0RhcmNJRHMsIFwicGFydHktZGFyYyBcIiArIGRlc2MubmFtZSk7XG4gICAgICAgIGNvbnN0IGN0eCA9IG5ldyBDbGllbnRUcmFuc2FjdGlvbih7XG4gICAgICAgICAgICBpbnN0cnVjdGlvbnM6IFtcbiAgICAgICAgICAgICAgICBJbnN0cnVjdGlvbi5jcmVhdGVJbnZva2UoXG4gICAgICAgICAgICAgICAgICAgIGNvaW4uaWQsXG4gICAgICAgICAgICAgICAgICAgIENvaW5JbnN0YW5jZS5jb250cmFjdElELFxuICAgICAgICAgICAgICAgICAgICBDb2luSW5zdGFuY2UuY29tbWFuZEZldGNoLFxuICAgICAgICAgICAgICAgICAgICBbbmV3IEFyZ3VtZW50KHtuYW1lOiBDb2luSW5zdGFuY2UuYXJndW1lbnRDb2lucywgdmFsdWU6IEJ1ZmZlci5mcm9tKHZhbHVlQnVmKX0pXSxcbiAgICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgICAgIEluc3RydWN0aW9uLmNyZWF0ZVNwYXduKFxuICAgICAgICAgICAgICAgICAgICB0aGlzLmlkLFxuICAgICAgICAgICAgICAgICAgICBEYXJjSW5zdGFuY2UuY29udHJhY3RJRCxcbiAgICAgICAgICAgICAgICAgICAgW25ldyBBcmd1bWVudCh7bmFtZTogU3Bhd25lckluc3RhbmNlLmFyZ3VtZW50RGFyYywgdmFsdWU6IG9yZ0RhcmMudG9CeXRlcygpfSldLFxuICAgICAgICAgICAgICAgICksXG4gICAgICAgICAgICAgICAgSW5zdHJ1Y3Rpb24uY3JlYXRlU3Bhd24oXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaWQsXG4gICAgICAgICAgICAgICAgICAgIFBvcFBhcnR5SW5zdGFuY2UuY29udHJhY3RJRCxcbiAgICAgICAgICAgICAgICAgICAgW1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV3IEFyZ3VtZW50KHtuYW1lOiBcImRhcmNJRFwiLCB2YWx1ZTogb3JnRGFyYy5nZXRCYXNlSUQoKX0pLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3IEFyZ3VtZW50KHtuYW1lOiBcImRlc2NyaXB0aW9uXCIsIHZhbHVlOiBkZXNjLnRvQnl0ZXMoKX0pLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3IEFyZ3VtZW50KHtuYW1lOiBcIm1pbmluZ1Jld2FyZFwiLCB2YWx1ZTogQnVmZmVyLmZyb20ocmV3YXJkLnRvQnl0ZXNMRSgpKX0pLFxuICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICksXG4gICAgICAgICAgICBdLFxuICAgICAgICB9KTtcbiAgICAgICAgYXdhaXQgY3R4LnVwZGF0ZUNvdW50ZXJzQW5kU2lnbih0aGlzLnJwYywgW3NpZ25lcnMsIFtdLCBbXV0pO1xuXG4gICAgICAgIGF3YWl0IHRoaXMucnBjLnNlbmRUcmFuc2FjdGlvbkFuZFdhaXQoY3R4KTtcblxuICAgICAgICByZXR1cm4gUG9wUGFydHlJbnN0YW5jZS5mcm9tQnl6Y29pbih0aGlzLnJwYywgY3R4Lmluc3RydWN0aW9uc1syXS5kZXJpdmVJZCgpLCAyKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgYSBSb2NrLVBhcGVyLXNjaXNzb3JzIGdhbWUgaW5zdGFuY2VcbiAgICAgKlxuICAgICAqIEBwYXJhbSBkZXNjICAgICAgVGhlIGRlc2NyaXB0aW9uIG9mIHRoZSBnYW1lXG4gICAgICogQHBhcmFtIGNvaW4gICAgICBUaGUgY29pbiBpbnN0YW5jZSB0byB0YWtlIGNvaW5zIGZyb21cbiAgICAgKiBAcGFyYW0gc2lnbmVycyAgIFRoZSBsaXN0IG9mIHNpZ25lcnNcbiAgICAgKiBAcGFyYW0gc3Rha2UgICAgIFRoZSByZXdhcmQgZm9yIHRoZSB3aW5uZXJcbiAgICAgKiBAcGFyYW0gY2hvaWNlICAgIFRoZSBjaG9pY2Ugb2YgdGhlIGZpcnN0IHBsYXllclxuICAgICAqIEBwYXJhbSBmaWxsdXAgICAgRGF0YSB0aGF0IHdpbGwgYmUgaGFzaCB3aXRoIHRoZSBjaG9pY2VcbiAgICAgKiBAcmV0dXJucyBhIHByb21pc2UgdGhhdCByZXNvbHZlcyB3aXRoIHRoZSBuZXcgaW5zdGFuY2VcbiAgICAgKi9cbiAgICBhc3luYyBzcGF3blJvUGFTY2kocGFyYW1zOiBJQ3JlYXRlUm9QYVNjaSk6IFByb21pc2U8Um9QYVNjaUluc3RhbmNlPiB7XG4gICAgICAgIGNvbnN0IHtkZXNjLCBjb2luLCBzaWduZXJzLCBzdGFrZSwgY2hvaWNlLCBmaWxsdXB9ID0gcGFyYW1zO1xuXG4gICAgICAgIGlmIChmaWxsdXAubGVuZ3RoICE9PSAzMSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwibmVlZCBleGFjdGx5IDMxIGJ5dGVzIGZvciBmaWxsVXBcIik7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBjID0gbmV3IENvaW4oe25hbWU6IGNvaW4ubmFtZSwgdmFsdWU6IHN0YWtlLmFkZCh0aGlzLnN0cnVjdC5jb3N0Um9QYVNjaS52YWx1ZSl9KTtcbiAgICAgICAgaWYgKGNvaW4udmFsdWUubGVzc1RoYW4oYy52YWx1ZSkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcImFjY291bnQgYmFsYW5jZSBub3QgaGlnaCBlbm91Z2ggZm9yIHRoYXQgc3Rha2VcIik7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBmcGggPSBjcmVhdGVIYXNoKFwic2hhMjU2XCIpO1xuICAgICAgICBmcGgudXBkYXRlKEJ1ZmZlci5mcm9tKFtjaG9pY2UgJSAzXSkpO1xuICAgICAgICBmcGgudXBkYXRlKGZpbGx1cCk7XG4gICAgICAgIGNvbnN0IHJwcyA9IG5ldyBSb1BhU2NpU3RydWN0KHtcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBkZXNjLFxuICAgICAgICAgICAgZmlyc3RQbGF5ZXI6IC0xLFxuICAgICAgICAgICAgZmlyc3RQbGF5ZXJIYXNoOiBmcGguZGlnZXN0KCksXG4gICAgICAgICAgICBzZWNvbmRQbGF5ZXI6IC0xLFxuICAgICAgICAgICAgc2Vjb25kUGxheWVyQWNjb3VudDogQnVmZmVyLmFsbG9jKDMyKSxcbiAgICAgICAgICAgIHN0YWtlOiBjLFxuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCBjdHggPSBuZXcgQ2xpZW50VHJhbnNhY3Rpb24oe1xuICAgICAgICAgICAgaW5zdHJ1Y3Rpb25zOiBbXG4gICAgICAgICAgICAgICAgSW5zdHJ1Y3Rpb24uY3JlYXRlSW52b2tlKFxuICAgICAgICAgICAgICAgICAgICBjb2luLmlkLFxuICAgICAgICAgICAgICAgICAgICBDb2luSW5zdGFuY2UuY29udHJhY3RJRCxcbiAgICAgICAgICAgICAgICAgICAgQ29pbkluc3RhbmNlLmNvbW1hbmRGZXRjaCxcbiAgICAgICAgICAgICAgICAgICAgW25ldyBBcmd1bWVudCh7bmFtZTogQ29pbkluc3RhbmNlLmFyZ3VtZW50Q29pbnMsIHZhbHVlOiBCdWZmZXIuZnJvbShjLnZhbHVlLnRvQnl0ZXNMRSgpKX0pXSxcbiAgICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgICAgIEluc3RydWN0aW9uLmNyZWF0ZVNwYXduKFxuICAgICAgICAgICAgICAgICAgICB0aGlzLmlkLFxuICAgICAgICAgICAgICAgICAgICBSb1BhU2NpSW5zdGFuY2UuY29udHJhY3RJRCxcbiAgICAgICAgICAgICAgICAgICAgW25ldyBBcmd1bWVudCh7bmFtZTogXCJzdHJ1Y3RcIiwgdmFsdWU6IHJwcy50b0J5dGVzKCl9KV0sXG4gICAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgIH0pO1xuICAgICAgICBhd2FpdCBjdHgudXBkYXRlQ291bnRlcnNBbmRTaWduKHRoaXMucnBjLCBbc2lnbmVycywgW11dKTtcblxuICAgICAgICBhd2FpdCB0aGlzLnJwYy5zZW5kVHJhbnNhY3Rpb25BbmRXYWl0KGN0eCk7XG5cbiAgICAgICAgY29uc3QgcnBzaSA9IGF3YWl0IFJvUGFTY2lJbnN0YW5jZS5mcm9tQnl6Y29pbih0aGlzLnJwYywgY3R4Lmluc3RydWN0aW9uc1sxXS5kZXJpdmVJZCgpLCAyKTtcbiAgICAgICAgcnBzaS5zZXRDaG9pY2UoY2hvaWNlLCBmaWxsdXApO1xuXG4gICAgICAgIHJldHVybiBycHNpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBuZXcgY2FseXBzbyB3cml0ZSBpbnN0YW5jZSBmb3IgYSBnaXZlbiBrZXkuIFRoZSBrZXkgd2lsbCBiZSBlbmNyeXB0ZWQgdW5kZXIgdGhlXG4gICAgICogYWdncmVnYXRlZCBwdWJsaWMga2V5LiBUaGlzIG1ldGhvZCBjcmVhdGVzIGJvdGggdGhlIGRhcmMgdGhhdCB3aWxsIGJlIHByb3RlY3RpbmcgdGhlXG4gICAgICogY2FseXBzb1dyaXRlLCBhcyB3ZWxsIGFzIHRoZSBjYWx5cHNvV3JpdGUgaW5zdGFuY2UuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY29pbkluc3QgdGhpcyBjb2luIGluc3RhbmNlIHdpbGwgcGF5IGZvciBzcGF3bmluZyB0aGUgY2FseXBzbyB3cml0ZVxuICAgICAqIEBwYXJhbSBzaWduZXJzIGFsbG93IHRoZSBgaW52b2tlOmNvaW4uZmV0Y2hgIGNhbGwgb24gdGhlIGNvaW5JbnN0YW5jZVxuICAgICAqIEBwYXJhbSBsdHMgdGhlIGlkIG9mIHRoZSBsb25nLXRlcm0tc2VjcmV0IHRoYXQgd2lsbCByZS1lbmNyeXB0IHRoZSBrZXlcbiAgICAgKiBAcGFyYW0ga2V5IHRoZSBzeW1tZXRyaWMga2V5IHRoYXQgd2lsbCBiZSBzdG9yZWQgZW5jcnlwdGVkIG9uLWNoYWluIC0gbm90IG1vcmUgdGhhbiAzMSBieXRlcy5cbiAgICAgKiBAcGFyYW0gaWRlbnQgYWxsb3dlZCB0byByZS1lbmNyeXB0IHRoZSBzeW1tZXRyaWMga2V5XG4gICAgICogQHBhcmFtIGRhdGEgYWRkaXRpb25sIGRhdGEgdGhhdCB3aWxsIGJlIHN0b3JlZCBBUy1JUyBvbiBjaGFpbiEgU28gaXQgbXVzdCBiZSBlaXRoZXIgZW5jcnlwdGVkIHVzaW5nXG4gICAgICogdGhlIHN5bW1ldHJpYyAna2V5Jywgb3IgbWV0YSBkYXRhIHRoYXQgaXMgcHVibGljLlxuICAgICAqL1xuICAgIGFzeW5jIHNwYXduQ2FseXBzb1dyaXRlKGNvaW5JbnN0OiBDb2luSW5zdGFuY2UsIHNpZ25lcnM6IFNpZ25lcltdLCBsdHM6IExvbmdUZXJtU2VjcmV0LCBrZXk6IEJ1ZmZlcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZGVudDogSUlkZW50aXR5W10sIGRhdGE/OiBCdWZmZXIpOlxuICAgICAgICBQcm9taXNlPENhbHlwc29Xcml0ZUluc3RhbmNlPiB7XG5cbiAgICAgICAgaWYgKGNvaW5JbnN0LnZhbHVlLmxlc3NUaGFuKHRoaXMuc3RydWN0LmNvc3REYXJjLnZhbHVlLmFkZCh0aGlzLnN0cnVjdC5jb3N0Q1dyaXRlLnZhbHVlKSkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcImFjY291bnQgYmFsYW5jZSBub3QgaGlnaCBlbm91Z2ggZm9yIHNwYXduaW5nIGEgZGFyYyArIGNhbHlwc28gd3JpdGVyXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgY3dEYXJjID0gRGFyYy5jcmVhdGVCYXNpYyhbaWRlbnRbMF1dLCBbaWRlbnRbMF1dLFxuICAgICAgICAgICAgQnVmZmVyLmZyb20oXCJjYWx5cHNvIHdyaXRlIHByb3RlY3Rpb24gXCIgKyByYW5kb21CeXRlcyg4KS50b1N0cmluZyhcImhleFwiKSksXG4gICAgICAgICAgICBbXCJzcGF3bjpcIiArIENhbHlwc29SZWFkSW5zdGFuY2UuY29udHJhY3RJRF0pO1xuICAgICAgICBpZGVudC5zbGljZSgxKS5mb3JFYWNoKChpZCkgPT4gY3dEYXJjLnJ1bGVzLmFwcGVuZFRvUnVsZShcInNwYXduOmNhbHlwc29SZWFkXCIsIGlkLCBSdWxlLk9SKSk7XG4gICAgICAgIGNvbnN0IGQgPSBhd2FpdCB0aGlzLnNwYXduRGFyY3MoY29pbkluc3QsIHNpZ25lcnMsIGN3RGFyYyk7XG5cbiAgICAgICAgY29uc3Qgd3JpdGUgPSBhd2FpdCBXcml0ZS5jcmVhdGVXcml0ZShsdHMuaWQsIGRbMF0uaWQsIGx0cy5YLCBrZXkpO1xuICAgICAgICB3cml0ZS5jb3N0ID0gdGhpcy5zdHJ1Y3QuY29zdENSZWFkO1xuICAgICAgICBpZiAoZGF0YSkge1xuICAgICAgICAgICAgd3JpdGUuZGF0YSA9IGRhdGE7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBjdHggPSBuZXcgQ2xpZW50VHJhbnNhY3Rpb24oe1xuICAgICAgICAgICAgaW5zdHJ1Y3Rpb25zOiBbXG4gICAgICAgICAgICAgICAgSW5zdHJ1Y3Rpb24uY3JlYXRlSW52b2tlKGNvaW5JbnN0LmlkLCBDb2luSW5zdGFuY2UuY29udHJhY3RJRCwgQ29pbkluc3RhbmNlLmNvbW1hbmRGZXRjaCwgW1xuICAgICAgICAgICAgICAgICAgICBuZXcgQXJndW1lbnQoe1xuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogQ29pbkluc3RhbmNlLmFyZ3VtZW50Q29pbnMsXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogQnVmZmVyLmZyb20odGhpcy5zdHJ1Y3QuY29zdENXcml0ZS52YWx1ZS50b0J5dGVzTEUoKSksXG4gICAgICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgIF0pLFxuICAgICAgICAgICAgICAgIEluc3RydWN0aW9uLmNyZWF0ZVNwYXduKHRoaXMuaWQsIENhbHlwc29Xcml0ZUluc3RhbmNlLmNvbnRyYWN0SUQsIFtcbiAgICAgICAgICAgICAgICAgICAgbmV3IEFyZ3VtZW50KHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IENhbHlwc29Xcml0ZUluc3RhbmNlLmFyZ3VtZW50V3JpdGUsXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogQnVmZmVyLmZyb20oV3JpdGUuZW5jb2RlKHdyaXRlKS5maW5pc2goKSksXG4gICAgICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgICAgICBuZXcgQXJndW1lbnQoe25hbWU6IFwiZGFyY0lEXCIsIHZhbHVlOiBkWzBdLmlkfSksXG4gICAgICAgICAgICAgICAgXSksXG4gICAgICAgICAgICBdLFxuICAgICAgICB9KTtcbiAgICAgICAgYXdhaXQgY3R4LnVwZGF0ZUNvdW50ZXJzQW5kU2lnbih0aGlzLnJwYywgW3NpZ25lcnMsIFtdXSk7XG4gICAgICAgIGF3YWl0IHRoaXMucnBjLnNlbmRUcmFuc2FjdGlvbkFuZFdhaXQoY3R4KTtcblxuICAgICAgICByZXR1cm4gQ2FseXBzb1dyaXRlSW5zdGFuY2UuZnJvbUJ5emNvaW4odGhpcy5ycGMsIGN0eC5pbnN0cnVjdGlvbnNbMV0uZGVyaXZlSWQoKSwgMik7XG4gICAgfVxufVxuXG4vKipcbiAqIERhdGEgb2YgYSBzcGF3bmVyIGluc3RhbmNlXG4gKi9cbmV4cG9ydCBjbGFzcyBTcGF3bmVyU3RydWN0IGV4dGVuZHMgTWVzc2FnZTxTcGF3bmVyU3RydWN0PiB7XG5cbiAgICAvKipcbiAgICAgKiBAc2VlIFJFQURNRSNNZXNzYWdlIGNsYXNzZXNcbiAgICAgKi9cbiAgICBzdGF0aWMgcmVnaXN0ZXIoKSB7XG4gICAgICAgIHJlZ2lzdGVyTWVzc2FnZShcInBlcnNvbmhvb2QuU3Bhd25lclN0cnVjdFwiLCBTcGF3bmVyU3RydWN0LCBDb2luKTtcbiAgICB9XG5cbiAgICByZWFkb25seSBjb3N0RGFyYzogQ29pbjtcbiAgICByZWFkb25seSBjb3N0Q29pbjogQ29pbjtcbiAgICByZWFkb25seSBjb3N0Q3JlZGVudGlhbDogQ29pbjtcbiAgICByZWFkb25seSBjb3N0UGFydHk6IENvaW47XG4gICAgcmVhZG9ubHkgY29zdFJvUGFTY2k6IENvaW47XG4gICAgcmVhZG9ubHkgY29zdENXcml0ZTogQ29pbjtcbiAgICByZWFkb25seSBjb3N0Q1JlYWQ6IENvaW47XG4gICAgcmVhZG9ubHkgYmVuZWZpY2lhcnk6IEluc3RhbmNlSUQ7XG5cbiAgICBjb25zdHJ1Y3Rvcihwcm9wcz86IFByb3BlcnRpZXM8U3Bhd25lclN0cnVjdD4pIHtcbiAgICAgICAgc3VwZXIocHJvcHMpO1xuXG4gICAgICAgIC8qIFByb3RvYnVmIGFsaWFzZXMgKi9cblxuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgXCJjb3N0ZGFyY1wiLCB7XG4gICAgICAgICAgICBnZXQoKTogQ29pbiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuY29zdERhcmM7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2V0KHZhbHVlOiBDb2luKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb3N0RGFyYyA9IHZhbHVlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIFwiY29zdGNvaW5cIiwge1xuICAgICAgICAgICAgZ2V0KCk6IENvaW4ge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNvc3RDb2luO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNldCh2YWx1ZTogQ29pbikge1xuICAgICAgICAgICAgICAgIHRoaXMuY29zdENvaW4gPSB2YWx1ZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0pO1xuXG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCBcImNvc3RjcmVkZW50aWFsXCIsIHtcbiAgICAgICAgICAgIGdldCgpOiBDb2luIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5jb3N0Q3JlZGVudGlhbDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzZXQodmFsdWU6IENvaW4pIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNvc3RDcmVkZW50aWFsID0gdmFsdWU7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9KTtcblxuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgXCJjb3N0cGFydHlcIiwge1xuICAgICAgICAgICAgZ2V0KCk6IENvaW4ge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNvc3RQYXJ0eTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzZXQodmFsdWU6IENvaW4pIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNvc3RQYXJ0eSA9IHZhbHVlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIFwiY29zdHJvcGFzY2lcIiwge1xuICAgICAgICAgICAgZ2V0KCk6IENvaW4ge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNvc3RSb1BhU2NpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNldCh2YWx1ZTogQ29pbikge1xuICAgICAgICAgICAgICAgIHRoaXMuY29zdFJvUGFTY2kgPSB2YWx1ZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0pO1xuXG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCBcImNvc3RjcmVhZFwiLCB7XG4gICAgICAgICAgICBnZXQoKTogQ29pbiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuY29zdENSZWFkO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNldCh2YWx1ZTogQ29pbikge1xuICAgICAgICAgICAgICAgIHRoaXMuY29zdENSZWFkID0gdmFsdWU7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9KTtcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIFwiY29zdGN3cml0ZVwiLCB7XG4gICAgICAgICAgICBnZXQoKTogQ29pbiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuY29zdENXcml0ZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzZXQodmFsdWU6IENvaW4pIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNvc3RDV3JpdGUgPSB2YWx1ZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuLyoqXG4gKiBGaWVsZHMgb2YgdGhlIGNvc3RzIG9mIGEgc3Bhd25lciBpbnN0YW5jZVxuICovXG5pbnRlcmZhY2UgSUNyZWF0ZUNvc3Qge1xuICAgIGNvc3RDUmVhZDogTG9uZztcbiAgICBjb3N0Q1dyaXRlOiBMb25nO1xuICAgIGNvc3RDb2luOiBMb25nO1xuICAgIGNvc3RDcmVkZW50aWFsOiBMb25nO1xuICAgIGNvc3REYXJjOiBMb25nO1xuICAgIGNvc3RQYXJ0eTogTG9uZztcblxuICAgIFtrOiBzdHJpbmddOiBMb25nO1xufVxuXG4vKipcbiAqIFBhcmFtZXRlcnMgdG8gY3JlYXRlIGEgc3Bhd25lciBpbnN0YW5jZVxuICovXG5pbnRlcmZhY2UgSUNyZWF0ZVNwYXduZXIge1xuICAgIGJjOiBCeXpDb2luUlBDO1xuICAgIGRhcmNJRDogSW5zdGFuY2VJRDtcbiAgICBzaWduZXJzOiBTaWduZXJbXTtcbiAgICBjb3N0czogSUNyZWF0ZUNvc3Q7XG4gICAgYmVuZWZpY2lhcnk6IEluc3RhbmNlSUQ7XG5cbiAgICBbazogc3RyaW5nXTogYW55O1xufVxuXG4vKipcbiAqIFBhcmFtZXRlcnMgdG8gY3JlYXRlIGEgcm9jay1wYXBlci1zY2lzc29ycyBnYW1lXG4gKi9cbmludGVyZmFjZSBJQ3JlYXRlUm9QYVNjaSB7XG4gICAgZGVzYzogc3RyaW5nO1xuICAgIGNvaW46IENvaW5JbnN0YW5jZTtcbiAgICBzaWduZXJzOiBTaWduZXJbXTtcbiAgICBzdGFrZTogTG9uZztcbiAgICBjaG9pY2U6IG51bWJlcjtcbiAgICBmaWxsdXA6IEJ1ZmZlcjtcblxuICAgIFtrOiBzdHJpbmddOiBhbnk7XG59XG5cbi8qKlxuICogUGFyYW1ldGVycyB0byBjcmVhdGUgYSBwb3AgcGFydHlcbiAqL1xuaW50ZXJmYWNlIElDcmVhdGVQb3BQYXJ0eSB7XG4gICAgY29pbjogQ29pbkluc3RhbmNlO1xuICAgIHNpZ25lcnM6IFNpZ25lcltdO1xuICAgIG9yZ3M6IENyZWRlbnRpYWxzSW5zdGFuY2VbXTtcbiAgICBkZXNjOiBQb3BEZXNjO1xuICAgIHJld2FyZDogTG9uZztcblxuICAgIFtrOiBzdHJpbmddOiBhbnk7XG59XG5cbi8qKlxuICogUGFyYW1ldGVycyB0byBjcmVhdGUgYSBjYWx5cHNvIHdyaXRlIGluc3RhbmNlXG4gKi9cbmludGVyZmFjZSBJU3Bhd25DYWx5c3BvV3JpdGUge1xuICAgIGNvaW46IENvaW5JbnN0YW5jZTtcbiAgICBzaWduZXJzOiBTaWduZXJbXTtcbiAgICB3cml0ZTogV3JpdGU7XG4gICAgZGFyY0lEOiBJbnN0YW5jZUlEO1xuICAgIGNob2ljZTogbnVtYmVyO1xuXG4gICAgW2s6IHN0cmluZ106IGFueTtcbn1cblxuU3Bhd25lclN0cnVjdC5yZWdpc3RlcigpO1xuIl19