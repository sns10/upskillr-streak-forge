-- Update quiz_attempts table for mastery-based system
ALTER TABLE public.quiz_attempts 
ADD COLUMN status TEXT DEFAULT 'In Progress' CHECK (status IN ('In Progress', 'Mastered'));

-- Rename student_answers to user_answers for consistency
ALTER TABLE public.student_answers RENAME TO user_answers;