import { Component, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatDialog } from "@angular/material/dialog";
import PersonhoodRPC from "@dedis/cothority/personhood/personhood-rpc";
import { ByzCoinService } from "src/app/byz-coin.service";
import Log from "@dedis/cothority/log";
import { showDialogInfo, showTransactions, TProgress } from "src/lib/Ui";
import { ServerIdentity } from "@dedis/cothority/network";

@Component({
    selector: "app-newuser",
    templateUrl: "./newuser.component.html",
})
export class NewuserComponent implements OnInit {
    readonly signupForm: FormGroup;
    readonly recoveryForm: FormGroup;

    constructor(private dialog: MatDialog,
                public bcs: ByzCoinService) {
        this.signupForm = new FormGroup({
            alias: new FormControl(),
            email: new FormControl("", Validators.email),
        });
        this.recoveryForm = new FormGroup({
            email: new FormControl("", Validators.email),
        });
    }

    async ngOnInit() {
        // Nothing to do here
    }

    getPHRPC(): PersonhoodRPC {
        if (this.bcs.config.signupNode === undefined) {
            throw new Error("didn't find signup node");
        }
        const node = new ServerIdentity({
            url: this.bcs.config.signupNode.toString(),
            id: Buffer.alloc(32)
        });
        return new PersonhoodRPC(node);
    }

    async signup() {
        const reply = await showTransactions(this.dialog, "Signing up new user",
            async (progress: TProgress) => {
                progress(50, "Requesting new user");
                const phRpc = this.getPHRPC();
                return await phRpc.signup(this.signupForm.controls.email.value, this.signupForm.controls.alias.value);
            });
        let err = "";
        switch (reply.status) {
            case 0:
                await showDialogInfo(this.dialog, "Successfully signed up", "Your new user has been created and an email with" +
                    " signup instruction has been sent to: " + this.signupForm.controls.email.value, "Cool!");
                break;
            case 1:
                err = "This email already exists";
                break;
            case 2:
                err = "Too many signups in the last 24h - try again in an hour";
                break;
        }
        if (err !== "") {
            await showDialogInfo(this.dialog, "Error while signing up", "Unfortunately the signup process didn't work for" +
                " the following reason: " + err, "Too bad");
            Log.error("While sending signup string:" + err);
        }
    }

    async recover() {
        const reply = await showTransactions(this.dialog, "Recovering user",
            async (progress: TProgress) => {
                progress(50, "Requesting recovery of user");
                const phRpc = this.getPHRPC();
                return await phRpc.recover(this.recoveryForm.controls.email.value);
            });
        let err = "";
        switch (reply.status) {
            case 0:
                await showDialogInfo(this.dialog, "Successfully recovered up", "A recovery device has been" +
                    " created and recovery instructions have been sent to: " + this.recoveryForm.controls.email.value, "Cool!");
                break;
            case 1:
                err = "Didn't find an account with that email";
                break;
            case 2:
                err = "Too many recovery attempts in the last 24h - try again in an hour";
                break;
        }
        if (err !== "") {
            await showDialogInfo(this.dialog, "Error while signing up", "Unfortunately the signup process didn't work for" +
                " the following reason: " + err, "Too bad");
            Log.error("While sending signup string:" + err);
        }
    }

}
