import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Layoutcomponent } from './layoutcomponent';

describe('Layoutcomponent', () => {
  let component: Layoutcomponent;
  let fixture: ComponentFixture<Layoutcomponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Layoutcomponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Layoutcomponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
