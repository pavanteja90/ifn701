import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

//Required modules for angular material animations
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

//Required module for timepicker
import { NgxMaterialTimepickerModule } from "ngx-material-timepicker";

//Required Material components
import { ReqMatModule } from "./app.material.module";

//Components
import { TransportMapComponent } from './transport-map/transport-map.component';
import { LoadingComponent } from './loading/loading.component';

//Services
import { ReadCSVService } from './services/read-csv.service';
import { ReadGeojsonService } from './services/read-geojson.service';

import { HashLocationStrategy, LocationStrategy } from '@angular/common';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS, MatIconModule } from '@angular/material';

@NgModule({
  declarations: [
    AppComponent,
    TransportMapComponent,
    LoadingComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    BrowserAnimationsModule,
    ReqMatModule,
    NgxMaterialTimepickerModule
  ],
  providers: [ReadCSVService, ReadGeojsonService, { provide: LocationStrategy, useClass: HashLocationStrategy }, { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { appearance: 'outline' } }],
  bootstrap: [AppComponent]
})
export class AppModule { }
