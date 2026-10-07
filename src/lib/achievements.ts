/**
 * Achievement definitions for Cyberpunk OS
 */

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_boot', title: 'Neural Awakening', description: 'Complete the boot sequence', icon: '◈' },
  { id: 'first_login', title: 'Identity Confirmed', description: 'Authenticate for the first time', icon: '◉' },
  { id: 'first_scan', title: 'Sector Mapper', description: 'Run your first network scan', icon: '◈' },
  { id: 'first_ask', title: 'Oracle Seeker', description: 'Consult the neural AI', icon: '✦' },
  { id: 'multi_window', title: 'Multitasker', description: 'Open 2+ terminal windows', icon: '⧉' },
  { id: 'matrix_dive', title: 'Data Diver', description: 'Enter the matrix stream', icon: '⬡' },
  { id: 'alias_master', title: 'Shortcut Savant', description: 'Create a custom alias', icon: '⌘' },
  { id: 'workspace_save', title: 'State Keeper', description: 'Save your workspace', icon: '☰' },
  { id: 'core_click', title: 'Core Touched', description: 'Interact with the 3D core', icon: '◎' },
  { id: 'ten_commands', title: 'Command Cadet', description: 'Execute 10 commands', icon: '▷' },
];

export function getAchievement(id: string): AchievementDef | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}
