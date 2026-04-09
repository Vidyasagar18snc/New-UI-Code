import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Jdcomponent } from './jdcomponent';

describe('Jdcomponent', () => {
  let component: Jdcomponent;
  let fixture: ComponentFixture<Jdcomponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Jdcomponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Jdcomponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
