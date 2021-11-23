import { Roster } from "@dedis/cothority/network/proto";

import toml from "toml";

type ID = Buffer;

export class Config {
    static fromTOML(raw: string): Config {
        const parsed = toml.parse(raw);

        const tryToGetField = <T>(name: string, func: (_: string) => T): T | undefined => {
            if (!(name in parsed)) {
                return undefined;
            }
            return func(parsed[name]);
        };

        const getField = <T>(name: string, func: (_: string) => T): T => {
            if (!(name in parsed)) {
                throw Error(`field "${name}" not found in config`);
            }
            return func(parsed[name]);
        };

        const asID = (field: any): ID => {
            if (typeof field !== "string") {
                throw Error("is not a string");
            }
            if (!(/^[a-f0-9]{64}$/).test(field)) {
                throw Error("is not of correct format");
            }
            return Buffer.from(field, "hex");
        };

        const asString = (field: any): string => {
            if (typeof field !== "string") {
                throw Error("is not a string");
            }
            return field;
        };

        const asURL = (field: any): URL => {
            if (typeof field !== "string") {
                throw Error("is not a string");
            }
            return new URL(field);
        }

        return new Config(
            getField("ByzCoinID", asID),
            Roster.fromTOML(raw),
            tryToGetField("SignupNode", asURL),
            tryToGetField("AdminDarcID", asID),
            tryToGetField("Ephemeral", asID),
            tryToGetField("BaseURL", asString),
        );
    }

    private constructor(
        readonly byzCoinID: ID,
        readonly roster: Roster,
        readonly signupNode?: URL,
        // TODO used only when registering, better provide them via URL during
        // initial deploy; that's also why it's optional
        readonly adminDarcID?: ID,
        readonly ephemeral?: ID,
        readonly baseURL?: string,
    ) {
        if (baseURL === undefined) {
            this.baseURL = window.location.protocol + "//" + window.location.host;
        }
    }
}
