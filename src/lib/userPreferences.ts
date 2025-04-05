import { supabase } from "./supabase";
import { DashboardVisibility } from "@/pages/Preferences";

// Type for user preferences
export interface UserPreferences {
  dashboardVisibility: DashboardVisibility;
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
      ? { dashboardVisibility: data.dashboard_visibility }
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
