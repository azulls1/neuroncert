import { ContentType, LearningLevelNumber, Platform } from './content-type.model';
import { LearningModule } from './learning-module.model';

export interface LearningTrack {
  id: string;
  title: string;
  description: string;
  platform: Platform;
  level: LearningLevelNumber;
  modules: LearningModule[];
  contentTypes: ContentType[];
  estimatedHours: number;
  tags: string[];
  externalUrl?: string;
  order: number;
}
