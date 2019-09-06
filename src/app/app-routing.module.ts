import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TransportMapComponent } from './transport-map/transport-map.component';


const routes: Routes = [
  {
    path: 'map',
    component: TransportMapComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
