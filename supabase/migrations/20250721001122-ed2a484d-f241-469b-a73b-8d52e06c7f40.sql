-- Modify assignment_id column to accept text instead of UUID for video lessons
ALTER TABLE public.submissions ALTER COLUMN assignment_id TYPE text;