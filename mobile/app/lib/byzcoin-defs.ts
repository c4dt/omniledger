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
    byzCoinID: Buffer.from("2c4e2b9f01fa3d9f9c0fb17bf910c2cc92a93b364e82f3a8840b703ad84c8cf6", "hex"),
    spawnerID: Buffer.from("f661f6cca5d9f1a45a72986df94e4875319b3d614254d064e19ebcac593147db", "hex"),
    adminDarc: Buffer.from("db449fdd79f51fc5d2e224cf9c5b1715873760752747b9ffea7b15e8732f5af3", "hex"),
    ltsID: Buffer.from("ad6c7e90b0bcee229c2e62d88665a06cba65bb2d11fffbcf85fd19d6205f4723", "hex"),
    ltsX: Public.fromHex("878c10c6772cd7ed0c85d990f5eb14a986d38e96811f7165b8af3d2e9625a508").point,
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
