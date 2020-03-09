import {Injectable} from '@angular/core';
import {Config, StorageDB} from "@c4dt/dynacred";
import {BasicStuff, Instances, User} from "observable_dynacred";
import {ByzCoinRPC} from "@c4dt/cothority/byzcoin";
import {RosterWSConnection} from "@c4dt/cothority/network/connection";
import StatusRPC from "@c4dt/cothority/status/status-rpc";
import {StatusRequest, StatusResponse} from "@c4dt/cothority/status/proto";
import {SkipBlock, SkipchainRPC} from "@c4dt/cothority/skipchain";
import Log from "@c4dt/cothority/log";

@Injectable({
    providedIn: 'root'
})
export class ByzCoinService {
    public bs?: BasicStuff;
    public user?: User;
    public config?: Config;
    public conn?: RosterWSConnection;

    private readonly storageKeyLatest = "latest_skipblock";
    // This is the hardcoded block at 0x6000, supposed to have higher forward-links. Once 0x8000 is created,
    // this will be updated.
    private readonly idKnown = Buffer.from("3781100c76ab3e6243da881036372387f8237c59cedd27fa0f556f71dc2dff48", "hex");

    async loadConfig(logger: (msg: string, percentage: number) => void): Promise<BasicStuff> {
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
        const db = new DataBaseDB();
        let bc: ByzCoinRPC;
        try {
            let latest: SkipBlock;
            const latestBuf = await db.get(this.storageKeyLatest);
            if (latestBuf !== undefined) {
                latest = SkipBlock.decode(latestBuf);
                Log.lvl2("Loaded latest block from db:", latest.index);
            } else {
                const sc = new SkipchainRPC(this.conn);
                latest = await sc.getSkipBlock(this.idKnown);
                Log.lvl2("Got known skipblock");
            }
            bc = await ByzCoinRPC.fromByzcoin(this.conn, this.config.byzCoinID, 3, 1000, latest);
        } catch (e) {
            logger("Getting genesis chain", 80);
            bc = await ByzCoinRPC.fromByzcoin(this.conn, this.config.byzCoinID, 3);
        }
        Log.lvl2("storing latest block in db:", bc.latest.index);
        await db.set(this.storageKeyLatest, Buffer.from(SkipBlock.encode(bc.latest).finish()));
        logger("Done connecting", 100);
        this.bs = new BasicStuff(bc, db, await Instances.fromScratch(db, bc));
        return this.bs
    }

    async loadUser(): Promise<void> {
        this.user = await User.load(this.bs);
    }

    async hasUser(base = "main"): Promise<boolean> {
        try {
            const key = await User.getDbKey(this.bs, base);
            const credID = await User.getDbCredID(this.bs, base);
            return key && credID && key.length === 32 && credID.length === 32;
        } catch(e){
            Log.warn("while checking user:", e);
            return false;
        }
    }
}


class DataBaseDB {
    async get(key: string): Promise<Buffer | undefined> {
        const val = await StorageDB.get(key);
        if (val === undefined || val === null) {
            return undefined;
        }
        return Buffer.from(val, "hex");
    }

    getObject<T>(key: string): Promise<T | undefined> {
        return StorageDB.getObject(key);
    }

    async set(key: string, value: Buffer): Promise<void> {
        await StorageDB.set(key, value.toString("hex"));
        return;
    }

    setObject<T>(key: string, obj: T): Promise<void> {
        return StorageDB.putObject(key, obj);
    }
}
