import { NgModule } from "@angular/core";

import { FlexLayoutModule } from "@angular/flex-layout";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatDialogModule } from "@angular/material";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { DialogOKCancelComponent } from "../lib/ui/Ui";
import { DemoMaterialModule } from "../material-module";
import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { BcviewerComponent, BcviewerService, ShowBlockComponent } from "./bcviewer/bcviewer.component";
import { LoadingComponent } from "./loading/loading.component";
import { RegisterComponent } from "./register/register.component";
import {
    AddContactComponent,
    ContactsComponent, CreateComponent,
    CreateUserComponent,
    TransferCoinComponent,
    UserCredComponent,
} from "./user/contacts/contacts.component";
import { ManageDarcComponent } from "./user/manage-darc";
import { CalypsoShowAccessComponent, CalypsoUploadComponent, SecureComponent } from "./user/secure/secure.component";
import { StatusComponent } from "./user/status/status.component";
import { RetryLoadComponent, UserComponent } from "./user/user.component";
import { YourselfComponent } from "./user/yourself/yourself.component";

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
        DialogOKCancelComponent,
        BcviewerComponent,
        ShowBlockComponent,
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
