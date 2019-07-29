export function parseQRCode(str: string, maxArgs: number): any {
    const url = str.split("?", 2);
    if (url.length !== 2) {
        return Promise.reject("wrong QRCode");
    }
    const parts = url[1].split("&", maxArgs);
    const ret: any = { url: url[0] };
    parts.forEach((p) => {
        const r = p.split("=", 2);
        ret[r[0]] = r[1];
    });
    return ret;
}