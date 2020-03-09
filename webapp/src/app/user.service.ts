import { Injectable } from '@angular/core';
import {ByzCoinService} from "src/app/byz-coin.service";
import {User} from "observable_dynacred";

@Injectable({
  providedIn: 'root'
})
export class UserService extends User {

  constructor(bcs: ByzCoinService) {
    if (bcs.user === undefined){
      throw new Error("cannot initialize with missing user!");
    }
    super(bcs.user);
  }
}

// @ts-ignore
global.UserService = UserService;
