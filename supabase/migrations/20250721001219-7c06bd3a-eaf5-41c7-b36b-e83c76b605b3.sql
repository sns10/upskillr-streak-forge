-- Drop the foreign key constraint to allow text assignment_id for video lessons
ALTER TABLE public.submissions DROP CONSTRAINT IF EXISTS submissions_assignment_id_fkey;

-- Now change the column type to text
ALTER TABLE public.submissions ALTER COLUMN assignment_id TYPE text;