import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stat-card">
      @if (iconClass()) {
        <div class="stat-icon" [ngClass]="iconClass()">
          <ng-content select="[slot=icon]"></ng-content>
        </div>
      }
      <div class="stat-value font-display">{{ value() }}</div>
      <div class="stat-label">{{ label() }}</div>
      @if (barPercent() !== null) {
        <div class="stat-bar">
          <div class="stat-bar-fill" [ngClass]="barClass()" [style.width.%]="barPercent()"></div>
        </div>
      }
      @if (hint()) {
        <div class="stat-hint font-mono">{{ hint() }}</div>
      }
    </div>
  `,
  styles: [
    `
      .stat-card {
        background: white;
        border: 1px solid #eff2f0;
        border-radius: 16px;
        padding: 20px;
        text-align: center;
        transition: all 0.25s ease;
      }

      .stat-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 16px rgba(4, 32, 44, 0.06);
      }

      .stat-icon {
        width: 44px;
        height: 44px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 12px;
      }

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

      .stat-value {
        font-size: 28px;
        font-weight: 700;
        color: #04202c;
        line-height: 1;
        margin-bottom: 4px;
      }
      .stat-label {
        font-size: 12px;
        color: #5b6b62;
        margin-bottom: 8px;
      }

      .stat-bar {
        height: 4px;
        background: #eff2f0;
        border-radius: 2px;
        overflow: hidden;
        margin-top: 8px;
      }

      .stat-bar-fill {
        height: 100%;
        background: #04202c;
        border-radius: 2px;
        transition: width 1s cubic-bezier(0.25, 0.1, 0.25, 1);
        min-width: 2px;
      }

      .stat-bar-green {
        background: #059669;
      }
      .stat-bar-gold {
        background: #d97706;
      }

      .stat-hint {
        font-size: 10px;
        color: #7d9088;
        margin-top: 6px;
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
