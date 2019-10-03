import { Component, OnInit } from '@angular/core';
import * as mapboxgl from 'mapbox-gl';
import { ReadCSVService } from '../services/read-csv.service';
import { ReadGeojsonService } from '../services/read-geojson.service';
import { MatSnackBar } from '@angular/material';

declare var $: any;

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
  public TRAJECTORY_FILE: string = '../../assets/Trajectory_sample.csv';
  public ID_List: Array<any> = [];
  public Origin_ID_List: Array<any> = [];
  public Destination_ID_List: Array<any> = [];
  public trajectories: Array<any> = []; //List of available trajectories
  //Variables from template
  public __selectedOrigin: string = '';
  public __selectedDestination: string = '';
  public __minDate: string = '';
  public __maxDate: string = '';
  public __selectedDate: string = '';
  public __startTime: string = '';
  public __endTime: string = '';
  public __bccjson: any; //List of BCC sensors across brisbane
  public __networkGeoJson: any; //Geojson of available network
  public __featureList: Array<any> = []; //List of features
  public __colorCodes: any = {
    "blue": '#A1C4FD',
    "yellow": '#FFDD00',
    "orange": '#F53803',
    "red": '#FF0000'
  }
  public __highestWeight: number = 0;

  constructor(public _readCSVService: ReadCSVService, public _readGeojsonService: ReadGeojsonService, public _snackBar: MatSnackBar) { }

  ngOnInit() {
    Object.getOwnPropertyDescriptor(mapboxgl, "accessToken").set('pk.eyJ1IjoicGF2YW50ZWphOTAiLCJhIjoiY2p6eXl6ZzhiMDV3cDNvcDd6Nmd3bWtmNyJ9.Q7ZMA251fPPlfRenu1V-Gg');
    this.map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/dark-v10',
      center: [153.0294284, -27.469861],
      zoom: 10.40
    });
    let scope = this;
    this.map.on('load', function () {
      scope.map.on('click', 'bcc_sensors', function (e: any) {
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

      scope.map.on('click', 'bcc_network', function (e: any) {
        var length = Math.floor(parseInt(e.features[0].geometry['coordinates'].length) / 2);
        var coordinates = e.features[0].geometry['coordinates'][length].slice();
        var description = scope.createDesc(e);
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

      scope.map.on('mouseenter', 'bcc_network', function () {
        scope.map.getCanvas().style.cursor = 'pointer';
      });

      scope.map.on('mouseleave', 'bcc_network', function () {
        scope.map.getCanvas().style.cursor = '';
      });

      scope.map.addControl(new mapboxgl.NavigationControl());
    });
    this.getTrajectory();
  }

  createDesc(e: any): string {
    if (e.features[0].properties.weight) {
      return '<p>Weight: ' + e.features[0].properties.weight + '<br>BTLink ID: ' + e.features[0].properties.Btlinkid + '</p>';
    }
    return '<p>BTLink ID: ' + e.features[0].properties.Btlinkid + '</p>';
  }

  getTrajectory() {
    this.loading(true);
    this._readCSVService.readCSV(this.TRAJECTORY_FILE)
      .subscribe(resp => {
        this.setOriginDestination(resp);
        this.getCSV();
      }, error => {
        console.log(error);
        setTimeout(() => {
          this.loading(false);
        }, 1000);;
        this.showSnackbar(error, 'Close');
      });
  }

  setOriginDestination(resp: any) {
    this.convertCSVtoJSON_Trajectory(resp)
  }

  convertCSVtoJSON_Trajectory(_csvFile: any) {
    let lines = _csvFile.split("\n");
    let headers = lines[0].split(",");
    let result = []
    for (let i = 1; i < lines.length; i++) {
      let obj = {}
      let currentLine = lines[i].split('"');
      let initial = currentLine[0].split(',');
      initial = initial.slice(0, initial.length - 1)
      let middle = currentLine[1];
      let final = currentLine[2].split(',');
      final = final.slice(1, final.length)
      currentLine = [...initial, JSON.parse(middle), ...final];
      for (let j = 0; j < headers.length; j++) {
        obj[headers[j]] = currentLine[j];
      }
      if (obj['origin'] && (this.Origin_ID_List.find(x => x == obj['origin']) == undefined)) {
        this.Origin_ID_List.push(obj['origin'])
      }
      if (obj['destination'] && (this.Destination_ID_List.find(x => x == obj['destination']) == undefined)) {
        this.Destination_ID_List.push(obj['destination'])
      }
      result.push(obj);
    }
    this.trajectories = result;
  }

  getCSV() {
    let csv_file: any;
    this._readCSVService.readCSV(this.CSV_TARGET_FILE)
      .subscribe(resp => {
        csv_file = resp
        this.convertCSVtoJSON_BMS(csv_file);
        setTimeout(() => {
          this.loading(false);
        }, 1000);
      }, error => {
        console.log(error);
        this.showSnackbar(error, 'Close');
        setTimeout(() => {
          this.loading(false);
        }, 1000);;
      });
  }

  convertCSVtoJSON_BMS(_csvFile: any) {
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
    this.__bccjson = bcc_json;
    this.addBCCLayerToMap(bcc_json);
  }

  addBCCLayerToMap(bcc_json: any, addNetwork: boolean = true) {
    let __geoJSON = this.generatePointMap(bcc_json);
    setTimeout(() => {
      this.map.addLayer(__geoJSON);
      if (addNetwork)
        this.addNetwork();
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

    data.forEach((__e: any) => {
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
        "icon": "dot",
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
        this.__networkGeoJson = resp;
      }, error => {
        console.log(error);
        this.showSnackbar(error, 'Close');
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
      "paint": {
        "line-color": ['get', 'color'],
        "line-width": 5
      }
    });
  }

  dateChanged(value: string) {

  }

  radioChanged(event: any) {
    console.log(event);
  }

  submitForm() {
    if (this.checkFilters())
      this.renderMap();
    else
      this.showSnackbar('Please select origin and destination', 'Close');
  }

  checkFilters(): boolean {
    if (this.__selectedOrigin && this.__selectedDestination)
      return true;
    else
      return false;
  }

  switchLayer(layer: { value: any; }) {
    var layerId = layer.value;
    if (this.map.getLayer('bcc_sensors'))
      this.map.removeLayer('bcc_sensors');
    if (this.map.getSource('bcc_sensors'))
      this.map.removeSource('bcc_sensors');
    if (this.map.getLayer('bcc_network'))
      this.map.removeLayer('bcc_network');
    if (this.map.getSource('bcc_network'))
      this.map.removeSource('bcc_network');
    this.map.setStyle('mapbox://styles/mapbox/' + layerId);
    this.getTrajectory();
  }

  renderMap() {
    if (this.map.getLayer('bcc_sensors'))
      this.map.removeLayer('bcc_sensors');
    if (this.map.getSource('bcc_sensors'))
      this.map.removeSource('bcc_sensors');
    if (this.map.getLayer('bcc_network'))
      this.map.removeLayer('bcc_network');
    if (this.map.getSource('bcc_network'))
      this.map.removeSource('bcc_network');
    console.log("This is GeoJSOn available for the current network");
    console.log(this.__networkGeoJson);
    console.log("These are the trajectories available for the current network");
    console.log(this.trajectories);
    console.log("These are the BCC points of the system");
    console.log(this.__bccjson);
    this.mapRequiredBTSensors();
  }

  mapRequiredBTSensors() {
    let requiredBTSensors = [];
    this.trajectories.forEach(item => {
      item['Path'].forEach((el: any) => {
        if (requiredBTSensors.find(x => x == el) == undefined)
          requiredBTSensors.push(el);
      });
    });
    let requiredBccJson = [];
    requiredBTSensors.forEach(sensorID => {
      requiredBccJson.push(this.__bccjson.find((x: any) => parseInt(x['BMS-ID']) == sensorID))
    })
    this.addBCCLayerToMap(requiredBccJson, false);
    this.buildNetwork();
  }

  buildNetwork() {
    this.__networkGeoJson.features.forEach((item: any) => {
      let BTLink = item.properties.path.split('/');
      BTLink = BTLink[BTLink.length - 1];
      BTLink = BTLink.split('.')[0].split('_');
      item.properties['origin'] = BTLink[0];
      item.properties['destination'] = BTLink[1];
    });
    console.log("This is the modified network GeoJson with origin and destination in the properties");
    console.log(this.__networkGeoJson);
    this.getNetworks()
  }

  getNetworks() {
    this.trajectories.forEach(trajectory => {
      let path = trajectory.Path;
      for (let i: number = 0; i < path.length - 1; ++i) {
        let origin: number = path[i];
        for (let j: number = i + 1; j < path.length; ++j) {
          let destination: number = path[j];
          let currentPath = this.getPath(origin, destination);
          if (currentPath != undefined) {
            let featureIndex = this.doesFeatureExist(currentPath)
            if (featureIndex != -1) {
              this.addWeight(trajectory, featureIndex)
            }
            else {
              this.buildFeature(currentPath, trajectory);
            }
            i = j - 1;
            break;
          }
        }
      }
    });
    this.addColorCode(this.__featureList);
    let featureList = {
      "type": "FeatureCollection",
      "features": this.__featureList
    }
    console.log(this.__featureList);
    this.addNetworkLayer(featureList);
  }

  getPath(origin: number, destination: number): any {
    for (let i = 0; i < this.__networkGeoJson.features.length; ++i) {
      if (parseInt(this.__networkGeoJson.features[i].properties.origin) == origin && parseInt(this.__networkGeoJson.features[i].properties.destination) == destination) {
        return this.__networkGeoJson.features[i];
      }
    }
    return undefined;
  }

  doesFeatureExist(feature: any) {
    return this.__featureList.findIndex(x => x.properties.Btlinkid == feature.properties.Btlinkid);
  }

  buildFeature(feature: any, trajectory: any) {
    feature.properties['weight'] = parseFloat(trajectory['Weight']);
    this.__featureList.push(feature);
  }

  addWeight(trajectory: any, index: number) {
    this.__featureList[index].properties['weight'] += parseFloat(trajectory['Weight']);
  }

  addColorCode(features: Array<any>) {
    let __highestWeight = Math.max.apply(Math, features.map((x: any) => { return x.properties['weight']; }));
    features.forEach((feature: any) => {
      let __weight = feature.properties['weight'];
      if (0 >= __weight && __weight < (__highestWeight * 0.25)) {
        feature.properties['color'] = this.__colorCodes['blue'];
      }
      else if (__weight >= (__highestWeight * 0.25) && __weight < (__highestWeight * 0.5)) {
        feature.properties['color'] = this.__colorCodes['yellow'];
      }
      else if (__weight >= (__highestWeight * 0.5) && __weight < (__highestWeight * 0.75)) {
        feature.properties['color'] = this.__colorCodes['orange'];
      }
      else if (__weight >= (__highestWeight * 0.75) && __weight <= (__highestWeight)) {
        feature.properties['color'] = this.__colorCodes['red'];
      }
      else {
        feature.properties['color'] = this.__colorCodes['blue'];
      }
    });
    // this.addLegend();
    this.__featureList = features;
  }

  addLegend() {
    let legend = document.getElementById('legend');
    for (let [__key, __value] of Object.entries(this.__colorCodes)) {
      var color = __value;
      var item = document.createElement('div');
      var key = document.createElement('span');
      key.className = 'legend-key';
      key.style.backgroundColor = __key;

      var value = document.createElement('span');
      value.innerHTML = __key;
      item.appendChild(key);
      item.appendChild(value);
      legend.appendChild(item);
    }
  }

  loading(isLoading: boolean) {
    if (isLoading) {
      $('#loading-page').show();
      $('#content').hide();
    }
    else {
      $('#loading-page').hide();
      $('#content').show();
    }
  }

  showSnackbar(message: string, action: string) {
    this._snackBar.open(message, action, {
      duration: 3000
    })
  }

}
