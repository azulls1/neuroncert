import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { environment } from '../environments/environment';

/**
 * Root component — contains the shell layout, navbar with navigation, and router outlet.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  // Application title from environment
  protected readonly title = signal(environment.APP_NAME);

  // Application version
  protected readonly version = signal(environment.APP_VERSION);
}
