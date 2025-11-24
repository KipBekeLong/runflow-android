export enum RunType {
  EASY = '轻松跑',
  TEMPO = '节奏跑',
  INTERVAL = '间歇跑',
  LONG = '长距离',
  RECOVERY = '恢复跑',
  REST = '休息日'
}

export type StepType = 'warmup' | 'run' | 'recover' | 'rest' | 'cooldown' | 'tempo' | 'interval';
export type TargetType = 'distance' | 'time';
export type RestType = 'jog' | 'rest';
export type DisplayUnit = 'km' | 'm' | 'min' | 'sec';

export interface WorkoutStep {
  id: string;
  type: StepType;
  targetType: TargetType;
  targetValue: number; // stored in km or minutes always
  displayUnit?: DisplayUnit; // Preference for how to show it (e.g. 400m vs 0.4km)
  targetPace?: string; // e.g., "5:00"
  description?: string;
  restType?: RestType; // New: Jog vs Static rest
}

export interface WorkoutBlock {
  id: string;
  type: 'single' | 'repeat';
  repeats: number; // Defaults to 1 for 'single'
  steps: WorkoutStep[];
}

export interface Workout {
  id: string;
  dayOffset: number; // 0 = Monday, 6 = Sunday, relative to week
  type: RunType;
  title: string; // User friendly title e.g. "Morning Run"
  description: string;
  isCompleted: boolean;
  
  // Legacy/Simple support (calculated from blocks if blocks exist)
  distanceKm: number;
  durationMin: number;
  
  // Advanced Structure
  blocks: WorkoutBlock[]; 
}

export interface WeekPlan {
  weekNumber: number;
  workouts: Workout[];
}

export interface ReferenceRace {
  distance: number; // km
  time: string; // "MM:SS" or "HH:MM:SS"
}

export interface RunningPlan {
  id: string;
  name: string;
  goal: string;
  level: string; // Beginner, Intermediate, Advanced
  totalWeeks: number;
  weeks: WeekPlan[];
  createdAt: number; // Timestamp start date
  referenceRace?: ReferenceRace; // For calculating intensity zones
}

// -- Shoe Structure --
export interface Shoe {
  id: string;
  brand: string;
  model: string;
  image?: string; // Base64 string
  distance: number; // km
  maxDistance: number; // default e.g. 800km
  isActive: boolean;
  purchaseDate: number;
}

// -- Logging Structures --

export interface LogSegment {
  stepType: StepType;
  actualDistance: number; // km
  actualDuration: number; // seconds
  actualPace: string; // min/km
  restType?: RestType;
  label?: string; // e.g., "Interval 1/4"
  groupId?: string; // To identify grouped segments (e.g. all 400m runs in a set)
}

export interface StructuredLogData {
  linkedWorkoutId: string;
  segments: LogSegment[];
  avgPace: string;
}

export interface RunLog {
  id: string;
  date: number; // Timestamp
  distanceKm: number;
  durationSec: number;
  pace: string; // min/km
  feeling: 'great' | 'good' | 'tired' | 'bad';
  notes?: string;
  structuredData?: StructuredLogData; // Optional detailed breakdown
  shoeId?: string; // Linked shoe
}

export type ViewState = 'dashboard' | 'plan' | 'record' | 'history' | 'create-plan';

export interface BackupData {
  version: number;
  timestamp: number;
  plan: RunningPlan | null;
  logs: RunLog[];
  shoes?: Shoe[];
}