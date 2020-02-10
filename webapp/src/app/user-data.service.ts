import "cross-fetch/polyfill";

import { Injectable } from "@angular/core";

import { ByzCoinRPC } from "@dedis/cothority/byzcoin";
import Log from "@dedis/cothority/log";

import { Config, Data, StorageDB } from "@c4dt/dynacred";
import { RosterWSConnection } from "@dedis/cothority/network/connection";
import { SkipBlock, SkipchainRPC } from "@dedis/cothority/skipchain";
import { StatusRequest, StatusResponse } from "@dedis/cothority/status/proto";
import StatusRPC from "@dedis/cothority/status/status-rpc";
import {Instances, User} from "observable_dynacred";

@Injectable({
    providedIn: "root",
})
/**
 * UserData can be used as a global data in the app. However, when using it outside
 * of the UI, it is important to always pass the data, so that it is simpler to
 * test the libraries.
 */
export class UserData extends Data {
    bc: ByzCoinRPC;
    config: Config;
    conn: RosterWSConnection;
    inst: Instances;
    user: User;
    private readonly storageKeyLatest = "latest_skipblock";
    // This is the hardcoded block at 0x6000, supposed to have higher forward-links. Once 0x8000 is created,
    // this will be updated.
    private readonly idKnown = Buffer.from("3781100c76ab3e6243da881036372387f8237c59cedd27fa0f556f71dc2dff48", "hex");

    constructor() {
        super(undefined); // poison
        this.storage = StorageDB;
    }

    async loadConfig(logger: (msg: string, percentage: number) => void): Promise<void> {
        logger("Loading config", 0);
        const res = await fetch("assets/config.toml");
        if (!res.ok) {
            return Promise.reject(`fetching config gave: ${res.status}: ${res.body}`);
        }
        this.config = Config.fromTOML(await res.text());
        logger("Pinging nodes", 10);
        this.conn = new RosterWSConnection(this.config.roster, StatusRPC.serviceName);
        this.conn.setParallel(this.config.roster.length);
        for (let i = 0; i < 3; i++) {
            await this.conn.send(new StatusRequest(), StatusResponse);
            const url = this.conn.getURL();
            logger(`Fastest node at ${i + 1}/3: ${url}`, 20 + i * 20);
        }
        this.conn.setParallel(1);
        logger("Fetching latest block", 70);
        let latest: SkipBlock;
        const latestBuf = await this.storage.get(this.storageKeyLatest);
        if (latestBuf !== undefined) {
            latest = SkipBlock.decode(Buffer.from(latestBuf, "hex"));
            Log.lvl2("Loaded latest block from db:", latest.index);
        } else {
            const sc = new SkipchainRPC(this.conn);
            try {
                latest = await sc.getSkipBlock(this.idKnown);
                Log.lvl2("Got known skipblock");
            } catch (e) {
                Log.lvl2("couldn't get known block", e);
            }
        }
        latest = undefined;
        this.bc = await ByzCoinRPC.fromByzcoin(this.conn, this.config.byzCoinID, 3, 1000, latest);
        Log.lvl2("storing latest block in db:", this.bc.latest.index);
        this.storage.set(this.storageKeyLatest, Buffer.from(SkipBlock.encode(this.bc.latest).finish()).toString("hex"));
        logger("Done connecting", 100);
    }

    async load() {
        Log.lvl1("Loading data from", this.dataFileName);
        const values = await this.storage.getObject(this.dataFileName);
        if (values === undefined) {
            throw new Error("No data available");
        }
        this.setValues(values);
        await this.connectByzcoin();
    }

    async loadUser() {
        try {
            const db = new DataBaseDB();
            this.inst = await Instances.fromScratch(db, this.bc as any);
            this.user = await User.load(db, this.inst);
        } catch(e) {
            Log.catch(e);
        }
    }

    async hasUser(): Promise<boolean> {
        const bufOld = await StorageDB.get(this.dataFileName);
        const bufNew = await StorageDB.get(User.keyCredID);
        return (bufOld !== undefined && bufOld.length > 0) ||
            (bufNew !== undefined && bufNew.length > 0);
    }
}

// @ts-ignore
global.UserData = UserData;

export class DataBaseDB {
    async get(key: string): Promise<Buffer | undefined> {
        const val = await StorageDB.get(key);
        if (val === undefined || val === null) {
            return undefined;
        }
        return Buffer.from(val);
    }

    getObject<T>(key: string): Promise<T | undefined> {
        return StorageDB.getObject(key);
    }

    async set(key: string, value: Buffer): Promise<void> {
        await StorageDB.set(key, value.toString());
        return;
    }

    setObject<T>(key: string, obj: T): Promise<void> {
        return StorageDB.putObject(key, obj);
    }
}
