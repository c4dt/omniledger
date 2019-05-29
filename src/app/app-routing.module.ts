import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { C4dtComponent } from "./c4dt/c4dt.component";
import { NewuserComponent } from "./c4dt/newuser/newuser.component";
import { LoadingComponent } from "./loading/loading.component";
import { DeviceComponent } from "./register/device/device.component";
import { RegisterComponent } from "./register/register.component";
import { ContactsComponent } from "./user/contacts/contacts.component";
import { DevicesComponent } from "./user/devices/devices.component";
import { SecureComponent } from "./user/secure/secure.component";
import { StatusComponent } from "./user/status/status.component";
import { UserComponent } from "./user/user.component";
import { YourselfComponent } from "./user/yourself/yourself.component";

const routes: Routes = [
    {path: "", redirectTo: "/loading", pathMatch: "full"},
    {path: "loading", component: LoadingComponent},
    {
        // tslint:disable-next-line
        path: "register", children: [
            {path: "device", component: DeviceComponent},
            {path: "", component: RegisterComponent, pathMatch: "full"},
        ],
    },
    {
        // tslint:disable-next-line
        path: "user", component: UserComponent, children: [
            {path: "yourself", component: YourselfComponent},
            {path: "contacts", component: ContactsComponent},
            {path: "secure", component: SecureComponent},
            {path: "status", component: StatusComponent},
            {path: "devices", component: DevicesComponent},
            {path: "", redirectTo: "yourself", pathMatch: "full"},
        ],
    },
    {
        // tslint:disable-next-line
        path: "c4dt", component: C4dtComponent, children: [
            {path: "newuser", component: NewuserComponent},
            {path: "partner", component: ContactsComponent},
            {path: "user", component: UserComponent},
        ],
    },
];

@NgModule({
    declarations: [],
    exports: [RouterModule],
    imports: [
        RouterModule.forRoot(routes),
        CommonModule,
    ],
})
export class AppRoutingModule {
}
