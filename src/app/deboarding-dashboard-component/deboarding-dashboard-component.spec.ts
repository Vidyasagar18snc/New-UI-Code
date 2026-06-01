import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeboardingDashboardComponent } from './deboarding-dashboard-component';

describe('DeboardingDashboardComponent', () => {
  let component: DeboardingDashboardComponent;
  let fixture: ComponentFixture<DeboardingDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeboardingDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeboardingDashboardComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
