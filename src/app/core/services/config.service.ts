import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ConfigService {
  get appName(): string { return environment.APP_NAME; }
  get appVersion(): string { return environment.APP_VERSION; }

  // Paths
  get catalogPath(): string { return environment.CATALOG_PATH; }

  // Exam defaults
  get defaultQuestionsCount(): number { return environment.DEFAULT_QUESTIONS_COUNT; }
  get defaultDurationSec(): number { return environment.DEFAULT_DURATION_SEC; }

  // CCA-F defaults
  get ccafQuestionCount(): number { return environment.CCAF_QUESTIONS; }
  get ccafDurationSec(): number { return environment.CCAF_DURATION_SEC; }
  get ccafPassingScore(): number { return environment.CCAF_PASSING_SCORE; }
  get passingPercent(): number { return environment.PASSING_PERCENT; }

  // Storage
  get storageKeys() { return environment.STORAGE_KEYS; }

  // Accessibility
  get accessibility() { return environment.ACCESSIBILITY; }
  get isKeyboardNavigationEnabled(): boolean { return environment.ACCESSIBILITY.KEYBOARD_NAVIGATION; }
  get focusTimeout(): number { return environment.ACCESSIBILITY.FOCUS_TIMEOUT; }
  get announceDelay(): number { return environment.ACCESSIBILITY.ANNOUNCE_DELAY; }

  // Validation
  get validation() { return environment.VALIDATION; }
  get minQuestions(): number { return environment.VALIDATION.MIN_QUESTIONS; }
  get maxQuestions(): number { return environment.VALIDATION.MAX_QUESTIONS; }

  isValidQuestionsCount(count: number): boolean {
    return count >= this.minQuestions && count <= this.maxQuestions;
  }
}
