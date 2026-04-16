import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { environment } from '../environments/environment';
import { ConnectivityService } from './core/services/connectivity.service';
import { SupabaseService } from './core/services/supabase.service';
import { I18nService } from './core/services/i18n.service';

/**
 * Root component — contains the shell layout, navbar with navigation, and router outlet.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  // Application title from environment
  protected readonly title = signal(environment.APP_NAME);

  // Application version
  protected readonly version = signal(environment.APP_VERSION);

  // Connectivity status
  protected readonly connectivity = inject(ConnectivityService);

  // Supabase connection status
  protected readonly supabase = inject(SupabaseService);

  // i18n service
  protected readonly i18n = inject(I18nService);

  // Mobile menu state
  protected readonly menuOpen = signal(false);

  protected toggleMenu(): void {
    this.menuOpen.update(v => !v);
  }
}
