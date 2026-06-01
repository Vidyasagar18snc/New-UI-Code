import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Blanklayout } from './blanklayout';

describe('Blanklayout', () => {
  let component: Blanklayout;
  let fixture: ComponentFixture<Blanklayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Blanklayout]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Blanklayout);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
