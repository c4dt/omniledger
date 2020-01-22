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
    byzCoinID: Buffer.from("e4d40b58afa880cfa730e934666e41eff9254c53d34a9fcf8a412daeb93560b7", "hex"),
    spawnerID: Buffer.from("9c6a4f338986a0a4fa5f7b44c2ae40472c219d4522f4ff14e9229347de4712ac", "hex"),
    adminDarc: Buffer.from("634aa0ac07a0112bc848af8a26cced9564fae3bf180872465230624380da8104", "hex"),
    ltsID: Buffer.from("f517823ab0552f421ef75367c4be01370f6c2e3bbd8e4f9abb3b3b2517b2d2cc", "hex"),
    ltsX: Public.fromHex("9227332415d246da97a02fe703bd521e3956f02a05fa58299d533f127f976e0f").point,
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
