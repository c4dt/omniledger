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
    byzCoinID: Buffer.from("a4142cc057fba09cb01e698c540c8144d23c120eef4d7add70c4afee8eb58f74", "hex"),
    spawnerID: Buffer.from("5b1342a7160b54c469c4f66e08c39fbd2bad7d3a76366bd59565bbc732217718", "hex"),
    adminDarc: Buffer.from("dfd2fb132fcc2ac74c333e6cdf27e18ebf45961443c6c992fb7cba2c0faad78f", "hex"),
    ltsID: Buffer.from("3fe179cb7351b0b03cf3bafab8c6f4cc5ff0942c0e8dce124741f3d4e522c8b0", "hex"),
    ltsX: Public.fromHex("dd32e75f287374f8a1af4081bb1caf56d27cf61fd8052d08e039e7f2020badf8").point,

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
