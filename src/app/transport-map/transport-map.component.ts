import { Component, OnInit, OnDestroy } from '@angular/core';
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
export class TransportMapComponent implements OnInit, OnDestroy {

    //Variables
    public map: any; //This holds the mapboxgl's map object
    public CSV_TARGET_FILE: string = '../../assets/BCC_sensors.csv'; //This file has the list of sensors and their latitude and songitude locations
    public NETWORK_TARGET_FILE: string = '../../assets/13_09_2019_latest.json'; //This is the json file created from shape file of the network
    public TRAJECTORY_FILE: string = '../../assets/Trajectory_visualisation_output.csv'; //This has the list of trips
    public ID_List: Array<any> = []; //This array has the list of all bluetooth ID's
    public Origin_ID_List: Array<any> = []; //This array holds the list of origin bluetooth ID's from available trips to show on dropdown
    public Destination_ID_List: Array<any> = []; //This array holds the list of destination bluetooth ID's from available trips to show on dropdown
    public trajectories: Array<any> = []; //List of available trajectories
    //Variables from template - UI
    public __selectedOrigin: string = ''; //This variable holds the value of selected origin
    public __selectedDestination: string = ''; //This variable holds the value of selected destination
    public __minDate: string = ''; //This variable is used to set the minimum date value for date filter
    public __maxDate: string = ''; //This variable is used to set the maximum date value for date filter
    public __selectedDate: string = ''; //This variable holds the selected date filter value
    public __startTime: string = ''; //This variable holds the start time filter value
    public __endTime: string = ''; //This variable holds the end time filter value
    public __bccjson: any; //List of BCC sensors across brisbane
    public __networkGeoJson: any; //Geojson of available network
    public __featureList: Array<any> = []; //List of features
    public __colorCodes: any = [
        '#A1C4FD', //Blue
        '#FFDD00', //Yellow
        '#F1974D', //Orange
        '#FF0000' //Red
    ] //These are the color codes of lines on the map
    public __highestWeight: number = 0; //This variable holds the highest weight available on map
    public __topVolumeRoutesList: Array<any> = []; //This variable holds the top volume routes available (If number of routes are more than 3, it defaults to 3)
    public __availableRoutes: any = {};
    public __subs = [];

    constructor(public _readCSVService: ReadCSVService, public _readGeojsonService: ReadGeojsonService, public _snackBar: MatSnackBar) { }

