import { Component, Inject } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { byzcoin } from "dynacred";

@Component({
    selector: "show",
    templateUrl: "show.html",
})
export class ShowComponent {
    constructor(
        public dialogRef: MatDialogRef<ShowComponent>,
        @Inject(MAT_DIALOG_DATA) public data: string) {
    }
}

interface IDeviceType {
    typeStr: string;
    name: string;
}

@Component({
    selector: "rename",
    templateUrl: "rename.html",
})
export class RenameComponent {
    origName: string;

    constructor(
        public dialogRef: MatDialogRef<RenameComponent>,
        @Inject(MAT_DIALOG_DATA) public data: IDeviceType) {
        this.origName = data.name;
    }
}

@Component({
    selector: "app-show-darcinstance",
    templateUrl: "show-darcinstance.html",
})
export class DarcInstanceInfoComponent {
    constructor(
        public dialogRef: MatDialogRef<DarcInstanceInfoComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { inst: byzcoin.DarcBS }) {
    }
}
