import { Component, OnInit } from '@angular/core';
import * as mapboxgl from 'mapbox-gl';
import { ReadCSVService } from '../services/read-csv.service';
import { ReadGeojsonService } from '../services/read-geojson.service';

@Component({
  selector: 'app-transport-map',
  templateUrl: './transport-map.component.html',
  styleUrls: ['./transport-map.component.css']
})
export class TransportMapComponent implements OnInit {

  //Variables
  public map: any;
  public CSV_TARGET_FILE: string = '../../assets/BCC_sensors.csv';
  public NETWORK_TARGET_FILE: string = '../../assets/13_09_2019_latest.json';
  public ID_List: Array<any> = [];
  //Variables from template
  public __selectedOrigin: string = '';
  public __selectedDestination: string = '';
  public __minDate: string = '';
  public __maxDate: string = '';
  public __selectedDate: string = '';
  public __startTime: string = '';
  public __endTime: string = '';

  constructor(public _readCSVService: ReadCSVService, public _readGeojsonService: ReadGeojsonService) { }

  ngOnInit() {
    Object.getOwnPropertyDescriptor(mapboxgl, "accessToken").set('pk.eyJ1IjoicGF2YW50ZWphOTAiLCJhIjoiY2p6eXl6ZzhiMDV3cDNvcDd6Nmd3bWtmNyJ9.Q7ZMA251fPPlfRenu1V-Gg');
    this.map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/dark-v10',
      center: [153.0294284, -27.469861],
      zoom: 11.50
    });
    let scope = this;
    this.map.on('load', function () {
      scope.map.on('click', 'bcc_sensors', function (e) {
        var coordinates = e.features[0].geometry['coordinates'].slice();
        var description = e.features[0].properties.description;
        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
          coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }

        new mapboxgl.Popup()
          .setLngLat(coordinates)
          .setHTML(description)
          .addTo(scope.map);
      });

      scope.map.on('mouseenter', 'bcc_sensors', function () {
        scope.map.getCanvas().style.cursor = 'pointer';
      });

      scope.map.on('mouseleave', 'bcc_sensors', function () {
        scope.map.getCanvas().style.cursor = '';
      });

      // scope.map.on("styleimagemissing", e => {
      //   console.log("loading missing image: " + e.id);
      //   if (
      //     e.id === "circle-11" ||
      //     e.id === "triangle-stroked-11" ||
      //     e.id == "circle-stroked-11"
      //   ) {
      //     scope.map.loadImage(e.id + ".png", (error, image) => {
      //       if (error) throw error;
      //       if (!scope.map.hasImage(e.id)) scope.map.addImage(e.id, image);
      //     });
      //   }
      // });
      // scope.map.on('mouseenter', 'boundary', function () {
      //   scope.map.getCanvas().style.cursor = 'pointer';
      // });

      // scope.map.on('mouseleave', 'boundary', function () {
      //   scope.map.getCanvas().style.cursor = '';
      // });
    });
    this.getCSV();
  }

  getCSV() {
    let csv_file;
    this._readCSVService.readCSV(this.CSV_TARGET_FILE)
      .subscribe(resp => {
        csv_file = resp
        this.convertCSVtoJSON(csv_file);
      }, error => {
        console.log(error);
      });
  }

  convertCSVtoJSON(_csvFile: any) {
    var lines = _csvFile.split("\n");
    var result = [];
    var headers = lines[0].split(",");
    for (var i = 1; i < lines.length; i++) {
      var obj = {};
      var currentline = lines[i].split(",");
      for (var j = 0; j < headers.length; j++) {
        obj[headers[j]] = currentline[j];
      }
      this.ID_List.push(obj['BMS-ID'])
      result.push(obj);
    }
    let bcc_json = result;
    this.addBCCLayerToMap(bcc_json);
  }

  addBCCLayerToMap(bcc_json: any) {
    let __geoJSON = this.generatePointMap(bcc_json);
    setTimeout(() => {
      this.map.addLayer(__geoJSON);
      this.addNetwork();
      // This is the base layer that is added to check whether we can add shapefile to the map 
      // this.map.addLayer({
      //   'id': 'bne_roads',
      //   'type': 'line',
      //   'source': {
      //     type: 'vector',
      //     url: 'mapbox://pavanteja90.dgc5wxjs'
      //   },
      //   'source-layer': 'network_28_06_2019-6q1aq6',
      //   "layout": {
      //     "line-join": "round",
      //     "line-cap": "round"
      //   },
      //   'paint': {
      //     "line-color": "#ff69b4",
      //     "line-width": 1
      //   }
      // })
    }, 1000);
  }

  generatePointMap(data: any) {
    let __respJSON = {
      "id": "bcc_sensors",
      "type": "symbol",
      "source": {
        "type": "geojson",
        "data": {
          "type": "FeatureCollection",
          "features": []
        }
      },
      "layout": {
        "icon-image": "{icon}-11",
        "icon-allow-overlap": true
      }
    }

    data.forEach(__e => {
      let __feature = this.generatePointFeature(__e)
      if (__feature) __respJSON.source.data.features.push(__feature);
    })

    return __respJSON;
  }

  generatePointFeature(__row: any): any {
    let __lat = __row['Y'];
    let __lng = __row['X'];
    let __desc = '<p>ID: ' + __row['BMS-ID'] + '</p> <p>Lat: ' + __row['Y'] + '</p> <p>Lng: ' + __row['X'] + '</p>';
    if (__lat == undefined && __lng == undefined) return;
    let coordinates = [parseFloat(__lng), parseFloat(__lat)];
    if (coordinates[0] == null && coordinates[1] == null) return;
    let __feature = {
      "type": "Feature",
      "properties": {
        "description": __desc,
        "icon": "car"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [coordinates[0], coordinates[1]]
      }
    }
    return __feature;
  }

  addNetwork() {
    this._readGeojsonService.readGeoJson(this.NETWORK_TARGET_FILE)
      .subscribe(resp => {
        this.addNetworkLayer(resp);
      }, error => {
        console.log(error);
      })
  }

  addNetworkLayer(geojson: any) {
    this.map.addLayer({
      "id": "bcc_network",
      "type": "line",
      "source": {
        "type": "geojson",
        "data": geojson
      },
      "layout": {
        "line-join": "round",
        "line-cap": "round"
      },
      'paint': {
        "line-color": "#ff69b4",
        "line-width": 1
      }
    });
  }

  dateChanged(value: string) {

  }

  submitForm() {

  }
}
