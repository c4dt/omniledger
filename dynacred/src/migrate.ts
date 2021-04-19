import { Darc, IdentityDarc } from "@dedis/cothority/darc";
import { byzcoin, CredentialSignerBS } from "./index";
import { SpawnerTransactionBuilder } from "./spawnerTransactionBuilder";

/**
 * The Migrate class puts all possible migrations into one place. For every migration, two methods
 * should be added:
 * - versionRecovery - returns a number indicating the current version
 * - updateRecovery - updates to the latest available version
 */
export class Migrate {
    static versionRecovery(sig: Darc, rec: byzcoin.DarcBS): number {
        const rule = sig.rules.getRule(Darc.ruleSign);
        const recId = new IdentityDarc({id: rec.getValue().getBaseID()}).toString();
        if (rule.getIdentities().find((id) => id === recId)) {
            return 0;
        }
        return 1;
    }

    static async updateRecovery(tx: SpawnerTransactionBuilder, sig: CredentialSignerBS, rec: byzcoin.DarcBS) {
        if (Migrate.versionRecovery(sig.getValue(), rec) === 1) {
            return;
        }
        const rules = sig.getValue().rules.clone();
        const recId = new IdentityDarc({id: rec.getValue().getBaseID()}).toString();
        rules.getRule(Darc.ruleSign).remove(recId);
        sig.evolve(tx, {rules});
    }
}
