import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeAssetTrackingComponent } from './employee-asset-tracking-component';

describe('EmployeeAssetTrackingComponent', () => {
  let component: EmployeeAssetTrackingComponent;
  let fixture: ComponentFixture<EmployeeAssetTrackingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeAssetTrackingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmployeeAssetTrackingComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
