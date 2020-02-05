// tslint:disable-next-line
require("nativescript-nodeify");

import Log from "@dedis/cothority/log";
import { BarcodeScanner, ScanResult } from "nativescript-barcodescanner";
import { fromNativeSource, ImageSource } from "tns-core-modules/image-source";
import { screen } from "tns-core-modules/platform";
// tslint:disable-next-line
const ZXing = require("nativescript-zxing");
const qrGenerator = new ZXing();

export async function scan(msg: string = "Please scan QRCode"): Promise<ScanResult> {
    return new Promise<ScanResult>((resolve) => {
        const barcodescanner = new BarcodeScanner();
        barcodescanner.scan({
            beepOnScan: true,             // Play or Suppress beep on scan (default true)
            cancelLabel: "EXIT. Also, try the volume buttons!", // iOS only, default 'Close'
            cancelLabelBackgroundColor: "#333333", // iOS only, default '#000000' (black)
            closeCallback: () => {
                Log.lvl2("Scanner closed");
            }, // invoked when the scanner was closed (success or abort)
            formats: "QR_CODE, EAN_13",
            message: "Scan the QR code.",
            // On iOS you can send the user to the settings app if access was previously denied
            openSettingsIfPermissionWasPreviouslyDenied: true,
            //  Android only, default undefined (sensor-driven orientation), other options: portrait|landscape
            // orientation: orientation,
            preferFrontCamera: false,     // default false
            resultDisplayDuration: 1000,
            showFlipCameraButton: true,
            showTorchButton: true,
            torchOn: false,               // launch with the flashlight on (default false)
        }).then((result) => {
            Log.lvl2("Got scan result", result);
            setTimeout(() => {
                resolve(result);
            }, 1);
            return result;
        });
    });
}

export function createQrcode(str: string, width: number = 0): ImageSource {
    let sideLength = screen.mainScreen.widthPixels / 4;
    if (width > 0) {
        sideLength = width;
    }
    const qrcode = qrGenerator.createBarcode({
        encode: str,
        format: ZXing.QR_CODE,
        height: sideLength,
        width: sideLength,
    });
    return fromNativeSource(qrcode);
}
