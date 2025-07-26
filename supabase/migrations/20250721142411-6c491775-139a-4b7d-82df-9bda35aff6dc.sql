
-- Add activity tracking table for comprehensive student analytics
CREATE TABLE public.student_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  activity_type TEXT NOT NULL, -- 'lesson_view', 'quiz_attempt', 'assignment_submit', 'login'
  activity_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on student activities
ALTER TABLE public.student_activities ENABLE ROW LEVEL SECURITY;

-- Create policies for student activities
CREATE POLICY "Admins can view all activities" 
  ON public.student_activities 
  FOR SELECT 
  USING (is_current_user_admin());

CREATE POLICY "Users can create their own activities" 
  ON public.student_activities 
  FOR INSERT 
  WITH CHECK (auth.uid() = student_id);

-- Add indexes for better performance
CREATE INDEX idx_student_activities_student_id ON public.student_activities(student_id);
CREATE INDEX idx_student_activities_type_date ON public.student_activities(activity_type, created_at);

-- Create function to calculate student progress
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
    COUNT(s.id)::INTEGER as completed_lessons,
    CASE 
      WHEN COUNT(l.id) > 0 THEN ROUND((COUNT(s.id)::NUMERIC / COUNT(l.id)::NUMERIC) * 100, 2)
      ELSE 0
    END as progress_percentage
  FROM courses c
  LEFT JOIN lessons l ON c.id = l.course_id
  LEFT JOIN submissions s ON l.id::TEXT = s.assignment_id AND s.student_id = student_uuid AND s.is_correct = true
  GROUP BY c.id, c.title
  ORDER BY c.title;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get student performance analytics
CREATE OR REPLACE FUNCTION public.get_student_analytics(student_uuid UUID)
RETURNS TABLE (
  total_quizzes INTEGER,
  completed_quizzes INTEGER,
  average_score NUMERIC,
  total_assignments INTEGER,
  correct_assignments INTEGER,
  success_rate NUMERIC,
  current_streak INTEGER,
  longest_streak INTEGER,
  days_active INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*)::INTEGER FROM quizzes) as total_quizzes,
    (SELECT COUNT(DISTINCT quiz_id)::INTEGER FROM quiz_attempts WHERE user_id = student_uuid) as completed_quizzes,
    (SELECT ROUND(AVG(score), 2) FROM quiz_attempts WHERE user_id = student_uuid) as average_score,
    (SELECT COUNT(*)::INTEGER FROM submissions WHERE student_id = student_uuid) as total_assignments,
    (SELECT COUNT(*)::INTEGER FROM submissions WHERE student_id = student_uuid AND is_correct = true) as correct_assignments,
    (SELECT 
      CASE 
        WHEN COUNT(*) > 0 THEN ROUND((COUNT(*) FILTER (WHERE is_correct = true)::NUMERIC / COUNT(*)::NUMERIC) * 100, 2)
        ELSE 0
      END
     FROM submissions WHERE student_id = student_uuid) as success_rate,
    (SELECT streak FROM user_profiles WHERE id = student_uuid) as current_streak,
    (SELECT streak FROM user_profiles WHERE id = student_uuid) as longest_streak, -- Simplified for now
    (SELECT COUNT(DISTINCT DATE(created_at))::INTEGER FROM student_activities WHERE student_id = student_uuid) as days_active;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
