import { TestBed } from '@angular/core/testing';

import { ReadCSVService } from './read-csv.service';

describe('ReadCSVService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ReadCSVService = TestBed.get(ReadCSVService);
    expect(service).toBeTruthy();
  });
});
