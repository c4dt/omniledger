// tslint:disable-next-line
require("nativescript-nodeify");

import { Public } from "./dynacred";
import { IByzcoinDef } from "./byzcoin-def";
import { c4dtCalypsoRoster, dedisRoster, testRoster } from "./byzcoin-rosters";

// tslint:disable:object-literal-sort-keys
export const bdTest: IByzcoinDef = {
    testingMode: true,
    roster: testRoster,
    // Paste here vvv
    byzCoinID: Buffer.from("411e72a22ec176fcd23526b47961d498d2febc469d4c15413c2455a9624e870a", "hex"),
    spawnerID: Buffer.from("502896da3a95a2cbc56d90f158947ed9d729e6cad2705560e9f522d8e29d8bd7", "hex"),
    adminDarc: Buffer.from("6bd93d6d36db3e7c98a7cfc1d267e0fae6b5b3bcee22d01320e9770e7ce545ba", "hex"),
    ltsID: Buffer.from("a0bc650366afdd2744580c973333d18a87ef81727adcd1e430efb7556c152c33", "hex"),
    ltsX: Public.fromHex("8f6bdc3344e0d17568ee0ead22a86fadf0b04f2932ba357077756a8434f640f2").point,
    // Paste here ^^^
    calypsoRoster: testRoster,
    gameNode: testRoster.list[0],
};

export const bdDEDIS: IByzcoinDef = {
    testingMode: false,
    roster: dedisRoster,
    byzCoinID: Buffer.from("9cc36071ccb902a1de7e0d21a2c176d73894b1cf88ae4cc2ba4c95cd76f474f3", "hex"),
    // This is block 0x18000, a height-8 block.
    latestID: Buffer.from("5a5b5903a64b169448b997e1e7ed5890bace99f1e5b3ec094c50cd7e9dfc0834", "hex"),
    adminDarc: Buffer.from("28aa9504ad3d781611b57d98607e1bca25b1c92f3b32a08a7e341c3866db4675", "hex"),
    spawnerID: Buffer.from("ebc32cc89129c7542cdb8991585756be48ea4bd2869d939898f5413e7f757d96", "hex"),
    calypsoRoster: c4dtCalypsoRoster,
    ltsID: Buffer.from("c460c73284503d175bdef8058d815bd99f133d39db2f8267d5ccf3dbce9c1e17", "hex"),
    ltsX: Public.fromHex("97a56eba22e02f67c83d568b1f96503d2f85ef1987711367d18a698332859a6b").point,
    gameNode: dedisRoster.list.find((si) => si.address.match("conode.c4dt.org") !== null),
};
