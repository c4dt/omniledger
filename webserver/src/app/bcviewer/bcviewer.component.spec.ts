import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { BcviewerComponent } from "./bcviewer.component";

describe("BcviewerComponent", () => {
  let component: BcviewerComponent;
  let fixture: ComponentFixture<BcviewerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BcviewerComponent ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BcviewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
