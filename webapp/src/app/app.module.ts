import { APP_INITIALIZER, NgModule } from "@angular/core";

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
    DarcInstanceInfoComponent,
    SignupLinkComponent,
    TransferCoinComponent,
    UserCredComponent,
} from "./admin/contacts/contacts.component";
import {
    DeviceAddComponent,
    DeviceRecoveryComponent,
    DevicesComponent,
    DeviceShowComponent,
} from "./admin/devices/devices.component";
import { ManageDarcComponent } from "./admin/manage-darc";
import { PersonhoodComponent } from "./admin/personhood/personhood.component";
import { CalypsoShowAccessComponent, CalypsoUploadComponent, SecureComponent } from "./admin/secure/secure.component";
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
import { NewuserComponent } from "./newuser/newuser.component";
import { DeviceComponent } from "./register/device/device.component";
import { RegisterComponent } from "./register/register.component";
import { UserData } from "./user-data.service";

// This is empty as the UserData is now initialized in the
// app.component, so that the success can be logged.
export function loadUserDataConfig(d: UserData) {
    return () => {};
}

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
        CalypsoUploadComponent,
        CalypsoShowAccessComponent,
        RetryLoadComponent,
        RegisterComponent,
        YourselfComponent,
        ContactsComponent,
        SecureComponent,
        StatusComponent,
        ProfileComponent,
        AdminComponent,
        DialogOKCancelComponent,
        DialogTransactionComponent,
        BcviewerComponent,
        ShowBlockComponent,
        DevicesComponent,
        DeviceAddComponent,
        DeviceShowComponent,
        DeviceRecoveryComponent,
        DeviceComponent,
        C4dtComponent,
        NewuserComponent,
        PartnerComponent,
        CASLoginComponent,
        WelcomeComponent,
        PersonhoodComponent,
        ContactInfoComponent,
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
        CalypsoUploadComponent,
        CalypsoShowAccessComponent,
        RetryLoadComponent,
        CreateComponent,
        DialogOKCancelComponent,
        DialogTransactionComponent,
        ShowBlockComponent,
        DeviceAddComponent,
        DeviceShowComponent,
        DeviceRecoveryComponent,
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
    providers: [
        UserData,
        {
            deps: [UserData],
            multi: true,
            provide: APP_INITIALIZER,
            useFactory: loadUserDataConfig,
        },
    ],
})
export class AppModule {
}
