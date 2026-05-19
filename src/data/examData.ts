import { englishQuestions } from './questions/english';
import { biologyQuestions } from './questions/biology';
import { chemistryQuestions } from './questions/chemistry';
import { physicsQuestions } from './questions/physics';
import { mathematicsQuestions } from './questions/mathematics';
import { geographyQuestions } from './questions/geography';
import { historyQuestions } from './questions/history';
import { computerQuestions } from './questions/computer';
import { furthermathsQuestions } from './questions/furthermaths';
import { homeeconomicsQuestions } from './questions/homeeconomics';
import { agricQuestions } from './questions/agric';
import { arabicQuestions } from './questions/arabic';
import { artQuestions } from './questions/art';
import { crkQuestions } from './questions/crk';
import { frenchQuestions } from './questions/french';
import { hausaQuestions } from './questions/hausa';
import { igboQuestions } from './questions/igbo';
import { irkQuestions } from './questions/irk';
import { literatureQuestions } from './questions/literature';
import { musicQuestions } from './questions/music';
import { yorubaQuestions } from './questions/yoruba';
import { economicsQuestions } from './questions/economics';

// --- Types ---
export interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface Subject {
  id: string;
  name: string;
  questions: Question[];
}

export type ExamCategory = 'JAMB' | 'WAEC' | 'NECO' | 'POST_UTME' | 'ICAN' | 'NIM';

// --- Atomic Subject Pools ---

const BASE_SUBJECTS: Subject[] = [
  { id: 'english', name: 'Use of English', questions: englishQuestions },
  { id: 'biology', name: 'Biology', questions: biologyQuestions },
  { id: 'chemistry', name: 'Chemistry', questions: chemistryQuestions },
  { id: 'physics', name: 'Physics', questions: physicsQuestions },
  { id: 'mathematics', name: 'Mathematics', questions: mathematicsQuestions },
  { id: 'economics', name: 'Economics', questions: economicsQuestions },
  { id: 'geography', name: 'Geography', questions: geographyQuestions },
  { id: 'history', name: 'History', questions: historyQuestions },
  { id: 'computer', name: 'Computer Studies', questions: computerQuestions },
  { id: 'furthermaths', name: 'Further Mathematics', questions: furthermathsQuestions },
  { id: 'homeeconomics', name: 'Home Economics', questions: homeeconomicsQuestions },
  { id: 'agric', name: 'Agricultural Science', questions: agricQuestions },
  { id: 'arabic', name: 'Arabic', questions: arabicQuestions },
  { id: 'art', name: 'Art (Fine Arts)', questions: artQuestions },
  { id: 'crk', name: 'Christian Religious Knowledge (CRK)', questions: crkQuestions },
  { id: 'french', name: 'French', questions: frenchQuestions },
  { id: 'hausa', name: 'Hausa', questions: hausaQuestions },
  { id: 'igbo', name: 'Igbo', questions: igboQuestions },
  { id: 'irk', name: 'Islamic Religious Knowledge (IRK)', questions: irkQuestions },
  { id: 'literature', name: 'Literature in English', questions: literatureQuestions },
  { id: 'music', name: 'Music', questions: musicQuestions },
  { id: 'yoruba', name: 'Yoruba', questions: yorubaQuestions },
];

export const EXAM_DATA: Record<ExamCategory, { name: string; subjects: Subject[]; seminarTitle: string }> = {
  JAMB: {
    name: 'JAMB (UTME)',
    subjects: BASE_SUBJECTS,
    seminarTitle: 'JAMB Tactical Excellence Webinar'
  },
  WAEC: {
    name: 'WAEC (WASSCE)',
    subjects: BASE_SUBJECTS.slice(0, 10), // Taking a subset for WAEC
    seminarTitle: 'WAEC Senior Certificate Protocol'
  },
  NECO: {
    name: 'NECO (SSCE)',
    subjects: BASE_SUBJECTS.slice(0, 10),
    seminarTitle: 'NECO National Merit Seminar'
  },
  POST_UTME: {
    name: 'University Post-UTME',
    subjects: BASE_SUBJECTS,
    seminarTitle: 'Tertiary Entrance Strategy'
  },
  ICAN: {
    name: 'ICAN Professional',
    subjects: [
      {
        id: 'accounting',
        name: 'Financial Accounting',
        questions: [
          {
            id: 1,
            text: "Which accounting principle states that revenue should be recognized when earned?",
            options: ["Matching Principle", "Revenue Recognition Principle", "Going Concern", "Entity Concept"],
            correctAnswer: 1,
            explanation: "The revenue recognition principle dictates that revenue is recognized when the performance obligation is satisfied."
          }
        ]
      }
    ],
    seminarTitle: 'Professional Charter Readiness'
  },
  NIM: {
    name: 'NIM Management',
    subjects: [
      {
        id: 'mgmt',
        name: 'Management Principles',
        questions: [
          {
            id: 1,
            text: "Who is known as the father of Scientific Management?",
            options: ["Henri Fayol", "Frederick Taylor", "Max Weber", "Elton Mayo"],
            correctAnswer: 1,
            explanation: "Frederick Winslow Taylor is widely known as the father of scientific management."
          }
        ]
      }
    ],
    seminarTitle: 'Management Leadership Tactics'
  }
};
