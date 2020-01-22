// tslint:disable-next-line
require("nativescript-nodeify");

import { Public } from "@c4dt/dynacred";
import { IByzcoinDef } from "./byzcoin-def";
import { c4dtCalypsoRoster, dedisRoster, testRoster } from "./byzcoin-rosters";

// tslint:disable:object-literal-sort-keys
export const bdTest: IByzcoinDef = {
    testingMode: true,
    roster: testRoster,
    // Paste here vvv
    byzCoinID: Buffer.from("2c84c2635be1e80e81f4c1b92f6a1367fce75e0d489bc353f8b0c870096b3be3", "hex"),
    spawnerID: Buffer.from("7bc530995ef8adf8b6ab80078923f86607a82b4a79d6185b985da9168d16be10", "hex"),
    adminDarc: Buffer.from("81cd5d45b7ada770b2b6515a42e10bfb5efc73ca868e19aedac20fada61e0112", "hex"),
    ltsID: Buffer.from("14cdd1ad8df144fc6557976f42bf002bc5b6f2bb2f038fc60958fa2bc5867b27", "hex"),
    ltsX: Public.fromHex("2c2fc3cb0b9dba2e742ca10f25111ce2661421de1fdb063e2c3d7f4dafd4b7dc").point,
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
