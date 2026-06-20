import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppIdeaComponent } from './app-idea.component';

describe('AppIdeaComponent', () => {
  let component: AppIdeaComponent;
  let fixture: ComponentFixture<AppIdeaComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AppIdeaComponent]
    });
    fixture = TestBed.createComponent(AppIdeaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
