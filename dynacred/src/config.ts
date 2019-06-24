import * as toml from "toml";

/**
 * Participating node of the network
 */
class Server {
    constructor(
        readonly address: ServerAddress,
        readonly services: Map<string, ServiceKey>,
    ) {}
}

/**
 * Public key of a service
 */
class ServiceKey {
    constructor(
        readonly publik: string,
        readonly suite: string,
    ) {}
}

/**
 * Type containing both the addresses of the endpoints for servers and for
 * clients
 */
class ServerAddress {
    constructor(
        readonly forClients: string,
        readonly forServers: string,
    ) {}
}

/**
 * Container for the configuration
 */
export class Config {
    constructor(
        readonly servers: Server[],
    ) {}
}

/**
 * Parse a single server element
 */
async function parseServer(server: any): Promise<Server> {
    const addr = server["Address"]; // tslint:disable-line
    if (addr === undefined || typeof addr !== "string" || !addr.startsWith("tls:")) {
        return Promise.reject(new Error(`"Address" is invalid`));
    }

    let url = server["Url"]; // tslint:disable-line
    if (url === undefined) {
        const [_, host, port] = addr.split(":");
        url = `ws:${host}:${parseInt(port, 10) + 1}`;
    } else if (typeof url !== "string" || !url.startsWith("ws:")) {
        return Promise.reject(new Error(`"Url" is invalid`));
    }

    const servicesKey = new Map();
    const services = server["Services"]; // tslint:disable-line
    for (const k in services) {
        if (!services.hasOwnProperty(k)) {
            continue;
        }

        const key = services[k];

        const key_public = key["Public"]; // tslint:disable-line
        if (key_public === undefined || typeof key_public !== "string") {
            return Promise.reject(new Error(`"Services.Public.${key}" is invalid`));
        }

        const key_suite = key["Suite"]; // tslint:disable-line
        if (key_suite === undefined || typeof key_suite !== "string") {
            return Promise.reject(new Error(`"Services.Suite.${key}" is invalid`));
        }

        servicesKey.set(k, new ServiceKey(key_public, key_suite));
    }

    return new Server(
        new ServerAddress(url, addr),
        servicesKey,
    );
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

    const mapped: Array<Promise<Server>> = parsed.servers.map(parseServer);

    return new Config(
        await Promise.all(mapped),
    );
}
