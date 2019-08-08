import { Component, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { MatDialog, MatSnackBar } from "@angular/material";
import { ActivatedRoute, Router } from "@angular/router";

import { Data, Private, StorageDB } from "@c4dt/dynacred";

import { ByzCoinRPC } from "@dedis/cothority/byzcoin";
import Log from "@dedis/cothority/log";

import { showDialogOKC, showSnack } from "../../lib/Ui";
import { BcviewerService } from "../bcviewer/bcviewer.component";
import { UserData } from "../user-data.service";

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
                private bcs: BcviewerService,
                private uData: UserData) {
    }

    async ngOnInit() {
        Log.llvl3("init register");

        this.ephemeralParam = this.route.snapshot.queryParamMap.get("ephemeral");
        if (this.ephemeralParam && this.ephemeralParam.length === 64) {
            const buf = await StorageDB.get(this.uData.dataFileName);
            if (buf.length > 0) {
                await showDialogOKC(this.dialog, "Overwrite user?", "There seems to be a user already " +
                    "stored in this browser - do you want to overwrite it?", async (overwrite: boolean) => {
                    if (overwrite) {
                        Log.lvl1("overwriting existing user");
                        await StorageDB.set(this.uData.dataFileName, "");
                        window.location.reload();
                    } else {
                        return await this.router.navigate(["/"]);
                    }
                });
            } else {
                this.registering = 1;
            }
        } else {
            this.register = true;
            this.registerForm = new FormGroup({
                alias: new FormControl(),
                darcID: new FormControl(undefined,
                    Validators.pattern(/[0-9a-fA-F]{64}/)),
                ephemeralKey: new FormControl(undefined,
                    Validators.pattern(/[0-9a-fA-F]{64}/)),
            });
            await this.uData.load();
            this.bcs.updateBlocks();
        }
    }

    async addID(ephemeral: string, alias: string = "", darcID: string = "") {
        if (ephemeral.length === 64) {
            await showSnack(this.snack, "Creating new user", async () => {
                Log.lvl1("creating user");
                const ekStr = ephemeral;
                const ek = Private.fromHex(ekStr);
                if (darcID.length === 64 && alias.length > 0) {
                    Log.lvl2("creating FIRST user");
                    const d = await Data.createFirstUser(this.uData.bc, Buffer.from(darcID, "hex"), ek.scalar, alias);
                    this.uData.contact = d.contact;
                    this.uData.keyIdentity = d.keyIdentity;
                    await this.uData.connectByzcoin();
                } else {
                    Log.lvl2("attaching to existing user and replacing password");
                    await this.uData.attachAndEvolve(ek);
                }
                Log.lvl1("verifying registration");
                await this.uData.save();
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
        return this.router.navigate(["/"]);
    }
}
