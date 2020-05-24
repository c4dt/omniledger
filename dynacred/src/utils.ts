import Long from "long";

export function bufferToObject<T>(buf: Buffer): T {
    return JSON.parse(buf.toString(), (key, value) => {
        if (value && typeof value === "object") {
            if (value.type && value.type === "Buffer") {
                return Buffer.from(value);
            } else if (value.low !== undefined && value.high !== undefined) {
                return Long.fromValue(value);
            }
        }
        return value;
    });
}
