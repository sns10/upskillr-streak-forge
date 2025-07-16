-- Create adaptive learning tables for smart quiz adaptation

-- Learning profiles to track user learning patterns
CREATE TABLE public.learning_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  learning_speed DECIMAL DEFAULT 1.0, -- Multiplier for pacing
  preferred_difficulty TEXT DEFAULT 'medium', -- easy, medium, hard
  knowledge_retention_rate DECIMAL DEFAULT 0.7, -- 0-1 scale
  response_time_avg INTEGER DEFAULT 30, -- seconds per question average
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Question difficulty and adaptive metadata
CREATE TABLE public.question_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL,
  question_index INTEGER NOT NULL,
  difficulty_level TEXT NOT NULL DEFAULT 'medium', -- easy, medium, hard
  avg_response_time INTEGER DEFAULT 30, -- seconds
  success_rate DECIMAL DEFAULT 0.5, -- 0-1 scale
  times_shown INTEGER DEFAULT 0,
  times_correct INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(quiz_id, question_index)
);

-- User question performance tracking
CREATE TABLE public.user_question_performance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  quiz_id UUID NOT NULL,
  question_index INTEGER NOT NULL,
  response_time INTEGER, -- seconds taken to answer
  is_correct BOOLEAN NOT NULL,
  difficulty_at_time TEXT NOT NULL, -- difficulty when question was shown
  confidence_level INTEGER DEFAULT 3, -- 1-5 scale (future use)
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adaptive quiz sessions for real-time adjustments
CREATE TABLE public.adaptive_quiz_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  quiz_id UUID NOT NULL,
  current_difficulty TEXT NOT NULL DEFAULT 'medium',
  questions_correct INTEGER DEFAULT 0,
  questions_total INTEGER DEFAULT 0,
  consecutive_correct INTEGER DEFAULT 0,
  consecutive_incorrect INTEGER DEFAULT 0,
  session_data JSONB DEFAULT '{}', -- Store adaptive state
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Enable RLS
ALTER TABLE public.learning_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_question_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adaptive_quiz_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for learning_profiles
CREATE POLICY "Users can manage their own learning profile"
ON public.learning_profiles
FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all learning profiles"
ON public.learning_profiles
FOR SELECT
USING (get_current_user_role() = 'admin'::app_role);

-- RLS Policies for question_analytics  
CREATE POLICY "Admins can manage question analytics"
ON public.question_analytics
FOR ALL
USING (get_current_user_role() = 'admin'::app_role);

CREATE POLICY "Anyone can view question analytics"
ON public.question_analytics
FOR SELECT
USING (true);

-- RLS Policies for user_question_performance
CREATE POLICY "Users can view their own question performance"
ON public.user_question_performance
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own question performance"
ON public.user_question_performance
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all question performance"
ON public.user_question_performance
FOR ALL
USING (get_current_user_role() = 'admin'::app_role);

-- RLS Policies for adaptive_quiz_sessions
CREATE POLICY "Users can manage their own quiz sessions"
ON public.adaptive_quiz_sessions
FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all quiz sessions"
ON public.adaptive_quiz_sessions
FOR SELECT
USING (get_current_user_role() = 'admin'::app_role);

-- Function to update learning profile based on performance
CREATE OR REPLACE FUNCTION public.update_learning_profile(
  user_uuid UUID,
  quiz_session_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  session_record RECORD;
  profile_record RECORD;
  avg_response_time INTEGER;
  success_rate DECIMAL;
BEGIN
  -- Get session data
  SELECT * INTO session_record
  FROM adaptive_quiz_sessions
  WHERE id = quiz_session_id AND user_id = user_uuid;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Calculate performance metrics
  SELECT 
    AVG(response_time)::INTEGER,
    AVG(CASE WHEN is_correct THEN 1.0 ELSE 0.0 END)
  INTO avg_response_time, success_rate
  FROM user_question_performance
  WHERE user_id = user_uuid 
    AND quiz_id = session_record.quiz_id;
  
  -- Get or create learning profile
  INSERT INTO learning_profiles (user_id)
  VALUES (user_uuid)
  ON CONFLICT (user_id) DO NOTHING;
  
  SELECT * INTO profile_record
  FROM learning_profiles
  WHERE user_id = user_uuid;
  
  -- Update learning profile with adaptive adjustments
  UPDATE learning_profiles
  SET
    learning_speed = CASE
      WHEN avg_response_time < 15 THEN LEAST(profile_record.learning_speed * 1.1, 2.0)
      WHEN avg_response_time > 60 THEN GREATEST(profile_record.learning_speed * 0.9, 0.5)
      ELSE profile_record.learning_speed
    END,
    preferred_difficulty = CASE
      WHEN success_rate > 0.8 AND session_record.current_difficulty = 'easy' THEN 'medium'
      WHEN success_rate > 0.85 AND session_record.current_difficulty = 'medium' THEN 'hard'
      WHEN success_rate < 0.5 AND session_record.current_difficulty = 'hard' THEN 'medium'
      WHEN success_rate < 0.3 AND session_record.current_difficulty = 'medium' THEN 'easy'
      ELSE session_record.current_difficulty
    END,
    knowledge_retention_rate = CASE
      WHEN success_rate IS NOT NULL THEN (profile_record.knowledge_retention_rate * 0.8 + success_rate * 0.2)
      ELSE profile_record.knowledge_retention_rate
    END,
    response_time_avg = COALESCE(avg_response_time, profile_record.response_time_avg),
    updated_at = now()
  WHERE user_id = user_uuid;
END;
$$;

-- Function to get adaptive difficulty for next question
CREATE OR REPLACE FUNCTION public.get_adaptive_difficulty(
  user_uuid UUID,
  quiz_session_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  session_record RECORD;
  difficulty TEXT;
BEGIN
  -- Get current session state
  SELECT * INTO session_record
  FROM adaptive_quiz_sessions
  WHERE id = quiz_session_id AND user_id = user_uuid;
  
  IF NOT FOUND THEN
    RETURN 'medium';
  END IF;
  
  -- Adaptive difficulty logic
  IF session_record.consecutive_correct >= 3 THEN
    -- Increase difficulty after 3 consecutive correct
    difficulty := CASE session_record.current_difficulty
      WHEN 'easy' THEN 'medium'
      WHEN 'medium' THEN 'hard'
      ELSE 'hard'
    END;
  ELSIF session_record.consecutive_incorrect >= 2 THEN
    -- Decrease difficulty after 2 consecutive incorrect
    difficulty := CASE session_record.current_difficulty
      WHEN 'hard' THEN 'medium'
      WHEN 'medium' THEN 'easy'
      ELSE 'easy'
    END;
  ELSE
    -- Maintain current difficulty
    difficulty := session_record.current_difficulty;
  END IF;
  
  -- Update session with new difficulty
  UPDATE adaptive_quiz_sessions
  SET current_difficulty = difficulty
  WHERE id = quiz_session_id;
  
  RETURN difficulty;
END;
$$;

-- Triggers for automatic updates
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_learning_profiles_updated_at
BEFORE UPDATE ON public.learning_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_question_analytics_updated_at
BEFORE UPDATE ON public.question_analytics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();