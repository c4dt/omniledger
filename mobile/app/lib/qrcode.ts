const ZXing = require("nativescript-zxing");
const QRGenerator = new ZXing();
import { fromNativeSource, ImageSource } from "image-source";
import { sprintf } from "sprintf-js";
import { screen } from "tns-core-modules/platform";
import { Contact } from "~/lib/dynacred/Contact";
import { Public } from "~/lib/dynacred/KeyPair";
import { PartyItem } from "~/lib/dynacred/PartyItem";

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
        width: sideLength
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
        width: sideLength
    });
    return fromNativeSource(qrcode);
}

