import { UserLocation } from "./personhood-rpc";

export class SocialNode {

    constructor(public users: UserLocation[]) {
    }

    static fromObject(o: any): SocialNode {
        return new SocialNode(o.users.map((u: any) => UserLocation.decode(u)));
    }

    toObject(): any {
        return {
            users: this.users.map((u) => Buffer.from(UserLocation.encode(u).finish())),
        };
    }
}
