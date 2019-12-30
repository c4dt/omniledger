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
    byzCoinID: Buffer.from("59aed7b405f38049ee2723599b20b9faa79b8648f63876b8532e2a2687833037", "hex"),
    spawnerID: Buffer.from("d8779fb1479d5de207ec46a923a40652721935453acd2471ddaa1597da64fe46", "hex"),
    adminDarc: Buffer.from("e14bb127ef839cfaf1121c9d54fcf850702bf6677d405b23d321ea850ce04e0d", "hex"),
    ltsID: Buffer.from("196bac20f79d64d93d94701e5c08b3a805070eac1ea3a684219c31e5665eb80b", "hex"),
    ltsX: Public.fromHex("2b2f78546324375326a6d191a05f2fa68871d058df2f2c31f1e899be2e6eba91").point,
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
