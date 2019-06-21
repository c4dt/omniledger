import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { AdminComponent } from "./admin/admin.component";
import { ContactsComponent } from "./admin/contacts/contacts.component";
import { DevicesComponent } from "./admin/devices/devices.component";
import { SecureComponent } from "./admin/secure/secure.component";
import { StatusComponent } from "./admin/status/status.component";
import { YourselfComponent } from "./admin/yourself/yourself.component";
import { LoginComponent } from "./api/v0/cas/login/login.component";
import { C4dtComponent } from "./c4dt/c4dt.component";
import { NewuserComponent } from "./c4dt/newuser/newuser.component";
import { PartnerComponent } from "./c4dt/partner/partner.component";
import { ProfileComponent } from "./c4dt/profile/profile.component";
import { WelcomeComponent } from "./c4dt/welcome/welcome.component";
import { LoadingComponent } from "./loading/loading.component";
import { DeviceComponent } from "./register/device/device.component";
import { RegisterComponent } from "./register/register.component";

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
        path: "admin", component: AdminComponent, children: [
            {path: "yourself", component: YourselfComponent},
            {path: "contacts", component: ContactsComponent},
            {path: "secure", component: SecureComponent},
            {path: "status", component: StatusComponent},
            {path: "devices", component: DevicesComponent},
            {path: "", redirectTo: "yourself", pathMatch: "full"},
        ],
    },
    {
        path: "user", redirectTo: "admin",
    },
    {
        // tslint:disable-next-line
        path: "c4dt", component: C4dtComponent, children: [
            {path: "newuser", component: NewuserComponent},
            {path: "partner", component: PartnerComponent},
            {path: "profile", component: ProfileComponent},
            {path: "welcome", component: WelcomeComponent},
            {path: "devices", component: DevicesComponent},
            {path: "status", component: StatusComponent},
        ],
    },
    {
        // tslint:disable-next-line
        path: "api", component: C4dtComponent, children: [
            // tslint:disable-next-line
            {path: "v0/cas/login", component: LoginComponent},
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
