import { TestBed } from '@angular/core/testing';

import { ReadGeojsonService } from './read-geojson.service';

describe('ReadGeojsonService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ReadGeojsonService = TestBed.get(ReadGeojsonService);
    expect(service).toBeTruthy();
  });
});
