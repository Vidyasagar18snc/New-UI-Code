import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PanelManagement } from './panel-management';

describe('PanelManagement', () => {
  let component: PanelManagement;
  let fixture: ComponentFixture<PanelManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PanelManagement]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PanelManagement);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
