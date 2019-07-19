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
Object.defineProperty(exports, "__esModule", { value: true });
var kyber_1 = require("@dedis/kyber");
var point_1 = require("@dedis/kyber/pairing/point");
var crypto_browserify_1 = require("crypto-browserify");
var light_1 = require("protobufjs/light");
var proto_1 = require("../network/proto");
var protobuf_1 = require("../protobuf");
var EMPTY_BUFFER = Buffer.allocUnsafe(0);
exports.BLS_INDEX = 0;
exports.BDN_INDEX = 1;
var bls = kyber_1.sign.bls, bdn = kyber_1.sign.bdn, Mask = kyber_1.sign.Mask;
/**
 * Convert an integer into a little-endian buffer
 *
 * @param v The number to convert
 * @returns a 32bits buffer
 */
function int2buf(v) {
    var b = Buffer.allocUnsafe(4);
    b.writeInt32LE(v, 0);
    return b;
}
var SkipBlock = /** @class */ (function (_super) {
    __extends(SkipBlock, _super);
    function SkipBlock(props) {
        var _this = _super.call(this, props) || this;
        _this.backlinks = _this.backlinks || [];
        _this.verifiers = _this.verifiers || [];
        _this.forward = _this.forward || [];
        _this.hash = Buffer.from(_this.hash || EMPTY_BUFFER);
        _this.data = Buffer.from(_this.data || EMPTY_BUFFER);
        _this.genesis = Buffer.from(_this.genesis || EMPTY_BUFFER);
        _this.payload = Buffer.from(_this.payload || EMPTY_BUFFER);
        return _this;
    }
    Object.defineProperty(SkipBlock.prototype, "forwardLinks", {
        /**
         * Getter for the forward links
         *
         * @returns the list of forward links
         */
        get: function () {
            return this.forward;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * @see README#Message classes
     */
    SkipBlock.register = function () {
        protobuf_1.registerMessage("SkipBlock", SkipBlock, proto_1.Roster, ForwardLink);
    };
    /**
     * Calculate the hash of the block
     *
     * @returns the hash
     */
    SkipBlock.prototype.computeHash = function () {
        var h = crypto_browserify_1.createHash("sha256");
        h.update(int2buf(this.index));
        h.update(int2buf(this.height));
        h.update(int2buf(this.maxHeight));
        h.update(int2buf(this.baseHeight));
        for (var _i = 0, _a = this.backlinks; _i < _a.length; _i++) {
            var bl = _a[_i];
            h.update(bl);
        }
        for (var _b = 0, _c = this.verifiers; _b < _c.length; _b++) {
            var v = _c[_b];
            h.update(v);
        }
        h.update(this.genesis);
        h.update(this.data);
        if (this.roster) {
            for (var _d = 0, _e = this.roster.list.map(function (srvid) { return srvid.getPublic(); }); _d < _e.length; _d++) {
                var pub = _e[_d];
                h.update(pub.marshalBinary());
            }
        }
        if (this.signatureScheme > 0) {
            h.update(int2buf(this.signatureScheme));
        }
        return h.digest();
    };
    return SkipBlock;
}(light_1.Message));
exports.SkipBlock = SkipBlock;
/**
 * Compute the minimum number of signatures an aggregate must have
 * according to the total number of nodes
 *
 * @param n The total numner of conodes
 * @returns the minimum number of signatures required
 */
function defaultThreshold(n) {
    // n = 3f + 1 with f the number of faulty nodes
    return n - ((n - 1) / 3);
}
var ForwardLink = /** @class */ (function (_super) {
    __extends(ForwardLink, _super);
    function ForwardLink(props) {
        var _this = _super.call(this, props) || this;
        _this.from = Buffer.from(_this.from || EMPTY_BUFFER);
        _this.to = Buffer.from(_this.to || EMPTY_BUFFER);
        return _this;
    }
    /**
     * @see README#Message classes
     */
    ForwardLink.register = function () {
        protobuf_1.registerMessage("ForwardLink", ForwardLink, proto_1.Roster, ByzcoinSignature);
    };
    /**
     * Compute the hash of the forward link
     *
     * @returns the hash
     */
    ForwardLink.prototype.hash = function () {
        var h = crypto_browserify_1.createHash("sha256");
        h.update(this.from);
        h.update(this.to);
        if (this.newRoster) {
            h.update(this.newRoster.id);
        }
        return h.digest();
    };
    /**
     * Verify the signature against the list of public keys
     *
     * @param publics The list of public keys
     * @returns an error if something is wrong, null otherwise
     */
    ForwardLink.prototype.verify = function (publics) {
        return this.verifyWithScheme(publics, exports.BLS_INDEX);
    };
    /**
     * Verify the signature against the list of public keys
     * using the specified signature scheme
     *
     * @param publics   The list of public keys
     * @param scheme    The index of the signature scheme
     * @returns an error if something is wrong, null otherwise
     */
    ForwardLink.prototype.verifyWithScheme = function (publics, scheme) {
        if (!this.hash().equals(this.signature.msg)) {
            return new Error("recreated message does not match");
        }
        var mask = new Mask(publics, this.signature.getMask());
        // Note: we only check that there are enough signatures because if the mask
        // is forged to have only one key for instance, the creation of the mask
        // will fail with a mismatch length
        if (mask.getCountEnabled() < defaultThreshold(mask.getCountTotal())) {
            return new Error("not enough signers");
        }
        switch (scheme) {
            case exports.BLS_INDEX:
                return this.verifyBLS(mask);
            case exports.BDN_INDEX:
                return this.verifyBDN(mask);
            default:
                return new Error("unknown signature scheme");
        }
    };
    ForwardLink.prototype.verifyBLS = function (mask) {
        var agg = mask.aggregate;
        if (!bls.verify(this.signature.msg, agg, this.signature.getSignature())) {
            return new Error("BLS signature not verified");
        }
        return null;
    };
    ForwardLink.prototype.verifyBDN = function (mask) {
        if (!bdn.verify(this.signature.msg, mask, this.signature.getSignature())) {
            return new Error("BDN signature not verified");
        }
        return null;
    };
    return ForwardLink;
}(light_1.Message));
exports.ForwardLink = ForwardLink;
var ByzcoinSignature = /** @class */ (function (_super) {
    __extends(ByzcoinSignature, _super);
    function ByzcoinSignature(props) {
        var _this = _super.call(this, props) || this;
        _this.msg = Buffer.from(_this.msg || EMPTY_BUFFER);
        _this.sig = Buffer.from(_this.sig || EMPTY_BUFFER);
        return _this;
    }
    /**
     * @see README#Message classes
     */
    ByzcoinSignature.register = function () {
        protobuf_1.registerMessage("ByzcoinSig", ByzcoinSignature);
    };
    /**
     * Get the actual bytes of the signature. The remaining part is the mask.
     *
     * @returns the signature
     */
    ByzcoinSignature.prototype.getSignature = function () {
        return this.sig.slice(0, new point_1.BN256G1Point().marshalSize());
    };
    /**
     * Get the correct aggregation of the public keys using the mask to know
     * which one has been used
     *
     * @param publics The public keys of the roster
     * @returns the aggregated public key for this signature
     */
    ByzcoinSignature.prototype.getAggregate = function (publics) {
        var mask = new Mask(publics, this.getMask());
        return mask.aggregate;
    };
    /**
     * Get the buffer slice that represents the mask
     *
     * @returns the mask as a buffer
     */
    ByzcoinSignature.prototype.getMask = function () {
        return this.sig.slice(new point_1.BN256G1Point().marshalSize());
    };
    return ByzcoinSignature;
}(light_1.Message));
exports.ByzcoinSignature = ByzcoinSignature;
SkipBlock.register();
ForwardLink.register();
ByzcoinSignature.register();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2tpcGJsb2NrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsic2tpcGJsb2NrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQUFBLHNDQUEyQztBQUMzQyxvREFBd0U7QUFDeEUsdURBQStDO0FBQy9DLDBDQUF1RDtBQUN2RCwwQ0FBMEM7QUFDMUMsd0NBQThDO0FBRTlDLElBQU0sWUFBWSxHQUFHLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFFOUIsUUFBQSxTQUFTLEdBQUcsQ0FBQyxDQUFDO0FBQ2QsUUFBQSxTQUFTLEdBQUcsQ0FBQyxDQUFDO0FBRW5CLElBQUEsc0JBQUcsRUFBRSxzQkFBRyxFQUFFLHdCQUFJLENBQVU7QUFFaEM7Ozs7O0dBS0c7QUFDSCxTQUFTLE9BQU8sQ0FBQyxDQUFTO0lBQ3RCLElBQU0sQ0FBQyxHQUFHLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDaEMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFFckIsT0FBTyxDQUFDLENBQUM7QUFDYixDQUFDO0FBRUQ7SUFBK0IsNkJBQWtCO0lBK0I3QyxtQkFBWSxLQUE2QjtRQUF6QyxZQUNJLGtCQUFNLEtBQUssQ0FBQyxTQVNmO1FBUEcsS0FBSSxDQUFDLFNBQVMsR0FBRyxLQUFJLENBQUMsU0FBUyxJQUFJLEVBQUUsQ0FBQztRQUN0QyxLQUFJLENBQUMsU0FBUyxHQUFHLEtBQUksQ0FBQyxTQUFTLElBQUksRUFBRSxDQUFDO1FBQ3RDLEtBQUksQ0FBQyxPQUFPLEdBQUcsS0FBSSxDQUFDLE9BQU8sSUFBSSxFQUFFLENBQUM7UUFDbEMsS0FBSSxDQUFDLElBQUksR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUksQ0FBQyxJQUFJLElBQUksWUFBWSxDQUFDLENBQUM7UUFDbkQsS0FBSSxDQUFDLElBQUksR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUksQ0FBQyxJQUFJLElBQUksWUFBWSxDQUFDLENBQUM7UUFDbkQsS0FBSSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUksQ0FBQyxPQUFPLElBQUksWUFBWSxDQUFDLENBQUM7UUFDekQsS0FBSSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUksQ0FBQyxPQUFPLElBQUksWUFBWSxDQUFDLENBQUM7O0lBQzdELENBQUM7SUFsQ0Qsc0JBQUksbUNBQVk7UUFMaEI7Ozs7V0FJRzthQUNIO1lBQ0ksT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDO1FBQ3hCLENBQUM7OztPQUFBO0lBQ0Q7O09BRUc7SUFDSSxrQkFBUSxHQUFmO1FBQ0ksMEJBQWUsQ0FBQyxXQUFXLEVBQUUsU0FBUyxFQUFFLGNBQU0sRUFBRSxXQUFXLENBQUMsQ0FBQztJQUNqRSxDQUFDO0lBNEJEOzs7O09BSUc7SUFDSCwrQkFBVyxHQUFYO1FBQ0ksSUFBTSxDQUFDLEdBQUcsOEJBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUMvQixDQUFDLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUM5QixDQUFDLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUMvQixDQUFDLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztRQUNsQyxDQUFDLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztRQUVuQyxLQUFpQixVQUFjLEVBQWQsS0FBQSxJQUFJLENBQUMsU0FBUyxFQUFkLGNBQWMsRUFBZCxJQUFjLEVBQUU7WUFBNUIsSUFBTSxFQUFFLFNBQUE7WUFDVCxDQUFDLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1NBQ2hCO1FBRUQsS0FBZ0IsVUFBYyxFQUFkLEtBQUEsSUFBSSxDQUFDLFNBQVMsRUFBZCxjQUFjLEVBQWQsSUFBYyxFQUFFO1lBQTNCLElBQU0sQ0FBQyxTQUFBO1lBQ1IsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUNmO1FBRUQsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDdkIsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFcEIsSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFO1lBQ2IsS0FBa0IsVUFBa0QsRUFBbEQsS0FBQSxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsVUFBQyxLQUFLLElBQUssT0FBQSxLQUFLLENBQUMsU0FBUyxFQUFFLEVBQWpCLENBQWlCLENBQUMsRUFBbEQsY0FBa0QsRUFBbEQsSUFBa0QsRUFBRTtnQkFBakUsSUFBTSxHQUFHLFNBQUE7Z0JBQ1YsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLENBQUMsQ0FBQzthQUNqQztTQUNKO1FBRUQsSUFBSSxJQUFJLENBQUMsZUFBZSxHQUFHLENBQUMsRUFBRTtZQUMxQixDQUFDLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQztTQUMzQztRQUVELE9BQU8sQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDO0lBQ3RCLENBQUM7SUFDTCxnQkFBQztBQUFELENBQUMsQUE5RUQsQ0FBK0IsZUFBTyxHQThFckM7QUE5RVksOEJBQVM7QUFnRnRCOzs7Ozs7R0FNRztBQUNILFNBQVMsZ0JBQWdCLENBQUMsQ0FBUztJQUMvQiwrQ0FBK0M7SUFDL0MsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztBQUM3QixDQUFDO0FBRUQ7SUFBaUMsK0JBQW9CO0lBYWpELHFCQUFZLEtBQStCO1FBQTNDLFlBQ0ksa0JBQU0sS0FBSyxDQUFDLFNBSWY7UUFGRyxLQUFJLENBQUMsSUFBSSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSSxDQUFDLElBQUksSUFBSSxZQUFZLENBQUMsQ0FBQztRQUNuRCxLQUFJLENBQUMsRUFBRSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSSxDQUFDLEVBQUUsSUFBSSxZQUFZLENBQUMsQ0FBQzs7SUFDbkQsQ0FBQztJQWpCRDs7T0FFRztJQUNJLG9CQUFRLEdBQWY7UUFDSSwwQkFBZSxDQUFDLGFBQWEsRUFBRSxXQUFXLEVBQUUsY0FBTSxFQUFFLGdCQUFnQixDQUFDLENBQUM7SUFDMUUsQ0FBQztJQWNEOzs7O09BSUc7SUFDSCwwQkFBSSxHQUFKO1FBQ0ksSUFBTSxDQUFDLEdBQUcsOEJBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUMvQixDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNwQixDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUVsQixJQUFJLElBQUksQ0FBQyxTQUFTLEVBQUU7WUFDaEIsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1NBQy9CO1FBRUQsT0FBTyxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUM7SUFDdEIsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsNEJBQU0sR0FBTixVQUFPLE9BQWdCO1FBQ25CLE9BQU8sSUFBSSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxpQkFBUyxDQUFDLENBQUM7SUFDckQsQ0FBQztJQUVEOzs7Ozs7O09BT0c7SUFDSCxzQ0FBZ0IsR0FBaEIsVUFBaUIsT0FBZ0IsRUFBRSxNQUFjO1FBQzdDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEVBQUU7WUFDekMsT0FBTyxJQUFJLEtBQUssQ0FBQyxrQ0FBa0MsQ0FBQyxDQUFDO1NBQ3hEO1FBRUQsSUFBTSxJQUFJLEdBQUcsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztRQUN6RCwyRUFBMkU7UUFDM0Usd0VBQXdFO1FBQ3hFLG1DQUFtQztRQUNuQyxJQUFJLElBQUksQ0FBQyxlQUFlLEVBQUUsR0FBRyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUMsRUFBRTtZQUNqRSxPQUFPLElBQUksS0FBSyxDQUFDLG9CQUFvQixDQUFDLENBQUM7U0FDMUM7UUFFRCxRQUFRLE1BQU0sRUFBRTtZQUNaLEtBQUssaUJBQVM7Z0JBQ1YsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ2hDLEtBQUssaUJBQVM7Z0JBQ1YsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ2hDO2dCQUNJLE9BQU8sSUFBSSxLQUFLLENBQUMsMEJBQTBCLENBQUMsQ0FBQztTQUNwRDtJQUNMLENBQUM7SUFFTywrQkFBUyxHQUFqQixVQUFrQixJQUFlO1FBQzdCLElBQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxTQUF5QixDQUFDO1FBRTNDLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLFlBQVksRUFBRSxDQUFDLEVBQUU7WUFDckUsT0FBTyxJQUFJLEtBQUssQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDO1NBQ2xEO1FBRUQsT0FBTyxJQUFJLENBQUM7SUFDaEIsQ0FBQztJQUVPLCtCQUFTLEdBQWpCLFVBQWtCLElBQWU7UUFDN0IsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsWUFBWSxFQUFFLENBQUMsRUFBRTtZQUN0RSxPQUFPLElBQUksS0FBSyxDQUFDLDRCQUE0QixDQUFDLENBQUM7U0FDbEQ7UUFFRCxPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDO0lBQ0wsa0JBQUM7QUFBRCxDQUFDLEFBL0ZELENBQWlDLGVBQU8sR0ErRnZDO0FBL0ZZLGtDQUFXO0FBaUd4QjtJQUFzQyxvQ0FBeUI7SUFXM0QsMEJBQVksS0FBb0M7UUFBaEQsWUFDSSxrQkFBTSxLQUFLLENBQUMsU0FJZjtRQUZHLEtBQUksQ0FBQyxHQUFHLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFJLENBQUMsR0FBRyxJQUFJLFlBQVksQ0FBQyxDQUFDO1FBQ2pELEtBQUksQ0FBQyxHQUFHLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFJLENBQUMsR0FBRyxJQUFJLFlBQVksQ0FBQyxDQUFDOztJQUNyRCxDQUFDO0lBZkQ7O09BRUc7SUFDSSx5QkFBUSxHQUFmO1FBQ0ksMEJBQWUsQ0FBQyxZQUFZLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztJQUNwRCxDQUFDO0lBWUQ7Ozs7T0FJRztJQUNILHVDQUFZLEdBQVo7UUFDSSxPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxJQUFJLG9CQUFZLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDO0lBQy9ELENBQUM7SUFFRDs7Ozs7O09BTUc7SUFDSCx1Q0FBWSxHQUFaLFVBQWEsT0FBZ0I7UUFDekIsSUFBTSxJQUFJLEdBQUcsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1FBQy9DLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQztJQUMxQixDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILGtDQUFPLEdBQVA7UUFDSSxPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksb0JBQVksRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7SUFDNUQsQ0FBQztJQUNMLHVCQUFDO0FBQUQsQ0FBQyxBQS9DRCxDQUFzQyxlQUFPLEdBK0M1QztBQS9DWSw0Q0FBZ0I7QUFpRDdCLFNBQVMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztBQUNyQixXQUFXLENBQUMsUUFBUSxFQUFFLENBQUM7QUFDdkIsZ0JBQWdCLENBQUMsUUFBUSxFQUFFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBQb2ludCwgc2lnbiB9IGZyb20gXCJAZGVkaXMva3liZXJcIjtcbmltcG9ydCB7IEJOMjU2RzFQb2ludCwgQk4yNTZHMlBvaW50IH0gZnJvbSBcIkBkZWRpcy9reWJlci9wYWlyaW5nL3BvaW50XCI7XG5pbXBvcnQgeyBjcmVhdGVIYXNoIH0gZnJvbSBcImNyeXB0by1icm93c2VyaWZ5XCI7XG5pbXBvcnQgeyBNZXNzYWdlLCBQcm9wZXJ0aWVzIH0gZnJvbSBcInByb3RvYnVmanMvbGlnaHRcIjtcbmltcG9ydCB7IFJvc3RlciB9IGZyb20gXCIuLi9uZXR3b3JrL3Byb3RvXCI7XG5pbXBvcnQgeyByZWdpc3Rlck1lc3NhZ2UgfSBmcm9tIFwiLi4vcHJvdG9idWZcIjtcblxuY29uc3QgRU1QVFlfQlVGRkVSID0gQnVmZmVyLmFsbG9jVW5zYWZlKDApO1xuXG5leHBvcnQgY29uc3QgQkxTX0lOREVYID0gMDtcbmV4cG9ydCBjb25zdCBCRE5fSU5ERVggPSAxO1xuXG5jb25zdCB7IGJscywgYmRuLCBNYXNrIH0gPSBzaWduO1xuXG4vKipcbiAqIENvbnZlcnQgYW4gaW50ZWdlciBpbnRvIGEgbGl0dGxlLWVuZGlhbiBidWZmZXJcbiAqXG4gKiBAcGFyYW0gdiBUaGUgbnVtYmVyIHRvIGNvbnZlcnRcbiAqIEByZXR1cm5zIGEgMzJiaXRzIGJ1ZmZlclxuICovXG5mdW5jdGlvbiBpbnQyYnVmKHY6IG51bWJlcik6IEJ1ZmZlciB7XG4gICAgY29uc3QgYiA9IEJ1ZmZlci5hbGxvY1Vuc2FmZSg0KTtcbiAgICBiLndyaXRlSW50MzJMRSh2LCAwKTtcblxuICAgIHJldHVybiBiO1xufVxuXG5leHBvcnQgY2xhc3MgU2tpcEJsb2NrIGV4dGVuZHMgTWVzc2FnZTxTa2lwQmxvY2s+IHtcblxuICAgIC8qKlxuICAgICAqIEdldHRlciBmb3IgdGhlIGZvcndhcmQgbGlua3NcbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHRoZSBsaXN0IG9mIGZvcndhcmQgbGlua3NcbiAgICAgKi9cbiAgICBnZXQgZm9yd2FyZExpbmtzKCk6IEZvcndhcmRMaW5rW10ge1xuICAgICAgICByZXR1cm4gdGhpcy5mb3J3YXJkO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBAc2VlIFJFQURNRSNNZXNzYWdlIGNsYXNzZXNcbiAgICAgKi9cbiAgICBzdGF0aWMgcmVnaXN0ZXIoKSB7XG4gICAgICAgIHJlZ2lzdGVyTWVzc2FnZShcIlNraXBCbG9ja1wiLCBTa2lwQmxvY2ssIFJvc3RlciwgRm9yd2FyZExpbmspO1xuICAgIH1cblxuICAgIHJlYWRvbmx5IGhhc2g6IEJ1ZmZlcjtcbiAgICByZWFkb25seSBpbmRleDogbnVtYmVyO1xuICAgIHJlYWRvbmx5IGhlaWdodDogbnVtYmVyO1xuICAgIHJlYWRvbmx5IG1heEhlaWdodDogbnVtYmVyO1xuICAgIHJlYWRvbmx5IGJhc2VIZWlnaHQ6IG51bWJlcjtcbiAgICByZWFkb25seSBiYWNrbGlua3M6IEJ1ZmZlcltdO1xuICAgIHJlYWRvbmx5IHZlcmlmaWVyczogQnVmZmVyW107XG4gICAgcmVhZG9ubHkgZ2VuZXNpczogQnVmZmVyO1xuICAgIHJlYWRvbmx5IGRhdGE6IEJ1ZmZlcjtcbiAgICByZWFkb25seSByb3N0ZXI6IFJvc3RlcjtcbiAgICByZWFkb25seSBmb3J3YXJkOiBGb3J3YXJkTGlua1tdO1xuICAgIHJlYWRvbmx5IHBheWxvYWQ6IEJ1ZmZlcjtcbiAgICByZWFkb25seSBzaWduYXR1cmVTY2hlbWU6IG51bWJlcjtcblxuICAgIGNvbnN0cnVjdG9yKHByb3BzPzogUHJvcGVydGllczxTa2lwQmxvY2s+KSB7XG4gICAgICAgIHN1cGVyKHByb3BzKTtcblxuICAgICAgICB0aGlzLmJhY2tsaW5rcyA9IHRoaXMuYmFja2xpbmtzIHx8IFtdO1xuICAgICAgICB0aGlzLnZlcmlmaWVycyA9IHRoaXMudmVyaWZpZXJzIHx8IFtdO1xuICAgICAgICB0aGlzLmZvcndhcmQgPSB0aGlzLmZvcndhcmQgfHwgW107XG4gICAgICAgIHRoaXMuaGFzaCA9IEJ1ZmZlci5mcm9tKHRoaXMuaGFzaCB8fCBFTVBUWV9CVUZGRVIpO1xuICAgICAgICB0aGlzLmRhdGEgPSBCdWZmZXIuZnJvbSh0aGlzLmRhdGEgfHwgRU1QVFlfQlVGRkVSKTtcbiAgICAgICAgdGhpcy5nZW5lc2lzID0gQnVmZmVyLmZyb20odGhpcy5nZW5lc2lzIHx8IEVNUFRZX0JVRkZFUik7XG4gICAgICAgIHRoaXMucGF5bG9hZCA9IEJ1ZmZlci5mcm9tKHRoaXMucGF5bG9hZCB8fCBFTVBUWV9CVUZGRVIpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENhbGN1bGF0ZSB0aGUgaGFzaCBvZiB0aGUgYmxvY2tcbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHRoZSBoYXNoXG4gICAgICovXG4gICAgY29tcHV0ZUhhc2goKTogQnVmZmVyIHtcbiAgICAgICAgY29uc3QgaCA9IGNyZWF0ZUhhc2goXCJzaGEyNTZcIik7XG4gICAgICAgIGgudXBkYXRlKGludDJidWYodGhpcy5pbmRleCkpO1xuICAgICAgICBoLnVwZGF0ZShpbnQyYnVmKHRoaXMuaGVpZ2h0KSk7XG4gICAgICAgIGgudXBkYXRlKGludDJidWYodGhpcy5tYXhIZWlnaHQpKTtcbiAgICAgICAgaC51cGRhdGUoaW50MmJ1Zih0aGlzLmJhc2VIZWlnaHQpKTtcblxuICAgICAgICBmb3IgKGNvbnN0IGJsIG9mIHRoaXMuYmFja2xpbmtzKSB7XG4gICAgICAgICAgICBoLnVwZGF0ZShibCk7XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKGNvbnN0IHYgb2YgdGhpcy52ZXJpZmllcnMpIHtcbiAgICAgICAgICAgIGgudXBkYXRlKHYpO1xuICAgICAgICB9XG5cbiAgICAgICAgaC51cGRhdGUodGhpcy5nZW5lc2lzKTtcbiAgICAgICAgaC51cGRhdGUodGhpcy5kYXRhKTtcblxuICAgICAgICBpZiAodGhpcy5yb3N0ZXIpIHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgcHViIG9mIHRoaXMucm9zdGVyLmxpc3QubWFwKChzcnZpZCkgPT4gc3J2aWQuZ2V0UHVibGljKCkpKSB7XG4gICAgICAgICAgICAgICAgaC51cGRhdGUocHViLm1hcnNoYWxCaW5hcnkoKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5zaWduYXR1cmVTY2hlbWUgPiAwKSB7XG4gICAgICAgICAgICBoLnVwZGF0ZShpbnQyYnVmKHRoaXMuc2lnbmF0dXJlU2NoZW1lKSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gaC5kaWdlc3QoKTtcbiAgICB9XG59XG5cbi8qKlxuICogQ29tcHV0ZSB0aGUgbWluaW11bSBudW1iZXIgb2Ygc2lnbmF0dXJlcyBhbiBhZ2dyZWdhdGUgbXVzdCBoYXZlXG4gKiBhY2NvcmRpbmcgdG8gdGhlIHRvdGFsIG51bWJlciBvZiBub2Rlc1xuICpcbiAqIEBwYXJhbSBuIFRoZSB0b3RhbCBudW1uZXIgb2YgY29ub2Rlc1xuICogQHJldHVybnMgdGhlIG1pbmltdW0gbnVtYmVyIG9mIHNpZ25hdHVyZXMgcmVxdWlyZWRcbiAqL1xuZnVuY3Rpb24gZGVmYXVsdFRocmVzaG9sZChuOiBudW1iZXIpOiBudW1iZXIge1xuICAgIC8vIG4gPSAzZiArIDEgd2l0aCBmIHRoZSBudW1iZXIgb2YgZmF1bHR5IG5vZGVzXG4gICAgcmV0dXJuIG4gLSAoKG4gLSAxKSAvIDMpO1xufVxuXG5leHBvcnQgY2xhc3MgRm9yd2FyZExpbmsgZXh0ZW5kcyBNZXNzYWdlPEZvcndhcmRMaW5rPiB7XG4gICAgLyoqXG4gICAgICogQHNlZSBSRUFETUUjTWVzc2FnZSBjbGFzc2VzXG4gICAgICovXG4gICAgc3RhdGljIHJlZ2lzdGVyKCkge1xuICAgICAgICByZWdpc3Rlck1lc3NhZ2UoXCJGb3J3YXJkTGlua1wiLCBGb3J3YXJkTGluaywgUm9zdGVyLCBCeXpjb2luU2lnbmF0dXJlKTtcbiAgICB9XG5cbiAgICByZWFkb25seSBmcm9tOiBCdWZmZXI7XG4gICAgcmVhZG9ubHkgdG86IEJ1ZmZlcjtcbiAgICByZWFkb25seSBuZXdSb3N0ZXI6IFJvc3RlcjtcbiAgICByZWFkb25seSBzaWduYXR1cmU6IEJ5emNvaW5TaWduYXR1cmU7XG5cbiAgICBjb25zdHJ1Y3Rvcihwcm9wcz86IFByb3BlcnRpZXM8Rm9yd2FyZExpbms+KSB7XG4gICAgICAgIHN1cGVyKHByb3BzKTtcblxuICAgICAgICB0aGlzLmZyb20gPSBCdWZmZXIuZnJvbSh0aGlzLmZyb20gfHwgRU1QVFlfQlVGRkVSKTtcbiAgICAgICAgdGhpcy50byA9IEJ1ZmZlci5mcm9tKHRoaXMudG8gfHwgRU1QVFlfQlVGRkVSKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb21wdXRlIHRoZSBoYXNoIG9mIHRoZSBmb3J3YXJkIGxpbmtcbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHRoZSBoYXNoXG4gICAgICovXG4gICAgaGFzaCgpOiBCdWZmZXIge1xuICAgICAgICBjb25zdCBoID0gY3JlYXRlSGFzaChcInNoYTI1NlwiKTtcbiAgICAgICAgaC51cGRhdGUodGhpcy5mcm9tKTtcbiAgICAgICAgaC51cGRhdGUodGhpcy50byk7XG5cbiAgICAgICAgaWYgKHRoaXMubmV3Um9zdGVyKSB7XG4gICAgICAgICAgICBoLnVwZGF0ZSh0aGlzLm5ld1Jvc3Rlci5pZCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gaC5kaWdlc3QoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBWZXJpZnkgdGhlIHNpZ25hdHVyZSBhZ2FpbnN0IHRoZSBsaXN0IG9mIHB1YmxpYyBrZXlzXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcHVibGljcyBUaGUgbGlzdCBvZiBwdWJsaWMga2V5c1xuICAgICAqIEByZXR1cm5zIGFuIGVycm9yIGlmIHNvbWV0aGluZyBpcyB3cm9uZywgbnVsbCBvdGhlcndpc2VcbiAgICAgKi9cbiAgICB2ZXJpZnkocHVibGljczogUG9pbnRbXSk6IEVycm9yIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudmVyaWZ5V2l0aFNjaGVtZShwdWJsaWNzLCBCTFNfSU5ERVgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFZlcmlmeSB0aGUgc2lnbmF0dXJlIGFnYWluc3QgdGhlIGxpc3Qgb2YgcHVibGljIGtleXNcbiAgICAgKiB1c2luZyB0aGUgc3BlY2lmaWVkIHNpZ25hdHVyZSBzY2hlbWVcbiAgICAgKlxuICAgICAqIEBwYXJhbSBwdWJsaWNzICAgVGhlIGxpc3Qgb2YgcHVibGljIGtleXNcbiAgICAgKiBAcGFyYW0gc2NoZW1lICAgIFRoZSBpbmRleCBvZiB0aGUgc2lnbmF0dXJlIHNjaGVtZVxuICAgICAqIEByZXR1cm5zIGFuIGVycm9yIGlmIHNvbWV0aGluZyBpcyB3cm9uZywgbnVsbCBvdGhlcndpc2VcbiAgICAgKi9cbiAgICB2ZXJpZnlXaXRoU2NoZW1lKHB1YmxpY3M6IFBvaW50W10sIHNjaGVtZTogbnVtYmVyKTogRXJyb3Ige1xuICAgICAgICBpZiAoIXRoaXMuaGFzaCgpLmVxdWFscyh0aGlzLnNpZ25hdHVyZS5tc2cpKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IEVycm9yKFwicmVjcmVhdGVkIG1lc3NhZ2UgZG9lcyBub3QgbWF0Y2hcIik7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBtYXNrID0gbmV3IE1hc2socHVibGljcywgdGhpcy5zaWduYXR1cmUuZ2V0TWFzaygpKTtcbiAgICAgICAgLy8gTm90ZTogd2Ugb25seSBjaGVjayB0aGF0IHRoZXJlIGFyZSBlbm91Z2ggc2lnbmF0dXJlcyBiZWNhdXNlIGlmIHRoZSBtYXNrXG4gICAgICAgIC8vIGlzIGZvcmdlZCB0byBoYXZlIG9ubHkgb25lIGtleSBmb3IgaW5zdGFuY2UsIHRoZSBjcmVhdGlvbiBvZiB0aGUgbWFza1xuICAgICAgICAvLyB3aWxsIGZhaWwgd2l0aCBhIG1pc21hdGNoIGxlbmd0aFxuICAgICAgICBpZiAobWFzay5nZXRDb3VudEVuYWJsZWQoKSA8IGRlZmF1bHRUaHJlc2hvbGQobWFzay5nZXRDb3VudFRvdGFsKCkpKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IEVycm9yKFwibm90IGVub3VnaCBzaWduZXJzXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgc3dpdGNoIChzY2hlbWUpIHtcbiAgICAgICAgICAgIGNhc2UgQkxTX0lOREVYOlxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnZlcmlmeUJMUyhtYXNrKTtcbiAgICAgICAgICAgIGNhc2UgQkROX0lOREVYOlxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnZlcmlmeUJETihtYXNrKTtcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBFcnJvcihcInVua25vd24gc2lnbmF0dXJlIHNjaGVtZVwiKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgdmVyaWZ5QkxTKG1hc2s6IHNpZ24uTWFzayk6IEVycm9yIHtcbiAgICAgICAgY29uc3QgYWdnID0gbWFzay5hZ2dyZWdhdGUgYXMgQk4yNTZHMlBvaW50O1xuXG4gICAgICAgIGlmICghYmxzLnZlcmlmeSh0aGlzLnNpZ25hdHVyZS5tc2csIGFnZywgdGhpcy5zaWduYXR1cmUuZ2V0U2lnbmF0dXJlKCkpKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IEVycm9yKFwiQkxTIHNpZ25hdHVyZSBub3QgdmVyaWZpZWRcIik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBwcml2YXRlIHZlcmlmeUJETihtYXNrOiBzaWduLk1hc2spOiBFcnJvciB7XG4gICAgICAgIGlmICghYmRuLnZlcmlmeSh0aGlzLnNpZ25hdHVyZS5tc2csIG1hc2ssIHRoaXMuc2lnbmF0dXJlLmdldFNpZ25hdHVyZSgpKSkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBFcnJvcihcIkJETiBzaWduYXR1cmUgbm90IHZlcmlmaWVkXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgQnl6Y29pblNpZ25hdHVyZSBleHRlbmRzIE1lc3NhZ2U8Qnl6Y29pblNpZ25hdHVyZT4ge1xuICAgIC8qKlxuICAgICAqIEBzZWUgUkVBRE1FI01lc3NhZ2UgY2xhc3Nlc1xuICAgICAqL1xuICAgIHN0YXRpYyByZWdpc3RlcigpIHtcbiAgICAgICAgcmVnaXN0ZXJNZXNzYWdlKFwiQnl6Y29pblNpZ1wiLCBCeXpjb2luU2lnbmF0dXJlKTtcbiAgICB9XG5cbiAgICByZWFkb25seSBtc2c6IEJ1ZmZlcjtcbiAgICByZWFkb25seSBzaWc6IEJ1ZmZlcjtcblxuICAgIGNvbnN0cnVjdG9yKHByb3BzPzogUHJvcGVydGllczxCeXpjb2luU2lnbmF0dXJlPikge1xuICAgICAgICBzdXBlcihwcm9wcyk7XG5cbiAgICAgICAgdGhpcy5tc2cgPSBCdWZmZXIuZnJvbSh0aGlzLm1zZyB8fCBFTVBUWV9CVUZGRVIpO1xuICAgICAgICB0aGlzLnNpZyA9IEJ1ZmZlci5mcm9tKHRoaXMuc2lnIHx8IEVNUFRZX0JVRkZFUik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSBhY3R1YWwgYnl0ZXMgb2YgdGhlIHNpZ25hdHVyZS4gVGhlIHJlbWFpbmluZyBwYXJ0IGlzIHRoZSBtYXNrLlxuICAgICAqXG4gICAgICogQHJldHVybnMgdGhlIHNpZ25hdHVyZVxuICAgICAqL1xuICAgIGdldFNpZ25hdHVyZSgpOiBCdWZmZXIge1xuICAgICAgICByZXR1cm4gdGhpcy5zaWcuc2xpY2UoMCwgbmV3IEJOMjU2RzFQb2ludCgpLm1hcnNoYWxTaXplKCkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgY29ycmVjdCBhZ2dyZWdhdGlvbiBvZiB0aGUgcHVibGljIGtleXMgdXNpbmcgdGhlIG1hc2sgdG8ga25vd1xuICAgICAqIHdoaWNoIG9uZSBoYXMgYmVlbiB1c2VkXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcHVibGljcyBUaGUgcHVibGljIGtleXMgb2YgdGhlIHJvc3RlclxuICAgICAqIEByZXR1cm5zIHRoZSBhZ2dyZWdhdGVkIHB1YmxpYyBrZXkgZm9yIHRoaXMgc2lnbmF0dXJlXG4gICAgICovXG4gICAgZ2V0QWdncmVnYXRlKHB1YmxpY3M6IFBvaW50W10pOiBQb2ludCB7XG4gICAgICAgIGNvbnN0IG1hc2sgPSBuZXcgTWFzayhwdWJsaWNzLCB0aGlzLmdldE1hc2soKSk7XG4gICAgICAgIHJldHVybiBtYXNrLmFnZ3JlZ2F0ZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIGJ1ZmZlciBzbGljZSB0aGF0IHJlcHJlc2VudHMgdGhlIG1hc2tcbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHRoZSBtYXNrIGFzIGEgYnVmZmVyXG4gICAgICovXG4gICAgZ2V0TWFzaygpOiBCdWZmZXIge1xuICAgICAgICByZXR1cm4gdGhpcy5zaWcuc2xpY2UobmV3IEJOMjU2RzFQb2ludCgpLm1hcnNoYWxTaXplKCkpO1xuICAgIH1cbn1cblxuU2tpcEJsb2NrLnJlZ2lzdGVyKCk7XG5Gb3J3YXJkTGluay5yZWdpc3RlcigpO1xuQnl6Y29pblNpZ25hdHVyZS5yZWdpc3RlcigpO1xuIl19