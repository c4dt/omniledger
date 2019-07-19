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
var kyber_1 = require("@dedis/kyber");
var blake2xs_1 = require("@stablelib/blake2xs");
var lodash_1 = require("lodash");
exports.ed25519 = new kyber_1.curve.edwards25519.Curve();
/**
 * Convenience class to wrap a linkable ring signature.
 */
var RingSig = /** @class */ (function () {
    function RingSig(C0, S, tag) {
        if (tag === void 0) { tag = null; }
        this.C0 = C0;
        this.S = S;
        this.tag = tag;
    }
    RingSig.prototype.encode = function () {
        var array = [];
        array.push(this.C0.marshalBinary());
        for (var _i = 0, _a = this.S; _i < _a.length; _i++) {
            var scalar = _a[_i];
            array.push(scalar.marshalBinary());
        }
        if (this.tag) {
            array.push(this.tag.marshalBinary());
        }
        return Buffer.concat(array);
    };
    return RingSig;
}());
exports.RingSig = RingSig;
/**
 * Sign a message using (un)linkable ring signature. This method is ported from the Kyber Golang version
 * available at https://github.com/dedis/kyber/blob/master/sign/anon/sig.go. Please refer to the documentation
 * of the given link for detailed instructions. This port stick to the Go implementation, however the hashing function
 * used here is Blake2xs, whereas Blake2xb is used in the Golang version.
 *
 * @param {Buffer} message - the message to be signed
 * @param {Array} anonymitySet - an array containing the public keys of the group
 * @param [linkScope] - ths link scope used for linkable signature
 * @param {Scalar} privateKey - the private key of the signer
 * @return {RingSig} - the signature
 */
function Sign(message, anonymitySet, linkScope, privateKey) {
    return __awaiter(this, void 0, void 0, function () {
        var hasLS, pi, n, L, linkBase, linkTag, linkStream, H1pre, u, UB, UL, s, c, P, PG, PH, i;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    hasLS = (linkScope) && (linkScope !== null);
                    return [4 /*yield*/, sortSet(anonymitySet, privateKey)];
                case 1:
                    pi = _a.sent();
                    n = anonymitySet.length;
                    L = anonymitySet.slice(0);
                    if (hasLS) {
                        linkStream = new blake2xs_1.BLAKE2Xs(undefined, { key: linkScope });
                        linkBase = exports.ed25519.point().pick(createStreamFromBlake(linkStream));
                        linkTag = exports.ed25519.point().mul(privateKey, linkBase);
                    }
                    H1pre = signH1pre(linkScope, linkTag, message);
                    u = exports.ed25519.scalar().pick();
                    UB = exports.ed25519.point().mul(u);
                    if (hasLS) {
                        UL = exports.ed25519.point().mul(u, linkBase);
                    }
                    s = [];
                    c = [];
                    c[(pi + 1) % n] = signH1(H1pre, UB, UL);
                    P = exports.ed25519.point();
                    PG = exports.ed25519.point();
                    if (hasLS) {
                        PH = exports.ed25519.point();
                    }
                    for (i = (pi + 1) % n; i !== pi; i = (i + 1) % n) {
                        s[i] = exports.ed25519.scalar().pick();
                        PG.add(PG.mul(s[i]), P.mul(c[i], L[i]));
                        if (hasLS) {
                            PH.add(PH.mul(s[i], linkBase), P.mul(c[i], linkTag));
                        }
                        c[(i + 1) % n] = signH1(H1pre, PG, PH);
                    }
                    s[pi] = exports.ed25519.scalar();
                    s[pi].mul(privateKey, c[pi]).sub(u, s[pi]);
                    return [2 /*return*/, new RingSig(c[0], s, linkTag)];
            }
        });
    });
}
exports.Sign = Sign;
/**
 * Verify the signature of a message  a message using (un)linkable ring signature. This method is ported from
 * the Kyber Golang version available at https://github.com/dedis/kyber/blob/master/sign/anon/sig.go. Please refer
 * to the documentation of the given link for detailed instructions. This port stick to the Go implementation, however
 * the hashing function used here is Blake2xs, whereas Blake2xb is used in the Golang version.
 *
 * @param {Kyber.Curve} suite - the crypto suite used for the sign process
 * @param {Uint8Array} message - the message to be signed
 * @param {Array} anonymitySet - an array containing the public keys of the group
 * @param [linkScope] - ths link scope used for linkable signature
 * @param signatureBuffer - the signature the will be verified
 * @return {SignatureVerification} - contains the property of the verification
 */
