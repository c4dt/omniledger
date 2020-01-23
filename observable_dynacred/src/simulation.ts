import {IGenesisUser, ISpawner, IUser} from "./credentials";

export interface ITest {
    genesisUser: IGenesisUser;
    spawner: ISpawner;
    user: IUser;
}
