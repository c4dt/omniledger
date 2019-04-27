import {InstanceID} from './src/byzcoin/instance';
import {Roster} from './src/network';
import {WebSocketConnection} from './src/network/connection';
import {Message, Properties} from 'protobufjs';
import {registerMessage} from './src/protobuf';

export class TestStoreRPC {
    static serviceName = 'TestData';

    constructor(public bcID: Buffer, public spawnerIID: InstanceID) {
    }

    static async save(r: Roster, bcID: Buffer, spawnerIID: InstanceID) {
        const s = new WebSocketConnection(r.list[0].getWebSocketAddress(), TestStoreRPC.serviceName);
        await s.send(new TestStore({
            byzcoinid: bcID,
            spawneriid: spawnerIID,
        }), TestStore);
    }

    static async load(r: Roster): Promise<TestStore> {
        const s = new WebSocketConnection(r.list[0].getWebSocketAddress(), TestStoreRPC.serviceName);
        const ts = await s.send(new TestStore({}), TestStore);
        return new TestStore(ts);
    }
}

export class TestStore extends Message<TestStore> {

    constructor(props?: Properties<TestStore>) {
        super(props);
    }

    get byzcoinID(): InstanceID {
        return this.byzcoinid;
    }

    get spawnerIID(): InstanceID {
        return this.spawneriid;
    }

    readonly byzcoinid: InstanceID;
    readonly spawneriid: InstanceID;
    /**
     * @see README#Message classes
     */
    static register() {
        registerMessage('testdata.TestStore', TestStore);
    }

    static fromBytes(b: Buffer): TestStore {
        return TestStore.decode(b);
    }

    /**
     * Helper to encode the TestStore using protobuf
     * @returns the bytes
     */
    toBytes(): Buffer {
        return Buffer.from(TestStore.encode(this).finish());
    }
}

TestStore.register();
