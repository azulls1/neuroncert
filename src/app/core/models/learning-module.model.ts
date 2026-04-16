export interface LearningModule {
  id: string;
  trackId: string;
  title: string;
  description: string;
  order: number;
  topics: string[];
  questionBankFile: string;
  questionCount: number;
}
