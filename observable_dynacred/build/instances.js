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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var mergeMap_1 = require("rxjs/internal/operators/mergeMap");
var filter_1 = require("rxjs/internal/operators/filter");
var long_1 = __importDefault(require("long"));
var cothority_1 = require("@dedis/cothority");
var interfaces_1 = require("./interfaces");
function newIInstance(key, value, contractID) {
    return {
        block: long_1.default.fromNumber(-1),
        contractID: contractID || "unknown",
        darcID: Buffer.alloc(32),
        key: key, value: value,
        version: long_1.default.fromNumber(0),
    };
}
exports.newIInstance = newIInstance;
function printInstance(i) {
    return "{\n    key: " + i.key.toString("hex") + "\n    value: " + i.value.slice(0, 100).toString("hex") + "\n    block: " + i.block.toNumber() + "\n    contractID: " + i.contractID + "\n    version: " + i.version.toNumber() + "\n    darcID: " + i.darcID.toString("hex") + "\n    }";
}
exports.printInstance = printInstance;
var Instances = /** @class */ (function () {
    function Instances(db, bc, newBlock) {
        this.db = db;
        this.bc = bc;
        this.newBlock = newBlock;
        this.cache = new Map();
    }
    Instances.fromScratch = function (db, bc) {
        return __awaiter(this, void 0, void 0, function () {
            var blockIndexBuf, blockIndex, p, newBlock;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db.get(Instances.dbKeyBlockIndex)];
                    case 1:
                        blockIndexBuf = _a.sent();
                        blockIndex = long_1.default.fromNumber(-1);
                        if (!(blockIndexBuf !== undefined)) return [3 /*break*/, 2];
                        blockIndex = long_1.default.fromBytes(Array.from(blockIndexBuf));
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, bc.getProof(interfaces_1.configInstanceID)];
                    case 3:
                        p = _a.sent();
                        blockIndex = long_1.default.fromNumber(p.latest.index);
                        _a.label = 4;
                    case 4:
                        newBlock = new rxjs_1.BehaviorSubject(blockIndex);
                        return [2 /*return*/, new Instances(db, bc, newBlock)];
                }
            });
        });
    };
    Instances.prototype.instanceObservable = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var bs, bsNew, lastBlock, dbInst;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        bs = this.cache.get(id);
                        if (bs !== undefined) {
                            return [2 /*return*/, bs];
                        }
                        bsNew = new rxjs_1.ReplaySubject(1);
                        lastBlock = long_1.default.fromNumber(-1);
                        return [4 /*yield*/, this.db.getObject(id.toString("hex"))];
                    case 1:
                        dbInst = _a.sent();
                        if (dbInst !== undefined) {
                            lastBlock = dbInst.block;
                            bsNew.next(dbInst);
                        }
                        // Set up a pipe from the block to fetch new versions if a new block
                        // is available.
                        this.newBlock
                            .pipe(filter_1.filter(function (v) { return !v.equals(lastBlock); }), mergeMap_1.mergeMap(function (v) { return _this.getInstanceFromChain(id); }))
                            .subscribe(bsNew);
                        this.cache.set(id, bsNew);
                        return [2 /*return*/, bsNew.pipe(operators_1.distinctUntilChanged(function (a, b) {
                                cothority_1.Log.print(a.version, b.version);
                                return a.version.equals(b.version);
                            }))];
                }
            });
        });
    };
    Instances.prototype.reload = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getInstanceFromChain(interfaces_1.configInstanceID)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Instances.prototype.getInstanceFromChain = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var p, inst;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        cothority_1.Log.lvl3("get instance", id);
                        return [4 /*yield*/, this.bc.getProof(id)];
                    case 1:
                        p = _a.sent();
                        if (!p.exists(id)) {
                            throw new Error("didn't find instance in cache or on chain");
                        }
                        inst = {
                            block: long_1.default.fromNumber(p.latest.index),
                            contractID: p.stateChangeBody.contractID,
                            darcID: p.stateChangeBody.darcID,
                            key: id,
                            value: p.stateChangeBody.value,
                            version: p.stateChangeBody.version,
                        };
                        return [4 /*yield*/, this.db.setObject(inst.key.toString("hex"), inst)];
                    case 2:
                        _a.sent();
                        if (!!inst.block.equals(this.newBlock.getValue())) return [3 /*break*/, 4];
                        cothority_1.Log.lvl3("got new block:", inst.block);
                        return [4 /*yield*/, this.db.set(Instances.dbKeyBlockIndex, Buffer.from(inst.block.toBytes()))];
                    case 3:
                        _a.sent();
                        this.newBlock.next(inst.block);
                        _a.label = 4;
                    case 4: return [2 /*return*/, inst];
                }
            });
        });
    };
    Instances.dbKeyBlockIndex = "instance_block_index";
    return Instances;
}());
exports.Instances = Instances;
