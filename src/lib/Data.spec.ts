import {Log} from './Log';
import {TestData} from './Data';
import {KeyPair} from './KeyPair';
import * as Long from 'long';
import {Defaults} from './Defaults';

jasmine.DEFAULT_TIMEOUT_INTERVAL = 100000;

describe('Testing new signup', () => {
    describe('With Byzcoin', async () => {
        let tdAdmin: TestData;

        beforeAll(async () => {
            Log.lvl1('Creating Byzcoin and first instance');
            tdAdmin = await TestData.init(Defaults.Roster, 'admin');
        });

        it('Creating new user from darc', async () => {
            let kp1 = new KeyPair();
            let user1 = await tdAdmin.createUser(kp1._private, 'user1');
            await tdAdmin.coinInstance.transfer(Long.fromNumber(1e6), user1.coinInstance.id, [tdAdmin.keyIdentitySigner]);
            let kp2 = new KeyPair();
            let user2 = await user1.createUser(kp2._private, 'user2');
            await user1.coinInstance.transfer(Long.fromNumber(1e5), user2.coinInstance.id, [user1.keyIdentitySigner]);
            await user1.coinInstance.update();
            await user2.coinInstance.update();
            // -600 is for the spawning cost of a new user
            expect(user1.coinInstance.coin.value.toNumber()).toBe(1e6 - 1e5 - 600);
            expect(user2.coinInstance.coin.value.toNumber()).toBe(1e5);
        });

        it('Spawning a secret and recover it', async () => {
            let user1 = await tdAdmin.createUser(null, 'user1');
            let user2 = await tdAdmin.createUser(null, 'user2');
            let secret = Buffer.from('calypsO for all');

        });
    });
});
