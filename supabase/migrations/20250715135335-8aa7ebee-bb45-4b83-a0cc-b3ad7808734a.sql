-- Create some initial badges for the badge system
INSERT INTO public.badges (name, description, icon, condition_type, condition_value) VALUES
  ('First Steps', 'Welcome to the platform! Earn your first 10 XP.', 'star', 'xp', 10),
  ('Learner', 'You''re getting started! Earn 100 XP.', 'award', 'xp', 100),
  ('Scholar', 'Dedicated student! Earn 500 XP.', 'trophy', 'xp', 500),
  ('Expert', 'Knowledge seeker! Earn 1000 XP.', 'crown', 'xp', 1000),
  ('Master', 'True dedication! Earn 2500 XP.', 'crown', 'xp', 2500),
  ('Consistent', 'Keep it up! Maintain a 3-day learning streak.', 'zap', 'streak', 3),
  ('Dedicated', 'Great habit! Maintain a 7-day learning streak.', 'zap', 'streak', 7),
  ('Unstoppable', 'Amazing commitment! Maintain a 30-day learning streak.', 'target', 'streak', 30),
  ('Course Starter', 'Begin your journey! Complete 1 lesson.', 'award', 'courses', 1),
  ('Course Explorer', 'Expanding knowledge! Complete 5 lessons.', 'trophy', 'courses', 5),
  ('Course Master', 'Impressive progress! Complete 10 lessons.', 'crown', 'courses', 10),
  ('Quiz Novice', 'Testing knowledge! Complete 1 quiz.', 'star', 'quizzes', 1),
  ('Quiz Champion', 'Quiz master! Complete 5 quizzes.', 'trophy', 'quizzes', 5),
  ('Quiz Legend', 'Incredible! Complete 20 quizzes.', 'crown', 'quizzes', 20);

-- Create function to check and award badges automatically
CREATE OR REPLACE FUNCTION public.check_and_award_badges(user_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_xp integer;
  user_streak integer;
  completed_lessons integer;
  completed_quizzes integer;
  badge_record record;
BEGIN
  -- Get user stats
  SELECT COALESCE(SUM(amount), 0) INTO user_xp
  FROM user_xp WHERE user_id = user_uuid;
  
  SELECT COALESCE(current_streak, 0) INTO user_streak
  FROM streaks WHERE user_id = user_uuid;
  
  SELECT COUNT(*) INTO completed_lessons
  FROM user_progress WHERE user_id = user_uuid AND completed = true;
  
  SELECT COUNT(*) INTO completed_quizzes
  FROM quiz_results WHERE user_id = user_uuid;
  
  -- Check each badge condition
  FOR badge_record IN 
    SELECT b.id, b.condition_type, b.condition_value
    FROM badges b
    WHERE NOT EXISTS (
      SELECT 1 FROM user_badges ub 
      WHERE ub.user_id = user_uuid AND ub.badge_id = b.id
    )
  LOOP
    -- Check if user meets badge condition
    CASE badge_record.condition_type
      WHEN 'xp' THEN
        IF user_xp >= badge_record.condition_value THEN
          INSERT INTO user_badges (user_id, badge_id) VALUES (user_uuid, badge_record.id);
        END IF;
      WHEN 'streak' THEN
        IF user_streak >= badge_record.condition_value THEN
          INSERT INTO user_badges (user_id, badge_id) VALUES (user_uuid, badge_record.id);
        END IF;
      WHEN 'courses' THEN
        IF completed_lessons >= badge_record.condition_value THEN
          INSERT INTO user_badges (user_id, badge_id) VALUES (user_uuid, badge_record.id);
        END IF;
      WHEN 'quizzes' THEN
        IF completed_quizzes >= badge_record.condition_value THEN
          INSERT INTO user_badges (user_id, badge_id) VALUES (user_uuid, badge_record.id);
        END IF;
    END CASE;
  END LOOP;
END;
$$;