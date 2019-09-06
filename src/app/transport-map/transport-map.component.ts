import { Component, OnInit } from '@angular/core';
import * as mapboxgl from 'mapbox-gl';

@Component({
  selector: 'app-transport-map',
  templateUrl: './transport-map.component.html',
  styleUrls: ['./transport-map.component.css']
})
export class TransportMapComponent implements OnInit {

  public map: any;
  constructor() { }

  ngOnInit() {
    Object.getOwnPropertyDescriptor(mapboxgl, "accessToken").set('pk.eyJ1IjoicGF2YW50ZWphOTAiLCJhIjoiY2p6eXl6ZzhiMDV3cDNvcDd6Nmd3bWtmNyJ9.Q7ZMA251fPPlfRenu1V-Gg');
    this.map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/dark-v10',
      center: [153.0294284, -27.469861],
      zoom: 11.50
    });
  }

}
