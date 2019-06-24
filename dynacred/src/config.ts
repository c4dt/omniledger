import * as toml from "toml";

/**
 * Readonly container for the configuration
 *
 * TODO preciser name
 */
export class Config {
    constructor(
        readonly addresses: Addresses,
    ) {}

    /**
     * Type containing both the addresses of the endpoints for servers and for
     * clients
     */
    // tslint:disable-next-line
    private class Addresses {
        constructor(
            readonly servers: string[],
            readonly clients: string[],
        ) {} // tslint:disable-line
    }
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
            if (!value.startswith("tls:")) {
                return Promise.reject(new Error(`on parse config: "${key}" of server doesn't start with "tls:"`));
            }

            return value;
            };

        addrsServer.push(await getField("Address"));
        addrsClient.push(await getField("Url"));
    }

    return new Config(new Addresses(
        addrsServer,
        addrsClient,
    ));
}
