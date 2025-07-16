-- Add assignment_type to assignments table
ALTER TABLE public.assignments 
ADD COLUMN assignment_type text NOT NULL DEFAULT 'regular' 
CHECK (assignment_type IN ('regular', 'coding'));

-- Add coding-specific fields to assignments table
ALTER TABLE public.assignments 
ADD COLUMN programming_language text,
ADD COLUMN starter_code text,
ADD COLUMN template_code text;

-- Create test_cases table for coding assignments
CREATE TABLE public.test_cases (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id uuid NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  input_data text NOT NULL,
  expected_output text NOT NULL,
  is_hidden boolean NOT NULL DEFAULT false,
  points integer NOT NULL DEFAULT 1,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on test_cases table
ALTER TABLE public.test_cases ENABLE ROW LEVEL SECURITY;

-- Create policies for test_cases
CREATE POLICY "Admins can manage test cases" 
ON public.test_cases 
FOR ALL 
USING (get_current_user_role() = 'admin'::app_role);

CREATE POLICY "Users can view non-hidden test cases for accessible assignments" 
ON public.test_cases 
FOR SELECT 
USING (
  NOT is_hidden AND 
  EXISTS (
    SELECT 1 FROM assignments a
    JOIN lessons l ON l.id = a.lesson_id
    JOIN modules m ON m.id = l.module_id
    JOIN courses c ON c.id = m.course_id
    WHERE a.id = test_cases.assignment_id 
    AND (c.status = 'published'::course_status OR get_current_user_role() = 'admin'::app_role)
  )
);

-- Add test_results to assignment_submissions table
ALTER TABLE public.assignment_submissions 
ADD COLUMN test_results jsonb,
ADD COLUMN passed_tests integer DEFAULT 0,
ADD COLUMN total_tests integer DEFAULT 0,
ADD COLUMN auto_grade integer;