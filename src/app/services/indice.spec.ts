import { TestBed } from '@angular/core/testing';

import { Indice } from './indice';

describe('Indice', () => {
  let service: Indice;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Indice);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
