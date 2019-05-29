import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { YourselfComponent } from "./yourself.component";

describe("YourselfComponent", () => {
  let component: YourselfComponent;
  let fixture: ComponentFixture<YourselfComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ YourselfComponent ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(YourselfComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
