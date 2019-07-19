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
Object.defineProperty(exports, "__esModule", { value: true });
var connection_1 = require("../network/connection");
var proto_1 = require("./proto");
var skipblock_1 = require("./skipblock");
/**
 * SkipchainRPC provides basic tools to interact with a skipchain
 * with a given roster
 */
var SkipchainRPC = /** @class */ (function () {
    function SkipchainRPC(roster) {
        this.roster = roster;
        this.pool = new connection_1.RosterWSConnection(roster, SkipchainRPC.serviceName);
        this.conn = roster.list.map(function (srvid) {
            return new connection_1.WebSocketConnection(srvid.getWebSocketAddress(), SkipchainRPC.serviceName);
        });
    }
    /**
     * Create a skipchain with a base and a max height
     *
     * @param baseHeight    base height of the skipchain
     * @param maxHeight     maximum height of the skipchain
     * @returns a promise that resolves with the genesis block
     */
    SkipchainRPC.prototype.createSkipchain = function (baseHeight, maxHeight) {
        if (baseHeight === void 0) { baseHeight = 4; }
        if (maxHeight === void 0) { maxHeight = 32; }
        var newBlock = new skipblock_1.SkipBlock({ roster: this.roster, maxHeight: maxHeight, baseHeight: baseHeight });
        var req = new proto_1.StoreSkipBlock({ newBlock: newBlock });
        return this.conn[0].send(req, proto_1.StoreSkipBlockReply);
    };
    /**
     * Add a new block to a given skipchain
     * @param gid the genesis ID of the skipchain
     * @param msg the data to include in the block
     * @throws an error if the request is not successful
     */
    SkipchainRPC.prototype.addBlock = function (gid, msg) {
        var newBlock = new skipblock_1.SkipBlock({ roster: this.roster, data: msg });
        var req = new proto_1.StoreSkipBlock({
            newBlock: newBlock,
            targetSkipChainID: gid,
        });
        return this.conn[0].send(req, proto_1.StoreSkipBlockReply);
    };
    /**
     * Get the block with the given ID
     *
     * @param bid   block ID being the hash
     * @returns a promise that resolves with the block
     */
    SkipchainRPC.prototype.getSkipBlock = function (bid) {
        return __awaiter(this, void 0, void 0, function () {
            var req, block;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        req = new proto_1.GetSingleBlock({ id: bid });
                        return [4 /*yield*/, this.pool.send(req, skipblock_1.SkipBlock)];
                    case 1:
                        block = _a.sent();
                        if (!block.computeHash().equals(block.hash)) {
                            throw new Error("invalid block: hash does not match");
                        }
                        return [2 /*return*/, block];
                }
            });
        });
    };
    /**
     * Get the block by its index and the genesis block ID
     *
     * @param genesis   Genesis block ID
     * @param index     Index of the block
     * @returns a promise that resolves with the block, or reject with an error
     */
    SkipchainRPC.prototype.getSkipBlockByIndex = function (genesis, index) {
        return __awaiter(this, void 0, void 0, function () {
            var req, reply;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        req = new proto_1.GetSingleBlockByIndex({ genesis: genesis, index: index });
                        return [4 /*yield*/, this.pool.send(req, proto_1.GetSingleBlockByIndexReply)];
                    case 1:
                        reply = _a.sent();
                        if (!reply.skipblock.computeHash().equals(reply.skipblock.hash)) {
                            throw new Error("invalid block: hash does not match");
                        }
                        return [2 /*return*/, reply];
                }
            });
        });
    };
    /**
     * Get the list of known skipchains
     *
     * @returns a promise that resolves with the list of skipchain IDs
     */
    SkipchainRPC.prototype.getAllSkipChainIDs = function () {
        return __awaiter(this, void 0, void 0, function () {
            var req, ret;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        req = new proto_1.GetAllSkipChainIDs();
                        return [4 /*yield*/, this.pool.send(req, proto_1.GetAllSkipChainIDsReply)];
                    case 1:
                        ret = _a.sent();
                        return [2 /*return*/, ret.skipChainIDs.map(function (id) { return Buffer.from(id); })];
                }
            });
        });
    };
    /**
     * Get the shortest path to the more recent block starting from latestID
     *
     * @param latestID  ID of the block
     * @param verify    Verify the integrity of the chain when true
     * @returns a promise that resolves with the list of blocks
     */
    SkipchainRPC.prototype.getUpdateChain = function (latestID, verify) {
        if (verify === void 0) { verify = true; }
        return __awaiter(this, void 0, void 0, function () {
            var req, ret, blocks, last, rpc, more, err;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        req = new proto_1.GetUpdateChain({ latestID: latestID });
                        return [4 /*yield*/, this.pool.send(req, proto_1.GetUpdateChainReply)];
                    case 1:
                        ret = _a.sent();
                        blocks = ret.update;
                        last = blocks[blocks.length - 1];
                        if (!(last && last.forwardLinks.length > 0)) return [3 /*break*/, 3];
                        rpc = new SkipchainRPC(last.roster);
                        return [4 /*yield*/, rpc.getUpdateChain(last.hash, verify)];
                    case 2:
                        more = _a.sent();
                        blocks.splice.apply(blocks, [-1, 1].concat(more));
                        _a.label = 3;
                    case 3:
                        if (verify) {
                            err = this.verifyChain(blocks, latestID);
                            if (err) {
                                throw new Error("invalid chain received: " + err.message);
                            }
                        }
                        return [2 /*return*/, blocks];
                }
            });
        });
    };
    /**
     * Get the latest known block of the skipchain. It will follow the forward
     * links as much as possible and it is resistant to roster changes.
     *
     * @param latestID  the current latest block
     * @param verify    Verify the integrity of the chain
     * @returns a promise that resolves with the block, or reject with an error
     */
    SkipchainRPC.prototype.getLatestBlock = function (latestID, verify) {
        if (verify === void 0) { verify = true; }
        return __awaiter(this, void 0, void 0, function () {
            var blocks;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getUpdateChain(latestID, verify)];
                    case 1:
                        blocks = _a.sent();
                        return [2 /*return*/, blocks.pop()];
                }
            });
        });
    };
    /**
     * Check the given chain of blocks to insure the integrity of the
     * chain by following the forward links and verifying the signatures
     *
     * @param blocks    the chain to check
     * @param firstID   optional parameter to check the first block identity
     * @returns null for a correct chain or a detailed error otherwise
     */
    SkipchainRPC.prototype.verifyChain = function (blocks, firstID) {
        if (blocks.length === 0) {
            // expect to have blocks
            return new Error("no block returned in the chain");
        }
        if (firstID && !blocks[0].computeHash().equals(firstID)) {
            // expect the first block to be a particular block
            return new Error("the first ID is not the one we have");
        }
        var _loop_1 = function (i) {
            var prev = blocks[i - 1];
            var curr = blocks[i];
            if (!curr.computeHash().equals(curr.hash)) {
                return { value: new Error("invalid block hash") };
            }
            if (prev.forwardLinks.length === 0) {
                return { value: new Error("no forward link included in the skipblock") };
            }
            var link = prev.forwardLinks.find(function (l) { return l.to.equals(curr.hash); });
            if (!link) {
                return { value: new Error("no forward link associated with the next block") };
            }
            var publics = prev.roster.getServicePublics(SkipchainRPC.serviceName);
            var err = link.verifyWithScheme(publics, prev.signatureScheme);
            if (err) {
                return { value: new Error("invalid link: " + err.message) };
            }
        };
        for (var i = 1; i < blocks.length; i++) {
            var state_1 = _loop_1(i);
            if (typeof state_1 === "object")
                return state_1.value;
        }
        return null;
    };
    SkipchainRPC.serviceName = "Skipchain";
    return SkipchainRPC;
}());
exports.default = SkipchainRPC;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2tpcGNoYWluLXJwYy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNraXBjaGFpbi1ycGMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUNBLG9EQUE2RjtBQUU3RixpQ0FVaUI7QUFDakIseUNBQXdDO0FBRXhDOzs7R0FHRztBQUNIO0lBT0ksc0JBQVksTUFBYztRQUN0QixJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztRQUNyQixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksK0JBQWtCLENBQUMsTUFBTSxFQUFFLFlBQVksQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUNyRSxJQUFJLENBQUMsSUFBSSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQUMsS0FBSztZQUM5QixPQUFPLElBQUksZ0NBQW1CLENBQUMsS0FBSyxDQUFDLG1CQUFtQixFQUFFLEVBQUUsWUFBWSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQzFGLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUNILHNDQUFlLEdBQWYsVUFBZ0IsVUFBc0IsRUFBRSxTQUFzQjtRQUE5QywyQkFBQSxFQUFBLGNBQXNCO1FBQUUsMEJBQUEsRUFBQSxjQUFzQjtRQUMxRCxJQUFNLFFBQVEsR0FBRyxJQUFJLHFCQUFTLENBQUMsRUFBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxTQUFTLFdBQUEsRUFBRSxVQUFVLFlBQUEsRUFBQyxDQUFDLENBQUM7UUFDN0UsSUFBTSxHQUFHLEdBQUcsSUFBSSxzQkFBYyxDQUFDLEVBQUMsUUFBUSxVQUFBLEVBQUMsQ0FBQyxDQUFDO1FBRTNDLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLDJCQUFtQixDQUFDLENBQUM7SUFDdkQsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gs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QUVELE9BQU8sSUFBSSxDQUFDO0lBQ2hCLENBQUM7SUFyTE0sd0JBQVcsR0FBRyxXQUFXLENBQUM7SUFzTHJDLG1CQUFDO0NBQUEsQUF2TEQsSUF1TEM7a0JBdkxvQixZQUFZIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IExvZyBmcm9tIFwiLi4vbG9nXCI7XG5pbXBvcnQgeyBJQ29ubmVjdGlvbiwgUm9zdGVyV1NDb25uZWN0aW9uLCBXZWJTb2NrZXRDb25uZWN0aW9uIH0gZnJvbSBcIi4uL25ldHdvcmsvY29ubmVjdGlvblwiO1xuaW1wb3J0IHsgUm9zdGVyIH0gZnJvbSBcIi4uL25ldHdvcmsvcHJvdG9cIjtcbmltcG9ydCB7XG4gICAgR2V0QWxsU2tpcENoYWluSURzLFxuICAgIEdldEFsbFNraXBDaGFpbklEc1JlcGx5LFxuICAgIEdldFNpbmdsZUJsb2NrLFxuICAgIEdldFNpbmdsZUJsb2NrQnlJbmRleCxcbiAgICBHZXRTaW5nbGVCbG9ja0J5SW5kZXhSZXBseSxcbiAgICBHZXRVcGRhdGVDaGFpbixcbiAgICBHZXRVcGRhdGVDaGFpblJlcGx5LFxuICAgIFN0b3JlU2tpcEJsb2NrLFxuICAgIFN0b3JlU2tpcEJsb2NrUmVwbHksXG59IGZyb20gXCIuL3Byb3RvXCI7XG5pbXBvcnQgeyBTa2lwQmxvY2sgfSBmcm9tIFwiLi9za2lwYmxvY2tcIjtcblxuLyoqXG4gKiBTa2lwY2hhaW5SUEMgcHJvdmlkZXMgYmFzaWMgdG9vbHMgdG8gaW50ZXJhY3Qgd2l0aCBhIHNraXBjaGFpblxuICogd2l0aCBhIGdpdmVuIHJvc3RlclxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBTa2lwY2hhaW5SUEMge1xuICAgIHN0YXRpYyBzZXJ2aWNlTmFtZSA9IFwiU2tpcGNoYWluXCI7XG5cbiAgICBwcml2YXRlIHJvc3RlcjogUm9zdGVyO1xuICAgIHByaXZhdGUgcG9vbDogSUNvbm5lY3Rpb247XG4gICAgcHJpdmF0ZSBjb25uOiBJQ29ubmVjdGlvbltdO1xuXG4gICAgY29uc3RydWN0b3Iocm9zdGVyOiBSb3N0ZXIpIHtcbiAgICAgICAgdGhpcy5yb3N0ZXIgPSByb3N0ZXI7XG4gICAgICAgIHRoaXMucG9vbCA9IG5ldyBSb3N0ZXJXU0Nvbm5lY3Rpb24ocm9zdGVyLCBTa2lwY2hhaW5SUEMuc2VydmljZU5hbWUpO1xuICAgICAgICB0aGlzLmNvbm4gPSByb3N0ZXIubGlzdC5tYXAoKHNydmlkKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFdlYlNvY2tldENvbm5lY3Rpb24oc3J2aWQuZ2V0V2ViU29ja2V0QWRkcmVzcygpLCBTa2lwY2hhaW5SUEMuc2VydmljZU5hbWUpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgYSBza2lwY2hhaW4gd2l0aCBhIGJhc2UgYW5kIGEgbWF4IGhlaWdodFxuICAgICAqXG4gICAgICogQHBhcmFtIGJhc2VIZWlnaHQgICAgYmFzZSBoZWlnaHQgb2YgdGhlIHNraXBjaGFpblxuICAgICAqIEBwYXJhbSBtYXhIZWlnaHQgICAgIG1heGltdW0gaGVpZ2h0IG9mIHRoZSBza2lwY2hhaW5cbiAgICAgKiBAcmV0dXJucyBhIHByb21pc2UgdGhhdCByZXNvbHZlcyB3aXRoIHRoZSBnZW5lc2lzIGJsb2NrXG4gICAgICovXG4gICAgY3JlYXRlU2tpcGNoYWluKGJhc2VIZWlnaHQ6IG51bWJlciA9IDQsIG1heEhlaWdodDogbnVtYmVyID0gMzIpOiBQcm9taXNlPFN0b3JlU2tpcEJsb2NrUmVwbHk+IHtcbiAgICAgICAgY29uc3QgbmV3QmxvY2sgPSBuZXcgU2tpcEJsb2NrKHtyb3N0ZXI6IHRoaXMucm9zdGVyLCBtYXhIZWlnaHQsIGJhc2VIZWlnaHR9KTtcbiAgICAgICAgY29uc3QgcmVxID0gbmV3IFN0b3JlU2tpcEJsb2NrKHtuZXdCbG9ja30pO1xuXG4gICAgICAgIHJldHVybiB0aGlzLmNvbm5bMF0uc2VuZChyZXEsIFN0b3JlU2tpcEJsb2NrUmVwbHkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFkZCBhIG5ldyBibG9jayB0byBhIGdpdmVuIHNraXBjaGFpblxuICAgICAqIEBwYXJhbSBnaWQgdGhlIGdlbmVzaXMgSUQgb2YgdGhlIHNraXBjaGFpblxuICAgICAqIEBwYXJhbSBtc2cgdGhlIGRhdGEgdG8gaW5jbHVkZSBpbiB0aGUgYmxvY2tcbiAgICAgKiBAdGhyb3dzIGFuIGVycm9yIGlmIHRoZSByZXF1ZXN0IGlzIG5vdCBzdWNjZXNzZnVsXG4gICAgICovXG4gICAgYWRkQmxvY2soZ2lkOiBCdWZmZXIsIG1zZzogQnVmZmVyKTogUHJvbWlzZTxTdG9yZVNraXBCbG9ja1JlcGx5PiB7XG4gICAgICAgIGNvbnN0IG5ld0Jsb2NrID0gbmV3IFNraXBCbG9jayh7cm9zdGVyOiB0aGlzLnJvc3RlciwgZGF0YTogbXNnfSk7XG4gICAgICAgIGNvbnN0IHJlcSA9IG5ldyBTdG9yZVNraXBCbG9jayh7XG4gICAgICAgICAgICBuZXdCbG9jayxcbiAgICAgICAgICAgIHRhcmdldFNraXBDaGFpbklEOiBnaWQsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiB0aGlzLmNvbm5bMF0uc2VuZChyZXEsIFN0b3JlU2tpcEJsb2NrUmVwbHkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgYmxvY2sgd2l0aCB0aGUgZ2l2ZW4gSURcbiAgICAgKlxuICAgICAqIEBwYXJhbSBiaWQgICBibG9jayBJRCBiZWluZyB0aGUgaGFzaFxuICAgICAqIEByZXR1cm5zIGEgcHJvbWlzZSB0aGF0IHJlc29sdmVzIHdpdGggdGhlIGJsb2NrXG4gICAgICovXG4gICAgYXN5bmMgZ2V0U2tpcEJsb2NrKGJpZDogQnVmZmVyKTogUHJvbWlzZTxTa2lwQmxvY2s+IHtcbiAgICAgICAgY29uc3QgcmVxID0gbmV3IEdldFNpbmdsZUJsb2NrKHtpZDogYmlkfSk7XG5cbiAgICAgICAgY29uc3QgYmxvY2sgPSBhd2FpdCB0aGlzLnBvb2wuc2VuZDxTa2lwQmxvY2s+KHJlcSwgU2tpcEJsb2NrKTtcbiAgICAgICAgaWYgKCFibG9jay5jb21wdXRlSGFzaCgpLmVxdWFscyhibG9jay5oYXNoKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiaW52YWxpZCBibG9jazogaGFzaCBkb2VzIG5vdCBtYXRjaFwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBibG9jaztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIGJsb2NrIGJ5IGl0cyBpbmRleCBhbmQgdGhlIGdlbmVzaXMgYmxvY2sgSURcbiAgICAgKlxuICAgICAqIEBwYXJhbSBnZW5lc2lzICAgR2VuZXNpcyBibG9jayBJRFxuICAgICAqIEBwYXJhbSBpbmRleCAgICAgSW5kZXggb2YgdGhlIGJsb2NrXG4gICAgICogQHJldHVybnMgYSBwcm9taXNlIHRoYXQgcmVzb2x2ZXMgd2l0aCB0aGUgYmxvY2ssIG9yIHJlamVjdCB3aXRoIGFuIGVycm9yXG4gICAgICovXG4gICAgYXN5bmMgZ2V0U2tpcEJsb2NrQnlJbmRleChnZW5lc2lzOiBCdWZmZXIsIGluZGV4OiBudW1iZXIpOiBQcm9taXNlPEdldFNpbmdsZUJsb2NrQnlJbmRleFJlcGx5PiB7XG4gICAgICAgIGNvbnN0IHJlcSA9IG5ldyBHZXRTaW5nbGVCbG9ja0J5SW5kZXgoe2dlbmVzaXMsIGluZGV4fSk7XG5cbiAgICAgICAgY29uc3QgcmVwbHkgPSBhd2FpdCB0aGlzLnBvb2wuc2VuZDxHZXRTaW5nbGVCbG9ja0J5SW5kZXhSZXBseT4ocmVxLCBHZXRTaW5nbGVCbG9ja0J5SW5kZXhSZXBseSk7XG4gICAgICAgIGlmICghcmVwbHkuc2tpcGJsb2NrLmNvbXB1dGVIYXNoKCkuZXF1YWxzKHJlcGx5LnNraXBibG9jay5oYXNoKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiaW52YWxpZCBibG9jazogaGFzaCBkb2VzIG5vdCBtYXRjaFwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXBseTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIGxpc3Qgb2Yga25vd24gc2tpcGNoYWluc1xuICAgICAqXG4gICAgICogQHJldHVybnMgYSBwcm9taXNlIHRoYXQgcmVzb2x2ZXMgd2l0aCB0aGUgbGlzdCBvZiBza2lwY2hhaW4gSURzXG4gICAgICovXG4gICAgYXN5bmMgZ2V0QWxsU2tpcENoYWluSURzKCk6IFByb21pc2U8QnVmZmVyW10+IHtcbiAgICAgICAgY29uc3QgcmVxID0gbmV3IEdldEFsbFNraXBDaGFpbklEcygpO1xuXG4gICAgICAgIGNvbnN0IHJldCA9IGF3YWl0IHRoaXMucG9vbC5zZW5kPEdldEFsbFNraXBDaGFpbklEc1JlcGx5PihyZXEsIEdldEFsbFNraXBDaGFpbklEc1JlcGx5KTtcblxuICAgICAgICByZXR1cm4gcmV0LnNraXBDaGFpbklEcy5tYXAoKGlkKSA9PiBCdWZmZXIuZnJvbShpZCkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgc2hvcnRlc3QgcGF0aCB0byB0aGUgbW9yZSByZWNlbnQgYmxvY2sgc3RhcnRpbmcgZnJvbSBsYXRlc3RJRFxuICAgICAqXG4gICAgICogQHBhcmFtIGxhdGVzdElEICBJRCBvZiB0aGUgYmxvY2tcbiAgICAgKiBAcGFyYW0gdmVyaWZ5ICAgIFZlcmlmeSB0aGUgaW50ZWdyaXR5IG9mIHRoZSBjaGFpbiB3aGVuIHRydWVcbiAgICAgKiBAcmV0dXJucyBhIHByb21pc2UgdGhhdCByZXNvbHZlcyB3aXRoIHRoZSBsaXN0IG9mIGJsb2Nrc1xuICAgICAqL1xuICAgIGFzeW5jIGdldFVwZGF0ZUNoYWluKGxhdGVzdElEOiBCdWZmZXIsIHZlcmlmeSA9IHRydWUpOiBQcm9taXNlPFNraXBCbG9ja1tdPiB7XG4gICAgICAgIGNvbnN0IHJlcSA9IG5ldyBHZXRVcGRhdGVDaGFpbih7bGF0ZXN0SUR9KTtcbiAgICAgICAgY29uc3QgcmV0ID0gYXdhaXQgdGhpcy5wb29sLnNlbmQ8R2V0VXBkYXRlQ2hhaW5SZXBseT4ocmVxLCBHZXRVcGRhdGVDaGFpblJlcGx5KTtcbiAgICAgICAgY29uc3QgYmxvY2tzID0gcmV0LnVwZGF0ZTtcblxuICAgICAgICBjb25zdCBsYXN0ID0gYmxvY2tzW2Jsb2Nrcy5sZW5ndGggLSAxXTtcbiAgICAgICAgaWYgKGxhc3QgJiYgbGFzdC5mb3J3YXJkTGlua3MubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgLy8gbW9yZSBibG9ja3MgZXhpc3QgYnV0IHR5cGljYWxseSB0aGUgcm9zdGVyIGhhcyBjaGFuZ2VkXG4gICAgICAgICAgICBjb25zdCBycGMgPSBuZXcgU2tpcGNoYWluUlBDKGxhc3Qucm9zdGVyKTtcbiAgICAgICAgICAgIGNvbnN0IG1vcmUgPSBhd2FpdCBycGMuZ2V0VXBkYXRlQ2hhaW4obGFzdC5oYXNoLCB2ZXJpZnkpO1xuXG4gICAgICAgICAgICBibG9ja3Muc3BsaWNlKC0xLCAxLCAuLi5tb3JlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh2ZXJpZnkpIHtcbiAgICAgICAgICAgIGNvbnN0IGVyciA9IHRoaXMudmVyaWZ5Q2hhaW4oYmxvY2tzLCBsYXRlc3RJRCk7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBpbnZhbGlkIGNoYWluIHJlY2VpdmVkOiAke2Vyci5tZXNzYWdlfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGJsb2NrcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIGxhdGVzdCBrbm93biBibG9jayBvZiB0aGUgc2tpcGNoYWluLiBJdCB3aWxsIGZvbGxvdyB0aGUgZm9yd2FyZFxuICAgICAqIGxpbmtzIGFzIG11Y2ggYXMgcG9zc2libGUgYW5kIGl0IGlzIHJlc2lzdGFudCB0byByb3N0ZXIgY2hhbmdlcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBsYXRlc3RJRCAgdGhlIGN1cnJlbnQgbGF0ZXN0IGJsb2NrXG4gICAgICogQHBhcmFtIHZlcmlmeSAgICBWZXJpZnkgdGhlIGludGVncml0eSBvZiB0aGUgY2hhaW5cbiAgICAgKiBAcmV0dXJucyBhIHByb21pc2UgdGhhdCByZXNvbHZlcyB3aXRoIHRoZSBibG9jaywgb3IgcmVqZWN0IHdpdGggYW4gZXJyb3JcbiAgICAgKi9cbiAgICBhc3luYyBnZXRMYXRlc3RCbG9jayhsYXRlc3RJRDogQnVmZmVyLCB2ZXJpZnkgPSB0cnVlKTogUHJvbWlzZTxTa2lwQmxvY2s+IHtcbiAgICAgICAgY29uc3QgYmxvY2tzID0gYXdhaXQgdGhpcy5nZXRVcGRhdGVDaGFpbihsYXRlc3RJRCwgdmVyaWZ5KTtcblxuICAgICAgICByZXR1cm4gYmxvY2tzLnBvcCgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENoZWNrIHRoZSBnaXZlbiBjaGFpbiBvZiBibG9ja3MgdG8gaW5zdXJlIHRoZSBpbnRlZ3JpdHkgb2YgdGhlXG4gICAgICogY2hhaW4gYnkgZm9sbG93aW5nIHRoZSBmb3J3YXJkIGxpbmtzIGFuZCB2ZXJpZnlpbmcgdGhlIHNpZ25hdHVyZXNcbiAgICAgKlxuICAgICAqIEBwYXJhbSBibG9ja3MgICAgdGhlIGNoYWluIHRvIGNoZWNrXG4gICAgICogQHBhcmFtIGZpcnN0SUQgICBvcHRpb25hbCBwYXJhbWV0ZXIgdG8gY2hlY2sgdGhlIGZpcnN0IGJsb2NrIGlkZW50aXR5XG4gICAgICogQHJldHVybnMgbnVsbCBmb3IgYSBjb3JyZWN0IGNoYWluIG9yIGEgZGV0YWlsZWQgZXJyb3Igb3RoZXJ3aXNlXG4gICAgICovXG4gICAgdmVyaWZ5Q2hhaW4oYmxvY2tzOiBTa2lwQmxvY2tbXSwgZmlyc3RJRD86IEJ1ZmZlcik6IEVycm9yIHtcbiAgICAgICAgaWYgKGJsb2Nrcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIC8vIGV4cGVjdCB0byBoYXZlIGJsb2Nrc1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBFcnJvcihcIm5vIGJsb2NrIHJldHVybmVkIGluIHRoZSBjaGFpblwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChmaXJzdElEICYmICFibG9ja3NbMF0uY29tcHV0ZUhhc2goKS5lcXVhbHMoZmlyc3RJRCkpIHtcbiAgICAgICAgICAgIC8vIGV4cGVjdCB0aGUgZmlyc3QgYmxvY2sgdG8gYmUgYSBwYXJ0aWN1bGFyIGJsb2NrXG4gICAgICAgICAgICByZXR1cm4gbmV3IEVycm9yKFwidGhlIGZpcnN0IElEIGlzIG5vdCB0aGUgb25lIHdlIGhhdmVcIik7XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8IGJsb2Nrcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgcHJldiA9IGJsb2Nrc1tpIC0gMV07XG4gICAgICAgICAgICBjb25zdCBjdXJyID0gYmxvY2tzW2ldO1xuXG4gICAgICAgICAgICBpZiAoIWN1cnIuY29tcHV0ZUhhc2goKS5lcXVhbHMoY3Vyci5oYXNoKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXJyb3IoXCJpbnZhbGlkIGJsb2NrIGhhc2hcIik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChwcmV2LmZvcndhcmRMaW5rcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEVycm9yKFwibm8gZm9yd2FyZCBsaW5rIGluY2x1ZGVkIGluIHRoZSBza2lwYmxvY2tcIik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGxpbmsgPSBwcmV2LmZvcndhcmRMaW5rcy5maW5kKChsKSA9PiBsLnRvLmVxdWFscyhjdXJyLmhhc2gpKTtcbiAgICAgICAgICAgIGlmICghbGluaykge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXJyb3IoXCJubyBmb3J3YXJkIGxpbmsgYXNzb2NpYXRlZCB3aXRoIHRoZSBuZXh0IGJsb2NrXCIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBwdWJsaWNzID0gcHJldi5yb3N0ZXIuZ2V0U2VydmljZVB1YmxpY3MoU2tpcGNoYWluUlBDLnNlcnZpY2VOYW1lKTtcbiAgICAgICAgICAgIGNvbnN0IGVyciA9IGxpbmsudmVyaWZ5V2l0aFNjaGVtZShwdWJsaWNzLCBwcmV2LnNpZ25hdHVyZVNjaGVtZSk7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBFcnJvcihgaW52YWxpZCBsaW5rOiAke2Vyci5tZXNzYWdlfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufVxuIl19