import { NgModule } from "@angular/core";

import { FlexLayoutModule } from "@angular/flex-layout";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatDialogModule } from "@angular/material/dialog";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { QRCodeModule } from "angularx-qrcode";
import { DialogTransactionComponent } from "../lib/dialog-transaction";
import { DialogOKCancelComponent } from "../lib/Ui";
import { DemoMaterialModule } from "../material-module";
import { AdminComponent } from "./admin/admin.component";
import {
    AddContactComponent,
    ContactInfoComponent,
    ContactsComponent,
    CreateComponent,
    DarcInstanceAddComponent,
    SignupLinkComponent,
    TransferCoinComponent,
    UserCredComponent,
} from "./admin/contacts/contacts.component";
import {
    DeviceAddComponent,
    DeviceRecoveryComponent,
    DevicesComponent,
    } from "./admin/devices/devices.component";
import { ManageDarcComponent } from "./admin/manage-darc";
import { PersonhoodComponent } from "./admin/personhood/personhood.component";
import { StatusComponent } from "./admin/status/status.component";
import { YourselfComponent } from "./admin/yourself/yourself.component";
import { LoginComponent as CASLoginComponent } from "./api/v0/cas/login/login.component";
import { AppRoutingModule } from "./app-routing.module";
import { AppComponent, RetryLoadComponent } from "./app.component";
import { BcviewerComponent, ShowBlockComponent } from "./bcviewer/bcviewer.component";
import { C4dtComponent } from "./c4dt/c4dt.component";
import { PartnerComponent } from "./c4dt/partner/partner.component";
import { ProfileComponent } from "./c4dt/profile/profile.component";
import { WelcomeComponent } from "./c4dt/welcome/welcome.component";
import { CoinComponent } from "./explorer/coin/coin.component";
import { CredentialComponent } from "./explorer/credential/credential.component";
import { DarcComponent } from "./explorer/darc/darc.component";
import { ExplorerComponent } from "./explorer/explorer.component";
import { NewuserComponent } from "./newuser/newuser.component";
import { DeviceComponent } from "./register/device/device.component";
import { RegisterComponent } from "./register/register.component";
import {DarcInstanceInfoComponent, RenameComponent, ShowComponent} from "src/lib/show/show.component";

@NgModule({
    bootstrap: [AppComponent],
    declarations: [
        CreateComponent,
        AppComponent,
        SignupLinkComponent,
        ManageDarcComponent,
        DarcInstanceAddComponent,
        DarcInstanceInfoComponent,
        AddContactComponent,
        TransferCoinComponent,
        UserCredComponent,
        RetryLoadComponent,
        RegisterComponent,
        YourselfComponent,
        ContactsComponent,
        StatusComponent,
        ProfileComponent,
        AdminComponent,
        DialogOKCancelComponent,
        DialogTransactionComponent,
        BcviewerComponent,
        ShowBlockComponent,
        DevicesComponent,
        DeviceAddComponent,
        ShowComponent,
        RenameComponent,
        DeviceRecoveryComponent,
        DeviceComponent,
        C4dtComponent,
        NewuserComponent,
        PartnerComponent,
        CASLoginComponent,
        WelcomeComponent,
        PersonhoodComponent,
        ContactInfoComponent,
        CredentialComponent,
        DarcComponent,
        ExplorerComponent,
        CoinComponent,
    ],
    entryComponents: [
        ManageDarcComponent,
        DarcInstanceAddComponent,
        DarcInstanceInfoComponent,
        AddContactComponent,
        ContactInfoComponent,
        SignupLinkComponent,
        TransferCoinComponent,
        UserCredComponent,
        RetryLoadComponent,
        CreateComponent,
        DialogOKCancelComponent,
        DialogTransactionComponent,
        ShowBlockComponent,
        DeviceAddComponent,
        ShowComponent,
        RenameComponent,
        DeviceRecoveryComponent,
        CredentialComponent,
    ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        DemoMaterialModule,
        FormsModule,
        FlexLayoutModule,
        ReactiveFormsModule,
        MatDialogModule,
        AppRoutingModule,
        QRCodeModule,
    ],
})
export class AppModule {
}
