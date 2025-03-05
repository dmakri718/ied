export interface Project {
  id: string;
  name: string;
  description: string;
  url: string;
  officialWebsite?: string;
  results?: string[];
  educationalPlan?: string;
  suitabilityScore?: number;
  category: 'school' | 'adult' | 'both' | 'unsuitable';
}

export interface AnalysisResult {
  suitabilityScore: number;
  category: 'school' | 'adult' | 'both' | 'unsuitable';
  educationalPlan: string;
  recommendations: string[];
}