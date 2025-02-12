import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NutrientsComponent } from './nutrients.component';

describe('NutrientsComponent', () => {
  let component: NutrientsComponent;
  let fixture: ComponentFixture<NutrientsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NutrientsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NutrientsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
