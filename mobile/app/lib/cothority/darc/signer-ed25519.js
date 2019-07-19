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
var kyber_1 = require("@dedis/kyber");
var crypto_browserify_1 = require("crypto-browserify");
var identity_ed25519_1 = __importDefault(require("./identity-ed25519"));
var ed25519 = kyber_1.curve.newCurve("edwards25519");
var schnorr = kyber_1.sign.schnorr;
var SignerEd25519 = /** @class */ (function (_super) {
    __extends(SignerEd25519, _super);
    function SignerEd25519(pub, priv) {
        var _this = _super.call(this, { point: pub.toProto() }) || this;
        _this.priv = priv;
        return _this;
    }
    Object.defineProperty(SignerEd25519.prototype, "secret", {
        get: function () {
            return this.priv;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Create a Ed25519 signer from the private given as a buffer
     *
     * @param bytes the private key
     * @returns the new signer
     */
    SignerEd25519.fromBytes = function (bytes) {
        var priv = ed25519.scalar();
        priv.unmarshalBinary(bytes);
        return new SignerEd25519(ed25519.point().base().mul(priv), priv);
    };
    SignerEd25519.random = function () {
        var priv = ed25519.scalar().setBytes(crypto_browserify_1.randomBytes(32));
        var pub = ed25519.point().mul(priv);
        return new SignerEd25519(pub, priv);
    };
    /** @inheritdoc */
    SignerEd25519.prototype.sign = function (msg) {
        return schnorr.sign(ed25519, this.priv, msg);
    };
    return SignerEd25519;
}(identity_ed25519_1.default));
exports.default = SignerEd25519;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2lnbmVyLWVkMjU1MTkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzaWduZXItZWQyNTUxOS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxzQ0FBMEQ7QUFFMUQsdURBQWdEO0FBRWhELHdFQUFpRDtBQUdqRCxJQUFNLE9BQU8sR0FBRyxhQUFLLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxDQUFDO0FBQ3hDLElBQUEsOEJBQU8sQ0FBUztBQUV2QjtJQUEyQyxpQ0FBZTtJQXlCdEQsdUJBQVksR0FBVSxFQUFFLElBQVk7UUFBcEMsWUFDSSxrQkFBTSxFQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsT0FBTyxFQUFFLEVBQUMsQ0FBQyxTQUVoQztRQURHLEtBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDOztJQUNyQixDQUFDO0lBMUJELHNCQUFJLGlDQUFNO2FBQVY7WUFDSSxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUM7UUFDckIsQ0FBQzs7O09BQUE7SUFDRDs7Ozs7T0FLRztJQUNJLHVCQUFTLEdBQWhCLFVBQWlCLEtBQWE7UUFDMUIsSUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQzlCLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDNUIsT0FBTyxJQUFJLGFBQWEsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ3JFLENBQUM7SUFFTSxvQkFBTSxHQUFiO1FBQ0ksSUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLFFBQVEsQ0FBQywrQkFBVyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDeEQsSUFBTSxHQUFHLEdBQUcsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN0QyxPQUFPLElBQUksYUFBYSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUN4QyxDQUFDO0lBU0Qsa0JBQWtCO0lBQ2xCLDRCQUFJLEdBQUosVUFBSyxHQUFXO1FBQ1osT0FBTyxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQ2pELENBQUM7SUFDTCxvQkFBQztBQUFELENBQUMsQUFsQ0QsQ0FBMkMsMEJBQWUsR0FrQ3pEIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgY3VydmUsIFBvaW50LCBTY2FsYXIsIHNpZ24gfSBmcm9tIFwiQGRlZGlzL2t5YmVyXCI7XG5pbXBvcnQgRWQyNTUxOVNjYWxhciBmcm9tIFwiQGRlZGlzL2t5YmVyL2N1cnZlL2Vkd2FyZHMyNTUxOS9zY2FsYXJcIjtcbmltcG9ydCB7IHJhbmRvbUJ5dGVzIH0gZnJvbSBcImNyeXB0by1icm93c2VyaWZ5XCI7XG5pbXBvcnQgTG9nIGZyb20gXCIuLi9sb2dcIjtcbmltcG9ydCBJZGVudGl0eUVkMjU1MTkgZnJvbSBcIi4vaWRlbnRpdHktZWQyNTUxOVwiO1xuaW1wb3J0IElTaWduZXIgZnJvbSBcIi4vc2lnbmVyXCI7XG5cbmNvbnN0IGVkMjU1MTkgPSBjdXJ2ZS5uZXdDdXJ2ZShcImVkd2FyZHMyNTUxOVwiKTtcbmNvbnN0IHtzY2hub3JyfSA9IHNpZ247XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFNpZ25lckVkMjU1MTkgZXh0ZW5kcyBJZGVudGl0eUVkMjU1MTkgaW1wbGVtZW50cyBJU2lnbmVyIHtcblxuICAgIGdldCBzZWNyZXQoKTogU2NhbGFyIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucHJpdjtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGEgRWQyNTUxOSBzaWduZXIgZnJvbSB0aGUgcHJpdmF0ZSBnaXZlbiBhcyBhIGJ1ZmZlclxuICAgICAqXG4gICAgICogQHBhcmFtIGJ5dGVzIHRoZSBwcml2YXRlIGtleVxuICAgICAqIEByZXR1cm5zIHRoZSBuZXcgc2lnbmVyXG4gICAgICovXG4gICAgc3RhdGljIGZyb21CeXRlcyhieXRlczogQnVmZmVyKTogU2lnbmVyRWQyNTUxOSB7XG4gICAgICAgIGNvbnN0IHByaXYgPSBlZDI1NTE5LnNjYWxhcigpO1xuICAgICAgICBwcml2LnVubWFyc2hhbEJpbmFyeShieXRlcyk7XG4gICAgICAgIHJldHVybiBuZXcgU2lnbmVyRWQyNTUxOShlZDI1NTE5LnBvaW50KCkuYmFzZSgpLm11bChwcml2KSwgcHJpdik7XG4gICAgfVxuXG4gICAgc3RhdGljIHJhbmRvbSgpOiBTaWduZXJFZDI1NTE5IHtcbiAgICAgICAgY29uc3QgcHJpdiA9IGVkMjU1MTkuc2NhbGFyKCkuc2V0Qnl0ZXMocmFuZG9tQnl0ZXMoMzIpKTtcbiAgICAgICAgY29uc3QgcHViID0gZWQyNTUxOS5wb2ludCgpLm11bChwcml2KTtcbiAgICAgICAgcmV0dXJuIG5ldyBTaWduZXJFZDI1NTE5KHB1YiwgcHJpdik7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBwcml2OiBTY2FsYXI7XG5cbiAgICBjb25zdHJ1Y3RvcihwdWI6IFBvaW50LCBwcml2OiBTY2FsYXIpIHtcbiAgICAgICAgc3VwZXIoe3BvaW50OiBwdWIudG9Qcm90bygpfSk7XG4gICAgICAgIHRoaXMucHJpdiA9IHByaXY7XG4gICAgfVxuXG4gICAgLyoqIEBpbmhlcml0ZG9jICovXG4gICAgc2lnbihtc2c6IEJ1ZmZlcik6IEJ1ZmZlciB7XG4gICAgICAgIHJldHVybiBzY2hub3JyLnNpZ24oZWQyNTUxOSwgdGhpcy5wcml2LCBtc2cpO1xuICAgIH1cbn1cbiJdfQ==