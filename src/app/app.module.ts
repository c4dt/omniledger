import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";

import { FlexLayoutModule } from "@angular/flex-layout";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatDialogModule } from "@angular/material";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { DemoMaterialModule } from "../material-module";
import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { LoadingComponent } from "./loading/loading.component";
import { RegisterComponent } from "./register/register.component";
import {
  AddContactComponent,
  ContactsComponent,
  CreateUserComponent,
  TransferCoinComponent,
} from "./user/contacts/contacts.component";
import { CalypsoUploadComponent, SecureComponent } from "./user/secure/secure.component";
import { StatusComponent } from "./user/status/status.component";
import { UserComponent } from "./user/user.component";
import { YourselfComponent } from "./user/yourself/yourself.component";

@NgModule({
  bootstrap: [AppComponent],
  declarations: [
        AppComponent,
        CreateUserComponent,
        AddContactComponent,
        TransferCoinComponent,
        CalypsoUploadComponent,
        RegisterComponent,
        YourselfComponent,
        ContactsComponent,
        SecureComponent,
        StatusComponent,
        LoadingComponent,
        UserComponent,
    ],
  entryComponents: [
    AddContactComponent,
    CreateUserComponent,
    TransferCoinComponent,
    CalypsoUploadComponent,
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
