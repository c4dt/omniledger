import { Component, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { ByzCoinRPC } from "@c4dt/cothority/byzcoin";
import { Log } from "@c4dt/cothority/log";
import { Data, gData } from "../../lib/Data";
import { activateTesting, Defaults } from "../../lib/Defaults";
import { Private } from "../../lib/KeyPair";

@Component({
  selector: "app-register",
  styleUrls: ["./register.component.css"],
  templateUrl: "./register.component.html",
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;

  constructor(private router: Router) {
    let alias = "ineiti";
    let darcID = "d025450db8db9f4f5ddb2f6eed83cb3f50dfcf53b005239041458f6984d34ff3";
    let ephemeral = "";
    if (true) {
      alias = "garfield";
      darcID = "1cbc6c2c4da749020ffa838e262c952862f582d9730e14c8afe2a1954aa7c50a";
      ephemeral = "2d9e65673748d99ba5ba7b6be76ff462aaf226461ea226fbb059cbb2af4a7e0c";
      activateTesting();
    }
    this.registerForm = new FormGroup({
      alias: new FormControl(alias),
      darcID: new FormControl(darcID,
        Validators.pattern(/[0-9a-fA-F]{64}/)),
      ephemeralKey: new FormControl(ephemeral,
        Validators.pattern(/[0-9a-fA-F]{64}/)),
    });
  }

  ngOnInit() {
    Log.lvl3("init");
  }

  async addID() {
    try {
      gData.delete();
      gData.bc = await ByzCoinRPC.fromByzcoin(Defaults.Roster, Defaults.ByzCoinID);
      if (this.registerForm.controls.ephemeralKey.valid) {
        Log.lvl1("creating user");
        const ekStr = this.registerForm.controls.ephemeralKey.value as string;
        const ek = Private.fromHex(ekStr);
        const did = this.registerForm.controls.darcID.value;
        if (this.registerForm.controls.darcID.valid && did.length === 64) {
          Log.lvl2("creating FIRST user");
          const d = await Data.createFirstUser(gData.bc, Buffer.from(did, "hex"), ek.scalar,
            this.registerForm.controls.alias.value);
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
    } catch (e) {
      Log.catch(e, "while registering");
    }
  }
}
