-- Update lesson_type enum to include 'quiz'
ALTER TYPE lesson_type ADD VALUE 'quiz';

-- Create Quiz table
CREATE TABLE public.quizzes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  time_limit_minutes INTEGER, -- Optional time limit
  passing_score INTEGER NOT NULL DEFAULT 70, -- Percentage needed to pass
  max_attempts INTEGER DEFAULT 3, -- Maximum number of attempts allowed
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Questions table
CREATE TABLE public.questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'multiple_choice', -- multiple_choice, true_false, etc.
  points INTEGER NOT NULL DEFAULT 1,
  order_num INTEGER NOT NULL,
  remedial_lesson_id UUID REFERENCES public.lessons(id) ON DELETE SET NULL, -- Optional remedial lesson
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Answers table
CREATE TABLE public.answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  order_num INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Quiz Attempts table
CREATE TABLE public.quiz_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  score INTEGER NOT NULL, -- Percentage score
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  time_taken_minutes INTEGER, -- Actual time taken
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  attempt_number INTEGER NOT NULL DEFAULT 1
);

-- Create Student Answers table to track individual question responses
CREATE TABLE public.student_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_attempt_id UUID NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  selected_answer_id UUID REFERENCES public.answers(id) ON DELETE SET NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_answers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for quizzes
CREATE POLICY "Authenticated users can view quizzes" ON public.quizzes
FOR SELECT USING (true);

CREATE POLICY "Admins can manage quizzes" ON public.quizzes
FOR ALL USING (is_current_user_admin());

-- Create RLS policies for questions
CREATE POLICY "Authenticated users can view questions" ON public.questions
FOR SELECT USING (true);

CREATE POLICY "Admins can manage questions" ON public.questions
FOR ALL USING (is_current_user_admin());

-- Create RLS policies for answers
CREATE POLICY "Authenticated users can view answers" ON public.answers
FOR SELECT USING (true);

CREATE POLICY "Admins can manage answers" ON public.answers
FOR ALL USING (is_current_user_admin());

-- Create RLS policies for quiz attempts
CREATE POLICY "Users can view their own quiz attempts" ON public.quiz_attempts
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own quiz attempts" ON public.quiz_attempts
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all quiz attempts" ON public.quiz_attempts
FOR SELECT USING (is_current_user_admin());

-- Create RLS policies for student answers
CREATE POLICY "Users can view their own student answers" ON public.student_answers
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.quiz_attempts qa 
    WHERE qa.id = quiz_attempt_id AND qa.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create their own student answers" ON public.student_answers
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.quiz_attempts qa 
    WHERE qa.id = quiz_attempt_id AND qa.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all student answers" ON public.student_answers
FOR SELECT USING (is_current_user_admin());

-- Create indexes for better performance
CREATE INDEX idx_quizzes_lesson_id ON public.quizzes(lesson_id);
CREATE INDEX idx_questions_quiz_id ON public.questions(quiz_id);
CREATE INDEX idx_questions_remedial_lesson ON public.questions(remedial_lesson_id);
CREATE INDEX idx_answers_question_id ON public.answers(question_id);
CREATE INDEX idx_quiz_attempts_user_quiz ON public.quiz_attempts(user_id, quiz_id);
CREATE INDEX idx_student_answers_attempt ON public.student_answers(quiz_attempt_id);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_quizzes_updated_at BEFORE UPDATE ON public.quizzes
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON public.questions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_answers_updated_at BEFORE UPDATE ON public.answers
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();