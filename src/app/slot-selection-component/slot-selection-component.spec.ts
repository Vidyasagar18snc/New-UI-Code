import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SlotSelectionComponent } from './slot-selection-component';

describe('SlotSelectionComponent', () => {
  let component: SlotSelectionComponent;
  let fixture: ComponentFixture<SlotSelectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SlotSelectionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SlotSelectionComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
