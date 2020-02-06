// tslint:disable-next-line
require("nativescript-nodeify");

import { Data, PersonhoodRPC } from "@c4dt/dynacred";
import ByzCoinRPC from "@dedis/cothority/byzcoin/byzcoin-rpc";
import { LongTermSecret } from "@dedis/cothority/calypso";
import { IdentityWrapper } from "@dedis/cothority/darc";
import Log from "@dedis/cothority/log";
import { Roster, ServerIdentity } from "@dedis/cothority/network";
import { RosterWSConnection } from "@dedis/cothority/network/connection";
import { SkipBlock } from "@dedis/cothority/skipchain";
import SkipchainRPC from "@dedis/cothority/skipchain/skipchain-rpc";
import { StatusRequest, StatusResponse } from "@dedis/cothority/status/proto";
import StatusRPC from "@dedis/cothority/status/status-rpc";
import { Point } from "@dedis/kyber";
import { bdDEDIS, bdTest } from "~/lib/byzcoin-defs";
import { StorageFile } from "~/lib/storage-file";
import { TestData } from "~/lib/test-data";
import { setNodeList } from "~/pages/settings/settings-page";

// Which byzcoinDefinition to use.
export const bcDef = bdDEDIS;
// export const bcDef = bdTest;

// Version of the app - this is automatically copied from package.json
export let appVersion = "0.5.8";

// The global uData that is used all over the pages.
export let uData: Data;
// Initialized BC
export let bc: ByzCoinRPC;
// Reduce the privacy surface until we have calypso-stored attributes
export let noAttributes = true;
// Whether the current user has admin power
export let isAdmin: boolean;

// Returns an initialized BC or a failed promise if the given BC is not available.
export async function initBC() {
    let latest: SkipBlock | undefined;
    const wsc = new RosterWSConnection(bcDef.roster, SkipchainRPC.serviceName);
    wsc.setParallel(2);
    if (bcDef.latestID !== undefined) {
        try {
            const latestBuf = await StorageFile.get("latest");
            latest = SkipBlock.decode(Buffer.from(latestBuf, "hex"));
            Log.lvl2("got stored latest skipblock at index", latest.index);
        } catch (e) {
            Log.error("couldn't get latest skipblock");
        }
        if (latest === undefined) {
            try {
                Log.lvl2("No skipblock stored yet - getting hardcoded one");
                const scRPC = new SkipchainRPC(wsc);
                const sb = await scRPC.getSkipBlock(bcDef.latestID);
                if (sb.computeHash().equals(bcDef.latestID)) {
                    Log.lvl2("Successfully got hardcoded block");
                    latest = sb;
                }
            } catch (e) {
                Log.catch(e, "failure while getting hardcoded latest block");
            }
        }
    }
    try {
        bc = await ByzCoinRPC.fromByzcoin(wsc, bcDef.byzCoinID, 0, 1000, latest);
    } catch (e) {
        if (latest !== undefined) {
            Log.warn("probably wrong latest");
            bc = await ByzCoinRPC.fromByzcoin(wsc, bcDef.byzCoinID);
        } else {
            throw new Error(e);
        }
    }
    await StorageFile.set("latest", Buffer.from(SkipBlock.encode(bc.latest).finish()).toString("hex"));
    Log.lvl2("Latest block is:", bc.latest.index, bc.latest.hash);
}

// Sends a status message to the nodes and checks which node replies the fastest
export async function speedTest(tries: number, result: (t: number, fastest: string) => void) {
    const wsc = new RosterWSConnection(bcDef.roster, StatusRPC.serviceName);
    wsc.setParallel(bcDef.roster.length);
    for (let i = 0; i < tries; i++) {
        await wsc.send(new StatusRequest(), StatusResponse);
        const url = wsc.getURL();
        Log.lvl2("fastest node:", url);
        result(i, url);
    }
    setNodeList(wsc.nodes.newList(StatusRPC.serviceName, bcDef.roster.list.length).active);
}

export async function updateIsAdmin() {
    const rights = await uData.bc.checkAuthorization(uData.bc.genesisID, bcDef.adminDarc,
        IdentityWrapper.fromIdentity(uData.keyIdentitySigner));
    Log.lvl2("User", uData.alias, "has admin-rights:", rights);
    isAdmin = rights.length > 0;
}

export async function finishData() {
    uData.storage = StorageFile;
    // uData.spawnerInstance = await SpawnerInstance.fromByzcoin(bc, bcDef.spawnerID);
    await updateIsAdmin();
    if (bcDef.gameNode === undefined) {
        bcDef.gameNode = bcDef.roster.list[0];
    }
    uData.phrpc = new PersonhoodRPC(bc.genesisID, [bcDef.gameNode]);
    uData.contact.ltsX = bcDef.ltsX;
    uData.contact.ltsID = bcDef.ltsID;
    uData.lts = new LongTermSecret(uData.bc, uData.contact.ltsID, uData.contact.ltsX, bcDef.calypsoRoster);
    await uData.save();
}

// Setting up uData - can be called again if uData needs to be reset and all data cleared.
// It uses the initialized BC and will fail if BC is not initialized.
export async function initData() {
    uData = new Data(bc);
    await uData.connectByzcoin();
    await finishData();
}

// Loading uData. If the data cannot be loaded (doesn't exist or is invalid),
// it will return a failed promise.
export async function loadData() {
    uData = await Data.load(bc, StorageFile);
    await finishData();
}

// Attaches to an existing identity as a new device. The passed string contains an
// ephemeral private key that will be used to set up the identity.
export async function attachDevice(url: string) {
    uData = await Data.attachDevice(bc, url);
    Log.lvl1("SpawnerID:", uData.spawnerInstance.id);
    Log.lvl1("LtsX:", uData.contact.ltsX);
    Log.lvl1("LtsID:", uData.contact.ltsID);
    await finishData();
}

// Creates a new byzcoin on the test-roster.
export async function newByzCoin(): Promise<Data> {
    uData = await TestData.init("admin", bcDef.roster);

    // tslint:disable
    console.log("// To be pasted into byzcoin-defs.ts :: bdTest - line 13\n");
    const ad = (await uData.contact.getDarcSignIdentity()).id;
    console.log(`byzCoinID: Buffer.from("${uData.bc.genesisID.toString("hex")}", "hex"),\n`);
    console.log(`spawnerID: Buffer.from("${uData.spawnerInstance.id.toString("hex")}", "hex"),\n`);
    console.log(`adminDarc: Buffer.from("${ad.toString("hex")}", "hex"),\n`);
    console.log(`ltsID: Buffer.from("${uData.contact.ltsID.toString("hex")}", "hex"),\n`);
    console.log(`ltsX: Public.fromHex("${uData.contact.ltsX.marshalBinary().toString("hex")}").point,\n`);
    // tslint:enable

    bc = uData.bc;
    bcDef.spawnerID = uData.spawnerInstance.id;
    bcDef.adminDarc = (await uData.contact.getDarcSignIdentity()).id;
    uData.storage = StorageFile;
    uData.phrpc = new PersonhoodRPC(bc.genesisID, [bcDef.gameNode]);
    isAdmin = true;
    await uData.save();
    return uData;
}

export interface IByzcoinDef {
    byzCoinID: Buffer;
    spawnerID: Buffer;
    adminDarc: Buffer;
    ltsID: Buffer;
    ltsX: Point;
    roster: Roster;
    testingMode: boolean;
    gameNode?: ServerIdentity;
    calypsoRoster?: Roster;
    latestID?: Buffer;
}
