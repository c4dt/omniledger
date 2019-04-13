import {UserLocation} from "./cothority/personhood/personhood-rpc";

export class SocialNode {
    constructor(public users: UserLocation[]){}

    toObject(): any{
        return {
            users: this.users.map(u => u.toObject())
        }
    }

    static fromObject(o: any): SocialNode{
        return new SocialNode(o.users.map(u => UserLocation.fromObject(u)));
    }
}
