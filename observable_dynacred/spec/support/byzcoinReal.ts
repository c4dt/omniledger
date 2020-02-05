import {IProof} from "src/instances";
import {
    IByzCoinAddTransaction,
    IByzCoinProof,
    IDataBase,
    IUser
} from "src/basics";
import {ITest} from "spec/support/itest";
import {byzcoin, darc, Log, network} from "@dedis/cothority";
import Long from "long";
import {User} from "src/user";


type IIdentity = darc.IIdentity;
type ByzCoinRPC = byzcoin.ByzCoinRPC;
type InstanceID = byzcoin.InstanceID;
type ClientTransaction = byzcoin.ClientTransaction;
type Roster = network.Roster;
const {
    ByzCoinRPC,
    contracts: {SpawnerInstance, CoinInstance}
} = byzcoin;
const {SignerEd25519} = darc;

export class ByzCoinReal implements IByzCoinProof, IByzCoinAddTransaction {

    constructor(private bc: ByzCoinRPC, private it: ITest) {
    }

    static async fromScratch(roster: Roster, test: ITest, db: IDataBase): Promise<ByzCoinReal> {
        Log.lvl2("Starting new ByzCoin");
        const bcRPC = await ByzCoinRPC.newByzCoinRPC(roster, test.genesisUser.darc, Long.fromNumber(1e8));
        const bc = new ByzCoinReal(bcRPC, test);
        Log.lvl2("Storing genesis user and 1st user");
        await bc.storeTest();
        await db.set(User.keyCredID, test.user.credID || Buffer.alloc(32));
        return bc;
    }

    async getProof(inst: InstanceID): Promise<IProof> {
        return this.bc.getProof(inst);
    }

    async addTransaction(tx: ClientTransaction): Promise<void> {
        await this.bc.sendTransactionAndWait(tx);
        return;
    };

    public async storeUser(user: IUser) {
        const signer = [new SignerEd25519(this.it.genesisUser.keyPair.pub, this.it.genesisUser.keyPair.priv)];
        if (this.it.spawner.spawnerInstance === undefined) {
            this.it.spawner.spawnerInstance = await SpawnerInstance.fromByzcoin(this.bc, this.it.spawner.spawnerID);
        }
        const si = this.it.spawner.spawnerInstance;

        if (this.it.spawner.coinInstance === undefined) {
            this.it.spawner.coinInstance = await CoinInstance.fromByzcoin(this.bc, this.it.spawner.coinID);
        }
        const ci = this.it.spawner.coinInstance;

        Log.lvl3("Spawning darcs");
        await si.spawnDarcs(ci, signer,
            user.darcSign, user.darcDevice, user.darcCred, user.darcCoin);

        Log.lvl3("Spawning coin");
        const coinInst = await si.spawnCoin(ci, signer,
            user.darcCoin.getBaseID(), user.keyPair.pub.marshalBinary(), Long.fromNumber(1e6));
        if (!user.coinID.equals(coinInst.id)) {
            throw new Error("resulting coinID doesn't match");
        }

        Log.lvl3("Spawning credential");
        const credInst = await si.spawnCredential(ci,
            signer, user.darcCred.getBaseID(), user.cred);
        user.credID = credInst.id;
    }

    public async getSignerCounters(signers: IIdentity[], increment: number): Promise<Long[]> {
        return this.bc.getSignerCounters(signers);
    }

    public async updateCachedCounters(signers: IIdentity[]): Promise<Long[]> {
        return this.bc.updateCachedCounters(signers);
    }

    public getNextCounter(signer: IIdentity): Long {
        return this.bc.getNextCounter(signer);
    }

    private async storeTest() {
        Log.lvl3("Storing coin and spawner instances");
        const signer = [new SignerEd25519(this.it.genesisUser.keyPair.pub, this.it.genesisUser.keyPair.priv)];
        this.it.spawner.coinInstance = await CoinInstance.spawn(this.bc, this.it.genesisUser.darc.getBaseID(),
            signer, this.it.spawner.coin.name);
        await this.it.spawner.coinInstance.mint(signer, Long.fromNumber(1e9));
        this.it.spawner.coinID = this.it.spawner.coinInstance.id;
        const sp = this.it.spawner.spawner;
        const icc = {
            costCRead: sp.costCRead.value,
            costCWrite: sp.costCWrite.value,
            costCoin: sp.costCoin.value,
            costCredential: sp.costCredential.value,
            costDarc: sp.costDarc.value,
            costParty: sp.costParty.value,
            costRoPaSci: sp.costRoPaSci.value,
            costValue: sp.costValue.value,
        };
        this.it.spawner.spawnerInstance = await SpawnerInstance.spawn(this.bc, this.it.genesisUser.darc.getBaseID(),
            signer, icc, this.it.spawner.coinID);
        this.it.spawner.spawnerID = this.it.spawner.spawnerInstance.id;
        return this.storeUser(this.it.user);
    }
}
