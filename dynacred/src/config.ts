import * as toml from 'toml';

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
    private class Addresses {
        constructor(
            readonly servers: string[],
            readonly clients: string[],
        ) {}
    }
}

/**
 * Load the Config from the server
 */
export default async function LoadConfig(): Promise<Config> {
    const res = await fetch(window.location.origin + '/assets/conodes.toml');
    if (!res.ok)
        return Promise.reject(new Error(`on fetch config: ${res.status}: ${res.body}`));

    const parsed = toml.parse(await res.text());
    if (!('servers' in parsed))
        return Promise.reject(new Error(`on parse config: unable to find "servers"`));
    if (!(Symbol.iterator in parsed.servers))
        return Promise.reject(new Error(`on parse config: "servers" is not iterable`));

    let addrs_client:string[] = [], addrs_server:string[] = [];
    for (const s of parsed.servers) {
        if (!('Address' in s))
            return Promise.reject(new Error(`on parse config: unable to find "Address" in each server`));

        const addr = s.Address;
        if (typeof addr != 'string')
            return Promise.reject(new Error(`on parse config: "Address" of server is not a string`));

        const [scheme, host, port_str] = addr.split(':');
        if (scheme != 'tls')
            return Promise.reject(new Error(`on parse config: "Address" of server doesn't start with "tls"`));

        addrs_server.push(addr);
        // FIXME hack as in cothority
        addrs_client.push(`ws:${host}:${parseInt(port_str) + 1}`);
    }

    return new Config(new Addresses(
        addrs_server,
        addrs_client,
    ));
}
