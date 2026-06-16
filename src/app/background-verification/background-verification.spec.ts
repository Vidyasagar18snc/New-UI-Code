import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BackgroundVerification } from './background-verification';

describe('BackgroundVerification', () => {
  let component: BackgroundVerification;
  let fixture: ComponentFixture<BackgroundVerification>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BackgroundVerification]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BackgroundVerification);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
