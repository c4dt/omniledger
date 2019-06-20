import { NgModule } from "@angular/core";

import { FlexLayoutModule } from "@angular/flex-layout";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatDialogModule } from "@angular/material";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { DialogOKCancelComponent } from "../lib/Ui";
import { DemoMaterialModule } from "../material-module";
import { AdminComponent, RetryLoadComponent } from "./admin/admin.component";
import {
    AddContactComponent,
    ContactsComponent, CreateComponent,
    CreateUserComponent,
    TransferCoinComponent,
    UserCredComponent,
} from "./admin/contacts/contacts.component";
import { DeviceAddComponent, DevicesComponent, DeviceShowComponent } from "./admin/devices/devices.component";
import { ManageDarcComponent } from "./admin/manage-darc";
import { CalypsoShowAccessComponent, CalypsoUploadComponent, SecureComponent } from "./admin/secure/secure.component";
import { StatusComponent } from "./admin/status/status.component";
import { YourselfComponent } from "./admin/yourself/yourself.component";
import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { BcviewerComponent, BcviewerService, ShowBlockComponent } from "./bcviewer/bcviewer.component";
import { C4dtComponent } from "./c4dt/c4dt.component";
import { NewuserComponent } from "./c4dt/newuser/newuser.component";
import { PartnerComponent } from "./c4dt/partner/partner.component";
import { UserComponent } from "./c4dt/user/user.component";
import { LoadingComponent } from "./loading/loading.component";
import { DeviceComponent } from "./register/device/device.component";
import { RegisterComponent } from "./register/register.component";
import { LoginComponent } from "./api/v0/cas/login/login.component";

@NgModule({
    bootstrap: [AppComponent],
    declarations: [
        CreateComponent,
        AppComponent,
        CreateUserComponent,
        ManageDarcComponent,
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
        LoadingComponent,
        UserComponent,
        AdminComponent,
        DialogOKCancelComponent,
        BcviewerComponent,
        ShowBlockComponent,
        DevicesComponent,
        DeviceAddComponent,
        DeviceShowComponent,
        DeviceComponent,
        C4dtComponent,
        NewuserComponent,
        PartnerComponent,
        LoginComponent,
    ],
    entryComponents: [
        ManageDarcComponent,
        AddContactComponent,
        CreateUserComponent,
        TransferCoinComponent,
        UserCredComponent,
        CalypsoUploadComponent,
        CalypsoShowAccessComponent,
        RetryLoadComponent,
        CreateComponent,
        DialogOKCancelComponent,
        ShowBlockComponent,
        DeviceAddComponent,
        DeviceShowComponent,
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
    ],
    providers: [],
})
export class AppModule {
}
