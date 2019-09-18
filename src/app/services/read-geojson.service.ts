import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs/internal/Observable';

@Injectable({
  providedIn: 'root'
})
export class ReadGeojsonService {
  
  public _headers: any;
  constructor(public _http: HttpClient) { 
    this._headers = new Headers({'Content-Type': 'application/json'})
  }

  readGeoJson(path: string):Observable<any> {
    return this._http.get(path, this._headers)
  }

}