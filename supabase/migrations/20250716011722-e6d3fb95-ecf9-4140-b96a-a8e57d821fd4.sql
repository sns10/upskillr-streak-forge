-- Fix security warnings by setting search_path on all functions

-- Update check_and_award_badges function
CREATE OR REPLACE FUNCTION public.check_and_award_badges(user_uuid uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

-- Update get_user_role function
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid uuid)
 RETURNS app_role
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT role FROM public.user_roles WHERE user_id = user_uuid LIMIT 1;
$function$;

-- Update get_current_user_role function
CREATE OR REPLACE FUNCTION public.get_current_user_role()
 RETURNS app_role
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT public.get_user_role(auth.uid());
$function$;

-- Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Insert into profiles table
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  
  -- Insert default student role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student');
  
  -- Initialize streak record
  INSERT INTO public.streaks (user_id, current_streak, longest_streak)
  VALUES (NEW.id, 0, 0);
  
  RETURN NEW;
END;
$function$;