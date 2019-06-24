import * as toml from "toml";

/**
    * Type containing both the addresses of the endpoints for servers and for
    * clients
    */
class Addresses {
    constructor(
        readonly servers: string[],
        readonly clients: string[],
    ) {} // tslint:disable-line
}

/**
 * Readonly container for the configuration
 *
 * TODO preciser name
 */
export class Config {
    constructor(
        readonly addresses: Addresses,
    ) {}
}

/**
 * Load the Config from the server
 */
export default async function LoadConfig(): Promise<Config> {
    const res = await fetch(window.location.origin + "/assets/conodes.toml");
    if (!res.ok) {
        return Promise.reject(new Error(`on fetch config: ${res.status}: ${res.body}`));
    }

    const parsed = toml.parse(await res.text());
    if (!("servers" in parsed)) {
        return Promise.reject(new Error(`on parse config: unable to find "servers"`));
    }
    if (!(Symbol.iterator in parsed.servers)) {
        return Promise.reject(new Error(`on parse config: "servers" is not iterable`));
    }

    const addrsClient: string[] = [];
    const addrsServer: string[] = [];
    for (const s of parsed.servers) {
        const getField = (key: string): Promise<string> => {
            if (!(key in s)) {
                return Promise.reject(new Error(`on parse config: unable to find "${key}" in each server`));
            }

            const value = s[key];
            if (typeof value !== "string") {
                return Promise.reject(new Error(`on parse config: "${key}" of server is not a string`));
            }
            if (!value.startsWith("tls:")) {
                return Promise.reject(new Error(`on parse config: "${key}" of server doesn't start with "tls:"`));
            }

            return Promise.resolve(value);
        };

        const addr = await getField("Address");
        const url = await getField("Url").catch((err) => {
            // TODO check for expected error
            const [_, host, port] = addr.split(":");
            return `ws:${host}:${parseInt(port, 10) + 1}`;
        })

        addrsServer.push(addr);
        addrsClient.push(url);
    }

    return new Config(new Addresses(
        addrsServer,
        addrsClient,
    ));
}
