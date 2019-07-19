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
Object.defineProperty(exports, "__esModule", { value: true });
var crypto_browserify_1 = require("crypto-browserify");
var lodash_1 = __importDefault(require("lodash"));
var light_1 = require("protobufjs/light");
var protobuf_1 = require("../protobuf");
var skipchain_1 = require("../skipchain");
var skipblock_1 = require("../skipchain/skipblock");
var instance_1 = __importDefault(require("./instance"));
var data_header_1 = __importDefault(require("./proto/data-header"));
/**
 * The proof class represents a proof that a given instance with its data is either present or absent in the global
 * state. It does this by proving three different things:
 *
 * 1. that there is a valid chain of blocks from the genesis to the latest block
 * 2. a copy of the latest block to get the root hash of the global state trie
 * 3. an inclusion proof against the root hash that can be positive (element is there) or negative (absence of element)
 *
 * As the element that is proven is always an instance, this class also has convenience methods to access the
 * instance data in case it is a proof of existence. For absence proofs, these methods will throw an error.
 */
var Proof = /** @class */ (function (_super) {
    __extends(Proof, _super);
    function Proof(props) {
        var _this = _super.call(this, props) || this;
        _this.links = _this.links || [];
        return _this;
    }
    Object.defineProperty(Proof.prototype, "stateChangeBody", {
        /**
         * Get the state change stored in the inclusion proof
         *
         * @returns the state change body
         */
        get: function () {
            if (!this._state) {
                // cache the decoding
                this._state = StateChangeBody.decode(this.inclusionproof.value);
            }
            return this._state;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Proof.prototype, "contractID", {
        /**
         * Returns the contractID this proof represents. Throws an error if it
         * is a proof of absence.
         *
         * @returns the contract ID as a buffer
         */
        get: function () {
            return this.stateChangeBody.contractID;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Proof.prototype, "darcID", {
        /**
         * Get the darc ID of the instance
         *
         * @returns the darcID responsible for the instanceID this proof represents.
         */
        get: function () {
            return this.stateChangeBody.darcID;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Proof.prototype, "value", {
        /**
         * The value of the instance is different from the value stored in the global state.
         *
         * @returns the value of the instance this proof represents.
         */
        get: function () {
            return this.stateChangeBody.value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Proof.prototype, "key", {
        /**
         * Get the instance ID for the proof
         *
         * @returns the instance ID as a buffer
         */
        get: function () {
            return this.inclusionproof.key;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * @see README#Message classes
     */
    Proof.register = function () {
        protobuf_1.registerMessage("byzcoin.Proof", Proof, InclusionProof, skipblock_1.SkipBlock, skipblock_1.ForwardLink);
    };
    /**
     * Verifies that the proof is of the given type and starts at the given byzcoin-id.
     * @param genesisID the hash of the first block, the byzcoin-id
     * @param contractID what contract the instance is supposed to be of
     * @throws an error if the proof is not based on genesisID, if it is a proof of absence,
     * or if the instance is not of type contractID.
     * @deprecated this function is unsecure
     */
    Proof.prototype.getVerifiedInstance = function (genesisID, contractID) {
        return __awaiter(this, void 0, void 0, function () {
            var err;
            return __generator(this, function (_a) {
                err = this.verify(genesisID);
                if (err != null) {
                    return [2 /*return*/, Promise.reject(err)];
                }
                if (!this.exists(this.key)) {
                    return [2 /*return*/, Promise.reject("cannot return an Instance from a proof of absence")];
                }
                if (this.contractID !== contractID) {
                    return [2 /*return*/, Promise.reject("not of correct contractID")];
                }
                return [2 /*return*/, new instance_1.default({ id: this.key, contractID: this.contractID, darcID: this.darcID, data: this.value })];
            });
        });
    };
    /**
     * Verify that the proof contains a correct chain from the given block.
     *
     * @param block the first block of the proof
     * @returns an error if something is wrong, null otherwise
     */
    Proof.prototype.verifyFrom = function (block) {
        if (this.links.length === 0) {
            return new Error("missing forward-links");
        }
        if (!this.links[0].newRoster.id.equals(block.roster.id)) {
            return new Error("invalid first roster found in proof");
        }
        return this.verify(block.hash);
    };
    /**
     * Verify that the proof contains a correct chain from the given genesis. Note that
     * this function doesn't verify the first roster of the chain.
     *
     * @param genesisID The skipchain ID
     * @returns an error if something is wrong, null otherwise
     * @deprecated use verifyFrom for a complete verification
     */
    Proof.prototype.verify = function (id) {
        if (!this.latest.computeHash().equals(this.latest.hash)) {
            return new Error("invalid latest block");
        }
        var header = data_header_1.default.decode(this.latest.data);
        if (!this.inclusionproof.hashInterior(0).equals(header.trieRoot)) {
            return new Error("invalid root");
        }
        var links = this.links;
        if (!links[0].to.equals(id)) {
            return new Error("mismatching block ID in the first link");
        }
        var publics = links[0].newRoster.getServicePublics(skipchain_1.SkipchainRPC.serviceName);
        // Check that all forward-links are correct.
        var prev = links[0].to;
        for (var i = 1; i < links.length; i++) {
            var link = links[i];
            var err = link.verifyWithScheme(publics, this.latest.signatureScheme);
            if (err) {
                return new Error("invalid forward link signature: " + err.message);
            }
            if (!link.from.equals(prev)) {
                return new Error("invalid chain of forward links");
            }
            prev = link.to;
            if (link.newRoster) {
                publics = link.newRoster.getServicePublics(skipchain_1.SkipchainRPC.serviceName);
            }
        }
        if (!prev.equals(this.latest.hash)) {
            return new Error("last forward link does not point to the latest block");
        }
        return null;
    };
    /**
     * Check if the key exists in the proof
     *
     * @returns true when it exists, false otherwise
     * @throws for corrupted proofs
     */
    Proof.prototype.exists = function (key) {
        if (key.length === 0) {
            throw new Error("key is nil");
        }
        if (this.inclusionproof.interiors.length === 0) {
            throw new Error("no interior node");
        }
        var bits = hashToBits(key);
        var expectedHash = this.inclusionproof.hashInterior(0);
        var i = 0;
        for (; i < this.inclusionproof.interiors.length; i++) {
            if (!expectedHash.equals(this.inclusionproof.hashInterior(i))) {
                throw new Error("invalid interior node");
            }
            if (bits[i]) {
                expectedHash = this.inclusionproof.interiors[i].left;
            }
            else {
                expectedHash = this.inclusionproof.interiors[i].right;
            }
        }
        if (expectedHash.equals(this.inclusionproof.hashLeaf())) {
            if (lodash_1.default.difference(bits.slice(0, i), this.inclusionproof.leaf.prefix).length !== 0) {
                throw new Error("invalid prefix in leaf node");
            }
            return this.key.equals(key);
        }
        else if (expectedHash.equals(this.inclusionproof.hashEmpty())) {
            if (lodash_1.default.difference(bits.slice(0, i), this.inclusionproof.empty.prefix).length !== 0) {
                throw new Error("invalid prefix in empty node");
            }
            return false;
        }
        throw new Error("no corresponding leaf/empty node with respect to the interior node");
    };
    /**
     * @param cid contractID to check
     * @returns true if it is a proof of existence and the given type of contract matches.
     */
    Proof.prototype.matchContract = function (cid) {
        return this.stateChangeBody.contractID.toString() === cid;
    };
    /**
     * @returns a nicely formatted representation of the proof.
     */
    Proof.prototype.toString = function () {
        return "Proof for contractID(" + this.contractID + ") for " + this.key;
    };
    return Proof;
}(light_1.Message));
exports.default = Proof;
/**
 * Get an array of booleans depending on the binary representation
 * of the key
 *
 * @param key the key to hash
 * @returns an array of booleans matching the key binary value
 */
function hashToBits(key) {
    var h = crypto_browserify_1.createHash("sha256");
    h.update(key);
    var hash = h.digest();
    var bits = new Array(hash.length * 8);
    for (var i = 0; i < bits.length; i++) {
        // tslint:disable-next-line no-bitwise
        bits[i] = ((hash[i >> 3] << (i % 8)) & (1 << 7)) > 0;
    }
    return bits;
}
/**
 * Get a buffer from an array of boolean converted in binary
 *
 * @param bits the array of booleans
 * @returns a buffer of the binary shape
 */
function boolToBuffer(bits) {
    // tslint:disable-next-line no-bitwise
    var buf = Buffer.alloc((bits.length + 7) >> 3, 0);
    for (var i = 0; i < bits.length; i++) {
        if (bits[i]) {
            // tslint:disable-next-line no-bitwise
            buf[i >> 3] |= (1 << 7) >> (i % 8);
        }
    }
    return buf;
}
/**
 * Interior node of an inclusion proof
 */
var InteriorNode = /** @class */ (function (_super) {
    __extends(InteriorNode, _super);
    function InteriorNode() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * @see README#Message classes
     */
    InteriorNode.register = function () {
        protobuf_1.registerMessage("trie.InteriorNode", InteriorNode);
    };
    return InteriorNode;
}(light_1.Message));
/**
 * Empty node of an inclusion proof
 */
var EmptyNode = /** @class */ (function (_super) {
    __extends(EmptyNode, _super);
    function EmptyNode(props) {
        var _this = _super.call(this, props) || this;
        _this.prefix = _this.prefix || [];
        return _this;
    }
    /**
     * @see README#Message classes
     */
    EmptyNode.register = function () {
        protobuf_1.registerMessage("trie.EmptyNode", EmptyNode);
    };
    return EmptyNode;
}(light_1.Message));
/**
 * Leaf node of an inclusion proof
 */
var LeafNode = /** @class */ (function (_super) {
    __extends(LeafNode, _super);
    function LeafNode(props) {
        var _this = _super.call(this, props) || this;
        _this.prefix = _this.prefix || [];
        return _this;
    }
    /**
     * @see README#Message classes
     */
    LeafNode.register = function () {
        protobuf_1.registerMessage("trie.LeafNode", LeafNode);
    };
    return LeafNode;
}(light_1.Message));
/**
 * InclusionProof represents the proof that an instance is present or not in the global state trie.
 */
var InclusionProof = /** @class */ (function (_super) {
    __extends(InclusionProof, _super);
    function InclusionProof(props) {
        var _this = _super.call(this, props) || this;
        _this.interiors = _this.interiors || [];
        return _this;
    }
    Object.defineProperty(InclusionProof.prototype, "key", {
        /**
         * @return {Buffer} the key in the leaf for this inclusionProof. This is not the same as the key this proof has
         * been created for!
         */
        get: function () {
            return this.leaf.key;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(InclusionProof.prototype, "value", {
        /**
         * @return {Buffer} the value stored in the instance. The value of an instance holds the contractID, darcID,
         * version and the data of the instance.
         */
        get: function () {
            return this.leaf.value;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * @see README#Message classes
     */
    InclusionProof.register = function () {
        protobuf_1.registerMessage("trie.Proof", InclusionProof, InteriorNode, LeafNode, EmptyNode);
    };
    /**
     * Get the hash of the interior node at the given index
     *
     * @param index the index of the interior node
     * @returns the hash as a buffer
     */
    InclusionProof.prototype.hashInterior = function (index) {
        var h = crypto_browserify_1.createHash("sha256");
        h.update(this.interiors[index].left);
        h.update(this.interiors[index].right);
        return h.digest();
    };
    /**
     * Get the hash of the leaf of the inclusion proof
     *
     * @returns the hash as a buffer
     */
    InclusionProof.prototype.hashLeaf = function () {
        var h = crypto_browserify_1.createHash("sha256");
        h.update(Buffer.from([3]));
        h.update(this.nonce);
        var prefix = boolToBuffer(this.leaf.prefix);
        h.update(prefix);
        var length = Buffer.allocUnsafe(4);
        length.writeIntLE(this.leaf.prefix.length, 0, 4);
        h.update(length);
        h.update(this.leaf.key);
        h.update(this.leaf.value);
        return h.digest();
    };
    /**
     * Get the hash of the empty node of the inclusion proof
     *
     * @returns the hash of the empty node
     */
    InclusionProof.prototype.hashEmpty = function () {
        var h = crypto_browserify_1.createHash("sha256");
        h.update(Buffer.from([2]));
        h.update(this.nonce);
        var prefix = boolToBuffer(this.empty.prefix);
        h.update(prefix);
        var length = Buffer.allocUnsafe(4);
        length.writeIntLE(this.empty.prefix.length, 0, 4);
        h.update(length);
        return h.digest();
    };
    return InclusionProof;
}(light_1.Message));
var StateChangeBody = /** @class */ (function (_super) {
    __extends(StateChangeBody, _super);
    function StateChangeBody(props) {
        return _super.call(this, props) || this;
    }
    Object.defineProperty(StateChangeBody.prototype, "contractID", {
        get: function () {
            return this.contractid;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(StateChangeBody.prototype, "darcID", {
        get: function () {
            return this.darcid;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * @see README#Message classes
     */
    StateChangeBody.register = function () {
        protobuf_1.registerMessage("StateChangeBody", StateChangeBody);
    };
    StateChangeBody.fromBytes = function (b) {
        return StateChangeBody.decode(b);
    };
    /**
     * Helper to encode the StateChangeBody using protobuf
     * @returns the bytes
     */
    StateChangeBody.prototype.toBytes = function () {
        return Buffer.from(StateChangeBody.encode(this).finish());
    };
    return StateChangeBody;
}(light_1.Message));
exports.StateChangeBody = StateChangeBody;
Proof.register();
InclusionProof.register();
InteriorNode.register();
LeafNode.register();
EmptyNode.register();
StateChangeBody.register();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvb2YuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJwcm9vZi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLHVEQUErQztBQUMvQyxrREFBdUI7QUFFdkIsMENBQXVEO0FBQ3ZELHdDQUE4QztBQUM5QywwQ0FBNEM7QUFDNUMsb0RBQWdFO0FBQ2hFLHdEQUFrRDtBQUNsRCxvRUFBNkM7QUFFN0M7Ozs7Ozs7Ozs7R0FVRztBQUNIO0lBQW1DLHlCQUFjO0lBaUU3QyxlQUFZLEtBQXdCO1FBQXBDLFlBQ0ksa0JBQU0sS0FBSyxDQUFDLFNBR2Y7UUFERyxLQUFJLENBQUMsS0FBSyxHQUFHLEtBQUksQ0FBQyxLQUFLLElBQUksRUFBRSxDQUFDOztJQUNsQyxDQUFDO0lBOURELHNCQUFJLGtDQUFlO1FBTG5COzs7O1dBSUc7YUFDSDtZQUNJLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFO2dCQUNkLHFCQUFxQjtnQkFDckIsSUFBSSxDQUFDLE1BQU0sR0FBRyxlQUFlLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUM7YUFDbkU7WUFFRCxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUM7UUFDdkIsQ0FBQzs7O09BQUE7SUFRRCxzQkFBSSw2QkFBVTtRQU5kOzs7OztXQUtHO2FBQ0g7WUFDSSxPQUFPLElBQUksQ0FBQyxlQUFlLENBQUMsVUFBVSxDQUFDO1FBQzNDLENBQUM7OztPQUFBO0lBT0Qsc0JBQUkseUJBQU07UUFMVjs7OztXQUlHO2FBQ0g7WUFDSSxPQUFPLElBQUksQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDO1FBQ3ZDLENBQUM7OztPQUFBO0lBT0Qsc0JBQUksd0JBQUs7UUFMVDs7OztXQUlHO2FBQ0g7WUFDSSxPQUFPLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDO1FBQ3RDLENBQUM7OztP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Q0FBQzs7O09BQUE7SUFFRCxzQkFBSSxtQ0FBTTthQUFWO1lBQ0ksT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDO1FBQ3ZCLENBQUM7OztPQUFBO0lBQ0Q7O09BRUc7SUFDSSx3QkFBUSxHQUFmO1FBQ0ksMEJBQWUsQ0FBQyxpQkFBaUIsRUFBRSxlQUFlLENBQUMsQ0FBQztJQUN4RCxDQUFDO0lBRU0seUJBQVMsR0FBaEIsVUFBaUIsQ0FBUztRQUN0QixPQUFPLGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDckMsQ0FBQztJQVlEOzs7T0FHRztJQUNILGlDQUFPLEdBQVA7UUFDSSxPQUFPLE1BQU0sQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO0lBQzlELENBQUM7SUFDTCxzQkFBQztBQUFELENBQUMsQUFyQ0QsQ0FBcUMsZUFBTyxHQXFDM0M7QUFyQ1ksMENBQWU7QUF1QzVCLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztBQUNqQixjQUFjLENBQUMsUUFBUSxFQUFFLENBQUM7QUFDMUIsWUFBWSxDQUFDLFFBQVEsRUFBRSxDQUFDO0FBQ3hCLFFBQVEsQ0FBQyxRQUFRLEVBQUUsQ0FBQztBQUNwQixTQUFTLENBQUMsUUFBUSxFQUFFLENBQUM7QUFDckIsZUFBZSxDQUFDLFFBQVEsRUFBRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgY3JlYXRlSGFzaCB9IGZyb20gXCJjcnlwdG8tYnJvd3NlcmlmeVwiO1xuaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xuaW1wb3J0IExvbmcgZnJvbSBcImxvbmdcIjtcbmltcG9ydCB7IE1lc3NhZ2UsIFByb3BlcnRpZXMgfSBmcm9tIFwicHJvdG9idWZqcy9saWdodFwiO1xuaW1wb3J0IHsgcmVnaXN0ZXJNZXNzYWdlIH0gZnJvbSBcIi4uL3Byb3RvYnVmXCI7XG5pbXBvcnQgeyBTa2lwY2hhaW5SUEMgfSBmcm9tIFwiLi4vc2tpcGNoYWluXCI7XG5pbXBvcnQgeyBGb3J3YXJkTGluaywgU2tpcEJsb2NrIH0gZnJvbSBcIi4uL3NraXBjaGFpbi9za2lwYmxvY2tcIjtcbmltcG9ydCBJbnN0YW5jZSwgeyBJbnN0YW5jZUlEIH0gZnJvbSBcIi4vaW5zdGFuY2VcIjtcbmltcG9ydCBEYXRhSGVhZGVyIGZyb20gXCIuL3Byb3RvL2RhdGEtaGVhZGVyXCI7XG5cbi8qKlxuICogVGhlIHByb29mIGNsYXNzIHJlcHJlc2VudHMgYSBwcm9vZiB0aGF0IGEgZ2l2ZW4gaW5zdGFuY2Ugd2l0aCBpdHMgZGF0YSBpcyBlaXRoZXIgcHJlc2VudCBvciBhYnNlbnQgaW4gdGhlIGdsb2JhbFxuICogc3RhdGUuIEl0IGRvZXMgdGhpcyBieSBwcm92aW5nIHRocmVlIGRpZmZlcmVudCB0aGluZ3M6XG4gKlxuICogMS4gdGhhdCB0aGVyZSBpcyBhIHZhbGlkIGNoYWluIG9mIGJsb2NrcyBmcm9tIHRoZSBnZW5lc2lzIHRvIHRoZSBsYXRlc3QgYmxvY2tcbiAqIDIuIGEgY29weSBvZiB0aGUgbGF0ZXN0IGJsb2NrIHRvIGdldCB0aGUgcm9vdCBoYXNoIG9mIHRoZSBnbG9iYWwgc3RhdGUgdHJpZVxuICogMy4gYW4gaW5jbHVzaW9uIHByb29mIGFnYWluc3QgdGhlIHJvb3QgaGFzaCB0aGF0IGNhbiBiZSBwb3NpdGl2ZSAoZWxlbWVudCBpcyB0aGVyZSkgb3IgbmVnYXRpdmUgKGFic2VuY2Ugb2YgZWxlbWVudClcbiAqXG4gKiBBcyB0aGUgZWxlbWVudCB0aGF0IGlzIHByb3ZlbiBpcyBhbHdheXMgYW4gaW5zdGFuY2UsIHRoaXMgY2xhc3MgYWxzbyBoYXMgY29udmVuaWVuY2UgbWV0aG9kcyB0byBhY2Nlc3MgdGhlXG4gKiBpbnN0YW5jZSBkYXRhIGluIGNhc2UgaXQgaXMgYSBwcm9vZiBvZiBleGlzdGVuY2UuIEZvciBhYnNlbmNlIHByb29mcywgdGhlc2UgbWV0aG9kcyB3aWxsIHRocm93IGFuIGVycm9yLlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBQcm9vZiBleHRlbmRzIE1lc3NhZ2U8UHJvb2Y+IHtcblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgc3RhdGUgY2hhbmdlIHN0b3JlZCBpbiB0aGUgaW5jbHVzaW9uIHByb29mXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB0aGUgc3RhdGUgY2hhbmdlIGJvZHlcbiAgICAgKi9cbiAgICBnZXQgc3RhdGVDaGFuZ2VCb2R5KCk6IFN0YXRlQ2hhbmdlQm9keSB7XG4gICAgICAgIGlmICghdGhpcy5fc3RhdGUpIHtcbiAgICAgICAgICAgIC8vIGNhY2hlIHRoZSBkZWNvZGluZ1xuICAgICAgICAgICAgdGhpcy5fc3RhdGUgPSBTdGF0ZUNoYW5nZUJvZHkuZGVjb2RlKHRoaXMuaW5jbHVzaW9ucHJvb2YudmFsdWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuX3N0YXRlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIGNvbnRyYWN0SUQgdGhpcyBwcm9vZiByZXByZXNlbnRzLiBUaHJvd3MgYW4gZXJyb3IgaWYgaXRcbiAgICAgKiBpcyBhIHByb29mIG9mIGFic2VuY2UuXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB0aGUgY29udHJhY3QgSUQgYXMgYSBidWZmZXJcbiAgICAgKi9cbiAgICBnZXQgY29udHJhY3RJRCgpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gdGhpcy5zdGF0ZUNoYW5nZUJvZHkuY29udHJhY3RJRDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIGRhcmMgSUQgb2YgdGhlIGluc3RhbmNlXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB0aGUgZGFyY0lEIHJlc3BvbnNpYmxlIGZvciB0aGUgaW5zdGFuY2VJRCB0aGlzIHByb29mIHJlcHJlc2VudHMuXG4gICAgICovXG4gICAgZ2V0IGRhcmNJRCgpOiBCdWZmZXIge1xuICAgICAgICByZXR1cm4gdGhpcy5zdGF0ZUNoYW5nZUJvZHkuZGFyY0lEO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSB2YWx1ZSBvZiB0aGUgaW5zdGFuY2UgaXMgZGlmZmVyZW50IGZyb20gdGhlIHZhbHVlIHN0b3JlZCBpbiB0aGUgZ2xvYmFsIHN0YXRlLlxuICAgICAqXG4gICAgICogQHJldHVybnMgdGhlIHZhbHVlIG9mIHRoZSBpbnN0YW5jZSB0aGlzIHByb29mIHJlcHJlc2VudHMuXG4gICAgICovXG4gICAgZ2V0IHZhbHVlKCk6IEJ1ZmZlciB7XG4gICAgICAgIHJldHVybiB0aGlzLnN0YXRlQ2hhbmdlQm9keS52YWx1ZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIGluc3RhbmNlIElEIGZvciB0aGUgcHJvb2ZcbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHRoZSBpbnN0YW5jZSBJRCBhcyBhIGJ1ZmZlclxuICAgICAqL1xuICAgIGdldCBrZXkoKTogQnVmZmVyIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaW5jbHVzaW9ucHJvb2Yua2V5O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBzZWUgUkVBRE1FI01lc3NhZ2UgY2xhc3Nlc1xuICAgICAqL1xuICAgIHN0YXRpYyByZWdpc3RlcigpIHtcbiAgICAgICAgcmVnaXN0ZXJNZXNzYWdlKFwiYnl6Y29pbi5Qcm9vZlwiLCBQcm9vZiwgSW5jbHVzaW9uUHJvb2YsIFNraXBCbG9jaywgRm9yd2FyZExpbmspO1xuICAgIH1cblxuICAgIHJlYWRvbmx5IGluY2x1c2lvbnByb29mOiBJbmNsdXNpb25Qcm9vZjtcbiAgICByZWFkb25seSBsYXRlc3Q6IFNraXBCbG9jaztcbiAgICByZWFkb25seSBsaW5rczogRm9yd2FyZExpbmtbXTtcbiAgICBwcm90ZWN0ZWQgX3N0YXRlOiBTdGF0ZUNoYW5nZUJvZHk7XG5cbiAgICBjb25zdHJ1Y3Rvcihwcm9wczogUHJvcGVydGllczxQcm9vZj4pIHtcbiAgICAgICAgc3VwZXIocHJvcHMpO1xuXG4gICAgICAgIHRoaXMubGlua3MgPSB0aGlzLmxpbmtzIHx8IFtdO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFZlcmlmaWVzIHRoYXQgdGhlIHByb29mIGlzIG9mIHRoZSBnaXZlbiB0eXBlIGFuZCBzdGFydHMgYXQgdGhlIGdpdmVuIGJ5emNvaW4taWQuXG4gICAgICogQHBhcmFtIGdlbmVzaXNJRCB0aGUgaGFzaCBvZiB0aGUgZmlyc3QgYmxvY2ssIHRoZSBieXpjb2luLWlkXG4gICAgICogQHBhcmFtIGNvbnRyYWN0SUQgd2hhdCBjb250cmFjdCB0aGUgaW5zdGFuY2UgaXMgc3VwcG9zZWQgdG8gYmUgb2ZcbiAgICAgKiBAdGhyb3dzIGFuIGVycm9yIGlmIHRoZSBwcm9vZiBpcyBub3QgYmFzZWQgb24gZ2VuZXNpc0lELCBpZiBpdCBpcyBhIHByb29mIG9mIGFic2VuY2UsXG4gICAgICogb3IgaWYgdGhlIGluc3RhbmNlIGlzIG5vdCBvZiB0eXBlIGNvbnRyYWN0SUQuXG4gICAgICogQGRlcHJlY2F0ZWQgdGhpcyBmdW5jdGlvbiBpcyB1bnNlY3VyZVxuICAgICAqL1xuICAgIGFzeW5jIGdldFZlcmlmaWVkSW5zdGFuY2UoZ2VuZXNpc0lEOiBJbnN0YW5jZUlELCBjb250cmFjdElEOiBzdHJpbmcpOiBQcm9taXNlPEluc3RhbmNlPiB7XG4gICAgICAgIGNvbnN0IGVyciA9IHRoaXMudmVyaWZ5KGdlbmVzaXNJRCk7XG4gICAgICAgIGlmIChlcnIgIT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLmV4aXN0cyh0aGlzLmtleSkpIHtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChcImNhbm5vdCByZXR1cm4gYW4gSW5zdGFuY2UgZnJvbSBhIHByb29mIG9mIGFic2VuY2VcIik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuY29udHJhY3RJRCAhPT0gY29udHJhY3RJRCkge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KFwibm90IG9mIGNvcnJlY3QgY29udHJhY3RJRFwiKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmV3IEluc3RhbmNlKHtpZDogdGhpcy5rZXksIGNvbnRyYWN0SUQ6IHRoaXMuY29udHJhY3RJRCwgZGFyY0lEOiB0aGlzLmRhcmNJRCwgZGF0YTogdGhpcy52YWx1ZX0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFZlcmlmeSB0aGF0IHRoZSBwcm9vZiBjb250YWlucyBhIGNvcnJlY3QgY2hhaW4gZnJvbSB0aGUgZ2l2ZW4gYmxvY2suXG4gICAgICpcbiAgICAgKiBAcGFyYW0gYmxvY2sgdGhlIGZpcnN0IGJsb2NrIG9mIHRoZSBwcm9vZlxuICAgICAqIEByZXR1cm5zIGFuIGVycm9yIGlmIHNvbWV0aGluZyBpcyB3cm9uZywgbnVsbCBvdGhlcndpc2VcbiAgICAgKi9cbiAgICB2ZXJpZnlGcm9tKGJsb2NrOiBTa2lwQmxvY2spOiBFcnJvciB7XG4gICAgICAgIGlmICh0aGlzLmxpbmtzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBFcnJvcihcIm1pc3NpbmcgZm9yd2FyZC1saW5rc1wiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdGhpcy5saW5rc1swXS5uZXdSb3N0ZXIuaWQuZXF1YWxzKGJsb2NrLnJvc3Rlci5pZCkpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgRXJyb3IoXCJpbnZhbGlkIGZpcnN0IHJvc3RlciBmb3VuZCBpbiBwcm9vZlwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLnZlcmlmeShibG9jay5oYXNoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBWZXJpZnkgdGhhdCB0aGUgcHJvb2YgY29udGFpbnMgYSBjb3JyZWN0IGNoYWluIGZyb20gdGhlIGdpdmVuIGdlbmVzaXMuIE5vdGUgdGhhdFxuICAgICAqIHRoaXMgZnVuY3Rpb24gZG9lc24ndCB2ZXJpZnkgdGhlIGZpcnN0IHJvc3RlciBvZiB0aGUgY2hhaW4uXG4gICAgICpcbiAgICAgKiBAcGFyYW0gZ2VuZXNpc0lEIFRoZSBza2lwY2hhaW4gSURcbiAgICAgKiBAcmV0dXJucyBhbiBlcnJvciBpZiBzb21ldGhpbmcgaXMgd3JvbmcsIG51bGwgb3RoZXJ3aXNlXG4gICAgICogQGRlcHJlY2F0ZWQgdXNlIHZlcmlmeUZyb20gZm9yIGEgY29tcGxldGUgdmVyaWZpY2F0aW9uXG4gICAgICovXG4gICAgdmVyaWZ5KGlkOiBJbnN0YW5jZUlEKTogRXJyb3Ige1xuICAgICAgICBpZiAoIXRoaXMubGF0ZXN0LmNvbXB1dGVIYXNoKCkuZXF1YWxzKHRoaXMubGF0ZXN0Lmhhc2gpKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IEVycm9yKFwiaW52YWxpZCBsYXRlc3QgYmxvY2tcIik7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBoZWFkZXIgPSBEYXRhSGVhZGVyLmRlY29kZSh0aGlzLmxhdGVzdC5kYXRhKTtcbiAgICAgICAgaWYgKCF0aGlzLmluY2x1c2lvbnByb29mLmhhc2hJbnRlcmlvcigwKS5lcXVhbHMoaGVhZGVyLnRyaWVSb290KSkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBFcnJvcihcImludmFsaWQgcm9vdFwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGxpbmtzID0gdGhpcy5saW5rcztcbiAgICAgICAgaWYgKCFsaW5rc1swXS50by5lcXVhbHMoaWQpKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IEVycm9yKFwibWlzbWF0Y2hpbmcgYmxvY2sgSUQgaW4gdGhlIGZpcnN0IGxpbmtcIik7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgcHVibGljcyA9IGxpbmtzWzBdLm5ld1Jvc3Rlci5nZXRTZXJ2aWNlUHVibGljcyhTa2lwY2hhaW5SUEMuc2VydmljZU5hbWUpO1xuXG4gICAgICAgIC8vIENoZWNrIHRoYXQgYWxsIGZvcndhcmQtbGlua3MgYXJlIGNvcnJlY3QuXG4gICAgICAgIGxldCBwcmV2ID0gbGlua3NbMF0udG87XG4gICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDwgbGlua3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IGxpbmsgPSBsaW5rc1tpXTtcblxuICAgICAgICAgICAgY29uc3QgZXJyID0gbGluay52ZXJpZnlXaXRoU2NoZW1lKHB1YmxpY3MsIHRoaXMubGF0ZXN0LnNpZ25hdHVyZVNjaGVtZSk7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBFcnJvcihcImludmFsaWQgZm9yd2FyZCBsaW5rIHNpZ25hdHVyZTogXCIgKyBlcnIubWVzc2FnZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghbGluay5mcm9tLmVxdWFscyhwcmV2KSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXJyb3IoXCJpbnZhbGlkIGNoYWluIG9mIGZvcndhcmQgbGlua3NcIik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHByZXYgPSBsaW5rLnRvO1xuXG4gICAgICAgICAgICBpZiAobGluay5uZXdSb3N0ZXIpIHtcbiAgICAgICAgICAgICAgICBwdWJsaWNzID0gbGluay5uZXdSb3N0ZXIuZ2V0U2VydmljZVB1YmxpY3MoU2tpcGNoYWluUlBDLnNlcnZpY2VOYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghcHJldi5lcXVhbHModGhpcy5sYXRlc3QuaGFzaCkpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgRXJyb3IoXCJsYXN0IGZvcndhcmQgbGluayBkb2VzIG5vdCBwb2ludCB0byB0aGUgbGF0ZXN0IGJsb2NrXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2hlY2sgaWYgdGhlIGtleSBleGlzdHMgaW4gdGhlIHByb29mXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB0cnVlIHdoZW4gaXQgZXhpc3RzLCBmYWxzZSBvdGhlcndpc2VcbiAgICAgKiBAdGhyb3dzIGZvciBjb3JydXB0ZWQgcHJvb2ZzXG4gICAgICovXG4gICAgZXhpc3RzKGtleTogQnVmZmVyKTogYm9vbGVhbiB7XG4gICAgICAgIGlmIChrZXkubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJrZXkgaXMgbmlsXCIpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmluY2x1c2lvbnByb29mLmludGVyaW9ycy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIm5vIGludGVyaW9yIG5vZGVcIik7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBiaXRzID0gaGFzaFRvQml0cyhrZXkpO1xuICAgICAgICBsZXQgZXhwZWN0ZWRIYXNoID0gdGhpcy5pbmNsdXNpb25wcm9vZi5oYXNoSW50ZXJpb3IoMCk7XG5cbiAgICAgICAgbGV0IGkgPSAwO1xuICAgICAgICBmb3IgKDsgaSA8IHRoaXMuaW5jbHVzaW9ucHJvb2YuaW50ZXJpb3JzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoIWV4cGVjdGVkSGFzaC5lcXVhbHModGhpcy5pbmNsdXNpb25wcm9vZi5oYXNoSW50ZXJpb3IoaSkpKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiaW52YWxpZCBpbnRlcmlvciBub2RlXCIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoYml0c1tpXSkge1xuICAgICAgICAgICAgICAgIGV4cGVjdGVkSGFzaCA9IHRoaXMuaW5jbHVzaW9ucHJvb2YuaW50ZXJpb3JzW2ldLmxlZnQ7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGV4cGVjdGVkSGFzaCA9IHRoaXMuaW5jbHVzaW9ucHJvb2YuaW50ZXJpb3JzW2ldLnJpZ2h0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGV4cGVjdGVkSGFzaC5lcXVhbHModGhpcy5pbmNsdXNpb25wcm9vZi5oYXNoTGVhZigpKSkge1xuICAgICAgICAgICAgaWYgKF8uZGlmZmVyZW5jZShiaXRzLnNsaWNlKDAsIGkpLCB0aGlzLmluY2x1c2lvbnByb29mLmxlYWYucHJlZml4KS5sZW5ndGggIT09IDApIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJpbnZhbGlkIHByZWZpeCBpbiBsZWFmIG5vZGVcIik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzLmtleS5lcXVhbHMoa2V5KTtcbiAgICAgICAgfSBlbHNlIGlmIChleHBlY3RlZEhhc2guZXF1YWxzKHRoaXMuaW5jbHVzaW9ucHJvb2YuaGFzaEVtcHR5KCkpKSB7XG4gICAgICAgICAgICBpZiAoXy5kaWZmZXJlbmNlKGJpdHMuc2xpY2UoMCwgaSksIHRoaXMuaW5jbHVzaW9ucHJvb2YuZW1wdHkucHJlZml4KS5sZW5ndGggIT09IDApIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJpbnZhbGlkIHByZWZpeCBpbiBlbXB0eSBub2RlXCIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJubyBjb3JyZXNwb25kaW5nIGxlYWYvZW1wdHkgbm9kZSB3aXRoIHJlc3BlY3QgdG8gdGhlIGludGVyaW9yIG5vZGVcIik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIGNpZCBjb250cmFjdElEIHRvIGNoZWNrXG4gICAgICogQHJldHVybnMgdHJ1ZSBpZiBpdCBpcyBhIHByb29mIG9mIGV4aXN0ZW5jZSBhbmQgdGhlIGdpdmVuIHR5cGUgb2YgY29udHJhY3QgbWF0Y2hlcy5cbiAgICAgKi9cbiAgICBtYXRjaENvbnRyYWN0KGNpZDogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiB0aGlzLnN0YXRlQ2hhbmdlQm9keS5jb250cmFjdElELnRvU3RyaW5nKCkgPT09IGNpZDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcmV0dXJucyBhIG5pY2VseSBmb3JtYXR0ZWQgcmVwcmVzZW50YXRpb24gb2YgdGhlIHByb29mLlxuICAgICAqL1xuICAgIHRvU3RyaW5nKCk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiBgUHJvb2YgZm9yIGNvbnRyYWN0SUQoJHt0aGlzLmNvbnRyYWN0SUR9KSBmb3IgJHt0aGlzLmtleX1gO1xuICAgIH1cbn1cblxuLyoqXG4gKiBHZXQgYW4gYXJyYXkgb2YgYm9vbGVhbnMgZGVwZW5kaW5nIG9uIHRoZSBiaW5hcnkgcmVwcmVzZW50YXRpb25cbiAqIG9mIHRoZSBrZXlcbiAqXG4gKiBAcGFyYW0ga2V5IHRoZSBrZXkgdG8gaGFzaFxuICogQHJldHVybnMgYW4gYXJyYXkgb2YgYm9vbGVhbnMgbWF0Y2hpbmcgdGhlIGtleSBiaW5hcnkgdmFsdWVcbiAqL1xuZnVuY3Rpb24gaGFzaFRvQml0cyhrZXk6IEJ1ZmZlcik6IGJvb2xlYW5bXSB7XG4gICAgY29uc3QgaCA9IGNyZWF0ZUhhc2goXCJzaGEyNTZcIik7XG4gICAgaC51cGRhdGUoa2V5KTtcbiAgICBjb25zdCBoYXNoID0gaC5kaWdlc3QoKTtcblxuICAgIGNvbnN0IGJpdHMgPSBuZXcgQXJyYXkoaGFzaC5sZW5ndGggKiA4KTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGJpdHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lIG5vLWJpdHdpc2VcbiAgICAgICAgYml0c1tpXSA9ICgoaGFzaFtpID4+IDNdIDw8IChpICUgOCkpICYgKDEgPDwgNykpID4gMDtcbiAgICB9XG5cbiAgICByZXR1cm4gYml0cztcbn1cblxuLyoqXG4gKiBHZXQgYSBidWZmZXIgZnJvbSBhbiBhcnJheSBvZiBib29sZWFuIGNvbnZlcnRlZCBpbiBiaW5hcnlcbiAqXG4gKiBAcGFyYW0gYml0cyB0aGUgYXJyYXkgb2YgYm9vbGVhbnNcbiAqIEByZXR1cm5zIGEgYnVmZmVyIG9mIHRoZSBiaW5hcnkgc2hhcGVcbiAqL1xuZnVuY3Rpb24gYm9vbFRvQnVmZmVyKGJpdHM6IGJvb2xlYW5bXSk6IEJ1ZmZlciB7XG4gICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lIG5vLWJpdHdpc2VcbiAgICBjb25zdCBidWYgPSBCdWZmZXIuYWxsb2MoKGJpdHMubGVuZ3RoICsgNykgPj4gMywgMCk7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGJpdHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGJpdHNbaV0pIHtcbiAgICAgICAgICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZSBuby1iaXR3aXNlXG4gICAgICAgICAgICBidWZbaSA+PiAzXSB8PSAoMSA8PCA3KSA+PiAoaSAlIDgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGJ1Zjtcbn1cblxuLyoqXG4gKiBJbnRlcmlvciBub2RlIG9mIGFuIGluY2x1c2lvbiBwcm9vZlxuICovXG5jbGFzcyBJbnRlcmlvck5vZGUgZXh0ZW5kcyBNZXNzYWdlPEludGVyaW9yTm9kZT4ge1xuICAgIC8qKlxuICAgICAqIEBzZWUgUkVBRE1FI01lc3NhZ2UgY2xhc3Nlc1xuICAgICAqL1xuICAgIHN0YXRpYyByZWdpc3RlcigpIHtcbiAgICAgICAgcmVnaXN0ZXJNZXNzYWdlKFwidHJpZS5JbnRlcmlvck5vZGVcIiwgSW50ZXJpb3JOb2RlKTtcbiAgICB9XG5cbiAgICByZWFkb25seSBsZWZ0OiBCdWZmZXI7XG4gICAgcmVhZG9ubHkgcmlnaHQ6IEJ1ZmZlcjtcbn1cblxuLyoqXG4gKiBFbXB0eSBub2RlIG9mIGFuIGluY2x1c2lvbiBwcm9vZlxuICovXG5jbGFzcyBFbXB0eU5vZGUgZXh0ZW5kcyBNZXNzYWdlPEVtcHR5Tm9kZT4ge1xuICAgIC8qKlxuICAgICAqIEBzZWUgUkVBRE1FI01lc3NhZ2UgY2xhc3Nlc1xuICAgICAqL1xuICAgIHN0YXRpYyByZWdpc3RlcigpIHtcbiAgICAgICAgcmVnaXN0ZXJNZXNzYWdlKFwidHJpZS5FbXB0eU5vZGVcIiwgRW1wdHlOb2RlKTtcbiAgICB9XG5cbiAgICByZWFkb25seSBwcmVmaXg6IGJvb2xlYW5bXTtcblxuICAgIGNvbnN0cnVjdG9yKHByb3BzPzogUHJvcGVydGllczxFbXB0eU5vZGU+KSB7XG4gICAgICAgIHN1cGVyKHByb3BzKTtcblxuICAgICAgICB0aGlzLnByZWZpeCA9IHRoaXMucHJlZml4IHx8IFtdO1xuICAgIH1cbn1cblxuLyoqXG4gKiBMZWFmIG5vZGUgb2YgYW4gaW5jbHVzaW9uIHByb29mXG4gKi9cbmNsYXNzIExlYWZOb2RlIGV4dGVuZHMgTWVzc2FnZTxMZWFmTm9kZT4ge1xuICAgIC8qKlxuICAgICAqIEBzZWUgUkVBRE1FI01lc3NhZ2UgY2xhc3Nlc1xuICAgICAqL1xuICAgIHN0YXRpYyByZWdpc3RlcigpIHtcbiAgICAgICAgcmVnaXN0ZXJNZXNzYWdlKFwidHJpZS5MZWFmTm9kZVwiLCBMZWFmTm9kZSk7XG4gICAgfVxuXG4gICAgcmVhZG9ubHkgcHJlZml4OiBib29sZWFuW107XG4gICAgcmVhZG9ubHkga2V5OiBCdWZmZXI7XG4gICAgcmVhZG9ubHkgdmFsdWU6IEJ1ZmZlcjtcblxuICAgIGNvbnN0cnVjdG9yKHByb3BzPzogUHJvcGVydGllczxMZWFmTm9kZT4pIHtcbiAgICAgICAgc3VwZXIocHJvcHMpO1xuXG4gICAgICAgIHRoaXMucHJlZml4ID0gdGhpcy5wcmVmaXggfHwgW107XG4gICAgfVxufVxuXG4vKipcbiAqIEluY2x1c2lvblByb29mIHJlcHJlc2VudHMgdGhlIHByb29mIHRoYXQgYW4gaW5zdGFuY2UgaXMgcHJlc2VudCBvciBub3QgaW4gdGhlIGdsb2JhbCBzdGF0ZSB0cmllLlxuICovXG5jbGFzcyBJbmNsdXNpb25Qcm9vZiBleHRlbmRzIE1lc3NhZ2U8SW5jbHVzaW9uUHJvb2Y+IHtcblxuICAgIC8qKlxuICAgICAqIEByZXR1cm4ge0J1ZmZlcn0gdGhlIGtleSBpbiB0aGUgbGVhZiBmb3IgdGhpcyBpbmNsdXNpb25Qcm9vZi4gVGhpcyBpcyBub3QgdGhlIHNhbWUgYXMgdGhlIGtleSB0aGlzIHByb29mIGhhc1xuICAgICAqIGJlZW4gY3JlYXRlZCBmb3IhXG4gICAgICovXG4gICAgZ2V0IGtleSgpOiBCdWZmZXIge1xuICAgICAgICByZXR1cm4gdGhpcy5sZWFmLmtleTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcmV0dXJuIHtCdWZmZXJ9IHRoZSB2YWx1ZSBzdG9yZWQgaW4gdGhlIGluc3RhbmNlLiBUaGUgdmFsdWUgb2YgYW4gaW5zdGFuY2UgaG9sZHMgdGhlIGNvbnRyYWN0SUQsIGRhcmNJRCxcbiAgICAgKiB2ZXJzaW9uIGFuZCB0aGUgZGF0YSBvZiB0aGUgaW5zdGFuY2UuXG4gICAgICovXG4gICAgZ2V0IHZhbHVlKCk6IEJ1ZmZlciB7XG4gICAgICAgIHJldHVybiB0aGlzLmxlYWYudmFsdWU7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEBzZWUgUkVBRE1FI01lc3NhZ2UgY2xhc3Nlc1xuICAgICAqL1xuICAgIHN0YXRpYyByZWdpc3RlcigpIHtcbiAgICAgICAgcmVnaXN0ZXJNZXNzYWdlKFwidHJpZS5Qcm9vZlwiLCBJbmNsdXNpb25Qcm9vZiwgSW50ZXJpb3JOb2RlLCBMZWFmTm9kZSwgRW1wdHlOb2RlKTtcbiAgICB9XG5cbiAgICBpbnRlcmlvcnM6IEludGVyaW9yTm9kZVtdO1xuICAgIGxlYWY6IExlYWZOb2RlO1xuICAgIGVtcHR5OiBFbXB0eU5vZGU7XG4gICAgbm9uY2U6IEJ1ZmZlcjtcblxuICAgIGNvbnN0cnVjdG9yKHByb3BzPzogUHJvcGVydGllczxJbmNsdXNpb25Qcm9vZj4pIHtcbiAgICAgICAgc3VwZXIocHJvcHMpO1xuXG4gICAgICAgIHRoaXMuaW50ZXJpb3JzID0gdGhpcy5pbnRlcmlvcnMgfHwgW107XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSBoYXNoIG9mIHRoZSBpbnRlcmlvciBub2RlIGF0IHRoZSBnaXZlbiBpbmRleFxuICAgICAqXG4gICAgICogQHBhcmFtIGluZGV4IHRoZSBpbmRleCBvZiB0aGUgaW50ZXJpb3Igbm9kZVxuICAgICAqIEByZXR1cm5zIHRoZSBoYXNoIGFzIGEgYnVmZmVyXG4gICAgICovXG4gICAgaGFzaEludGVyaW9yKGluZGV4OiBudW1iZXIpOiBCdWZmZXIge1xuICAgICAgICBjb25zdCBoID0gY3JlYXRlSGFzaChcInNoYTI1NlwiKTtcbiAgICAgICAgaC51cGRhdGUodGhpcy5pbnRlcmlvcnNbaW5kZXhdLmxlZnQpO1xuICAgICAgICBoLnVwZGF0ZSh0aGlzLmludGVyaW9yc1tpbmRleF0ucmlnaHQpO1xuXG4gICAgICAgIHJldHVybiBoLmRpZ2VzdCgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgaGFzaCBvZiB0aGUgbGVhZiBvZiB0aGUgaW5jbHVzaW9uIHByb29mXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB0aGUgaGFzaCBhcyBhIGJ1ZmZlclxuICAgICAqL1xuICAgIGhhc2hMZWFmKCk6IEJ1ZmZlciB7XG4gICAgICAgIGNvbnN0IGggPSBjcmVhdGVIYXNoKFwic2hhMjU2XCIpO1xuICAgICAgICBoLnVwZGF0ZShCdWZmZXIuZnJvbShbM10pKTtcbiAgICAgICAgaC51cGRhdGUodGhpcy5ub25jZSk7XG5cbiAgICAgICAgY29uc3QgcHJlZml4ID0gYm9vbFRvQnVmZmVyKHRoaXMubGVhZi5wcmVmaXgpO1xuICAgICAgICBoLnVwZGF0ZShwcmVmaXgpO1xuXG4gICAgICAgIGNvbnN0IGxlbmd0aCA9IEJ1ZmZlci5hbGxvY1Vuc2FmZSg0KTtcbiAgICAgICAgbGVuZ3RoLndyaXRlSW50TEUodGhpcy5sZWFmLnByZWZpeC5sZW5ndGgsIDAsIDQpO1xuICAgICAgICBoLnVwZGF0ZShsZW5ndGgpO1xuXG4gICAgICAgIGgudXBkYXRlKHRoaXMubGVhZi5rZXkpO1xuICAgICAgICBoLnVwZGF0ZSh0aGlzLmxlYWYudmFsdWUpO1xuXG4gICAgICAgIHJldHVybiBoLmRpZ2VzdCgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgaGFzaCBvZiB0aGUgZW1wdHkgbm9kZSBvZiB0aGUgaW5jbHVzaW9uIHByb29mXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB0aGUgaGFzaCBvZiB0aGUgZW1wdHkgbm9kZVxuICAgICAqL1xuICAgIGhhc2hFbXB0eSgpOiBCdWZmZXIge1xuICAgICAgICBjb25zdCBoID0gY3JlYXRlSGFzaChcInNoYTI1NlwiKTtcbiAgICAgICAgaC51cGRhdGUoQnVmZmVyLmZyb20oWzJdKSk7XG4gICAgICAgIGgudXBkYXRlKHRoaXMubm9uY2UpO1xuXG4gICAgICAgIGNvbnN0IHByZWZpeCA9IGJvb2xUb0J1ZmZlcih0aGlzLmVtcHR5LnByZWZpeCk7XG4gICAgICAgIGgudXBkYXRlKHByZWZpeCk7XG5cbiAgICAgICAgY29uc3QgbGVuZ3RoID0gQnVmZmVyLmFsbG9jVW5zYWZlKDQpO1xuICAgICAgICBsZW5ndGgud3JpdGVJbnRMRSh0aGlzLmVtcHR5LnByZWZpeC5sZW5ndGgsIDAsIDQpO1xuICAgICAgICBoLnVwZGF0ZShsZW5ndGgpO1xuXG4gICAgICAgIHJldHVybiBoLmRpZ2VzdCgpO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFN0YXRlQ2hhbmdlQm9keSBleHRlbmRzIE1lc3NhZ2U8U3RhdGVDaGFuZ2VCb2R5PiB7XG5cbiAgICBnZXQgY29udHJhY3RJRCgpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gdGhpcy5jb250cmFjdGlkO1xuICAgIH1cblxuICAgIGdldCBkYXJjSUQoKTogQnVmZmVyIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGFyY2lkO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBAc2VlIFJFQURNRSNNZXNzYWdlIGNsYXNzZXNcbiAgICAgKi9cbiAgICBzdGF0aWMgcmVnaXN0ZXIoKSB7XG4gICAgICAgIHJlZ2lzdGVyTWVzc2FnZShcIlN0YXRlQ2hhbmdlQm9keVwiLCBTdGF0ZUNoYW5nZUJvZHkpO1xuICAgIH1cblxuICAgIHN0YXRpYyBmcm9tQnl0ZXMoYjogQnVmZmVyKTogU3RhdGVDaGFuZ2VCb2R5IHtcbiAgICAgICAgcmV0dXJuIFN0YXRlQ2hhbmdlQm9keS5kZWNvZGUoYik7XG4gICAgfVxuXG4gICAgcmVhZG9ubHkgc3RhdGVhY3Rpb246IG51bWJlcjtcbiAgICByZWFkb25seSBjb250cmFjdGlkOiBzdHJpbmc7XG4gICAgcmVhZG9ubHkgdmFsdWU6IEJ1ZmZlcjtcbiAgICByZWFkb25seSB2ZXJzaW9uOiBMb25nO1xuICAgIHJlYWRvbmx5IGRhcmNpZDogQnVmZmVyO1xuXG4gICAgY29uc3RydWN0b3IocHJvcHM/OiBQcm9wZXJ0aWVzPFN0YXRlQ2hhbmdlQm9keT4pIHtcbiAgICAgICAgc3VwZXIocHJvcHMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEhlbHBlciB0byBlbmNvZGUgdGhlIFN0YXRlQ2hhbmdlQm9keSB1c2luZyBwcm90b2J1ZlxuICAgICAqIEByZXR1cm5zIHRoZSBieXRlc1xuICAgICAqL1xuICAgIHRvQnl0ZXMoKTogQnVmZmVyIHtcbiAgICAgICAgcmV0dXJuIEJ1ZmZlci5mcm9tKFN0YXRlQ2hhbmdlQm9keS5lbmNvZGUodGhpcykuZmluaXNoKCkpO1xuICAgIH1cbn1cblxuUHJvb2YucmVnaXN0ZXIoKTtcbkluY2x1c2lvblByb29mLnJlZ2lzdGVyKCk7XG5JbnRlcmlvck5vZGUucmVnaXN0ZXIoKTtcbkxlYWZOb2RlLnJlZ2lzdGVyKCk7XG5FbXB0eU5vZGUucmVnaXN0ZXIoKTtcblN0YXRlQ2hhbmdlQm9keS5yZWdpc3RlcigpO1xuIl19