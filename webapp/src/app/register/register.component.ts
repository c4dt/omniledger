import { Component, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { MatDialog, MatSnackBar } from "@angular/material";
import { ActivatedRoute, Router } from "@angular/router";

import { Data, gData } from "@c4dt/dynacred/Data";
import { Defaults } from "@c4dt/dynacred/Defaults";
import { Private } from "@c4dt/dynacred/KeyPair";
import { StorageDB } from "@c4dt/dynacred/StorageDB";

import { ByzCoinRPC } from "@dedis/cothority/byzcoin";
import Log from "@dedis/cothority/log";

import { showDialogOKC, showSnack } from "../../lib/Ui";
import { BcviewerService } from "../bcviewer/bcviewer.component";

@Component({
    selector: "app-register",
    styleUrls: ["./register.component.css"],
    templateUrl: "./register.component.html",
})
export class RegisterComponent implements OnInit {
    registerForm: FormGroup;
    registering: number;
    register: boolean = false;
    error: string;
    ephemeralParam: string;

    constructor(private router: Router,
                private dialog: MatDialog,
                private route: ActivatedRoute,
                private snack: MatSnackBar,
                private bcs: BcviewerService) {
    }

    async ngOnInit() {
        Log.llvl3("init register");
        const darcID = Defaults.AdminDarc.toString("hex");
        const ephemeral = Defaults.Ephemeral.toString("hex");

        this.ephemeralParam = this.route.snapshot.queryParamMap.get("ephemeral");
        if (this.ephemeralParam && this.ephemeralParam.length === 64) {
            const buf = await StorageDB.get(gData.dataFileName);
            if (buf.length > 0) {
                await showDialogOKC(this.dialog, "Overwrite user?", "There seems to be a user already " +
                    "stored in this browser - do you want to overwrite it?", async (overwrite: boolean) => {
                    if (overwrite) {
                        Log.lvl1("overwriting existing user");
                        await StorageDB.set(gData.dataFileName, "");
                        window.location.reload();
                    } else {
                        await this.router.navigateByUrl(Defaults.PathUser);
                    }
                });
            } else {
                this.registering = 1;
            }
        } else {
            this.register = true;
            this.registerForm = new FormGroup({
                alias: new FormControl(Defaults.Alias),
                darcID: new FormControl(darcID,
                    Validators.pattern(/[0-9a-fA-F]{64}/)),
                ephemeralKey: new FormControl(ephemeral,
                    Validators.pattern(/[0-9a-fA-F]{64}/)),
            });
            await gData.load();
            this.bcs.updateBlocks();
        }
    }

    async addID(ephemeral: string, alias: string = "", darcID: string = "") {
        gData.delete();
        gData.bc = await ByzCoinRPC.fromByzcoin(await Defaults.Roster, Defaults.ByzCoinID);
        if (ephemeral.length === 64) {
            await showSnack(this.snack, "Creating new user", async () => {
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
            });
        }
    }

    async addIDButton() {
        const ctrl = this.registerForm.controls;
        try {
            await this.addID(ctrl.ephemeralKey.value, ctrl.alias.value, ctrl.darcID.value);
            await this.start_demonstrator();
        } catch (e) {
            Log.error("Couldn't register:", e);
        }
    }

    async register_user() {
        this.registering = 2;
        try {
            await this.addID(this.ephemeralParam);
            this.registering = 3;
        } catch (e) {
            this.registering = 4;
            this.error = "Registration failed - you can only register once using a registration link!";
        }
    }

    async start_demonstrator() {
        this.router.navigateByUrl(Defaults.PathUser);
    }
}
