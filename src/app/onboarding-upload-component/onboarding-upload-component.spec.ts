import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OnboardingUploadComponent } from './onboarding-upload-component';

describe('OnboardingUploadComponent', () => {
  let component: OnboardingUploadComponent;
  let fixture: ComponentFixture<OnboardingUploadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OnboardingUploadComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OnboardingUploadComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
