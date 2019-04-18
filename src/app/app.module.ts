import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {AddContactComponent, AppComponent, CreateUserComponent, TransferCoinComponent} from './app.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {DemoMaterialModule} from '../material-module';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {FlexLayoutModule} from '@angular/flex-layout';
import {MatDialogModule} from '@angular/material';

@NgModule({
    declarations: [
        AppComponent,
        CreateUserComponent,
        AddContactComponent,
        TransferCoinComponent,
    ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        DemoMaterialModule,
        FormsModule,
        FlexLayoutModule,
        ReactiveFormsModule,
        MatDialogModule
    ],
    entryComponents: [
        AddContactComponent,
        CreateUserComponent,
        TransferCoinComponent
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule {
}
