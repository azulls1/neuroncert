import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card-stat hover-lift text-center">
      @if (iconClass()) {
        <div
          class="w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-3"
          [ngClass]="iconClass()"
        >
          <ng-content select="[slot=icon]"></ng-content>
        </div>
      }
      <div class="card-stat__value font-display">{{ value() }}</div>
      <div class="card-stat__label">{{ label() }}</div>
      @if (barPercent() !== null) {
        <div class="progress progress--sm mt-2">
          <div class="progress__bar" [ngClass]="barClass()" [style.width.%]="barPercent()"></div>
        </div>
      }
      @if (hint()) {
        <div class="card-stat__desc font-mono mt-1.5">{{ hint() }}</div>
      }
    </div>
  `,
  styles: [
    `
      .stat-icon-tracks {
        background: #eff2f0;
        color: #04202c;
      }
      .stat-icon-exams {
        background: #ecfdf5;
        color: #059669;
      }
      .stat-icon-score {
        background: #fffbeb;
        color: #d97706;
      }
      .stat-icon-certs {
        background: #eff6ff;
        color: #2563eb;
      }

      .stat-bar-green .progress__bar,
      .stat-bar-green {
        background: #059669;
      }
      .stat-bar-gold .progress__bar,
      .stat-bar-gold {
        background: #d97706;
      }
    `,
  ],
})
export class StatCardComponent {
  value = input('');
  label = input('');
  iconClass = input('');
  barPercent = input<number | null>(null);
  barClass = input('');
  hint = input('');
}
