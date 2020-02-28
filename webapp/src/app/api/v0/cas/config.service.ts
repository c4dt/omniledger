import crypto from "crypto-browserify";
import { List, Map } from "immutable";
import toml from "toml";

import { Injectable } from "@angular/core";

import { InstanceID } from "@dedis/cothority/byzcoin";

// Action represents a DARC with its CoinInstance.
export class Action {
    constructor(
        readonly darc: InstanceID,
        readonly coin: InstanceID,
    ) {}
}

function getField(obj: object, name: string): unknown {
    if (!(name in obj)) {
        throw new Error(`field "${name}" not found in config`);
    }
    return obj[name];
}

function getIterableField(obj: object, name: string): Iterable<unknown> {
    const value = getField(obj, name);
    if (typeof value !== "object" || !(Symbol.iterator in value)) {
        throw new Error(`field "${name}" is not iterable`);
    }
    // @ts-ignore
    return value;
}

function getStringField(obj: object, name: string): string {
    const value = getField(obj, name);
    if (typeof value !== "string") {
        throw new Error(`field "${name}" is not a string`);
    }
    return value;
}

function getUintField(obj: object, name: string): number {
    const value = getField(obj, name);
    if (typeof value !== "number") {
        throw new Error(`field "${name}" is not a number`);
    }
    if (value < 0) {
        throw new Error("number is negative");
    }
    return value;
}

function asInstanceID(value: string): InstanceID {
    return Buffer.from(value, "hex");
}

// Config is the parser for the config used by the golang CAS.
export class Config {

    // fromTOML extracts the config from a raw TOML encoded string.
    static fromTOML(raw: string): Config {
        const parsed = toml.parse(raw);

        const ticketEncoder = (() => {
            switch (getStringField(parsed, "TicketEncoding")) {
                case "base64url":
                    return (buf: Buffer) =>
                        buf.toString("base64")
                            .replace(/\+/g, "-")
                            .replace(/\//g, "_");
                default:
                    throw new Error("unknown ticket encoding");
            }
        })();

        const challengeHasher = (() => {
            switch (getStringField(parsed, "ChallengeHash")) {
                case "sha256":
                    return (buf: Buffer) => {
                        const hash = crypto.createHash("sha256");
                        hash.update(buf);
                        return hash.digest();
                    };
                default:
                    throw new Error("unknown ticket encoding");
            }
        })();

        return new Config(
            getUintField(parsed, "CoinCost"),
            getUintField(parsed, "ChallengeSize"),
            getStringField(parsed, "TxArgumentName"),
            ticketEncoder,
            challengeHasher,
            Config.parseServices(List(getIterableField(parsed, "Services"))),
        );
    }

    private static parseServices(services: List<unknown>): Map<string, Action> {
        return Map(services
            .map((service) => {
                if (typeof service !== "object") {
                    throw new Error("service is not an object");
                }
                return service;
            })
            .flatMap((service) => {
                const action = new Action(
                    asInstanceID(getStringField(service, "DarcInstanceID")),
                    asInstanceID(getStringField(service, "CoinInstanceID")),
                );
                return List(getIterableField(service, "URLs"))
                    .map((url) => {
                        if (typeof url !== "string") {
                            throw new Error("service's url is not an object");
                        }
                        return url;
                    }).map((url) => [url, action]);
                },
            ));
    }

    private constructor(
        readonly coinCost: number,
        readonly challengeSize: number,
        readonly txArgName: string,
        readonly ticketEncoder: (_: Buffer) => string,
        readonly challengeHasher: (_: Buffer) => Buffer,
        readonly serviceToAction: Map<string, Action>,
    ) {}
}

@Injectable({
  providedIn: "root",
})
export class ConfigService {

    private static async getAndParseConfig(): Promise<Config> {
        const res = await fetch("assets/cas.conf");
        if (!res.ok) {
            throw new Error(`fetching config gave: ${res.status}: ${res.body}`);
        }
        return Config.fromTOML(await res.text());
    }

    readonly config: Promise<Config>;

    constructor() {
      this.config = ConfigService.getAndParseConfig();
    }
}
