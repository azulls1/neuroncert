import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class ConnectivityService {
  private platformId = inject(PLATFORM_ID);
  private _online = signal(true);
  readonly online = this._online.asReadonly();

  constructor() {
    if (!isPlatformBrowser(this.platformId)) return;

    this._online.set(navigator.onLine);
    window.addEventListener('online', () => this._online.set(true));
    window.addEventListener('offline', () => this._online.set(false));
  }
}
