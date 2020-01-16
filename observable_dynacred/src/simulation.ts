import {IGenesisUser, ISpawner, IUser} from "./credential";

export interface ITest {
    genesisUser: IGenesisUser;
    spawner: ISpawner;
    user: IUser;
}
