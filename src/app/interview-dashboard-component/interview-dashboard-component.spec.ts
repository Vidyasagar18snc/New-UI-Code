import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InterviewDashboardComponent } from './interview-dashboard-component';

describe('InterviewDashboardComponent', () => {
  let component: InterviewDashboardComponent;
  let fixture: ComponentFixture<InterviewDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InterviewDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InterviewDashboardComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
