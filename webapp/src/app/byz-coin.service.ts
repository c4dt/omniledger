import Dexie from "dexie";
import {Injectable} from '@angular/core';
import {ByzCoinBuilder, User} from "dynacred2";
import {ByzCoinRPC} from "@dedis/cothority/byzcoin";
import {RosterWSConnection} from "@dedis/cothority/network/connection";
import StatusRPC from "@dedis/cothority/status/status-rpc";
import {StatusRequest, StatusResponse} from "@dedis/cothority/status/proto";
import {SkipBlock, SkipchainRPC} from "@dedis/cothority/skipchain";
import Log from "@dedis/cothority/log";
import {Config} from "src/lib/config";

@Injectable({
    providedIn: 'root'
})
export class ByzCoinService extends ByzCoinBuilder {
    public user?: User;
    public config?: Config;
    public conn?: RosterWSConnection;
    private readonly storageKeyLatest = "latest_skipblock";
    // this will be updated.
    private readonly idKnown = Buffer.from("3781100c76ab3e6243da881036372387f8237c59cedd27fa0f556f71dc2dff48", "hex");

    // This is the hardcoded block at 0x6000, supposed to have higher forward-links. Once 0x8000 is created,

    constructor() {
        // Initialize with undefined. Before using, the root component has to call `loadConfig`.
        super(undefined, undefined);
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
        this.db = new StorageDB();
        try {
            let latest: SkipBlock;
            const latestBuf = await this.db.get(this.storageKeyLatest);
            if (latestBuf !== undefined) {
                latest = SkipBlock.decode(latestBuf);
                Log.lvl2("Loaded latest block from db:", latest.index);
            } else {
                const sc = new SkipchainRPC(this.conn);
                latest = await sc.getSkipBlock(this.idKnown);
                Log.lvl2("Got known skipblock");
            }
            this.bc = await ByzCoinRPC.fromByzcoin(this.conn, this.config.byzCoinID,
                3, 1000, latest, this.db);
        } catch (e) {
            logger("Getting genesis chain", 80);
            this.bc = await ByzCoinRPC.fromByzcoin(this.conn, this.config.byzCoinID,
                3, 1000, undefined, this.db);
        }
        Log.lvl2("storing latest block in db:", this.bc.latest.index);
        await this.db.set(this.storageKeyLatest, Buffer.from(SkipBlock.encode(this.bc.latest).finish()));
        logger("Done connecting", 100);
    }

    async loadUser(): Promise<void> {
        try {
            this.user = await this.retrieveUserByDB();
            return;
        } catch(e){
            Log.warn("couldn't find dynacred2 user");
        }
    }

    async hasUser(base = "main"): Promise<boolean> {
        try {
            await this.retrieveUserKeyCredID(base);
            return true;
        } catch (e) {
            Log.warn("while checking user:", e);
        }
        return false;
    }

    async migrate(): Promise<boolean> {
        return await this.migrateUser(new StorageDBOld());
    }
}

export class StorageDB {
    public db: Dexie.Table<{ key: string, buf: Buffer }, string>;

    constructor() {
        const db = new Dexie("dynasent2");
        db.version(1).stores({
            contacts: "&key",
        });
        this.db = db.table("contacts");
    }

    async set(key: string, buf: Buffer) {
        await this.db.put({key, buf});
    }

    async get(key: string): Promise<Buffer | undefined> {
        const entry = await this.db.get({key});
        if (entry !== undefined) {
            return Buffer.from(entry.buf);
        }
        return undefined;
    }
}

export class StorageDBOld {
    public db: Dexie.Table<{ key: string, buffer: string }, string>;

    constructor() {
        const db = new Dexie("dynasent");
        db.version(1).stores({
            contacts: "&key, buffer",
        });
        this.db = db.table("contacts");
    }

    async set(key: string, buf: Buffer) {
        await this.db.put({key, buffer: buf.toString()});
    }

    async get(key: string): Promise<Buffer | undefined> {
        const entry = await this.db.get({key});
        if (entry !== undefined) {
            return Buffer.from(entry.buffer);
        }
        return undefined;
    }
}
