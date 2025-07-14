-- Create assignments table
CREATE TABLE public.assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT NOT NULL,
  max_file_size INTEGER, -- in bytes
  allowed_file_types TEXT[], -- array of file extensions
  due_date TIMESTAMP WITH TIME ZONE,
  xp_reward INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create assignment_submissions table
CREATE TABLE public.assignment_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID NOT NULL,
  user_id UUID NOT NULL,
  text_submission TEXT,
  file_url TEXT,
  file_name TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  grade INTEGER, -- percentage grade
  feedback TEXT,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded', 'returned'))
);

-- Create quiz_results table to track quiz attempts
CREATE TABLE public.quiz_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL,
  user_id UUID NOT NULL,
  score INTEGER NOT NULL, -- percentage score
  answers INTEGER[] NOT NULL, -- array of selected answer indices
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;

-- RLS policies for assignments
CREATE POLICY "Admins can manage assignments" 
ON public.assignments 
FOR ALL 
USING (get_current_user_role() = 'admin'::app_role);

CREATE POLICY "Users can view assignments of accessible lessons" 
ON public.assignments 
FOR SELECT 
USING (EXISTS (
  SELECT 1
  FROM lessons
  JOIN modules ON modules.id = lessons.module_id
  JOIN courses ON courses.id = modules.course_id
  WHERE lessons.id = assignments.lesson_id 
    AND (courses.status = 'published'::course_status OR get_current_user_role() = 'admin'::app_role)
));

-- RLS policies for assignment_submissions
CREATE POLICY "Admins can view all assignment submissions" 
ON public.assignment_submissions 
FOR SELECT 
USING (get_current_user_role() = 'admin'::app_role);

CREATE POLICY "Users can submit their own assignments" 
ON public.assignment_submissions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own submissions" 
ON public.assignment_submissions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can update submissions for grading" 
ON public.assignment_submissions 
FOR UPDATE 
USING (get_current_user_role() = 'admin'::app_role);

-- RLS policies for quiz_results
CREATE POLICY "Admins can view all quiz results" 
ON public.quiz_results 
FOR SELECT 
USING (get_current_user_role() = 'admin'::app_role);

CREATE POLICY "Users can submit their own quiz results" 
ON public.quiz_results 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own quiz results" 
ON public.quiz_results 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create storage bucket for assignment files
INSERT INTO storage.buckets (id, name, public) VALUES ('assignment-files', 'assignment-files', false);

-- Storage policies for assignment files
CREATE POLICY "Users can upload their own assignment files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'assignment-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own assignment files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'assignment-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all assignment files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'assignment-files' AND get_current_user_role() = 'admin'::app_role);