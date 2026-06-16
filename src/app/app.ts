import { Component,signal } from '@angular/core';
import { Router,RouterOutlet,NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Sidebarcomponent } from './sidebarcomponent/sidebarcomponent';

@Component({
selector:'app-root',
standalone:true,
imports:[CommonModule,RouterOutlet,Sidebarcomponent],
templateUrl:'./app.html',
styleUrl:'./app.css'
})

export class App{

protected readonly title=signal('resumeparsing');

showSidebar=true;

constructor(private router:Router){

this.router.events.subscribe(event=>{

if(event instanceof NavigationEnd){

const hiddenRoutes=[
'/PortalLogin',
'/offer-response',   
'/test',
'/slots',
'/uploaddocuments/:candidateId',

];

this.showSidebar = !hiddenRoutes.some(route => event.url.startsWith(route));

}

});

}
}
