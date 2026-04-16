import { LearningLevelNumber } from './content-type.model';

export interface LearningLevel {
  level: LearningLevelNumber;
  name: string;
  description: string;
  icon: string;
  color: string;
  requiredLevel?: number;
}
