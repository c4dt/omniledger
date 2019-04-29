import { PopPartyInstance } from "../../personhood/pop-party-instance";
import * as PopPartyProto from "../../personhood/proto";
import RoPaSciInstance, { RoPaSciStruct } from "../../personhood/ro-pa-sci-instance";
import CoinInstance, { Coin } from "./coin-instance";
import CredentialsInstance, { Attribute, Credential, CredentialStruct } from "./credentials-instance";
import DarcInstance from "./darc-instance";
import SpawnerInstance, { SpawnerStruct } from "./spawner-instance";

const coin = {
    Coin,
    CoinInstance,
};

const credentials = {
    Attribute,
    Credential,
    CredentialStruct,
    CredentialsInstance,
};

const darc = {
    DarcInstance,
};

const pop = {
    PopPartyInstance,
    ...PopPartyProto,
};

const game = {
    RoPaSciInstance,
    RoPaSciStruct,
};

const spawner = {
    SpawnerInstance,
    SpawnerStruct,
};

export {
    coin,
    credentials,
    darc,
    pop,
    game,
    spawner,
};
