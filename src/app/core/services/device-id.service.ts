import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const DEVICE_ID_KEY = 'claude_lp_device_id';
const DEVICE_FINGERPRINT_KEY = 'claude_lp_device_fp';

@Injectable({ providedIn: 'root' })
export class DeviceIdService {
  private platformId = inject(PLATFORM_ID);
  private _deviceId = signal<string>('');

  /** The unique device identifier */
  get deviceId() {
    return this._deviceId.asReadonly();
  }

  constructor() {
    this._initDeviceId();
  }

  /** Get the device ID as a plain string (for passing to Supabase) */
  getDeviceId(): string {
    return this._deviceId();
  }

  private _initDeviceId(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this._deviceId.set('ssr-placeholder');
      return;
    }

    // Check localStorage for existing ID
    let id = localStorage.getItem(DEVICE_ID_KEY);

    if (!id) {
      // Generate new: UUID + fingerprint hash
      const uuid = crypto.randomUUID();
      const fp = this._generateFingerprint();
      id = `${uuid}_${fp}`;
      localStorage.setItem(DEVICE_ID_KEY, id);
      localStorage.setItem(DEVICE_FINGERPRINT_KEY, fp);
    }

    this._deviceId.set(id);
  }

  private _generateFingerprint(): string {
    // Collect browser characteristics
    const components = [
      navigator.language,
      navigator.languages?.join(','),
      Intl.DateTimeFormat().resolvedOptions().timeZone,
      screen.width + 'x' + screen.height,
      screen.colorDepth?.toString(),
      navigator.hardwareConcurrency?.toString(),
      navigator.platform,
      new Date().getTimezoneOffset().toString(),
    ];

    // Simple hash function (djb2)
    const str = components.filter(Boolean).join('|');
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) + hash + str.charCodeAt(i);
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
}
