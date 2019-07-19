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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var point_1 = __importDefault(require("@dedis/kyber/curve/edwards25519/point"));
var light_1 = require("protobufjs/light");
var protobuf_1 = require("../protobuf");
var identity_darc_1 = __importDefault(require("./identity-darc"));
var identity_ed25519_1 = __importDefault(require("./identity-ed25519"));
/**
 * Protobuf representation of an identity
 */
var IdentityWrapper = /** @class */ (function (_super) {
    __extends(IdentityWrapper, _super);
    function IdentityWrapper() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * @see README#Message classes
     */
    IdentityWrapper.register = function () {
        protobuf_1.registerMessage("Identity", IdentityWrapper, identity_ed25519_1.default, identity_darc_1.default);
    };
    /**
     * fromIdentity returns an IdentityWrapper for a given Identity
     */
    IdentityWrapper.fromIdentity = function (id) {
        return this.fromString(id.toString());
    };
    /**
     * fromString returns an IdentityWrapper for a given Identity represented as string
     */
    IdentityWrapper.fromString = function (idStr) {
        if (idStr.startsWith("ed25519:")) {
            var point = new point_1.default();
            point.unmarshalBinary(Buffer.from(idStr.slice(8), "hex"));
            var id = identity_ed25519_1.default.fromPoint(point);
            return new IdentityWrapper({ ed25519: id });
        }
        if (idStr.startsWith("darc:")) {
            var id = new identity_darc_1.default({ id: Buffer.from(idStr.slice(5), "hex") });
            return new IdentityWrapper({ darc: id });
        }
    };
    /**
     * fromEd25519 returns an IdentityWrapper for a given IdentityDarc
     */
    IdentityWrapper.fromEd25519 = function (id) {
        return new IdentityWrapper({ ed25519: id });
    };
    /**
     * Get the inner identity as bytes
     * @returns the bytes
     */
    IdentityWrapper.prototype.toBytes = function () {
        if (this.ed25519) {
            return this.ed25519.public.marshalBinary();
        }
        if (this.darc) {
            return this.darc.toBytes();
        }
        return Buffer.from([]);
    };
    /**
     * Get the string representation of the identity
     * @returns a string of the identity
     */
    IdentityWrapper.prototype.toString = function () {
        if (this.ed25519) {
            return this.ed25519.toString();
        }
        if (this.darc) {
            return this.darc.toString();
        }
        return "empty signer";
    };
    return IdentityWrapper;
}(light_1.Message));
exports.default = IdentityWrapper;
IdentityWrapper.register();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaWRlbnRpdHktd3JhcHBlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImlkZW50aXR5LXdyYXBwZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsZ0ZBQWlFO0FBQ2pFLDBDQUEyQztBQUMzQyx3Q0FBOEM7QUFDOUMsa0VBQTJDO0FBQzNDLHdFQUFpRDtBQUVqRDs7R0FFRztBQUNIO0lBQTZDLG1DQUF3QjtJQUFyRTs7SUFzRUEsQ0FBQztJQXJFRzs7T0FFRztJQUNJLHdCQUFRLEdBQWY7UUFDSSwwQkFBZSxDQUFDLFVBQVUsRUFBRSxlQUFlLEVBQUUsMEJBQWUsRUFBRSx1QkFBWSxDQUFDLENBQUM7SUFDaEYsQ0FBQztJQUVEOztPQUVHO0lBQ0ksNEJBQVksR0FBbkIsVUFBb0IsRUFBYTtRQUM3QixPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7SUFDMUMsQ0FBQztJQUVEOztPQUVHO0lBQ0ksMEJBQVUsR0FBakIsVUFBa0IsS0FBYTtRQUMzQixJQUFJLEtBQUssQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLEVBQUU7WUFDOUIsSUFBTSxLQUFLLEdBQUcsSUFBSSxlQUFZLEVBQUUsQ0FBQztZQUNqQyxLQUFLLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQzFELElBQU0sRUFBRSxHQUFHLDBCQUFlLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzVDLE9BQU8sSUFBSSxlQUFlLENBQUMsRUFBQyxPQUFPLEVBQUUsRUFBRSxFQUFDLENBQUMsQ0FBQztTQUM3QztRQUNELElBQUksS0FBSyxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsRUFBRTtZQUMzQixJQUFNLEVBQUUsR0FBRyxJQUFJLHVCQUFZLENBQUMsRUFBQyxFQUFFLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxFQUFDLENBQUMsQ0FBQztZQUN0RSxPQUFPLElBQUksZUFBZSxDQUFDLEVBQUMsSUFBSSxFQUFFLEVBQUUsRUFBQyxDQUFDLENBQUM7U0FDMUM7SUFDTCxDQUFDO0lBRUQ7O09BRUc7SUFDSSwyQkFBVyxHQUFsQixVQUFtQixFQUFtQjtRQUNsQyxPQUFPLElBQUksZUFBZSxDQUFDLEVBQUMsT0FBTyxFQUFFLEVBQUUsRUFBQyxDQUFDLENBQUM7SUFDOUMsQ0FBQztJQUtEOzs7T0FHRztJQUNILGlDQUFPLEdBQVA7UUFDSSxJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUU7WUFDZCxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLGFBQWEsRUFBRSxDQUFDO1NBQzlDO1FBQ0QsSUFBSSxJQUFJLENBQUMsSUFBSSxFQUFFO1lBQ1gsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1NBQzlCO1FBRUQsT0FBTyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQzNCLENBQUM7SUFFRDs7O09BR0c7SUFDSCxrQ0FBUSxHQUFSO1FBQ0ksSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFO1lBQ2QsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxDQUFDO1NBQ2xDO1FBQ0QsSUFBSSxJQUFJLENBQUMsSUFBSSxFQUFFO1lBQ1gsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1NBQy9CO1FBRUQsT0FBTyxjQUFjLENBQUM7SUFDMUIsQ0FBQztJQUNMLHNCQUFDO0FBQUQsQ0FBQyxBQXRFRCxDQUE2QyxlQUFPLEdBc0VuRDs7QUE0QkQsZUFBZSxDQUFDLFFBQVEsRUFBRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IEVkMjU1MTlQb2ludCBmcm9tIFwiQGRlZGlzL2t5YmVyL2N1cnZlL2Vkd2FyZHMyNTUxOS9wb2ludFwiO1xuaW1wb3J0IHsgTWVzc2FnZSB9IGZyb20gXCJwcm90b2J1ZmpzL2xpZ2h0XCI7XG5pbXBvcnQgeyByZWdpc3Rlck1lc3NhZ2UgfSBmcm9tIFwiLi4vcHJvdG9idWZcIjtcbmltcG9ydCBJZGVudGl0eURhcmMgZnJvbSBcIi4vaWRlbnRpdHktZGFyY1wiO1xuaW1wb3J0IElkZW50aXR5RWQyNTUxOSBmcm9tIFwiLi9pZGVudGl0eS1lZDI1NTE5XCI7XG5cbi8qKlxuICogUHJvdG9idWYgcmVwcmVzZW50YXRpb24gb2YgYW4gaWRlbnRpdHlcbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgSWRlbnRpdHlXcmFwcGVyIGV4dGVuZHMgTWVzc2FnZTxJZGVudGl0eVdyYXBwZXI+IHtcbiAgICAvKipcbiAgICAgKiBAc2VlIFJFQURNRSNNZXNzYWdlIGNsYXNzZXNcbiAgICAgKi9cbiAgICBzdGF0aWMgcmVnaXN0ZXIoKSB7XG4gICAgICAgIHJlZ2lzdGVyTWVzc2FnZShcIklkZW50aXR5XCIsIElkZW50aXR5V3JhcHBlciwgSWRlbnRpdHlFZDI1NTE5LCBJZGVudGl0eURhcmMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIGZyb21JZGVudGl0eSByZXR1cm5zIGFuIElkZW50aXR5V3JhcHBlciBmb3IgYSBnaXZlbiBJZGVudGl0eVxuICAgICAqL1xuICAgIHN0YXRpYyBmcm9tSWRlbnRpdHkoaWQ6IElJZGVudGl0eSk6IElkZW50aXR5V3JhcHBlciB7XG4gICAgICAgIHJldHVybiB0aGlzLmZyb21TdHJpbmcoaWQudG9TdHJpbmcoKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogZnJvbVN0cmluZyByZXR1cm5zIGFuIElkZW50aXR5V3JhcHBlciBmb3IgYSBnaXZlbiBJZGVudGl0eSByZXByZXNlbnRlZCBhcyBzdHJpbmdcbiAgICAgKi9cbiAgICBzdGF0aWMgZnJvbVN0cmluZyhpZFN0cjogc3RyaW5nKTogSWRlbnRpdHlXcmFwcGVyIHtcbiAgICAgICAgaWYgKGlkU3RyLnN0YXJ0c1dpdGgoXCJlZDI1NTE5OlwiKSkge1xuICAgICAgICAgICAgY29uc3QgcG9pbnQgPSBuZXcgRWQyNTUxOVBvaW50KCk7XG4gICAgICAgICAgICBwb2ludC51bm1hcnNoYWxCaW5hcnkoQnVmZmVyLmZyb20oaWRTdHIuc2xpY2UoOCksIFwiaGV4XCIpKTtcbiAgICAgICAgICAgIGNvbnN0IGlkID0gSWRlbnRpdHlFZDI1NTE5LmZyb21Qb2ludChwb2ludCk7XG4gICAgICAgICAgICByZXR1cm4gbmV3IElkZW50aXR5V3JhcHBlcih7ZWQyNTUxOTogaWR9KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaWRTdHIuc3RhcnRzV2l0aChcImRhcmM6XCIpKSB7XG4gICAgICAgICAgICBjb25zdCBpZCA9IG5ldyBJZGVudGl0eURhcmMoe2lkOiBCdWZmZXIuZnJvbShpZFN0ci5zbGljZSg1KSwgXCJoZXhcIil9KTtcbiAgICAgICAgICAgIHJldHVybiBuZXcgSWRlbnRpdHlXcmFwcGVyKHtkYXJjOiBpZH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogZnJvbUVkMjU1MTkgcmV0dXJucyBhbiBJZGVudGl0eVdyYXBwZXIgZm9yIGEgZ2l2ZW4gSWRlbnRpdHlEYXJjXG4gICAgICovXG4gICAgc3RhdGljIGZyb21FZDI1NTE5KGlkOiBJZGVudGl0eUVkMjU1MTkpOiBJZGVudGl0eVdyYXBwZXIge1xuICAgICAgICByZXR1cm4gbmV3IElkZW50aXR5V3JhcHBlcih7ZWQyNTUxOTogaWR9KTtcbiAgICB9XG5cbiAgICByZWFkb25seSBlZDI1NTE5OiBJZGVudGl0eUVkMjU1MTk7XG4gICAgcmVhZG9ubHkgZGFyYzogSWRlbnRpdHlEYXJjO1xuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSBpbm5lciBpZGVudGl0eSBhcyBieXRlc1xuICAgICAqIEByZXR1cm5zIHRoZSBieXRlc1xuICAgICAqL1xuICAgIHRvQnl0ZXMoKTogQnVmZmVyIHtcbiAgICAgICAgaWYgKHRoaXMuZWQyNTUxOSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZWQyNTUxOS5wdWJsaWMubWFyc2hhbEJpbmFyeSgpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmRhcmMpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmRhcmMudG9CeXRlcygpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIEJ1ZmZlci5mcm9tKFtdKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgaWRlbnRpdHlcbiAgICAgKiBAcmV0dXJucyBhIHN0cmluZyBvZiB0aGUgaWRlbnRpdHlcbiAgICAgKi9cbiAgICB0b1N0cmluZygpOiBzdHJpbmcge1xuICAgICAgICBpZiAodGhpcy5lZDI1NTE5KSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5lZDI1NTE5LnRvU3RyaW5nKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuZGFyYykge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZGFyYy50b1N0cmluZygpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIFwiZW1wdHkgc2lnbmVyXCI7XG4gICAgfVxufVxuXG4vKipcbiAqIElkZW50aXR5IGlzIGFuIGFic3RyYWN0IGNsYXNzIGZvciBhbGwgdGhlIERhcmNzJ3MgaWRlbnRpdGllc1xuICovXG5leHBvcnQgaW50ZXJmYWNlIElJZGVudGl0eSB7XG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0cnVlIGlmIHRoZSB2ZXJpZmljYXRpb24gb2Ygc2lnbmF0dXJlIG9uIHRoZSBzaGEtMjU2IG9mIG1zZyBpc1xuICAgICAqIHN1Y2Nlc3NmdWwgb3IgZmFsc2UgaWYgbm90LlxuICAgICAqIEBwYXJhbSBtc2cgICAgICAgdGhlIG1lc3NhZ2UgdG8gdmVyaWZ5XG4gICAgICogQHBhcmFtIHNpZ25hdHVyZSB0aGUgc2lnbmF0dXJlIHRvIHZlcmlmeVxuICAgICAqIEByZXR1cm5zIHRydWUgd2hlbiB0aGUgc2lnbmF0dXJlIG1hdGNoZXMgdGhlIG1lc3NhZ2UsIGZhbHNlIG90aGVyd2lzZVxuICAgICAqL1xuICAgIHZlcmlmeShtc2c6IEJ1ZmZlciwgc2lnbmF0dXJlOiBCdWZmZXIpOiBib29sZWFuO1xuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSBieXRlIGFycmF5IHJlcHJlc2VudGF0aW9uIG9mIHRoZSBwdWJsaWMga2V5IG9mIHRoZSBpZGVudGl0eVxuICAgICAqIEByZXR1cm5zIHRoZSBwdWJsaWMga2V5IGFzIGJ1ZmZlclxuICAgICAqL1xuICAgIHRvQnl0ZXMoKTogQnVmZmVyO1xuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIGlkZW50aXR5XG4gICAgICogQHJldHVybiBhIHN0cmluZyByZXByZXNlbnRhdGlvblxuICAgICAqL1xuICAgIHRvU3RyaW5nKCk6IHN0cmluZztcbn1cblxuSWRlbnRpdHlXcmFwcGVyLnJlZ2lzdGVyKCk7XG4iXX0=