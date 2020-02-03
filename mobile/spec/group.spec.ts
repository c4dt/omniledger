// tslint:disable-next-line
require("nativescript-nodeify");

import Log from "@dedis/cothority/log";
import { KeyPair } from "../app/lib/dynacred";
import {
    GroupContract,
    GroupContractCollection,
    GroupDefinition,
    IGroupContract,
    IGroupDefinition,
} from "../app/lib/dynacred/group";

describe("Group Management", () => {
    it("Test GroupContractCollection", () => {
        const user1 = new KeyPair();
        const user2 = new KeyPair();

        // creation of the GroupContractCollection
        const purpose: string = "Test";
        const contractCollection = new GroupContractCollection(purpose);

        // creation of the first group definition
        const orginialVar = {
            orgPubKeys: [user1._public.toHex(), user2._public.toHex()],
            purpose,
            suite: "edwards25519",
            voteThreshold: ">=1/2",
        };
        let gd = new GroupDefinition(orginialVar);
        let contract0 = contractCollection.createGroupContract(undefined, gd);

        // user1 exchanges the first group definition
        contractCollection.sign(contract0, user1._private);

        // user2 receives the group definition by JSON
        let jsonContract: IGroupContract = contract0.toJSON();
        contract0 = GroupContract.createFromJSON(jsonContract);

        // user2 accepts the group definition
        let variables = gd.allVariables;
        variables.predecessor.push(contract0.id);
        gd = new GroupDefinition(variables);
        let contract1 = contract0.proposeGroupContract(gd);
        contractCollection.sign(contract1, user2._private);

        // user1 receives back the group definition by JSON
        jsonContract = contract1.toJSON();
        contract1 = GroupContract.createFromJSON(jsonContract);

        // update group definition Collection
        contractCollection.append(contract1);

        // first test
        expect(contractCollection.has(contract1)).toBeTruthy();
        expect(contractCollection.get(contract1.id)).toEqual(contract1);
        // expect(contractCollection.getWorldView(contract1)).toEqual([contract1]);
        Log.print("First part of test GroupDefinitionList passed!");

        // new user
        const user3 = new KeyPair();

        // user1 proposes user3 as a new member in a new group definition
        variables = gd.allVariables;
        variables.orgPubKeys.push(user3._public.toHex());
        gd = new GroupDefinition(variables);
        let contract2: GroupContract = contractCollection.createGroupContract(contract1, gd);

        // user1 exchanges the first group definition
        contractCollection.sign(contract2, user1._private);

        // user2 receives the group definition by JSON
        jsonContract = contract2.toJSON();
        contract2 = GroupContract.createFromJSON(jsonContract);

        // user2 accepts the group definition
        contractCollection.sign(contract2, user2._private);

        // user3 receives the group definition by JSON
        jsonContract = contract2.toJSON();
        contract2 = GroupContract.createFromJSON(jsonContract);

        // user3 signs the group definition
        contractCollection.sign(contract2, user3._private);

        // user1 gets back the group definition
        jsonContract = contract2.toJSON();
        contract2 = GroupContract.createFromJSON(jsonContract);
        contractCollection.append(contract2);

        // Second tests
        expect(contractCollection.get(contract2.id)).toEqual(contract2);
        expect(contractCollection.getChildren(contract1)).toEqual([contract2]);
        // expect(gdCollection.isAccepted(contract1)).toBeTruthy();
        expect(contractCollection.isAccepted(contract2)).toBeTruthy();
        // expect(contractCollection.getWorldView(contract1)).toEqual([[contract1, contract2]]);
        expect(contractCollection.getWorldView(contract2)).toEqual([contract2]);
        expect(contractCollection.getCurrentGroupContract()).toEqual(contract2);
        Log.print("Second part of test GroupDescriptionCollection is passed!");
    });
    it("Test multiple signature by same user", () => {
        const user1 = new KeyPair();
        const user2 = new KeyPair();

        // creation of the first group definition
        const originalVar = {
            orgPubKeys: [user1._public.toHex(), user2._public.toHex()],
            purpose: "Test",
            suite: "edwards25519",
            voteThreshold: ">1/2",
        };
        const contractCollection = new GroupContractCollection(originalVar.purpose);
        let gd = new GroupDefinition(originalVar);
        const contract0 = contractCollection.createGroupContract(undefined, gd);

        // user1 exchanges the first group definition
        const variables = gd.allVariables;
        variables.predecessor.push(contract0.id);
        gd = new GroupDefinition(variables);
        let contract1 = contractCollection.createGroupContract(contract0, gd);
        contractCollection.sign(contract1, user1._private);
        contractCollection.sign(contract1, user1._private);

        // user2 receives the group definition by JSON
        const jsonGD: IGroupContract = contract1.toJSON();
        contract1 = GroupContract.createFromJSON(jsonGD);

        expect(contractCollection.isAccepted(contract1)).toBeFalsy();
        Log.print("Test multiple signature by same user passed!");
    });
    it("Test getWorldView with multiple branches", () => {
        const user1 = new KeyPair();
        const user2 = new KeyPair();
        const user3 = new KeyPair();
        const user4 = new KeyPair();
        const user5 = new KeyPair();

        // creation of the first group contract
        let variables: IGroupDefinition = {
            orgPubKeys: [user1._public.toHex(), user2._public.toHex(), user3._public.toHex(), user4._public.toHex(), user5._public.toHex()],
            purpose: "Test",
            suite: "edwards25519",
            voteThreshold: ">=1/3",
        };

        // creates four group contracts
        //              c0
        //              |
        //              c1
        //            /    \
        //           c2    c3

        const contractCollection = new GroupContractCollection(variables.purpose);
        let gd = new GroupDefinition(variables);
        const c0 = contractCollection.createGroupContract(undefined, gd);
        variables = gd.allVariables;
        variables.predecessor = [c0.id];
        const c1 = contractCollection.createGroupContract(c0, new GroupDefinition(c0.groupDefinition.allVariables));
        contractCollection.sign(c1, user1._private);
        contractCollection.sign(c1, user2._private);
        contractCollection.sign(c1, user3._private);
        contractCollection.sign(c1, user4._private);
        contractCollection.sign(c1, user5._private);

        variables = gd.allVariables;
        variables.voteThreshold = ">=1/2";
        variables.predecessor = [c1.id];
        gd = new GroupDefinition(variables);
        const c2 = contractCollection.createGroupContract(c1, gd);
        contractCollection.sign(c2, user1._private);
        contractCollection.sign(c2, user2._private);
        contractCollection.sign(c2, user3._private);

        variables = gd.allVariables;
        variables.voteThreshold = ">=9/10";
        gd = new GroupDefinition(variables);
        const c3 = contractCollection.createGroupContract(c1, gd);
        contractCollection.sign(c3, user4._private);
        contractCollection.sign(c3, user5._private);

        expect(contractCollection.getWorldView(c1)).toEqual([c2, c3]);
        Log.print("Test getWorldView with multiples branches passed!");
    });
    it("Test vote threshold", () => {
        const user1 = new KeyPair();
        const user2 = new KeyPair();

        for (let i = 1; i <= 3; i++) {
            // creation of the GroupContractCollection
            const purpose: string = "Test";
            const contractCollection = new GroupContractCollection(purpose);

            // creation of the first group definition
            const orginialVar = {
                orgPubKeys: [user1._public.toHex(), user2._public.toHex()],
                purpose,
                suite: "edwards25519",
                voteThreshold: ">1/" + i,
            };

            let gd = new GroupDefinition(orginialVar);
            const contract0 = contractCollection.createGroupContract(undefined, gd);

            // user1 exchanges the first group definition
            const variables = gd.allVariables;
            variables.predecessor.push(contract0.id);
            gd = new GroupDefinition(variables);
            const contract1 = contract0.proposeGroupContract(gd);
            contractCollection.sign(contract1, user1._private);

            // update group definition Collection
            contractCollection.append(contract1);

            if (i <= 2) {
                expect(contractCollection.isAccepted(contract1)).toBeFalsy();
            } else {
                expect(contractCollection.isAccepted(contract1)).toBeTruthy();
            }
        }
        Log.print("Test vote threshold passed!");
    });
    it("Test merge", () => {
        const user1 = new KeyPair();
        const user2 = new KeyPair();
        const user3 = new KeyPair();
        const user4 = new KeyPair();
        const user5 = new KeyPair();

        // creation of the first group contract
        let variables: IGroupDefinition = {
            orgPubKeys: [user1._public.toHex(), user2._public.toHex(), user3._public.toHex(), user4._public.toHex(), user5._public.toHex()],
            purpose: "Test",
            suite: "edwards25519",
            voteThreshold: ">=1/3",
        };

        // creates five group contracts
        //              c0
        //              |
        //              c1
        //            /    \
        //           c2    c3
        //            \    /
        //              c4

        const contractCollection = new GroupContractCollection(variables.purpose);
        let gd = new GroupDefinition(variables);
        const c0 = contractCollection.createGroupContract(undefined, gd);
        variables = gd.allVariables;
        variables.predecessor = [c0.id];
        const c1 = contractCollection.createGroupContract(c0, new GroupDefinition(c0.groupDefinition.allVariables));
        contractCollection.sign(c1, user1._private);
        contractCollection.sign(c1, user2._private);
        contractCollection.sign(c1, user3._private);
        contractCollection.sign(c1, user4._private);
        contractCollection.sign(c1, user5._private);

        variables = gd.allVariables;
        variables.voteThreshold = ">=1/2";
        variables.predecessor = [c1.id];
        gd = new GroupDefinition(variables);
        const c2 = contractCollection.createGroupContract(c1, gd);
        contractCollection.sign(c2, user1._private);
        contractCollection.sign(c2, user2._private);
        contractCollection.sign(c2, user3._private);

        variables = gd.allVariables;
        variables.voteThreshold = ">=9/10";
        gd = new GroupDefinition(variables);
        const c3 = contractCollection.createGroupContract(c1, gd);
        contractCollection.sign(c3, user4._private);
        contractCollection.sign(c3, user5._private);

        variables = gd.allVariables;
        variables.voteThreshold = ">=1/2";
        variables.predecessor = [c2.id, c3.id];
        gd = new GroupDefinition(variables);
        const c4 = contractCollection.createGroupContract(c2, gd);
        contractCollection.sign(c4, user1._private);
        contractCollection.sign(c4, user2._private);
        contractCollection.sign(c4, user3._private);
        contractCollection.sign(c4, user4._private);
        contractCollection.sign(c4, user5._private);

        expect(contractCollection.isAccepted(c1)).toBeTruthy();
        expect(contractCollection.isAccepted(c2)).toBeTruthy();
        expect(contractCollection.isAccepted(c3)).toBeTruthy();
        expect(contractCollection.isAccepted(c4)).toBeTruthy();
        expect(contractCollection.getCurrentGroupContract()).toEqual(c4);
        Log.print("Test merge passed!");
    });
});
