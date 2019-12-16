// tslint:disable-next-line
require("nativescript-nodeify");

// tslint:disable-next-line
const ZXing = require("nativescript-zxing");
// tslint:disable-next-line
const QRGenerator = new ZXing();
import { Contact, PartyItem, Public } from "~/lib/dynacred";
import { sprintf } from "sprintf-js";
import { fromNativeSource, ImageSource } from "tns-core-modules/image-source";
import { screen } from "tns-core-modules/platform";

export function qrcodeIdentityStr(c: Contact): string {
    let str = Contact.urlUnregistered + "?";
    if (c.isRegistered()) {
        str = sprintf("%s?credentialIID=%s&", Contact.urlRegistered, c.credentialIID.toString("hex"));
    }
    str += sprintf("public_ed25519=%s&alias=%s&email=%s&phone=%s", c.seedPublic.toHex(), c.alias, c.email,
        c.phone);
    return str;
}

export function qrcodeIdentity(c: Contact): ImageSource {
    const sideLength = screen.mainScreen.widthPixels / 4;
    const qrcode = QRGenerator.createBarcode({
        encode: qrcodeIdentityStr(c),
        format: ZXing.QR_CODE,
        height: sideLength,
        width: sideLength,
    });
    return fromNativeSource(qrcode);
}

export function partyQrcode(key: Public, desc: string): ImageSource {
    let url = PartyItem.url + "?public=" + key.toHex();
    url += "&name=" + desc;
    const sideLength = screen.mainScreen.widthPixels / 4;
    const qrcode = QRGenerator.createBarcode({
        encode: url,
        format: ZXing.QR_CODE,
        height: sideLength,
        width: sideLength,
    });
    return fromNativeSource(qrcode);
}
