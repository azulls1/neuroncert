export const environment = {
  production: false,
  APP_NAME: 'Claude AI Learning Platform',
  APP_VERSION: '2.0.0',
  CATALOG_PATH: '/assets/question-bank/catalog.json',

  // Exam defaults (standard track exams)
  DEFAULT_QUESTIONS_COUNT: 30,
  DEFAULT_DURATION_SEC: 2700, // 45 minutes

  // CCA-F Certification defaults
  CCAF_QUESTIONS: 60,
  CCAF_DURATION_SEC: 7200, // 120 minutes
  CCAF_PASSING_SCORE: 720, // out of 1000
  PASSING_PERCENT: 70, // minimum passing percentage for exam history

  STORAGE_KEYS: {
    EXAM_STATE: 'exam_state',
    USER_PREFERENCES: 'user_preferences',
    EXAM_RESULTS: 'exam_results',
    EXAM_PROGRESS: 'exam_progress',
    LAST_RESULTS: 'last_results',
    LEARNING_PROGRESS: 'claude_learning_progress',
  },
  ACCESSIBILITY: {
    KEYBOARD_NAVIGATION: true,
    FOCUS_TIMEOUT: 100,
    ANNOUNCE_DELAY: 500,
  },
  VALIDATION: {
    MIN_QUESTIONS: 1,
    MAX_QUESTIONS: 200,
    MIN_DURATION_SEC: 300,
    MAX_DURATION_SEC: 7200,
    MIN_DOMAINS: 1,
    MAX_DOMAINS: 10,
  },
  security: {
    enableDetailedLogs: false,
    maskSensitiveData: true,
  },
  supabase: {
    url: '/supabase',
    anonKey:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJyb2xlIjogImFub24iLAogICJpc3MiOiAic3VwYWJhc2UiLAogICJpYXQiOiAxNzE1MDUwODAwLAogICJleHAiOiAxODcyODE3MjAwCn0.23LYnOepZ9yTJObLFoTnszO5WdHpbekvgwMt8bn2o_k',
  },
};
