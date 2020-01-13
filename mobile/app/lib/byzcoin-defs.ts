// tslint:disable-next-line
require("nativescript-nodeify");

import { Public } from "~/lib/dynacred";
import { IByzcoinDef } from "./byzcoin-def";
import { c4dtCalypsoRoster, dedisRoster, testRoster } from "./byzcoin-rosters";

// tslint:disable:object-literal-sort-keys
export const bdTest: IByzcoinDef = {
    testingMode: true,
    roster: testRoster,
    // Paste here vvv
    byzCoinID: Buffer.from("a000506c90c4811dbf6a8103a2561ac71f4e73dc1cd36b216c9f2a9d4c391e09", "hex"),
    spawnerID: Buffer.from("2b885002d850decf64be97f047ada1274a7dd76c3f2e11c27a7fc52a310be27b", "hex"),
    adminDarc: Buffer.from("765603ee65741eeb72143fa9c4757027161755b3adcea1a5153d8cf854fc340a", "hex"),
    ltsID: Buffer.from("8bbbaf0ccb09e6d03f69d782757ec57e41780fc5bda1e8741bb37a161447244c", "hex"),
    ltsX: Public.fromHex("89f90476b08d56526e6a60d710eacbd0320ddadf4c5ae0af573b0bbc8511196f").point,
    // Paste here ^^^
    calypsoRoster: testRoster,
    gameNode: testRoster.list[0],
};

export const bdDEDIS: IByzcoinDef = {
    testingMode: false,
    roster: dedisRoster,
    byzCoinID: Buffer.from("9cc36071ccb902a1de7e0d21a2c176d73894b1cf88ae4cc2ba4c95cd76f474f3", "hex"),
    // This is block #16384, which is a power of 4, so it should have nice forward-links
    latestID: Buffer.from("75a0da2025a119fbb21b3187af9e2e8b978c75581ea9fe139d1f70dbf06ceefa", "hex"),
    adminDarc: Buffer.from("28aa9504ad3d781611b57d98607e1bca25b1c92f3b32a08a7e341c3866db4675", "hex"),
    spawnerID: Buffer.from("ebc32cc89129c7542cdb8991585756be48ea4bd2869d939898f5413e7f757d96", "hex"),
    calypsoRoster: c4dtCalypsoRoster,
    ltsID: Buffer.from("c460c73284503d175bdef8058d815bd99f133d39db2f8267d5ccf3dbce9c1e17", "hex"),
    ltsX: Public.fromHex("97a56eba22e02f67c83d568b1f96503d2f85ef1987711367d18a698332859a6b").point,
    gameNode: dedisRoster.list.find((si) => si.address.match("conode.c4dt.org") !== null),
};
