import { UserLocation } from "./personhood-rpc";

export class SocialNode {

    static fromObject(o: any): SocialNode {
        return new SocialNode(o.users.map((u: any) => UserLocation.decode(u)));
    }
    constructor(public users: UserLocation[]) {
    }

    toObject(): any {
        return {
            users: this.users.map((u) => Buffer.from(UserLocation.encode(u).finish())),
        };
    }
}
