import { Component, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { ByzCoinRPC } from "@c4dt/cothority/byzcoin";
import { Log } from "@c4dt/cothority/log";
import { Data, gData } from "../../lib/Data";
import { activateC4DT, activateTesting, Defaults } from "../../lib/Defaults";
import { Private } from "../../lib/KeyPair";
import { StorageDB } from "../../lib/StorageDB";

@Component({
    selector: "app-register",
    styleUrls: ["./register.component.css"],
    templateUrl: "./register.component.html",
})
export class RegisterComponent implements OnInit {
    registerForm: FormGroup;
    registering: boolean = false;
    error: string;

    constructor(private router: Router,
                private route: ActivatedRoute) {
        const darcID = Defaults.AdminDarc.toString("hex");
        const ephemeral = Defaults.Ephemeral.toString("hex");

        const ephemeralParam = route.snapshot.queryParamMap.get("ephemeral");
        if (ephemeralParam && ephemeralParam.length === 64) {
            StorageDB.get(gData.dataFileName).then((buf) => {
                if (buf.length > 0) {
                    this.router.navigateByUrl("/user");
                } else {
                    this.registering = true;
                    this.addID(ephemeralParam).catch((e) => {
                        this.error = "Registration failed - you can only register once using a registration link!";
                    });
                }
            });
        }

        this.registerForm = new FormGroup({
            alias: new FormControl(Defaults.Alias),
            darcID: new FormControl(darcID,
                Validators.pattern(/[0-9a-fA-F]{64}/)),
            ephemeralKey: new FormControl(ephemeral,
                Validators.pattern(/[0-9a-fA-F]{64}/)),
        });
    }

    ngOnInit() {
        Log.lvl3("init");
    }

    async addID(ephemeral: string, alias: string = "", darcID: string = "") {
        gData.delete();
        gData.bc = await ByzCoinRPC.fromByzcoin(Defaults.Roster, Defaults.ByzCoinID);
        if (ephemeral.length === 64) {
            Log.lvl1("creating user");
            const ekStr = ephemeral;
            const ek = Private.fromHex(ekStr);
            if (darcID.length === 64 && alias.length > 0) {
                Log.lvl2("creating FIRST user");
                const d = await Data.createFirstUser(gData.bc, Buffer.from(darcID, "hex"), ek.scalar,
                    alias);
                gData.contact = d.contact;
                gData.keyIdentity = d.keyIdentity;
                await gData.connectByzcoin();
            } else {
                Log.lvl2("attaching to existing user and replacing password");
                await gData.attachAndEvolve(ek);
            }
            Log.lvl1("verifying registration");
            await gData.save();
            Log.lvl1("done registering");
            await this.router.navigateByUrl("/user");
            Log.lvl1("navigated to user");
        }
    }

    async addIDButton() {
        const ctrl = this.registerForm.controls;
        try {
            this.addID(ctrl.ephemeralKey.value, ctrl.alias.value, ctrl.darcID.value);
        } catch (e) {
            Log.error("Couldn't register:", e);
        }
    }
}
