import { Component, signal } from '@angular/core';
import {
  Router,
  RouterOutlet,
  NavigationEnd
} from '@angular/router';
import { CommonModule } from '@angular/common';
import { Sidebarcomponent } from './sidebarcomponent/sidebarcomponent';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    Sidebarcomponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {

  protected readonly title = signal('resumeparsing');

  showSidebar = true;

  constructor(private router: Router) {

    this.router.events.subscribe(event => {

      if (event instanceof NavigationEnd) {

        const url = event.urlAfterRedirects;

        this.showSidebar = !(
          url === '/PortalLogin' ||
          url.startsWith('/test') ||
          url === '/login' ||
         url.startsWith('/slots') ||
          url.startsWith('/offer-response/') ||
          url.startsWith('/uploaddocuments/') ||
          url.startsWith('/interviewFeedback')
        );

      }

    });

  }

}