import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OfferResponseComponent } from './offer-response-component';

describe('OfferResponseComponent', () => {
  let component: OfferResponseComponent;
  let fixture: ComponentFixture<OfferResponseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OfferResponseComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OfferResponseComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
