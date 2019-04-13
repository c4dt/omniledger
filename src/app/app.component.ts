import {Component, Inject} from '@angular/core';
import {Defaults} from '../lib/Defaults';
import StatusRPC from '../lib/cothority/status/status-rpc';
import {Log} from '../lib/Log';
import {Data, gData, TestData} from '../lib/Data';
import {MAT_DIALOG_DATA, MatDialogRef, MatTabChangeEvent} from '@angular/material';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Private, Public} from '../lib/KeyPair';
import SkipchainRPC from '../lib/cothority/skipchain/skipchain-rpc';
import {Contact} from '../lib/Contact';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Welcome to DynaSent';
  nodes = [];
  gData: Data;
  registerForm: FormGroup;
  contactForm: FormGroup;
  isRegistered = false;
  isLoaded = false;
  testing = true;
  blockCount = -1;

  constructor() {
    if (!this.testing) {
      this.registerForm = new FormGroup({
        ephemeralKey: new FormControl('dccd8216bb4c87890ab5c52c01366265ba1d57bcfaaa0a384a94597c33c47d0c', Validators.pattern(/[0-9a-fA-F]{64}/)),
        darcID: new FormControl('7ec0220b1a4a5c99578188e81f01036acb6c5c9ead9fb002162b8dd111417a7c', Validators.pattern(/[0-9a-fA-F]{64}/)),
        alias: new FormControl('garfield')
      });

      gData.load().then(() => {
        this.gData = gData;
        this.isRegistered = gData.contact.isRegistered();
        this.updateContactForm();
      }).catch(e => {
        Log.catch(e);
      }).finally(() => {
        this.isLoaded = true;
      })
    }
  }

  updateContactForm(){
    this.contactForm = new FormGroup({
      alias: new FormControl(gData.contact.alias),
      email: new FormControl(gData.contact.email, Validators.email),
      phone: new FormControl(gData.contact.phone)
    });
  }

  async updateContact(event: Event){
    gData.contact.alias = this.contactForm.controls['alias'].value;
    gData.contact.email = this.contactForm.controls['email'].value;
    gData.contact.phone = this.contactForm.controls['phone'].value;
    await gData.contact.sendUpdate(gData.keyIdentitySigner);
  }

  async addID(event: Event) {
    try {
      if (this.registerForm.controls['ephemeralKey'].valid) {
        let ekStr = <string> this.registerForm.controls['ephemeralKey'].value;
        let ek = Private.fromHex(ekStr);
        let did = this.registerForm.controls['darcID'].value;
        if (this.registerForm.controls['darcID'].valid && did.length == 64) {
          let d = await Data.createFirstUser(gData.bc, Buffer.from(did, 'hex'), ek.scalar,
            this.registerForm.controls['alias'].value);
          gData.contact = d.contact;
        } else {
          await gData.attachAndEvolve(ek);
        }
      }
    } catch(e){
      Log.catch(e);
    }
    this.isRegistered = gData.contact.isRegistered();
    await gData.save();
    this.updateContactForm();
  }

  async createContact(){
    let ek = Private.fromRand();
    await gData.createUser(ek, "test")
  }

  async addContact(){}

  tabChanged(tabChangeEvent: MatTabChangeEvent) {
    switch (tabChangeEvent.index) {
      case 0:
        break;
      case 1:
        break;
      case 2:
        break;
      case 3:
        this.update().catch(e => Log.catch(e));
        break;
    }
  }

  async update() {
    this.nodes = [];
    let list = Defaults.Roster.list;
    let srpc = new StatusRPC(Defaults.Roster);
    for (let i = 0; i < list.length; i++) {
      let node = list[i].description;
      try {
        let s = await srpc.getStatus(i);
        node += ': OK - Port:' + JSON.stringify(s.status.Generic.field['Port']);
      } catch (e) {
        node += ': Failed';
      }
      this.nodes.push(node);
    }
    this.nodes.sort();
    await gData.bc.updateConfig();
    let skiprpc = new SkipchainRPC(gData.bc.getConfig().roster);
    let last = await skiprpc.getLatestBlock(gData.bc.genesisID);
    this.blockCount = last.index;
  }
}

export interface DialogData {
  animal: string;
  name: string;
}

@Component({
  selector: 'create-user',
  templateUrl: 'create-user.html',
})
export class CreateUser {

  constructor(
    public dialogRef: MatDialogRef<CreateUser>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData) {}

  onNoClick(): void {
    this.dialogRef.close();
  }

}