    ngOnInit() {
        //Setting the access token to mapbox
        Object.getOwnPropertyDescriptor(mapboxgl, "accessToken").set('pk.eyJ1IjoicGF2YW50ZWphOTAiLCJhIjoiY2p6eXl6ZzhiMDV3cDNvcDd6Nmd3bWtmNyJ9.Q7ZMA251fPPlfRenu1V-Gg');
        //Creating mapbox object
        this.map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/dark-v10',
            center: [153.0294284, -27.469861],
            zoom: 10.40
        });
        let scope = this;
        //Handling various events on mapbox while initial load
        this.map.on('load', function () {
            //WHen a bcc sensor is clicked show it's details
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
            //when a link on network is clicked show its details
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
            //when hovered over bcc sensor show pointer tool
            scope.map.on('mouseenter', 'bcc_sensors', function () {
                scope.map.getCanvas().style.cursor = 'pointer';
            });
            //when hovered out of bcc sensor revert back
            scope.map.on('mouseleave', 'bcc_sensors', function () {
                scope.map.getCanvas().style.cursor = '';
            });
            //when hovered over bcc network show pointer tool
            scope.map.on('mouseenter', 'bcc_network', function () {
                scope.map.getCanvas().style.cursor = 'pointer';
            });
            //when hovered out of bcc network revert back
            scope.map.on('mouseleave', 'bcc_network', function () {
                scope.map.getCanvas().style.cursor = '';
            });
            //add manual zoom controls to map
            scope.map.addControl(new mapboxgl.NavigationControl());
        });
        this.getTrajectory();
    }
    //Create a description to the link in a map (Weights if available)
    createDesc(e: any): string {
        if (e.features[0].properties.weight) {
            return '<p>Volume: ' + e.features[0].properties.weight + '<br>BTLink ID: ' + e.features[0].properties.Btlinkid + '</p>';
        }
        return '<p>BTLink ID: ' + e.features[0].properties.Btlinkid + '</p>';
    }
    //Call to the service to get the list of trips
    getTrajectory() {
        this.loading(true);
        this.__subs.push(
            this._readCSVService.readCSV(this.TRAJECTORY_FILE)
                .subscribe(resp => {
                    this.convertCSVtoJSON_Trajectory(resp);
                    this.getCSV();
                }, error => {
                    console.log(error);
                    setTimeout(() => {
                        this.loading(false);
                    }, 1000);;
                    this.showSnackbar(error, 'Close');
                }));
    }
    //Convert the csv from the trajectories (available trips) to json file
    convertCSVtoJSON_Trajectory(_csvFile: any) {
        let lines = _csvFile.split("\n").map((item: any) => { return item.trim() });
        let tempLines = []
        lines.forEach((x: any) => { if (x.length > 0) tempLines.push(x); });
        lines = tempLines;
        let headers = lines[0].split(",").map((item: any) => { return item.trim() });
        let result = []
        for (let i = 1; i < lines.length; i++) {
            let obj = {}
            let currentLine = lines[i].split('"').map((item: any) => { return item.trim() });
            let initial = currentLine[0].split(',').map((item: any) => { return item.trim() });
            initial = initial.slice(0, initial.length - 1)
            let middle = currentLine[1];
            let final = currentLine[2].split(',').map((item: any) => { return item.trim() });
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
    //Call to the service to get the list of BCC sensors
    getCSV() {
        let csv_file: any;
        this.__subs.push(
            this._readCSVService.readCSV(this.CSV_TARGET_FILE)
                .subscribe(resp => {
                    csv_file = resp
                    this.convertCSVtoJSON_BMS(csv_file);
                    setTimeout(() => {
                        this.loading(false);
                    }, 2000);
                }, error => {
                    console.log(error);
                    this.showSnackbar(error, 'Close');
                    setTimeout(() => {
                        this.loading(false);
                    }, 1000);;
                }));
    }
    //Convert the csv from BCC sensors to json file
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
        this.addBMSLayerToMap(bcc_json);
    }
    //Adding the BMS sensors layer to map
    addBMSLayerToMap(bcc_json: any, addNetwork: boolean = true) {
        let __geoJSON = this.generatePointMap(bcc_json);
        if (addNetwork)
            this.addNetwork();
        setTimeout(() => {
            this.map.addLayer(__geoJSON);
        }, 200);
    }
    //Generating the BMS sensor points layer on the map
    generatePointMap(data: any) {
        let __respJSON = {
            "id": "bcc_sensors",
            "type": "circle",
            "source": {
                "type": "geojson",
                "data": {
                    "type": "FeatureCollection",
                    "features": []
                }
            },
            "paint": {
                "circle-radius": ['get', 'radius'],
                "circle-color": ['get', 'color']
            }
        }

        data.forEach((__e: any) => {
            let __feature = this.generatePointFeature(__e)
            if (__feature) __respJSON.source.data.features.push(__feature);
        })

        return __respJSON;
    }
    //Generating the BMS sensor point features on the map
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
                "description": __desc
            },
            "geometry": {
                "type": "Point",
                "coordinates": [coordinates[0], coordinates[1]]
            }
        }
        if (parseInt(__row['BMS-ID']) == parseInt(this.__selectedOrigin)) {
            __feature.properties['color'] = '#4169e1'; //Origin BT Sensor color
            __feature.properties['radius'] = 5;
        }
        else if (parseInt(__row['BMS-ID']) == parseInt(this.__selectedDestination)) {
            __feature.properties['color'] = '#136207'; //Destination BT Sensor color
            __feature.properties['radius'] = 5;
        }
        else {
            __feature.properties['color'] = '#999999'; //Normal BT sensor color
            __feature.properties['radius'] = 3;
        }
        return __feature;
    }
    //Adding the city trajectory network to the map
    addNetwork() {
        this.__subs.push(
            this._readGeojsonService.readGeoJson(this.NETWORK_TARGET_FILE)
                .subscribe(resp => {
                    this.generateNetworkLayer(resp);
                    this.__networkGeoJson = resp;
                }, error => {
                    console.log(error);
                    this.showSnackbar(error, 'Close');
                }));
    }
    //Generating the city network layer
    generateNetworkLayer(geojson: any) {
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
                "line-width": 3
            }
        });
    }
    //Handling the date filter change event
    dateChanged(value: string) {

    }
    //Handing the frequency filter radio button change
    radioChanged(event: any) {
        // console.log(event);
    }
    //When submit button is clicked
    submitForm() {
        if (this.checkFilters())
            this.renderMap();
        else
            this.showSnackbar('Please select origin and destination', 'Close');
    }
    //Checking whether the mandatory filters are provided
    checkFilters(): boolean {
        if (this.__selectedOrigin && this.__selectedDestination)
            return true;
        else
            return false;
    }
    //Switch the layer designs when the user changes the radio button options
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
    //Switch the top routes on the map when the user changes the radio button options
    switchRoute(routeIndex: any) {
        this.__featureList = []; //Clearing the features
        if (routeIndex == "-1") {
            this.renderMap();
        }
        else {
            if (this.map.getLayer('bcc_network'))
                this.map.removeLayer('bcc_network');
            if (this.map.getSource('bcc_network'))
                this.map.removeSource('bcc_network');
            let Path = JSON.parse("[" + this.__topVolumeRoutesList[routeIndex] + "]");
            let trajectory = [{
                "origin": Path[0],
                "destination": Path[Path.length - 1],
                "Weight": this.__availableRoutes[this.__topVolumeRoutesList[routeIndex]],
                "Path": Path
            }];
            this.addFilteredNetwork(trajectory);
        }
    }
    //Generates the top volume routes
    generateTopRoutes() {
        this.__availableRoutes = {}; //Clearing the available routes
        this.trajectories.forEach(trajectory => {
            if (this.__availableRoutes[trajectory.Path]) {
                this.__availableRoutes[trajectory.Path] += parseFloat(trajectory.Weight);
            }
            else {
                this.__availableRoutes[trajectory.Path] = parseFloat(trajectory.Weight);
            }
        });
        let __sortedKeys = Object.keys(this.__availableRoutes).sort((a, b) => { return this.__availableRoutes[b] - this.__availableRoutes[a] });
        this.__topVolumeRoutesList = __sortedKeys.slice(0, 3);
    }
    //Rendering the map on the UI on click on submit button
    renderMap() {
        if (this.map.getLayer('bcc_sensors'))
            this.map.removeLayer('bcc_sensors');
        if (this.map.getSource('bcc_sensors'))
            this.map.removeSource('bcc_sensors');
        if (this.map.getLayer('bcc_network'))
            this.map.removeLayer('bcc_network');
        if (this.map.getSource('bcc_network'))
            this.map.removeSource('bcc_network');
        this.mapRequiredBTSensors();
    }
    //Mapping only the required BMS sensors on the map on user selection
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
        this.addBMSLayerToMap(requiredBccJson, false);
        this.buildNetwork();
    }
    //Building the trajectory network after filtering
    buildNetwork() {
        this.__networkGeoJson.features.forEach((item: any) => {
            let BTLink = item.properties.path.split('/');
            BTLink = BTLink[BTLink.length - 1];
            BTLink = BTLink.split('.')[0].split('_');
            item.properties['origin'] = BTLink[0];
            item.properties['destination'] = BTLink[1];
        });
        this.addFilteredNetwork()
    }
    //Adding the filtered network to the map
    addFilteredNetwork(trajectory: Array<any> = this.trajectories) {
        trajectory.forEach(trajectory => {
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
        this.generateNetworkLayer(featureList);
        this.generateTopRoutes();
    }
    //Gets the path from the network json for the provided origin and destination BCC sensors
    getPath(origin: number, destination: number): any {
        for (let i = 0; i < this.__networkGeoJson.features.length; ++i) {
            if (parseInt(this.__networkGeoJson.features[i].properties.origin) == origin && parseInt(this.__networkGeoJson.features[i].properties.destination) == destination) {
                return this.__networkGeoJson.features[i];
            }
        }
        return undefined;
    }
    //Checking whether the feature exists in __featureList
    doesFeatureExist(feature: any) {
        return this.__featureList.findIndex(x => x.properties.Btlinkid == feature.properties.Btlinkid);
    }
    //Adding weights to the trajectory feature (If feature doesn't exist in __featureList)
    buildFeature(feature: any, trajectory: any) {
        feature.properties['weight'] = parseFloat(trajectory['Weight']);
        this.__featureList.push(feature);
    }
    //Adding weights to the trajectory feature (If feature exists in __featureList)
    addWeight(trajectory: any, index: number) {
        this.__featureList[index].properties['weight'] += parseFloat(trajectory['Weight']);
    }
    //Adding color codes to the properties of each feature of the trajectory lines
    addColorCode(features: Array<any>) {
        let __highestWeight = Math.max.apply(Math, features.map((x: any) => { return x.properties['weight']; }));
        this.__highestWeight = __highestWeight;
        features.forEach((feature: any) => {
            let __weight = feature.properties['weight'];
            if (0 >= __weight && __weight < (__highestWeight * 0.25)) {
                feature.properties['color'] = this.__colorCodes[0];
            }
            else if (__weight >= (__highestWeight * 0.25) && __weight < (__highestWeight * 0.5)) {
                feature.properties['color'] = this.__colorCodes[1];
            }
            else if (__weight >= (__highestWeight * 0.5) && __weight < (__highestWeight * 0.75)) {
                feature.properties['color'] = this.__colorCodes[2];
            }
            else if (__weight >= (__highestWeight * 0.75) && __weight <= (__highestWeight)) {
                feature.properties['color'] = this.__colorCodes[3];
            }
            else {
                feature.properties['color'] = this.__colorCodes[0];
            }
        });
        this.__featureList = features;
    }
    //Show or hide the loading page
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
    //Show the snackbar in the bottom with message and action
    showSnackbar(message: string, action: string) {
        this._snackBar.open(message, action, {
            duration: 3000
        })
    }

    clearFilters() {
        this.__selectedOrigin = undefined;
        this.__selectedDestination = undefined;
        // this.__topVolumeRoutesList = [];
        // this.trajectories = [];
        // this.__highestWeight = 0;
        // this.__availableRoutes = {};
    }

    reload() {
        location.reload();
    }

    ngOnDestroy() {
        if (this.__subs && this.__subs.length > 0) {
            this.__subs.forEach(sub => {
                if (sub) {
                    sub.unsubscribe();
                }
            });
        }
    }

}
