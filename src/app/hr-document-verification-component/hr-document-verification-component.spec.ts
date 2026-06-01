import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HrDocumentVerificationComponent } from './hr-document-verification-component';

describe('HrDocumentVerificationComponent', () => {
  let component: HrDocumentVerificationComponent;
  let fixture: ComponentFixture<HrDocumentVerificationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HrDocumentVerificationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HrDocumentVerificationComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