function Verify(message, anonymitySet, linkScope, signatureBuffer) {
    return __awaiter(this, void 0, void 0, function () {
        var n, L, linkBase, linkTag, sig, linkStream, H1pre, P, PG, PH, s, ci, i;
        return __generator(this, function (_a) {
            if (!(signatureBuffer instanceof Uint8Array)) {
                return [2 /*return*/, Promise.reject("signatureBuffer must be Uint8Array")];
            }
            anonymitySet.sort(function (a, b) {
                return Buffer.compare(a.marshalBinary(), b.marshalBinary());
            });
            n = anonymitySet.length;
            L = anonymitySet.slice(0);
            sig = decodeSignature(signatureBuffer, !!linkScope);
            if (anonymitySet.length !== sig.S.length) {
                return [2 /*return*/, Promise.reject("given anonymity set and signature anonymity set not of equal length")];
            }
            if (linkScope) {
                linkStream = new blake2xs_1.BLAKE2Xs(undefined, { key: linkScope });
                linkBase = exports.ed25519.point().pick(createStreamFromBlake(linkStream));
                linkTag = sig.tag;
            }
            H1pre = signH1pre(linkScope, linkTag, message);
            P = exports.ed25519.point();
            PG = exports.ed25519.point();
            if (linkScope) {
                PH = exports.ed25519.point();
            }
            s = sig.S;
            ci = sig.C0;
            for (i = 0; i < n; i++) {
                PG.add(PG.mul(s[i]), P.mul(ci, L[i]));
                if (linkScope) {
                    PH.add(PH.mul(s[i], linkBase), P.mul(ci, linkTag));
                }
                ci = signH1(H1pre, PG, PH);
            }
            if (!ci.equals(sig.C0)) {
                return [2 /*return*/, new SignatureVerification(false)];
            }
            if (linkScope) {
                return [2 /*return*/, new SignatureVerification(true, linkTag)];
            }
            return [2 /*return*/, new SignatureVerification(true)];
        });
    });
}
exports.Verify = Verify;
var SignatureVerification = /** @class */ (function () {
    function SignatureVerification(valid, tag) {
        if (tag === void 0) { tag = null; }
        this.valid = valid;
        this.tag = tag;
    }
    return SignatureVerification;
}());
exports.SignatureVerification = SignatureVerification;
function createStreamFromBlake(blakeInstance) {
    if (!(blakeInstance instanceof blake2xs_1.BLAKE2Xs)) {
        throw new Error("blakeInstance must be of type Blake2xs");
    }
    function getNextBytes(count) {
        if (!Number.isInteger(count)) {
            throw new Error("count must be a integer");
        }
        var array = new Uint8Array(count);
        blakeInstance.stream(array);
        return Buffer.from(array);
    }
    return getNextBytes;
}
function signH1pre(linkScope, linkTag, message) {
    // tslint:disable-next-line
    var H1pre = new blake2xs_1.BLAKE2Xs(undefined, { key: message });
    if (linkScope) {
        H1pre.update(linkScope);
        var tag = linkTag.marshalBinary();
        H1pre.update(tag);
    }
    return H1pre;
}
// tslint:disable-next-line
function signH1(H1pre, PG, PH) {
    var H1 = lodash_1.cloneDeep(H1pre);
    // tslint:disable-next-line
    var PGb = PG.marshalBinary();
    H1.update(PGb);
    if (PH) {
        // tslint:disable-next-line
        var PHb = PH.marshalBinary();
        H1.update(PHb);
    }
    return exports.ed25519.scalar().pick(createStreamFromBlake(H1));
}
function decodeSignature(signatureBuffer, isLinkableSig) {
    // tslint:disable-next-line
    var scalarMarshalSize = exports.ed25519.scalar().marshalSize();
    var pointMarshalSize = exports.ed25519.point().marshalSize();
    var c0 = exports.ed25519.scalar();
    c0.unmarshalBinary(signatureBuffer.slice(0, pointMarshalSize));
    var S = [];
    var endIndex = isLinkableSig ? signatureBuffer.length - pointMarshalSize : signatureBuffer.length;
    for (var i = pointMarshalSize; i < endIndex; i += scalarMarshalSize) {
        var pr = exports.ed25519.scalar();
        pr.unmarshalBinary(signatureBuffer.slice(i, i + scalarMarshalSize));
        S.push(pr);
    }
    var fields = new RingSig(c0, S);
    if (isLinkableSig) {
        fields.tag = exports.ed25519.point();
        fields.tag.unmarshalBinary(signatureBuffer.slice(endIndex));
    }
    return fields;
}
function sortSet(anonymitySet, privateKey) {
    return __awaiter(this, void 0, void 0, function () {
        var pubKey, pi;
        return __generator(this, function (_a) {
            anonymitySet.sort(function (a, b) {
                return Buffer.compare(a.marshalBinary(), b.marshalBinary());
            });
            pubKey = exports.ed25519.point().base().mul(privateKey);
            pi = anonymitySet.findIndex(function (pub) { return pub.equals(pubKey); });
            if (pi < 0) {
                return [2 /*return*/, Promise.reject("didn't find public key in anonymity set")];
            }
            return [2 /*return*/, pi];
        });
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmluZy1zaWcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJyaW5nLXNpZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFYixzQ0FBb0Q7QUFDcEQsZ0RBQStDO0FBQy9DLGlDQUFtQztBQUV0QixRQUFBLE9BQU8sR0FBRyxJQUFJLGFBQUssQ0FBQyxZQUFZLENBQUMsS0FBSyxFQUFFLENBQUM7QUFFdEQ7O0dBRUc7QUFDSDtJQUNJLGlCQUFtQixFQUFVLEVBQVMsQ0FBVyxFQUFTLEdBQWlCO1FBQWpCLG9CQUFBLEVBQUEsVUFBaUI7UUFBeEQsT0FBRSxHQUFGLEVBQUUsQ0FBUTtRQUFTLE1BQUMsR0FBRCxDQUFDLENBQVU7UUFBUyxRQUFHLEdBQUgsR0FBRyxDQUFjO0lBQzNFLENBQUM7SUFFRCx3QkFBTSxHQUFOO1FBQ0ksSUFBTSxLQUFLLEdBQWEsRUFBRSxDQUFDO1FBRTNCLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxhQUFhLEVBQUUsQ0FBQyxDQUFDO1FBRXBDLEtBQXFCLFVBQU0sRUFBTixLQUFBLElBQUksQ0FBQyxDQUFDLEVBQU4sY0FBTSxFQUFOLElBQU0sRUFBRTtZQUF4QixJQUFNLE1BQU0sU0FBQTtZQUNiLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLGFBQWEsRUFBRSxDQUFDLENBQUM7U0FDdEM7UUFFRCxJQUFJLElBQUksQ0FBQyxHQUFHLEVBQUU7WUFDVixLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLENBQUMsQ0FBQztTQUN4QztRQUVELE9BQU8sTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNoQyxDQUFDO0lBQ0wsY0FBQztBQUFELENBQUMsQUFuQkQsSUFtQkM7QUFuQlksMEJBQU87QUFxQnBCOzs7Ozs7Ozs7OztHQVdHO0FB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QUMsYUFBYSxFQUFFLEVBQUUsQ0FBQyxDQUFDLGFBQWEsRUFBRSxDQUFDLENBQUM7WUFDaEUsQ0FBQyxDQUFDLENBQUM7WUFDRyxNQUFNLEdBQUcsZUFBTyxDQUFDLEtBQUssRUFBRSxDQUFDLElBQUksRUFBRSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUNoRCxFQUFFLEdBQUcsWUFBWSxDQUFDLFNBQVMsQ0FBQyxVQUFDLEdBQUcsSUFBSyxPQUFBLEdBQUcsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQWxCLENBQWtCLENBQUMsQ0FBQztZQUMvRCxJQUFJLEVBQUUsR0FBRyxDQUFDLEVBQUU7Z0JBQ1Isc0JBQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyx5Q0FBeUMsQ0FBQyxFQUFDO2FBQ3BFO1lBQ0Qsc0JBQU8sRUFBRSxFQUFDOzs7Q0FDYiIsInNvdXJjZXNDb250ZW50IjpbIlwidXNlIHN0cmljdFwiO1xuXG5pbXBvcnQgeyBjdXJ2ZSwgUG9pbnQsIFNjYWxhciB9IGZyb20gXCJAZGVkaXMva3liZXJcIjtcbmltcG9ydCB7IEJMQUtFMlhzIH0gZnJvbSBcIkBzdGFibGVsaWIvYmxha2UyeHNcIjtcbmltcG9ydCB7IGNsb25lRGVlcCB9IGZyb20gXCJsb2Rhc2hcIjtcblxuZXhwb3J0IGNvbnN0IGVkMjU1MTkgPSBuZXcgY3VydmUuZWR3YXJkczI1NTE5LkN1cnZlKCk7XG5cbi8qKlxuICogQ29udmVuaWVuY2UgY2xhc3MgdG8gd3JhcCBhIGxpbmthYmxlIHJpbmcgc2lnbmF0dXJlLlxuICovXG5leHBvcnQgY2xhc3MgUmluZ1NpZyB7XG4gICAgY29uc3RydWN0b3IocHVibGljIEMwOiBTY2FsYXIsIHB1YmxpYyBTOiBTY2FsYXJbXSwgcHVibGljIHRhZzogUG9pbnQgPSBudWxsKSB7XG4gICAgfVxuXG4gICAgZW5jb2RlKCk6IEJ1ZmZlciB7XG4gICAgICAgIGNvbnN0IGFycmF5OiBCdWZmZXJbXSA9IFtdO1xuXG4gICAgICAgIGFycmF5LnB1c2godGhpcy5DMC5tYXJzaGFsQmluYXJ5KCkpO1xuXG4gICAgICAgIGZvciAoY29uc3Qgc2NhbGFyIG9mIHRoaXMuUykge1xuICAgICAgICAgICAgYXJyYXkucHVzaChzY2FsYXIubWFyc2hhbEJpbmFyeSgpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLnRhZykge1xuICAgICAgICAgICAgYXJyYXkucHVzaCh0aGlzLnRhZy5tYXJzaGFsQmluYXJ5KCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIEJ1ZmZlci5jb25jYXQoYXJyYXkpO1xuICAgIH1cbn1cblxuLyoqXG4gKiBTaWduIGEgbWVzc2FnZSB1c2luZyAodW4pbGlua2FibGUgcmluZyBzaWduYXR1cmUuIFRoaXMgbWV0aG9kIGlzIHBvcnRlZCBmcm9tIHRoZSBLeWJlciBHb2xhbmcgdmVyc2lvblxuICogYXZhaWxhYmxlIGF0IGh0dHBzOi8vZ2l0aHViLmNvbS9kZWRpcy9reWJlci9ibG9iL21hc3Rlci9zaWduL2Fub24vc2lnLmdvLiBQbGVhc2UgcmVmZXIgdG8gdGhlIGRvY3VtZW50YXRpb25cbiAqIG9mIHRoZSBnaXZlbiBsaW5rIGZvciBkZXRhaWxlZCBpbnN0cnVjdGlvbnMuIFRoaXMgcG9ydCBzdGljayB0byB0aGUgR28gaW1wbGVtZW50YXRpb24sIGhvd2V2ZXIgdGhlIGhhc2hpbmcgZnVuY3Rpb25cbiAqIHVzZWQgaGVyZSBpcyBCbGFrZTJ4cywgd2hlcmVhcyBCbGFrZTJ4YiBpcyB1c2VkIGluIHRoZSBHb2xhbmcgdmVyc2lvbi5cbiAqXG4gKiBAcGFyYW0ge0J1ZmZlcn0gbWVzc2FnZSAtIHRoZSBtZXNzYWdlIHRvIGJlIHNpZ25lZFxuICogQHBhcmFtIHtBcnJheX0gYW5vbnltaXR5U2V0IC0gYW4gYXJyYXkgY29udGFpbmluZyB0aGUgcHVibGljIGtleXMgb2YgdGhlIGdyb3VwXG4gKiBAcGFyYW0gW2xpbmtTY29wZV0gLSB0aHMgbGluayBzY29wZSB1c2VkIGZvciBsaW5rYWJsZSBzaWduYXR1cmVcbiAqIEBwYXJhbSB7U2NhbGFyfSBwcml2YXRlS2V5IC0gdGhlIHByaXZhdGUga2V5IG9mIHRoZSBzaWduZXJcbiAqIEByZXR1cm4ge1JpbmdTaWd9IC0gdGhlIHNpZ25hdHVyZVxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gU2lnbihtZXNzYWdlOiBCdWZmZXIsIGFub255bWl0eVNldDogUG9pbnRbXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpbmtTY29wZTogQnVmZmVyLCBwcml2YXRlS2V5OiBTY2FsYXIpOlxuICAgIFByb21pc2U8UmluZ1NpZz4ge1xuICAgIGNvbnN0IGhhc0xTID0gKGxpbmtTY29wZSkgJiYgKGxpbmtTY29wZSAhPT0gbnVsbCk7XG5cbiAgICBjb25zdCBwaSA9IGF3YWl0IHNvcnRTZXQoYW5vbnltaXR5U2V0LCBwcml2YXRlS2V5KTtcbiAgICBjb25zdCBuID0gYW5vbnltaXR5U2V0Lmxlbmd0aDtcbiAgICBjb25zdCBMID0gYW5vbnltaXR5U2V0LnNsaWNlKDApO1xuXG4gICAgbGV0IGxpbmtCYXNlO1xuICAgIGxldCBsaW5rVGFnOiBQb2ludDtcbiAgICBpZiAoaGFzTFMpIHtcbiAgICAgICAgY29uc3QgbGlua1N0cmVhbSA9IG5ldyBCTEFLRTJYcyh1bmRlZmluZWQsIHtrZXk6IGxpbmtTY29wZX0pO1xuICAgICAgICBsaW5rQmFzZSA9IGVkMjU1MTkucG9pbnQoKS5waWNrKGNyZWF0ZVN0cmVhbUZyb21CbGFrZShsaW5rU3RyZWFtKSk7XG4gICAgICAgIGxpbmtUYWcgPSBlZDI1NTE5LnBvaW50KCkubXVsKHByaXZhdGVLZXksIGxpbmtCYXNlKTtcbiAgICB9XG5cbiAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmVcbiAgICBjb25zdCBIMXByZSA9IHNpZ25IMXByZShsaW5rU2NvcGUsIGxpbmtUYWcsIG1lc3NhZ2UpO1xuXG4gICAgY29uc3QgdSA9IGVkMjU1MTkuc2NhbGFyKCkucGljaygpO1xuICAgIGNvbnN0IFVCID0gZWQyNTUxOS5wb2ludCgpLm11bCh1KTtcbiAgICBsZXQgVUw7XG4gICAgaWYgKGhhc0xTKSB7XG4gICAgICAgIFVMID0gZWQyNTUxOS5wb2ludCgpLm11bCh1LCBsaW5rQmFzZSk7XG4gICAgfVxuXG4gICAgY29uc3QgczogYW55W10gPSBbXTtcbiAgICBjb25zdCBjOiBTY2FsYXJbXSA9IFtdO1xuXG4gICAgY1socGkgKyAxKSAlIG5dID0gc2lnbkgxKEgxcHJlLCBVQiwgVUwpO1xuXG4gICAgY29uc3QgUCA9IGVkMjU1MTkucG9pbnQoKTtcbiAgICBjb25zdCBQRyA9IGVkMjU1MTkucG9pbnQoKTtcbiAgICBsZXQgUEg6IFBvaW50O1xuICAgIGlmIChoYXNMUykge1xuICAgICAgICBQSCA9IGVkMjU1MTkucG9pbnQoKTtcbiAgICB9XG4gICAgZm9yIChsZXQgaSA9IChwaSArIDEpICUgbjsgaSAhPT0gcGk7IGkgPSAoaSArIDEpICUgbikge1xuICAgICAgICBzW2ldID0gZWQyNTUxOS5zY2FsYXIoKS5waWNrKCk7XG4gICAgICAgIFBHLmFkZChQRy5tdWwoc1tpXSksIFAubXVsKGNbaV0sIExbaV0pKTtcbiAgICAgICAgaWYgKGhhc0xTKSB7XG4gICAgICAgICAgICBQSC5hZGQoUEgubXVsKHNbaV0sIGxpbmtCYXNlKSwgUC5tdWwoY1tpXSwgbGlua1RhZykpO1xuICAgICAgICB9XG4gICAgICAgIGNbKGkgKyAxKSAlIG5dID0gc2lnbkgxKEgxcHJlLCBQRywgUEgpO1xuICAgIH1cbiAgICBzW3BpXSA9IGVkMjU1MTkuc2NhbGFyKCk7XG4gICAgc1twaV0ubXVsKHByaXZhdGVLZXksIGNbcGldKS5zdWIodSwgc1twaV0pO1xuXG4gICAgcmV0dXJuIG5ldyBSaW5nU2lnKGNbMF0sIHMsIGxpbmtUYWcpO1xufVxuXG4vKipcbiAqIFZlcmlmeSB0aGUgc2lnbmF0dXJlIG9mIGEgbWVzc2FnZSAgYSBtZXNzYWdlIHVzaW5nICh1bilsaW5rYWJsZSByaW5nIHNpZ25hdHVyZS4gVGhpcyBtZXRob2QgaXMgcG9ydGVkIGZyb21cbiAqIHRoZSBLeWJlciBHb2xhbmcgdmVyc2lvbiBhdmFpbGFibGUgYXQgaHR0cHM6Ly9naXRodWIuY29tL2RlZGlzL2t5YmVyL2Jsb2IvbWFzdGVyL3NpZ24vYW5vbi9zaWcuZ28uIFBsZWFzZSByZWZlclxuICogdG8gdGhlIGRvY3VtZW50YXRpb24gb2YgdGhlIGdpdmVuIGxpbmsgZm9yIGRldGFpbGVkIGluc3RydWN0aW9ucy4gVGhpcyBwb3J0IHN0aWNrIHRvIHRoZSBHbyBpbXBsZW1lbnRhdGlvbiwgaG93ZXZlclxuICogdGhlIGhhc2hpbmcgZnVuY3Rpb24gdXNlZCBoZXJlIGlzIEJsYWtlMnhzLCB3aGVyZWFzIEJsYWtlMnhiIGlzIHVzZWQgaW4gdGhlIEdvbGFuZyB2ZXJzaW9uLlxuICpcbiAqIEBwYXJhbSB7S3liZXIuQ3VydmV9IHN1aXRlIC0gdGhlIGNyeXB0byBzdWl0ZSB1c2VkIGZvciB0aGUgc2lnbiBwcm9jZXNzXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IG1lc3NhZ2UgLSB0aGUgbWVzc2FnZSB0byBiZSBzaWduZWRcbiAqIEBwYXJhbSB7QXJyYXl9IGFub255bWl0eVNldCAtIGFuIGFycmF5IGNvbnRhaW5pbmcgdGhlIHB1YmxpYyBrZXlzIG9mIHRoZSBncm91cFxuICogQHBhcmFtIFtsaW5rU2NvcGVdIC0gdGhzIGxpbmsgc2NvcGUgdXNlZCBmb3IgbGlua2FibGUgc2lnbmF0dXJlXG4gKiBAcGFyYW0gc2lnbmF0dXJlQnVmZmVyIC0gdGhlIHNpZ25hdHVyZSB0aGUgd2lsbCBiZSB2ZXJpZmllZFxuICogQHJldHVybiB7U2lnbmF0dXJlVmVyaWZpY2F0aW9ufSAtIGNvbnRhaW5zIHRoZSBwcm9wZXJ0eSBvZiB0aGUgdmVyaWZpY2F0aW9uXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBWZXJpZnkobWVzc2FnZTogQnVmZmVyLCBhbm9ueW1pdHlTZXQ6IFBvaW50W10sIGxpbmtTY29wZTogQnVmZmVyLCBzaWduYXR1cmVCdWZmZXI6IEJ1ZmZlcik6XG4gICAgUHJvbWlzZTxTaWduYXR1cmVWZXJpZmljYXRpb24+IHtcbiAgICBpZiAoIShzaWduYXR1cmVCdWZmZXIgaW5zdGFuY2VvZiBVaW50OEFycmF5KSkge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoXCJzaWduYXR1cmVCdWZmZXIgbXVzdCBiZSBVaW50OEFycmF5XCIpO1xuICAgIH1cbiAgICBhbm9ueW1pdHlTZXQuc29ydCgoYSwgYikgPT4ge1xuICAgICAgICByZXR1cm4gQnVmZmVyLmNvbXBhcmUoYS5tYXJzaGFsQmluYXJ5KCksIGIubWFyc2hhbEJpbmFyeSgpKTtcbiAgICB9KTtcblxuICAgIGNvbnN0IG4gPSBhbm9ueW1pdHlTZXQubGVuZ3RoO1xuICAgIGNvbnN0IEwgPSBhbm9ueW1pdHlTZXQuc2xpY2UoMCk7XG5cbiAgICBsZXQgbGlua0Jhc2U6IFBvaW50O1xuICAgIGxldCBsaW5rVGFnOiBQb2ludDtcbiAgICBjb25zdCBzaWcgPSBkZWNvZGVTaWduYXR1cmUoc2lnbmF0dXJlQnVmZmVyLCAhIWxpbmtTY29wZSk7XG4gICAgaWYgKGFub255bWl0eVNldC5sZW5ndGggIT09IHNpZy5TLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoXCJnaXZlbiBhbm9ueW1pdHkgc2V0IGFuZCBzaWduYXR1cmUgYW5vbnltaXR5IHNldCBub3Qgb2YgZXF1YWwgbGVuZ3RoXCIpO1xuICAgIH1cblxuICAgIGlmIChsaW5rU2NvcGUpIHtcbiAgICAgICAgY29uc3QgbGlua1N0cmVhbSA9IG5ldyBCTEFLRTJYcyh1bmRlZmluZWQsIHtrZXk6IGxpbmtTY29wZX0pO1xuICAgICAgICBsaW5rQmFzZSA9IGVkMjU1MTkucG9pbnQoKS5waWNrKGNyZWF0ZVN0cmVhbUZyb21CbGFrZShsaW5rU3RyZWFtKSk7XG4gICAgICAgIGxpbmtUYWcgPSBzaWcudGFnO1xuICAgIH1cblxuICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZVxuICAgIGNvbnN0IEgxcHJlID0gc2lnbkgxcHJlKGxpbmtTY29wZSwgbGlua1RhZywgbWVzc2FnZSk7XG5cbiAgICBjb25zdCBQID0gZWQyNTUxOS5wb2ludCgpO1xuICAgIGNvbnN0IFBHID0gZWQyNTUxOS5wb2ludCgpO1xuICAgIGxldCBQSDogUG9pbnQ7XG4gICAgaWYgKGxpbmtTY29wZSkge1xuICAgICAgICBQSCA9IGVkMjU1MTkucG9pbnQoKTtcbiAgICB9XG4gICAgY29uc3QgcyA9IHNpZy5TO1xuICAgIGxldCBjaSA9IHNpZy5DMDtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG47IGkrKykge1xuICAgICAgICBQRy5hZGQoUEcubXVsKHNbaV0pLCBQLm11bChjaSwgTFtpXSkpO1xuICAgICAgICBpZiAobGlua1Njb3BlKSB7XG4gICAgICAgICAgICBQSC5hZGQoUEgubXVsKHNbaV0sIGxpbmtCYXNlKSwgUC5tdWwoY2ksIGxpbmtUYWcpKTtcbiAgICAgICAgfVxuICAgICAgICBjaSA9IHNpZ25IMShIMXByZSwgUEcsIFBIKTtcbiAgICB9XG4gICAgaWYgKCFjaS5lcXVhbHMoc2lnLkMwKSkge1xuICAgICAgICByZXR1cm4gbmV3IFNpZ25hdHVyZVZlcmlmaWNhdGlvbihmYWxzZSk7XG4gICAgfVxuXG4gICAgaWYgKGxpbmtTY29wZSkge1xuICAgICAgICByZXR1cm4gbmV3IFNpZ25hdHVyZVZlcmlmaWNhdGlvbih0cnVlLCBsaW5rVGFnKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFNpZ25hdHVyZVZlcmlmaWNhdGlvbih0cnVlKTtcbn1cblxuZXhwb3J0IGNsYXNzIFNpZ25hdHVyZVZlcmlmaWNhdGlvbiB7XG4gICAgY29uc3RydWN0b3IocHVibGljIHZhbGlkOiBib29sZWFuLCBwdWJsaWMgdGFnOiBQb2ludCA9IG51bGwpIHtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVN0cmVhbUZyb21CbGFrZShibGFrZUluc3RhbmNlOiBCTEFLRTJYcyk6IChhOiBudW1iZXIpID0+IEJ1ZmZlciB7XG4gICAgaWYgKCEoYmxha2VJbnN0YW5jZSBpbnN0YW5jZW9mIEJMQUtFMlhzKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJibGFrZUluc3RhbmNlIG11c3QgYmUgb2YgdHlwZSBCbGFrZTJ4c1wiKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXROZXh0Qnl0ZXMoY291bnQ6IG51bWJlcik6IEJ1ZmZlciB7XG4gICAgICAgIGlmICghTnVtYmVyLmlzSW50ZWdlcihjb3VudCkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcImNvdW50IG11c3QgYmUgYSBpbnRlZ2VyXCIpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGFycmF5ID0gbmV3IFVpbnQ4QXJyYXkoY291bnQpO1xuICAgICAgICBibGFrZUluc3RhbmNlLnN0cmVhbShhcnJheSk7XG4gICAgICAgIHJldHVybiBCdWZmZXIuZnJvbShhcnJheSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGdldE5leHRCeXRlcztcbn1cblxuZnVuY3Rpb24gc2lnbkgxcHJlKGxpbmtTY29wZTogQnVmZmVyLCBsaW5rVGFnOiBQb2ludCwgbWVzc2FnZTogQnVmZmVyKTogYW55IHtcbiAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmVcbiAgICBjb25zdCBIMXByZSA9IG5ldyBCTEFLRTJYcyh1bmRlZmluZWQsIHtrZXk6IG1lc3NhZ2V9KTtcblxuICAgIGlmIChsaW5rU2NvcGUpIHtcbiAgICAgICAgSDFwcmUudXBkYXRlKGxpbmtTY29wZSk7XG4gICAgICAgIGNvbnN0IHRhZyA9IGxpbmtUYWcubWFyc2hhbEJpbmFyeSgpO1xuICAgICAgICBIMXByZS51cGRhdGUodGFnKTtcbiAgICB9XG5cbiAgICByZXR1cm4gSDFwcmU7XG59XG5cbi8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZVxuZnVuY3Rpb24gc2lnbkgxKEgxcHJlOiBCTEFLRTJYcywgUEc6IFBvaW50LCBQSDogUG9pbnQpOiBTY2FsYXIge1xuICAgIGNvbnN0IEgxID0gY2xvbmVEZWVwKEgxcHJlKTtcblxuICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZVxuICAgIGNvbnN0IFBHYiA9IFBHLm1hcnNoYWxCaW5hcnkoKTtcbiAgICBIMS51cGRhdGUoUEdiKTtcbiAgICBpZiAoUEgpIHtcbiAgICAgICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lXG4gICAgICAgIGNvbnN0IFBIYiA9IFBILm1hcnNoYWxCaW5hcnkoKTtcbiAgICAgICAgSDEudXBkYXRlKFBIYik7XG4gICAgfVxuICAgIHJldHVybiBlZDI1NTE5LnNjYWxhcigpLnBpY2soY3JlYXRlU3RyZWFtRnJvbUJsYWtlKEgxKSk7XG59XG5cbmZ1bmN0aW9uIGRlY29kZVNpZ25hdHVyZShzaWduYXR1cmVCdWZmZXI6IEJ1ZmZlciwgaXNMaW5rYWJsZVNpZzogYm9vbGVhbik6IFJpbmdTaWcge1xuICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZVxuICAgIGNvbnN0IHNjYWxhck1hcnNoYWxTaXplID0gZWQyNTUxOS5zY2FsYXIoKS5tYXJzaGFsU2l6ZSgpO1xuICAgIGNvbnN0IHBvaW50TWFyc2hhbFNpemUgPSBlZDI1NTE5LnBvaW50KCkubWFyc2hhbFNpemUoKTtcbiAgICBjb25zdCBjMCA9IGVkMjU1MTkuc2NhbGFyKCk7XG4gICAgYzAudW5tYXJzaGFsQmluYXJ5KHNpZ25hdHVyZUJ1ZmZlci5zbGljZSgwLCBwb2ludE1hcnNoYWxTaXplKSk7XG5cbiAgICBjb25zdCBTOiBTY2FsYXJbXSA9IFtdO1xuICAgIGNvbnN0IGVuZEluZGV4ID0gaXNMaW5rYWJsZVNpZyA/IHNpZ25hdHVyZUJ1ZmZlci5sZW5ndGggLSBwb2ludE1hcnNoYWxTaXplIDogc2lnbmF0dXJlQnVmZmVyLmxlbmd0aDtcbiAgICBmb3IgKGxldCBpID0gcG9pbnRNYXJzaGFsU2l6ZTsgaSA8IGVuZEluZGV4OyBpICs9IHNjYWxhck1hcnNoYWxTaXplKSB7XG4gICAgICAgIGNvbnN0IHByID0gZWQyNTUxOS5zY2FsYXIoKTtcbiAgICAgICAgcHIudW5tYXJzaGFsQmluYXJ5KHNpZ25hdHVyZUJ1ZmZlci5zbGljZShpLCBpICsgc2NhbGFyTWFyc2hhbFNpemUpKTtcbiAgICAgICAgUy5wdXNoKHByKTtcbiAgICB9XG5cbiAgICBjb25zdCBmaWVsZHMgPSBuZXcgUmluZ1NpZyhjMCwgUyk7XG5cbiAgICBpZiAoaXNMaW5rYWJsZVNpZykge1xuICAgICAgICBmaWVsZHMudGFnID0gZWQyNTUxOS5wb2ludCgpO1xuICAgICAgICBmaWVsZHMudGFnLnVubWFyc2hhbEJpbmFyeShzaWduYXR1cmVCdWZmZXIuc2xpY2UoZW5kSW5kZXgpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZmllbGRzO1xufVxuXG5hc3luYyBmdW5jdGlvbiBzb3J0U2V0KGFub255bWl0eVNldDogUG9pbnRbXSwgcHJpdmF0ZUtleTogU2NhbGFyKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBhbm9ueW1pdHlTZXQuc29ydCgoYSwgYikgPT4ge1xuICAgICAgICByZXR1cm4gQnVmZmVyLmNvbXBhcmUoYS5tYXJzaGFsQmluYXJ5KCksIGIubWFyc2hhbEJpbmFyeSgpKTtcbiAgICB9KTtcbiAgICBjb25zdCBwdWJLZXkgPSBlZDI1NTE5LnBvaW50KCkuYmFzZSgpLm11bChwcml2YXRlS2V5KTtcbiAgICBjb25zdCBwaSA9IGFub255bWl0eVNldC5maW5kSW5kZXgoKHB1YikgPT4gcHViLmVxdWFscyhwdWJLZXkpKTtcbiAgICBpZiAocGkgPCAwKSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChcImRpZG4ndCBmaW5kIHB1YmxpYyBrZXkgaW4gYW5vbnltaXR5IHNldFwiKTtcbiAgICB9XG4gICAgcmV0dXJuIHBpO1xufVxuIl19