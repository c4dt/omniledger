import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { AdminComponent } from "./admin/admin.component";
import { ContactsComponent } from "./admin/contacts/contacts.component";
import { DevicesComponent } from "./admin/devices/devices.component";
import { StatusComponent } from "./admin/status/status.component";
import { YourselfComponent } from "./admin/yourself/yourself.component";
import { LoginComponent as CASLoginComponent } from "./api/v0/cas/login/login.component";
import { C4dtComponent } from "./c4dt/c4dt.component";
import { PartnerComponent } from "./c4dt/partner/partner.component";
import { ProfileComponent } from "./c4dt/profile/profile.component";
import { WelcomeComponent } from "./c4dt/welcome/welcome.component";
import { ExplorerComponent } from "./explorer/explorer.component";
import { NewuserComponent } from "./newuser/newuser.component";
import { DeviceComponent } from "./register/device/device.component";
import { RegisterComponent } from "./register/register.component";

const routes: Routes = [
    { path: "", redirectTo: "/c4dt", pathMatch: "full" },
    {
        // tslint:disable-next-line
        path: "register", children: [
            { path: "device", component: DeviceComponent },
            { path: "", component: RegisterComponent, pathMatch: "full" },
        ],
    },
    {
        // tslint:disable-next-line
        path: "admin", component: AdminComponent, children: [
            { path: "yourself", component: YourselfComponent },
            { path: "contacts", component: ContactsComponent },
            { path: "status", component: StatusComponent },
            { path: "devices", component: DevicesComponent },
            { path: "", redirectTo: "yourself", pathMatch: "full" },
        ],
    },
    {
        path: "user", redirectTo: "admin",
    },
    {
        // tslint:disable-next-line
        path: "newuser", component: NewuserComponent
    },
    {
        // tslint:disable-next-line
        path: "c4dt", component: C4dtComponent, children: [
            { path: "partner", component: PartnerComponent },
            { path: "profile", component: ProfileComponent },
            { path: "welcome", component: WelcomeComponent },
            { path: "devices", component: DevicesComponent },
            { path: "status", component: StatusComponent },
        ],
    },
    {
        // tslint:disable-next-line
        path: "api/v0", children: [
            { path: "cas/login", component: CASLoginComponent },
        ],
    },
    {
        // tslint:disable-next-line
        path: "explorer/:id", component: ExplorerComponent
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
