import { Injectable } from '@angular/core';
import {ByzCoinService} from "src/app/byz-coin.service";
import {User} from "dynacred2";

@Injectable({
  providedIn: 'root'
})
export class UserService extends User {

  constructor(bcs: ByzCoinService) {
    if (bcs.user === undefined){
      throw new Error("cannot initialize with missing user!");
    }
    super(bcs.user.bc, bcs.user.db, bcs.user.kpp, bcs.user.dbBase, bcs.user.credStructBS,
        bcs.user.spawnerInstanceBS, bcs.user.coinBS, bcs.user.credSignerBS,
        bcs.user.addressBook);
  }
}

// @ts-ignore
global.UserService = UserService;
