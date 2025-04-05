import { supabase } from "./supabase-browser";
// Define DashboardVisibility type locally instead of importing from @/pages/Preferences
export interface DashboardVisibility {
  liveMetrics: boolean;
  networkStats: boolean;
  lightningNetwork: boolean;
  whaleAndSentiment: boolean;
  aiAndNews: boolean;
}

// Type for theme preference
export type Theme = "light" | "dark" | "system";

// Type for user preferences
export interface UserPreferences {
  dashboardVisibility: DashboardVisibility;
  theme?: Theme; // Make theme optional since it's stored in localStorage
  // Add more preference types here as needed
}

// Default preferences
export const defaultPreferences: UserPreferences = {
  dashboardVisibility: {
    liveMetrics: true,
    networkStats: true,
    lightningNetwork: true,
    whaleAndSentiment: true,
    aiAndNews: true,
  },
  theme: "system", // Default theme, but not saved to database
};

/**
 * Get user preferences from Supabase
 * @param userId The Clerk user ID
 */
export async function getUserPreferences(
  userId: string
): Promise<UserPreferences> {
  console.log("Fetching preferences for user:", userId);

  try {
    const { data, error } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("Error fetching user preferences:", error);
      return defaultPreferences;
    }

    console.log("Retrieved preferences:", data);
    return data
      ? {
          dashboardVisibility: data.dashboard_visibility,
          // Theme is handled by localStorage now
        }
      : defaultPreferences;
  } catch (err) {
    console.error("Error in getUserPreferences:", err);
    return defaultPreferences;
  }
}

/**
 * Save user preferences to Supabase
 * @param userId The Clerk user ID
 * @param preferences The user preferences to save
 */
export async function saveUserPreferences(
  userId: string,
  preferences: UserPreferences
): Promise<boolean> {
  console.log("Saving preferences for user:", userId, preferences);

  try {
    // Only include dashboard visibility for database
    const payload = {
      user_id: userId,
      dashboard_visibility: preferences.dashboardVisibility,
      updated_at: new Date().toISOString(),
    };

    console.log("Payload being sent to Supabase:", payload);

    const { data, error } = await supabase
      .from("user_preferences")
      .upsert(payload, { onConflict: "user_id" });

    if (error) {
      console.error("Error saving user preferences:", error);
      return false;
    }

    console.log("Preferences saved successfully:", data);
    return true;
  } catch (err) {
    console.error("Error in saveUserPreferences:", err);
    return false;
  }
}
