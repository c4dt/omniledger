import { Component, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ActivatedRoute, Router } from "@angular/router";

import Log from "@dedis/cothority/log";

import { Genesis, KeyPair, User } from "dynacred";
import { ByzCoinService } from "src/app/byz-coin.service";
import { showDialogOKC, showTransactions, TProgress } from "../../lib/Ui";

@Component({
    selector: "app-register",
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
                private bcs: ByzCoinService) {
    }

    async ngOnInit() {
        Log.lvl2("init register");

        this.ephemeralParam = this.route.snapshot.queryParamMap.get("ephemeral");
        if (this.ephemeralParam && this.ephemeralParam.length === 64) {
            if (await this.bcs.hasUser()) {
                const overwrite = await showDialogOKC(this.dialog, "Overwrite user?",
                    "There seems to be a user already stored in this browser - do you want to overwrite it?");
                if (!overwrite) {
                    window.location.href = "https://c4dt.org";
                    return;
                }
                Log.lvl1("overwriting existing user");
            }
            this.registering = 1;
        } else {
            this.register = true;
            this.registerForm = new FormGroup({
                // These values are only valid in the local byzcoin-docker, so it's not a problem to have a
                // private key here.
                alias: new FormControl("admin"),
                darcID: new FormControl(this.bcs.config.adminDarcID.toString('hex'),
                    Validators.pattern(/[0-9a-fA-F]{64}/)),
                ephemeralKey: new FormControl(this.bcs.config.ephemeral.toString('hex'),
                    Validators.pattern(/[0-9a-fA-F]{64}/)),
            });
        }
    }

    async addID(ephemeralStr: string, alias: string = "", darcIDStr: string = "") {
        if (ephemeralStr.length === 64) {
            const keyPair = KeyPair.fromString(ephemeralStr);
            await showTransactions(this.dialog, "Creating new user",
                async (progress: TProgress) => {
                    Log.lvl1("creating user");
                    if (darcIDStr.length === 64 && alias.length > 0) {
                        Log.lvl2("creating FIRST user");
                        progress(30, "Updating genesis darc");
                        const darcID = Buffer.from(darcIDStr, "hex");
                        const genesis = new Genesis(this.bcs.db, this.bcs.bc, {keyPair, darcID});
                        await genesis.evolveGenesisDarc();
                        progress(50, "Creating Coin");
                        await genesis.createCoin();
                        progress(70, "Creating Spawner");
                        await genesis.createSpawner();
                        progress(80, "Creating User");
                        await genesis.createUser();
                    } else {
                        Log.lvl2("attaching to existing user and replacing password");
                        progress(30, "Creating User");
                        await this.bcs.retrieveUserByEphemeral(keyPair);
                    }
                    Log.lvl1("verifying registration");
                    progress(90, "Loading new user");
                    await this.bcs.loadUser();
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
