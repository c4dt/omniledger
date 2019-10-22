import { Rule, Rules } from "@dedis/cothority/darc";
import { CredentialStruct } from "@dedis/cothority/personhood/credentials-instance";

describe("plain credential test should", () => {
    it("allow to set the credential", async () => {
        const cs = new CredentialStruct();
        cs.setAttribute("one", "two", Buffer.from("three"));
        cs.setAttribute("one", "four", undefined);
        cs.setAttribute("one", "five", Buffer.from("six"));
        const cred = cs.copy().getCredential("one");
        expect(cred.attributes.length).toBe(3);
        expect(cs.deleteAttribute("one", "seven")).toBeUndefined();
        expect(cs.deleteAttribute("one", "four")).toEqual(Buffer.alloc(0));
        expect(cs.deleteAttribute("one", "five")).toEqual(Buffer.from("six"));
        expect(cs.getCredential("one").attributes.length).toBe(1);
        cs.setCredential("one", cred);
        expect(cs.getCredential("one").attributes.length).toBe(3);
    });

    it ("should correctly treat expressions", () => {
        let rule = new Rule({action: "sign"});
        const id1 = "identity1";
        const id2 = "identity2";
        const id3 = "identity3";
        expect(rule.append(id1, Rule.OR).toString()).toEqual(id1);
        rule = Rule.fromActionExpr("sign", Buffer.from(id1));
        expect(rule.getExpr().toString()).toEqual(id1);
        expect(rule.append(id2, Rule.OR).toString()).toEqual(`${id1} | ${id2}`);
        expect(rule.append(id3, Rule.OR).toString()).toEqual(`${id1} | ${id2} | ${id3}`);

        const ruleC = rule.clone();
        expect(() => ruleC.remove("id")).toThrowError();
        expect(() => ruleC.remove("darc")).toThrowError();
        expect(ruleC.remove(id2).toString()).toEqual(`${id1} | ${id3}`);
        expect(ruleC.remove(id3).toString()).toEqual(`${id1}`);
        expect(ruleC.remove(id1).toString()).toEqual("");

        expect(rule.remove(id1).toString()).toEqual(`${id2} | ${id3}`);

        const rules = new Rules({list: [rule]});
        expect(rules.getRule("sign").getExpr().toString().split("|").length).toBe(2);
        expect(rules.getRule("sign").remove(id2).toString()).toBe(id3);
        expect(rules.getRule("sign").getExpr().toString()).toBe(id3);
    });
});
