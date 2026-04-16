export interface CCAFDomain {
  code: string;
  name: string;
  weight: number;
  questionBankFile: string;
  description: string;
  totalQuestions: number;
}

export interface CCAFScenario {
  id: string;
  title: string;
  description: string;
  domains: string[];
  questionCount: number;
}

export interface CCAFConfig {
  totalQuestions: number;
  durationSec: number;
  passingScore: number;
  maxScore: number;
  domains: CCAFDomain[];
  scenarioCount: number;
  scenarioPool: CCAFScenario[];
}
