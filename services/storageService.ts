import { NoteEntry, ReminderSettings } from '../types';

const NOTES_KEY = 'gentle_check_notes';
const SETTINGS_KEY = 'gentle_check_settings';

export const getNotes = (): NoteEntry[] => {
  try {
    const data = localStorage.getItem(NOTES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const saveNote = (note: NoteEntry) => {
  const notes = getNotes();
  const updated = [note, ...notes];
  localStorage.setItem(NOTES_KEY, JSON.stringify(updated));
};

export const getSettings = (): ReminderSettings => {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    return data ? JSON.parse(data) : { enabled: false, lastChecked: null, frequencyDays: 30 };
  } catch (e) {
    return { enabled: false, lastChecked: null, frequencyDays: 30 };
  }
};

export const saveSettings = (settings: ReminderSettings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

export const markCheckComplete = () => {
  const settings = getSettings();
  settings.lastChecked = new Date().toISOString();
  saveSettings(settings);
};