import { UserLocation } from "@c4dt/cothority/personhood/personhood-rpc";

export class SocialNode {

    static fromObject(o: any): SocialNode {
        return new SocialNode(o.users.map((u) => UserLocation.fromObject(u)));
    }
    constructor(public users: UserLocation[]) {
    }

    toObject(): any {
        return {
            users: this.users.map((u) => u.toObject()),
        };
    }
}
