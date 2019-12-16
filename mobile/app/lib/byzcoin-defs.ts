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
    byzCoinID: Buffer.from("95d90c141e6b055c743dd0710a2ee2a6e2e7af89b28e30a52ba461f10a16c15f", "hex"),
    spawnerID: Buffer.from("7bf9ecfe8d8f6afcf96afd90f25b305d582afba2fe5aa5a35d463d8a458e330a", "hex"),
    adminDarc: Buffer.from("ea05689b2f3c800c344345bb505bf8d26cb7c7df6e24ee8f9f347ca24f96db43", "hex"),
    ltsID: Buffer.from("80af9e5b0ca3e50a119967f450fa2811808d2f969b42b55b9e7b27ed240a560f", "hex"),
    ltsX: Public.fromHex("f77745dfdd7b9498a7a1f8f98b7fdb1776e380ca6c8f5376f40063c12f827d62").point,
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
