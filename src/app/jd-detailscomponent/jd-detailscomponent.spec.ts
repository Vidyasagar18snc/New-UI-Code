import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JdDetailscomponent } from './jd-detailscomponent';

describe('JdDetailscomponent', () => {
  let component: JdDetailscomponent;
  let fixture: ComponentFixture<JdDetailscomponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JdDetailscomponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JdDetailscomponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
