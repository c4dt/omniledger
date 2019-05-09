import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { LoadingComponent } from "./loading/loading.component";
import { RegisterComponent } from "./register/register.component";
import { ContactsComponent } from "./user/contacts/contacts.component";
import { SecureComponent } from "./user/secure/secure.component";
import { StatusComponent } from "./user/status/status.component";
import { UserComponent } from "./user/user.component";
import { YourselfComponent } from "./user/yourself/yourself.component";

const routes: Routes = [
  {path: "", redirectTo: "/loading", pathMatch: "full"},
  {path: "loading", component: LoadingComponent},
  {path: "register", component: RegisterComponent},
  {
    // tslint:disable-next-line
    path: "user", component: UserComponent, children: [
      {path: "yourself", component: YourselfComponent},
      {path: "contacts", component: ContactsComponent},
      {path: "secure", component: SecureComponent},
      {path: "status", component: StatusComponent},
      {path: "", redirectTo: "yourself", pathMatch: "full"},
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
