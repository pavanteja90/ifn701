import { Component, OnInit } from '@angular/core';
declare var $:any;

@Component({
    selector: 'app-loading',
    templateUrl: './loading.component.html',
    styleUrls: ['./loading.component.css']
})
export class LoadingComponent implements OnInit {

    constructor() {
    }

    ngOnInit() {
        window.scrollTo(0,0);
    }

}
