import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BudgetBookComponent } from './budget-book.component';

describe('BudgetBookComponent', () => {
  let component: BudgetBookComponent;
  let fixture: ComponentFixture<BudgetBookComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [BudgetBookComponent]
    });
    fixture = TestBed.createComponent(BudgetBookComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
