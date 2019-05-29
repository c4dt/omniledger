import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { C4dtComponent } from './c4dt.component';

describe('C4dtComponent', () => {
  let component: C4dtComponent;
  let fixture: ComponentFixture<C4dtComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ C4dtComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(C4dtComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
