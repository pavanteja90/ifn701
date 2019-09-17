import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReadCSVService {

  constructor(public _http: HttpClient) { }

  readCSV(fileLocation: string): Observable<any> {
    return this._http.get(fileLocation, {responseType: 'text'});
  }
}
