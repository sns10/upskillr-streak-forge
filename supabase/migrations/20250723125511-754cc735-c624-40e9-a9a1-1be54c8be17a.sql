-- Fix the progress calculation function to handle different lesson types and track activities properly

-- Update get_student_progress function to handle video lessons and coding assignments
CREATE OR REPLACE FUNCTION public.get_student_progress(student_uuid UUID)
RETURNS TABLE (
  course_id UUID,
  course_title TEXT,
  total_lessons INTEGER,
  completed_lessons INTEGER,
  progress_percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as course_id,
    c.title as course_title,
    COUNT(l.id)::INTEGER as total_lessons,
    COUNT(CASE 
      WHEN l.lesson_type = 'video' AND EXISTS (
        SELECT 1 FROM submissions s 
        WHERE s.assignment_id = ('video_' || l.id::TEXT) 
        AND s.student_id = student_uuid 
        AND s.is_correct = true
      ) THEN 1
      WHEN l.lesson_type = 'coding' AND EXISTS (
        SELECT 1 FROM submissions s 
        WHERE s.assignment_id = l.id::TEXT
        AND s.student_id = student_uuid 
        AND s.is_correct = true
      ) THEN 1
      WHEN l.lesson_type = 'quiz' AND EXISTS (
        SELECT 1 FROM quiz_attempts qa
        JOIN quizzes q ON qa.quiz_id = q.id
        WHERE q.lesson_id = l.id
        AND qa.user_id = student_uuid
        AND qa.score >= q.passing_score
      ) THEN 1
    END)::INTEGER as completed_lessons,
    CASE 
      WHEN COUNT(l.id) > 0 THEN ROUND((COUNT(CASE 
        WHEN l.lesson_type = 'video' AND EXISTS (
          SELECT 1 FROM submissions s 
          WHERE s.assignment_id = ('video_' || l.id::TEXT) 
          AND s.student_id = student_uuid 
          AND s.is_correct = true
        ) THEN 1
        WHEN l.lesson_type = 'coding' AND EXISTS (
          SELECT 1 FROM submissions s 
          WHERE s.assignment_id = l.id::TEXT
          AND s.student_id = student_uuid 
          AND s.is_correct = true
        ) THEN 1
        WHEN l.lesson_type = 'quiz' AND EXISTS (
          SELECT 1 FROM quiz_attempts qa
          JOIN quizzes q ON qa.quiz_id = q.id
          WHERE q.lesson_id = l.id
          AND qa.user_id = student_uuid
          AND qa.score >= q.passing_score
        ) THEN 1
      END)::NUMERIC / COUNT(l.id)::NUMERIC) * 100, 2)
      ELSE 0
    END as progress_percentage
  FROM courses c
  LEFT JOIN lessons l ON c.id = l.course_id
  GROUP BY c.id, c.title
  ORDER BY c.title;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to update user activity and last activity date
CREATE OR REPLACE FUNCTION public.track_user_activity(
  user_uuid UUID,
  activity_type_param TEXT,
  activity_data_param JSONB DEFAULT '{}'
)
RETURNS VOID AS $$
BEGIN
  -- Insert into student_activities
  INSERT INTO public.student_activities (student_id, activity_type, activity_data)
  VALUES (user_uuid, activity_type_param, activity_data_param);
  
  -- Update last_activity_date in user_profiles
  UPDATE public.user_profiles 
  SET last_activity_date = CURRENT_DATE,
      updated_at = NOW()
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to automatically track lesson completion activities
CREATE OR REPLACE FUNCTION public.track_submission_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Track assignment submission activity
  IF NEW.assignment_id LIKE 'video_%' THEN
    PERFORM track_user_activity(
      NEW.student_id,
      'lesson_view',
      jsonb_build_object(
        'lesson_id', REPLACE(NEW.assignment_id, 'video_', ''),
        'lesson_type', 'video',
        'completed', NEW.is_correct
      )
    );
  ELSE
    PERFORM track_user_activity(
      NEW.student_id,
      'assignment_submit',
      jsonb_build_object(
        'assignment_id', NEW.assignment_id,
        'is_correct', NEW.is_correct
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for submissions
CREATE TRIGGER track_submission_activity_trigger
  AFTER INSERT ON public.submissions
  FOR EACH ROW
  EXECUTE FUNCTION track_submission_activity();

-- Create a trigger to track quiz attempts
CREATE OR REPLACE FUNCTION public.track_quiz_activity()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM track_user_activity(
    NEW.user_id,
    'quiz_attempt',
    jsonb_build_object(
      'quiz_id', NEW.quiz_id,
      'score', NEW.score,
      'passed', NEW.score >= 70
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for quiz attempts
CREATE TRIGGER track_quiz_activity_trigger
  AFTER INSERT ON public.quiz_attempts
  FOR EACH ROW
  EXECUTE FUNCTION track_quiz_activity();

-- Update existing users' last_activity_date based on their latest submission or quiz attempt
UPDATE public.user_profiles 
SET last_activity_date = COALESCE(
  (SELECT MAX(submitted_at::DATE) 
   FROM submissions 
   WHERE student_id = user_profiles.id),
  (SELECT MAX(completed_at::DATE) 
   FROM quiz_attempts 
   WHERE user_id = user_profiles.id)
)
WHERE last_activity_date IS NULL;