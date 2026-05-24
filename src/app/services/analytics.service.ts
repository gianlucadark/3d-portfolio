import { Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { environment } from '../../environments/environment';

type AnalyticsConsent = 'accepted' | 'rejected';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly measurementId = 'G-XE0CH7MY4Q';
  private readonly consentStorageKey = 'gd-analytics-consent';
  private initialized = false;

  constructor(private readonly router: Router) {}

  getConsent(): AnalyticsConsent | null {
    try {
      const value = localStorage.getItem(this.consentStorageKey);
      return value === 'accepted' || value === 'rejected' ? value : null;
    } catch {
      return null;
    }
  }

  accept(): void {
    this.saveConsent('accepted');
    this.enable();
  }

  reject(): void {
    this.saveConsent('rejected');
  }

  enableIfConsented(): void {
    if (this.getConsent() === 'accepted') {
      this.enable();
    }
  }

  private enable(): void {
    if (this.initialized || !environment.production) return;

    this.initialized = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || ((...args: unknown[]) => window.dataLayer?.push(args));

    window.gtag('consent', 'default', {
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
    window.gtag('js', new Date());
    window.gtag('config', this.measurementId, { send_page_view: false });

    this.loadScript();
    this.trackPageView(this.router.url);

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(event => this.trackPageView(event.urlAfterRedirects));
  }

  private trackPageView(path: string): void {
    window.gtag?.('event', 'page_view', {
      page_path: path,
      page_location: window.location.origin + path,
      page_title: document.title
    });
  }

  private loadScript(): void {
    if (document.querySelector(`script[src*="${this.measurementId}"]`)) return;

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.measurementId}`;
    document.head.appendChild(script);
  }

  private saveConsent(consent: AnalyticsConsent): void {
    try {
      localStorage.setItem(this.consentStorageKey, consent);
    } catch {
      // If storage is blocked, keep the choice for this page load only.
    }
  }
}
