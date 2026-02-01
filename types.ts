export enum AppMode {
  ONBOARDING = 'ONBOARDING',
  HOME = 'HOME',
  GUIDED_CHECK = 'GUIDED_CHECK',
  LEARN = 'LEARN',
  NOTES = 'NOTES',
  PRIVACY_INFO = 'PRIVACY_INFO',
  DIGITAL_TWIN = 'DIGITAL_TWIN'
}

export enum CheckStep {
  PREPARE = 0,
  VISUAL_INSPECT = 1,
  LEFT_TESTICLE = 2,
  RIGHT_TESTICLE = 3,
  EPIDIDYMIS_CHECK = 4,
  FINISH = 5
}

export interface NoteEntry {
  id: string;
  date: string;
  content: string;
}

export interface ReminderSettings {
  enabled: boolean;
  lastChecked: string | null; // ISO Date string
  frequencyDays: number;
}

export interface PoseData {
  indexTip: { x: number; y: number; z: number };
}