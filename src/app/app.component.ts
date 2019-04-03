import {Component} from '@angular/core';
import {Defaults} from '../lib/Defaults';
import StatusRPC from '../lib/cothority/status/status-rpc';
import {Log} from '../lib/Log';
import {Data, gData} from '../lib/Data';
import {MatTabChangeEvent} from '@angular/material';
import {FormControl, FormGroup, Validators} from '@angular/forms';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Welcome to DynaSent';
  nodes = [];
  gData: Data;
  idForm: FormGroup;

  constructor() {
    this.idForm = new FormGroup({
      accountRequest: new FormControl('account request', Validators.required),
    });

    gData.load().then(()=>{
      this.gData = gData;
      Log.print(gData.contact);
    }).catch(e => {
      Log.catch(e);
    })
  }

  addID(event: Event) {
    event.preventDefault();
    Log.print(this.idForm.controls['accountRequest'].value);
  }

  tabChanged(tabChangeEvent: MatTabChangeEvent){
    switch(tabChangeEvent.index){
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

  async update(){
    Log.print("updating status of roster");
    this.nodes = [];
    let list = Defaults.Roster.list;
    let srpc = new StatusRPC(Defaults.Roster);
    for (let i = 0; i < list.length; i++) {
      let node = list[i].description;
      try {
        let s = await srpc.getStatus(i);
        node += ": OK - Port:" + JSON.stringify(s.status.Generic.field["Port"]);
      } catch (e) {
        node += ": Failed";
      }
      this.nodes.push(node);
    }
    this.nodes.sort();
  }


}
