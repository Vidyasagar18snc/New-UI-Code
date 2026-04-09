import { Component } from '@angular/core';
import { Sidebarcomponent } from '../sidebarcomponent/sidebarcomponent';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-layoutcomponent',
  imports: [Sidebarcomponent,RouterOutlet],
  templateUrl: './layoutcomponent.html',
  styleUrl: './layoutcomponent.css',
})
export class Layoutcomponent {

}
