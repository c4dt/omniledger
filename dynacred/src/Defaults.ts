// import { FileIO } from "./FileIO";
import { Roster } from "@dedis/cothority/network";
import "cross-fetch/polyfill";

// tslint:disable-next-line
export const Defaults = {
    // IDs
    // TODO remove these when data path is clearer
    AdminDarc: Buffer.alloc(0), // darc of root user -> ? config.toml
    ByzCoinID: Buffer.alloc(0), // genesis block -> config.toml
    Ephemeral: Buffer.alloc(0), // new user init pass -> by User

    // - Testing settings - all settings here are set for the non-testing case. If testing == true, then the
    // settings should be set in the below 'if'. This ensures that we don't forget any testing setting.

    Roster: null as Promise<Roster>,  // config.toml
    RosterCalypso: null as Promise<Roster>, // config.toml

    // Testing
    Testing: false,
};

// Assets path
let assetsPath = "/omniledger/assets/";

function getConodesURL(): string {
    const host =
        (typeof window !== "undefined")
            ? window.location.origin
            : "http://localhost:4200"; // not via browser, so via tests (TODO not true for lib/karma), so localhost

    return host + assetsPath + "conodes.toml";
}

async function rosterFromAssets(): Promise<Roster> {
    const res = await fetch(getConodesURL());
    if (!res.ok) {
        return Promise.reject(Error(`while fetching Roster config: ${res.status}: ${res.body}`));
    }

    return await Roster.fromTOML(await res.text());
}

export function activateTesting() {
    Defaults.Testing = true;
    Defaults.ByzCoinID = Buffer.from("5f78d08a260b6fcc0b492448ec272dc4a59794ddf34a9914fdfe4f3faeba616e", "hex");
    Defaults.AdminDarc = Buffer.from("1cbc6c2c4da749020ffa838e262c952862f582d9730e14c8afe2a1954aa7c50a", "hex");
    Defaults.Ephemeral = Buffer.from("2d9e65673748d99ba5ba7b6be76ff462aaf226461ea226fbb059cbb2af4a7e0c", "hex");
    assetsPath = "/assets/";
}

export function activateDEDIS() {
    Defaults.ByzCoinID = Buffer.from("9cc36071ccb902a1de7e0d21a2c176d73894b1cf88ae4cc2ba4c95cd76f474f3", "hex");
    Defaults.AdminDarc = Buffer.from("d427c78474967d6a2ed108713b858c0195cde97f1516f0113fc75b4e9a6dcb52", "hex");
}

export function activateC4DT() {
    Defaults.ByzCoinID = Buffer.from("5b081e02e38e583085204abfe4553ceb6e0833a530bf8fa476ce2f5c1a9a51ae", "hex");
    Defaults.AdminDarc = Buffer.from("05e647cbdd220e30e33db4d168bd3ceacd09839ca099ca8ef5ab146c986726f6", "hex");
    Defaults.Ephemeral = Buffer.from("ed3ebf1be6fbe7496a8a31c4124fe560fa2f1651dbfa851c61cbd48c961ab30c", "hex");
}

function setRosterFromAssets() {
    const roster = rosterFromAssets();
    Defaults.Roster = roster;
    Defaults.RosterCalypso = roster;
}

// TODO ugly hack to delay fetching when running tests, would be fixed with
// having a not globally defined and not auto-initialized Defaults
if (typeof window !== "undefined") {
    // activateC4DT();
    activateDEDIS();
    // activateTesting();

    setRosterFromAssets();
}
