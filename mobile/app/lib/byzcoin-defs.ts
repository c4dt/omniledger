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
    byzCoinID: Buffer.from("06dcea73c44170f93d0c6df31b9917a549edcb7a3a03a6dee7189a137e45afe1", "hex"),
    spawnerID: Buffer.from("d326ee32cc3995ac7492b815304e593db6713532705ddda573b51b3dfcc08cb6", "hex"),
    adminDarc: Buffer.from("1494808c2bce937ed619e27acbc8d3224c7edc85cf9a26eb217ddb7e48597050", "hex"),
    ltsID: Buffer.from("feaf879273ba3cbfe9067e1d5a49eb077bf3000db2501c44e112263260b21140", "hex"),
    ltsX: Public.fromHex("47822dcbb1c5205bab858d0117c0396f87a8c0912c54bac5d6673f0e5df26c80").point,
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
