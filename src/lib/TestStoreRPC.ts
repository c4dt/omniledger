import {InstanceID} from "./cothority/byzcoin/instance";
import {Log} from "./Log";
import {Roster} from "./cothority/network";
import {WebSocketConnection} from "./cothority/network/connection";
import {Message, Properties} from "protobufjs";
import {registerMessage} from "./cothority/protobuf";
import {Coin} from "./cothority/byzcoin/contracts/coin-instance";

export class TestStoreRPC{
    static serviceName = "TestData";

    constructor (public bcID: Buffer, public spawnerIID: InstanceID){}

    static async save(r: Roster, bcID: Buffer, spawnerIID: InstanceID){
        let s = new WebSocketConnection(r.list[0].getWebSocketAddress(), TestStoreRPC.serviceName);
        await s.send(new TestStore({
            byzcoinid: bcID,
            spawneriid: spawnerIID,
        }), TestStore);
    }

    static async load(r: Roster): Promise<TestStore>{
        let s = new WebSocketConnection(r.list[0].getWebSocketAddress(), TestStoreRPC.serviceName);
        let ts = await s.send(new TestStore({}), TestStore);
        return new TestStore(ts);
    }
}

export class TestStore extends Message<TestStore>{
    /**
     * @see README#Message classes
     */
    static register() {
        registerMessage("testdata.TestStore", TestStore);
    }

    static fromBytes(b: Buffer): TestStore{
        return TestStore.decode(b)
    }
    readonly byzcoinid: InstanceID;
    readonly spawneriid: InstanceID;

    constructor(props?: Properties<TestStore>){
        super(props);
    }

    /**
     * Helper to encode the TestStore using protobuf
     * @returns the bytes
     */
    toBytes(): Buffer {
        return Buffer.from(TestStore.encode(this).finish());
    }

    get byzcoinID(): InstanceID{
        return this.byzcoinid;
    }

    get spawnerIID(): InstanceID{
        return this.spawneriid;
    }
}

TestStore.register();
