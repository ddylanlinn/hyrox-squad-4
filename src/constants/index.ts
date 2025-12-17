/**
 * Application-wide constants
 */

// Re-export error messages
export * from "./errorMessages";

// ========== App Users ==========

/**
 * Available app users for binding
 */
export const APP_USERS = [
  { id: "u1", name: "Dylan", initials: "DL" },
  { id: "u2", name: "Crystal", initials: "CH" },
  { id: "u3", name: "Sylvi", initials: "SB" },
  { id: "u4", name: "Andrew", initials: "AC" },
] as const;

// ========== Squad Configuration ==========

/**
 * Current squad ID for the application
 * TODO: Make this dynamic based on user selection or routing
 */
export const CURRENT_SQUAD_ID = "squad-001";

/**
 * Total number of squad members
 */
export const SQUAD_MEMBER_COUNT = 4;

// ========== Competition ==========

/**
 * Competition date (YYYY-MM-DD format)
 */
export const COMPETITION_DATE = "2026-02-28";

/**
 * Number of days to display in history heatmap
 */
export const HEATMAP_DAYS_COUNT = 80;

// ========== Authentication ==========

/**
 * Fixed password for email-based login
 * Used for simplified authentication flow
 */
export const FIXED_LOGIN_PASSWORD = "Hyrox20260228";

// ========== Messages ==========

/**
 * Motivational messages for nudging squad members
 */
export const NUDGE_MESSAGES = [
  "Wake up squad! Only I have trained today? 😤",
  "Let's go team! Don't break the streak! 🔥",
  "Training done. Who's next? ⚡️",
  "Hyrox waits for no one. Get it done! 🏋️",
] as const;

/**
 * Default workout note when user doesn't provide one
 */
export const DEFAULT_WORKOUT_NOTE = "Done! Let's go squad!";

/**
 * Message shown when all squad members complete their workout
 */
export const SQUAD_GOAL_ACHIEVED_MESSAGE = "Squad goal achieved! 💪";

/**
 * Placeholder text for workout input field
 */
export const WORKOUT_PLACEHOLDER = "e.g., 5k Run + 100 Wall Balls";
