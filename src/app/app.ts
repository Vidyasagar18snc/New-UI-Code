import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebarcomponent } from "./sidebarcomponent/sidebarcomponent";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Sidebarcomponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('resumeparsing');
}
