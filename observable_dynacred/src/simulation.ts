import {IGenesisUser, ISpawner, IUser} from "./credentialObservable";

export interface ITest {
    genesisUser: IGenesisUser;
    spawner: ISpawner;
    user: IUser;
}
