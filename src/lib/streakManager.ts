import { supabase } from "@/integrations/supabase/client";

export const checkAndResetStreak = async (userId: string): Promise<void> => {
  try {
    // Get user's profile with last activity date
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('last_activity_date, streak')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching user profile for streak check:', profileError);
      return;
    }

    if (!profile) return;

    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // Reset to start of day for accurate comparison

    // If no last activity date, set streak to 0
    if (!profile.last_activity_date) {
      if (profile.streak > 0) {
        await supabase
          .from('user_profiles')
          .update({ streak: 0 })
          .eq('id', userId);
      }
      return;
    }

    const lastActivityDate = new Date(profile.last_activity_date);
    lastActivityDate.setHours(0, 0, 0, 0); // Reset to start of day

    // Calculate difference in days
    const timeDifference = currentDate.getTime() - lastActivityDate.getTime();
    const daysDifference = Math.floor(timeDifference / (1000 * 60 * 60 * 24));

    // If 1 or more days have passed, reset streak to 0
    if (daysDifference >= 1 && profile.streak > 0) {
      await supabase
        .from('user_profiles')
        .update({ streak: 0 })
        .eq('id', userId);
      
      console.log(`Streak reset for user ${userId}. Days since last activity: ${daysDifference}`);
    }
  } catch (error) {
    console.error('Error in streak reset logic:', error);
  }
};

interface UserProfile {
  id: string;
  last_activity_date?: string;
  streak: number;
  xp: number;
  bits: number;
}

export const updateStreakOnActivity = async (userId: string, currentProfile: UserProfile, xpReward: number, bitsReward: number): Promise<void> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    let newStreak = 1;
    let shouldUpdateStreak = true;
    
    if (currentProfile.last_activity_date) {
      const lastActivityDate = currentProfile.last_activity_date;
      
      if (lastActivityDate === today) {
        // Already completed something today, don't change streak
        newStreak = currentProfile.streak;
        shouldUpdateStreak = false;
      } else if (lastActivityDate === yesterday) {
        // Consecutive day, increment streak
        newStreak = currentProfile.streak + 1;
      } else {
        // Gap in activity, reset streak to 1
        newStreak = 1;
      }
    }

    const updateData: any = {
      xp: (currentProfile.xp || 0) + xpReward,
      bits: (currentProfile.bits || 0) + bitsReward,
      updated_at: new Date().toISOString()
    };

    if (shouldUpdateStreak) {
      updateData.streak = newStreak;
      updateData.last_activity_date = today;
    }

    const { error } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating streak on activity:', error);
    throw error;
  }
};