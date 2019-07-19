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
var light_1 = require("protobufjs/light");
var protobuf_1 = require("../protobuf");
var schnorr = kyber_1.sign.schnorr;
var ed25519 = kyber_1.curve.newCurve("edwards25519");
/**
 * Identity of an Ed25519 signer
 */
var IdentityEd25519 = /** @class */ (function (_super) {
    __extends(IdentityEd25519, _super);
    function IdentityEd25519(props) {
        return _super.call(this, props) || this;
    }
    Object.defineProperty(IdentityEd25519.prototype, "public", {
        /**
         * Get the public key as a point
         */
        get: function () {
            if (!this._public) {
                this._public = kyber_1.PointFactory.fromProto(this.point);
            }
            return this._public;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * @see README#Message classes
     */
    IdentityEd25519.register = function () {
        protobuf_1.registerMessage("IdentityEd25519", IdentityEd25519);
    };
    /**
     * Initialize an IdentityEd25519 from a point.
     */
    IdentityEd25519.fromPoint = function (p) {
        return new IdentityEd25519({ point: p.toProto() });
    };
    /** @inheritdoc */
    IdentityEd25519.prototype.verify = function (msg, signature) {
        return schnorr.verify(ed25519, this.public, msg, signature);
    };
    /** @inheritdoc */
    IdentityEd25519.prototype.toBytes = function () {
        return this.point;
    };
    /** @inheritdoc */
    IdentityEd25519.prototype.toString = function () {
        return "ed25519:" + this.public.toString().toLowerCase();
    };
    return IdentityEd25519;
}(light_1.Message));
exports.default = IdentityEd25519;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaWRlbnRpdHktZWQyNTUxOS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImlkZW50aXR5LWVkMjU1MTkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsc0NBQWdFO0FBQ2hFLDBDQUF1RDtBQUN2RCx3Q0FBOEM7QUFHdkMsSUFBQSw4QkFBTyxDQUFTO0FBQ3ZCLElBQU0sT0FBTyxHQUFHLGFBQUssQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLENBQUM7QUFFL0M7O0dBRUc7QUFDSDtJQUE2QyxtQ0FBd0I7SUE4QmpFLHlCQUFZLEtBQW1DO2VBQzNDLGtCQUFNLEtBQUssQ0FBQztJQUNoQixDQUFDO0lBM0JELHNCQUFJLG1DQUFNO1FBSFY7O1dBRUc7YUFDSDtZQUNJLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFO2dCQUNmLElBQUksQ0FBQyxPQUFPLEdBQUcsb0JBQVksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO2FBQ3JEO1lBRUQsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDO1FBQ3hCLENBQUM7OztPQUFBO0lBQ0Q7O09BRUc7SUFDSSx3QkFBUSxHQUFmO1FBQ0ksMEJBQWUsQ0FBQyxpQkFBaUIsRUFBRSxlQUFlLENBQUMsQ0FBQztJQUN4RCxDQUFDO0lBRUQ7O09BRUc7SUFDSSx5QkFBUyxHQUFoQixVQUFpQixDQUFRO1FBQ3JCLE9BQU8sSUFBSSxlQUFlLENBQUMsRUFBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLE9BQU8sRUFBRSxFQUFDLENBQUMsQ0FBQztJQUNyRCxDQUFDO0lBVUQsa0JBQWtCO0lBQ2xCLGdDQUFNLEdBQU4sVUFBTyxHQUFXLEVBQUUsU0FBaUI7UUFDakMsT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxTQUFTLENBQUMsQ0FBQztJQUNoRSxDQUFDO0lBRUQsa0JBQWtCO0lBQ2xCLGlDQUFPLEdBQVA7UUFDSSxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUM7SUFDdEIsQ0FBQztJQUVELGtCQUFrQjtJQUNsQixrQ0FBUSxHQUFSO1FBQ0ksT0FBTyxhQUFXLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUMsV0FBVyxFQUFJLENBQUM7SUFDN0QsQ0FBQztJQUNMLHNCQUFDO0FBQUQsQ0FBQyxBQWhERCxDQUE2QyxlQUFPLEdBZ0RuRCIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGN1cnZlLCBQb2ludCwgUG9pbnRGYWN0b3J5LCBzaWduIH0gZnJvbSBcIkBkZWRpcy9reWJlclwiO1xuaW1wb3J0IHsgTWVzc2FnZSwgUHJvcGVydGllcyB9IGZyb20gXCJwcm90b2J1ZmpzL2xpZ2h0XCI7XG5pbXBvcnQgeyByZWdpc3Rlck1lc3NhZ2UgfSBmcm9tIFwiLi4vcHJvdG9idWZcIjtcbmltcG9ydCB7IElJZGVudGl0eSB9IGZyb20gXCIuL2lkZW50aXR5LXdyYXBwZXJcIjtcblxuY29uc3Qge3NjaG5vcnJ9ID0gc2lnbjtcbmNvbnN0IGVkMjU1MTkgPSBjdXJ2ZS5uZXdDdXJ2ZShcImVkd2FyZHMyNTUxOVwiKTtcblxuLyoqXG4gKiBJZGVudGl0eSBvZiBhbiBFZDI1NTE5IHNpZ25lclxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBJZGVudGl0eUVkMjU1MTkgZXh0ZW5kcyBNZXNzYWdlPElkZW50aXR5RWQyNTUxOT4gaW1wbGVtZW50cyBJSWRlbnRpdHkge1xuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSBwdWJsaWMga2V5IGFzIGEgcG9pbnRcbiAgICAgKi9cbiAgICBnZXQgcHVibGljKCk6IFBvaW50IHtcbiAgICAgICAgaWYgKCF0aGlzLl9wdWJsaWMpIHtcbiAgICAgICAgICAgIHRoaXMuX3B1YmxpYyA9IFBvaW50RmFjdG9yeS5mcm9tUHJvdG8odGhpcy5wb2ludCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5fcHVibGljO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBAc2VlIFJFQURNRSNNZXNzYWdlIGNsYXNzZXNcbiAgICAgKi9cbiAgICBzdGF0aWMgcmVnaXN0ZXIoKSB7XG4gICAgICAgIHJlZ2lzdGVyTWVzc2FnZShcIklkZW50aXR5RWQyNTUxOVwiLCBJZGVudGl0eUVkMjU1MTkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEluaXRpYWxpemUgYW4gSWRlbnRpdHlFZDI1NTE5IGZyb20gYSBwb2ludC5cbiAgICAgKi9cbiAgICBzdGF0aWMgZnJvbVBvaW50KHA6IFBvaW50KTogSWRlbnRpdHlFZDI1NTE5IHtcbiAgICAgICAgcmV0dXJuIG5ldyBJZGVudGl0eUVkMjU1MTkoe3BvaW50OiBwLnRvUHJvdG8oKX0pO1xuICAgIH1cblxuICAgIHJlYWRvbmx5IHBvaW50OiBCdWZmZXI7XG5cbiAgICBwcml2YXRlIF9wdWJsaWM6IFBvaW50O1xuXG4gICAgY29uc3RydWN0b3IocHJvcHM/OiBQcm9wZXJ0aWVzPElkZW50aXR5RWQyNTUxOT4pIHtcbiAgICAgICAgc3VwZXIocHJvcHMpO1xuICAgIH1cblxuICAgIC8qKiBAaW5oZXJpdGRvYyAqL1xuICAgIHZlcmlmeShtc2c6IEJ1ZmZlciwgc2lnbmF0dXJlOiBCdWZmZXIpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIHNjaG5vcnIudmVyaWZ5KGVkMjU1MTksIHRoaXMucHVibGljLCBtc2csIHNpZ25hdHVyZSk7XG4gICAgfVxuXG4gICAgLyoqIEBpbmhlcml0ZG9jICovXG4gICAgdG9CeXRlcygpOiBCdWZmZXIge1xuICAgICAgICByZXR1cm4gdGhpcy5wb2ludDtcbiAgICB9XG5cbiAgICAvKiogQGluaGVyaXRkb2MgKi9cbiAgICB0b1N0cmluZygpIHtcbiAgICAgICAgcmV0dXJuIGBlZDI1NTE5OiR7dGhpcy5wdWJsaWMudG9TdHJpbmcoKS50b0xvd2VyQ2FzZSgpfWA7XG4gICAgfVxufVxuIl19