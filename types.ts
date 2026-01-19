
export interface SubjectScore {
  subject: string;
  score: number;
}

export interface ExamSubScore {
  sectionA: number;
  sectionB: number;
}

export interface ComputedSubject extends SubjectScore {
  sbaScore: number;
  finalCompositeScore: number;
  grade: string;
  gradeValue: number; 
  remark: string;
  facilitator: string;
  zScore: number;
  sectionA?: number;
  sectionB?: number;
}

export interface InstitutionalPerformance {
  mockSeries: string;
  avgComposite: number;
  avgAggregate: number;
  avgObjective: number;
  avgTheory: number;
  studentCount: number;
  timestamp: string;
}

export interface RemarkMetric {
  text: string;
  count: number;
  maleCount: number;
  femaleCount: number;
}

export interface RemarkTelemetry {
  subjectRemarks: Record<string, RemarkMetric[]>;
  conductRemarks: RemarkMetric[];
  facilitatorNotes: RemarkMetric[];
}

export interface VerificationEntry {
  subject: string;
  verifiedBy: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  confirmedScripts: string[]; 
}

export type StaffRole = 'FACILITATOR' | 'INVIGILATOR' | 'EXAMINER' | 'SUPERVISOR' | 'OFFICER';

export interface InvigilationSlot {
  dutyDate: string;
  timeSlot: string;
  subject: string;
}

export interface StaffAssignment {
  name: string;
  role: StaffRole;
  enrolledId: string; 
  taughtSubject?: string;
  invigilations: InvigilationSlot[];
  marking: {
    dateTaken: string;
    dateReturned: string;
    inProgress: boolean;
  };
}

export interface MockSnapshotMetadata {
  submissionDate: string;
  subjectsSubmitted: string[];
  subjectSubmissionDates?: Record<string, string>; // Maps subject name to its submission date
  confirmedScripts: string[];
  approvalStatus: 'pending' | 'approved' | 'completed';
  approvedBy?: string;
}

export interface SchoolRegistryEntry {
  id: string; 
  name: string;
  registrant: string;
  accessCode: string;
  enrollmentDate: string;
  studentCount: number;
  avgAggregate: number;
  performanceHistory: InstitutionalPerformance[];
  remarkTelemetry?: RemarkTelemetry;
  verificationLogs?: Record<string, VerificationEntry[]>;
  status: 'active' | 'suspended' | 'audit';
  lastActivity: string;
  fullData?: {
    settings: GlobalSettings;
    students: StudentData[];
    facilitators: Record<string, StaffAssignment>;
  };
}

export interface MockSeriesRecord {
  aggregate: number;
  rank: number;
  date: string;
  time?: string;
  reviewStatus: 'pending' | 'complete';
  isApproved: boolean;
  facilitatorSnapshot?: Record<string, string>;
  subjectPerformanceSummary?: Record<string, { mean: number; grade: string }>;
  subScores?: Record<string, ExamSubScore>;
}

export interface MockScoreSet {
  scores: Record<string, number>;
  sbaScores: Record<string, number>;
  examSubScores: Record<string, ExamSubScore>;
  facilitatorRemarks: Record<string, string>; 
  observations: {
    facilitator: string;
    invigilator: string;
    examiner: string;
  };
  attendance?: number;
  conductRemark?: string;
}

export interface BeceResult {
  grades: Record<string, number>; // Subject -> Grade (1-9)
  year: string;
}

export interface StudentData {
  id: number;
  name: string;
  gender: string;
  parentName?: string;
  parentContact: string;
  parentEmail?: string;
  attendance: number;
  conductRemark?: string;
  scores: Record<string, number>;
  sbaScores: Record<string, number>;
  examSubScores: Record<string, ExamSubScore>;
  mockData: Record<string, MockScoreSet>; 
  seriesHistory?: Record<string, MockSeriesRecord>;
  beceResults?: Record<string, BeceResult>; // Year -> Result
}

export interface ProcessedStudent {
  id: number;
  name: string;
  gender: string;
  parentName?: string;
  parentContact: string;
  parentEmail?: string;
  attendance: number;
  conductRemark?: string;
  subjects: ComputedSubject[];
  totalScore: number;
  bestSixAggregate: number;
  bestCoreSubjects: ComputedSubject[];
  bestElectiveSubjects: ComputedSubject[];
  overallRemark: string;
  weaknessAnalysis: string;
  category: string;
  rank: number;
  seriesHistory?: Record<string, MockSeriesRecord>;
  mockData?: Record<string, MockScoreSet>;
  beceResults?: Record<string, BeceResult>;
}

export interface ClassStatistics {
  subjectMeans: Record<string, number>;
  subjectStdDevs: Record<string, number>;
  subjectSectionAMeans: Record<string, number>;
  subjectSectionBMeans: Record<string, number>;
  subjectSectionAStdDevs: Record<string, number>;
  subjectSectionBStdDevs: Record<string, number>;
}

export interface GradingThresholds {
  A1: number;
  B2: number;
  B3: number;
  C4: number;
  C5: number;
  C6: number;
  D7: number;
  E8: number;
}

export interface NormalizationConfig {
  enabled: boolean;
  subject: string;
  maxScore: number;
  isLocked: boolean;
}

export interface SBAConfig {
  enabled: boolean;
  isLocked: boolean;
  sbaWeight: number;
  examWeight: number;
}

export interface ScoreEntryMetadata {
  mockSeries: string;
  entryDate: string;
}

export interface CategoryThreshold {
  label: string;
  min: number;
  max: number;
}

export interface GlobalSettings {
  schoolName: string;
  schoolAddress: string;
  schoolNumber: string; 
  schoolLogo?: string;
  registrantName?: string; 
  registrantEmail?: string;
  accessCode?: string;     
  enrollmentDate?: string; 
  examTitle: string;
  termInfo: string;
  academicYear: string;
  nextTermBegin: string;
  attendanceTotal: string;
  startDate: string;
  endDate: string;
  headTeacherName: string;
  reportDate: string;
  schoolContact: string;
  schoolEmail: string;
  gradingThresholds: GradingThresholds;
  normalizationConfig: NormalizationConfig;
  sbaConfig: SBAConfig;
  scoreEntryMetadata: ScoreEntryMetadata;
  committedMocks?: string[];
  categoryThresholds: CategoryThreshold[];
  isConductLocked: boolean;
  activeMock: string;
  resourcePortal: Record<string, Record<string, MockResource>>;
  maxSectionA: number;
  maxSectionB: number;
  sortOrder: 'name-asc' | 'name-desc' | 'id-asc' | 'score-desc' | 'aggregate-asc';
  useTDistribution: boolean;
  mockSnapshots?: Record<string, MockSnapshotMetadata>;
  reportTemplate: 'standard' | 'minimal' | 'prestige';
}

export interface QuestionIndicatorMapping {
  id: string;
  section: 'A' | 'B';
  questionRef: string;
  strand: string;
  subStrand: string;
  indicatorCode: string;
  indicator: string;
  weight: number;
}

export interface MockResource {
  indicators: QuestionIndicatorMapping[];
  questionUrl?: string;
  schemeUrl?: string;
  generalReport?: string;
}
