import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RankComponent } from './rank-component';

describe('RankComponent', () => {
  let component: RankComponent;
  let fixture: ComponentFixture<RankComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RankComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RankComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
