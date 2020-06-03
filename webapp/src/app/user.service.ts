import { Injectable } from "@angular/core";
import { User } from "dynacred";
import { ByzCoinService } from "src/app/byz-coin.service";

@Injectable({
  providedIn: "root",
})
export class UserService extends User {

  constructor(bcs: ByzCoinService) {
    if (bcs.user === undefined) {
      throw new Error("cannot initialize with missing user!");
    }
    super(bcs.user.bc, bcs.user.db, bcs.user.kpp, bcs.user.dbBase, bcs.user.credStructBS,
        bcs.user.spawnerInstanceBS, bcs.user.coinBS, bcs.user.credSignerBS,
        bcs.user.addressBook, bcs.user.calypso);
  }
}

// @ts-ignore
global.UserService = UserService;
