import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormAtualizacao } from './form-atualizacao';

describe('FormAtualizacao', () => {
  let component: FormAtualizacao;
  let fixture: ComponentFixture<FormAtualizacao>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormAtualizacao]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormAtualizacao);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
