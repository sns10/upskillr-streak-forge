-- Create user_achievements table to track awarded achievements
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  achievement_title TEXT NOT NULL,
  xp_awarded INTEGER NOT NULL,
  bits_awarded INTEGER NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Create RLS policies for user_achievements
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own achievements" ON user_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements" ON user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create function to check if achievement is already awarded
CREATE OR REPLACE FUNCTION is_achievement_awarded(user_uuid UUID, achievement_id_param TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_achievements 
    WHERE user_id = user_uuid AND achievement_id = achievement_id_param
  );
END;
$$ LANGUAGE plpgsql;

-- Create function to award achievement safely
CREATE OR REPLACE FUNCTION award_achievement_safely(
  user_uuid UUID,
  achievement_id_param TEXT,
  achievement_title_param TEXT,
  xp_reward INTEGER,
  bits_reward INTEGER
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if achievement is already awarded
  IF is_achievement_awarded(user_uuid, achievement_id_param) THEN
    RETURN FALSE;
  END IF;

  -- Award the achievement
  INSERT INTO user_achievements (
    user_id, 
    achievement_id, 
    achievement_title, 
    xp_awarded, 
    bits_awarded
  ) VALUES (
    user_uuid, 
    achievement_id_param, 
    achievement_title_param, 
    xp_reward, 
    bits_reward
  );

  -- Update user profile with XP and Bits
  UPDATE user_profiles 
  SET 
    xp = xp + xp_reward,
    bits = bits + bits_reward,
    updated_at = NOW()
  WHERE id = user_uuid;

  -- Record activity
  INSERT INTO student_activities (
    student_id,
    activity_type,
    activity_data
  ) VALUES (
    user_uuid,
    'achievement_unlocked',
    json_build_object(
      'achievement_id', achievement_id_param,
      'achievement_title', achievement_title_param,
      'xp_awarded', xp_reward,
      'bits_awarded', bits_reward
    )
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_unlocked_at ON user_achievements(unlocked_at); 