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
    byzCoinID: Buffer.from("7e07c329c5fe8b4d11e213d56d2e44fb732cba55a952ff315a48e1a19e13b9df", "hex"),
    spawnerID: Buffer.from("ec46865b6fe53fc2778109870eda9cc39bc6eef7e4efa26ce5b9890810d32f4a", "hex"),
    adminDarc: Buffer.from("b3dafa3b94d7d07016d76cbe29cc9f9195e0c2cb36086d8eb0892e418a0bc481", "hex"),
    ltsID: Buffer.from("4c99ce919edfa063626d6080f5229b7ea707d5c7f8c0b43939be968416660a93", "hex"),
    ltsX: Public.fromHex("5d8007e677d236045cc269633fa4ad7a20b2fb99c3f30b51a67aa10cb8212075").point,
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
