import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Sidebarcomponent } from './sidebarcomponent';

describe('Sidebarcomponent', () => {
  let component: Sidebarcomponent;
  let fixture: ComponentFixture<Sidebarcomponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Sidebarcomponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Sidebarcomponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
