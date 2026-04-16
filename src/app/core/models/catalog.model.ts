import { LearningLevel } from './learning-level.model';
import { LearningTrack } from './learning-track.model';
import { CCAFConfig } from './ccaf-config.model';

export interface Catalog {
  version: string;
  lastUpdated: string;
  levels: LearningLevel[];
  tracks: LearningTrack[];
  ccafConfig: CCAFConfig;
}
