
import { StudentData, GradingThresholds, NormalizationConfig, CategoryThreshold } from './types';

export const SUBJECT_LIST = [
  "English Language",
  "Mathematics",
  "Science",
  "Social Studies",
  "Career Technology",
  "Creative Arts and Designing",
  "Ghana Language (Twi)",
  "Religious and Moral Education",
  "Computing",
  "French"
];

export const CORE_SUBJECTS = ["Mathematics", "English Language", "Social Studies", "Science"];

export const SUBJECT_REMARKS: Record<string, string[]> = {
  "English Language": ["Exhibits excellent command of grammar.", "Creative writing skills are highly developed.", "Needs work on essay transitions."],
  "Mathematics": ["Logical reasoning is exceptional.", "Grasps geometric concepts quickly.", "Requires more practice with algebra."],
  "Science": ["Scientific reasoning is clear and structured.", "Shows great interest in lab procedures.", "Improve diagram labeling."],
  "Social Studies": ["Strong understanding of national heritage.", "Excellent civic responsibility.", "Focus on map interpretation."],
  "Career Technology": ["Outstanding technical drawing skills.", "Resourceful in practical projects.", "Strong design thinking."],
  "Creative Arts and Designing": ["Vibrant artistic talent.", "Great attention to detail.", "Explore more diverse media."],
  "Ghana Language (Twi)": ["Excellent oral proficiency.", "Deep appreciation for culture.", "Mastering complex idioms."],
  "Religious and Moral Education": ["Exemplary moral character.", "Deep knowledge of ethics.", "Spiritual maturity observed."],
  "Computing": ["Advanced digital literacy.", "Efficient computational logic.", "Strong coding fundamentals."],
  "French": ["Très bien! Strong vocabulary.", "Improving conversational skills.", "Keen interest in Francophone culture."],
  "General": ["Maintains high academic standards.", "Diligent and focused student.", "Positive attitude toward learning."]
};

export const PREDEFINED_CONDUCT_REMARKS = [
  "Displays exemplary character. Consistently disciplined in all academic engagements.",
  "Highly disciplined and shows great respect to staff and peers.",
  "Punctual and focused. Demonstrates a strong sense of responsibility.",
  "Satisfactory behavior, though consistency in focus is needed.",
  "A well-behaved student who responds positively to correction."
];

export const DEFAULT_THRESHOLDS: GradingThresholds = {
  A1: 1.645, B2: 1.036, B3: 0.524, C4: 0, C5: -0.524, C6: -1.036, D7: -1.645, E8: -2.326
};

export const DEFAULT_CATEGORY_THRESHOLDS: CategoryThreshold[] = [
  { label: "Distinction", min: 6, max: 10 },
  { label: "Merit", min: 11, max: 20 },
  { label: "Pass", min: 21, max: 36 },
  { label: "Fail", min: 37, max: 54 }
];

export const DEFAULT_NORMALIZATION: NormalizationConfig = {
  enabled: false, subject: "Mathematics", maxScore: 100, isLocked: false
};

export const FACILITATORS: Record<string, string> = {
  "English Language": "MADAM NANCY",
  "Mathematics": "SIR SAMMY",
  "Science": "SIR JOSHUA",
  "Social Studies": "SIR ASHMIE",
  "Career Technology": "SIR JOSHUA",
  "Creative Arts and Designing": "MADAM NORTEY",
  "Ghana Language (Twi)": "MADAM RITA",
  "Religious and Moral Education": "MADAM JANE",
  "Computing": "SIR ISAAC",
  "French": "SIR CHARLES"
};

export const RAW_STUDENTS: StudentData[] = [
  { id: 101, name: "KWAME MENSAH", gender: "M", parentName: "MR. KOFI MENSAH", parentContact: "024 111 1111", attendance: 0, scores: {}, sbaScores: {}, examSubScores: {}, mockData: {} },
  { id: 102, name: "ABENA OSEI", gender: "F", parentName: "MRS. RITA OSEI", parentContact: "024 222 2222", attendance: 0, scores: {}, sbaScores: {}, examSubScores: {}, mockData: {} },
  { id: 103, name: "KOFI ADU", gender: "M", parentName: "MR. SAMUEL ADU", parentContact: "024 333 3333", attendance: 0, scores: {}, sbaScores: {}, examSubScores: {}, mockData: {} },
  { id: 104, name: "AKOSUA SERWAA", gender: "F", parentName: "MADAM LYDIA SERWAA", parentContact: "024 444 4444", attendance: 0, scores: {}, sbaScores: {}, examSubScores: {}, mockData: {} },
  { id: 105, name: "YAW BOATENG", gender: "M", parentName: "MR. ENOCH BOATENG", parentContact: "024 555 5555", attendance: 0, scores: {}, sbaScores: {}, examSubScores: {}, mockData: {} }
];
