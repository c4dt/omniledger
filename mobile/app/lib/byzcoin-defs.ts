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
    byzCoinID: Buffer.from("6e3dde4556227d1d5ca6b0d3a993eb5902397736ab8fbaaf699feff2b39e00bd", "hex"),
    spawnerID: Buffer.from("ff211a3e9e8f3a02f0969ec6e68ad4d774628618158a1215a5eacbcec5cff8a6", "hex"),
    adminDarc: Buffer.from("f6449b215589101027fce35baf647c575c9e96047856f899b10509434eb1f0ed", "hex"),
    ltsID: Buffer.from("3977ed10dcf0286fa1531a4c97304ecd5b7bb1491061a0736ebb0f25c1c8b126", "hex"),
    ltsX: Public.fromHex("597c550a1ee9261702680fecc028c5238317a5404ef176923c00eeeb5c96cf28").point,
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
