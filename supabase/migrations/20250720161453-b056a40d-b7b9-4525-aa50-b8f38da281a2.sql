
-- Add new columns for separate test inputs and outputs
ALTER TABLE public.coding_assignments 
ADD COLUMN test_inputs JSONB DEFAULT '[]'::jsonb,
ADD COLUMN test_outputs JSONB DEFAULT '[]'::jsonb;

-- Migrate existing test_cases data to the new format
UPDATE public.coding_assignments 
SET 
  test_inputs = (
    SELECT jsonb_agg(test_case->'input') 
    FROM jsonb_array_elements(test_cases) AS test_case
  ),
  test_outputs = (
    SELECT jsonb_agg(test_case->'expected') 
    FROM jsonb_array_elements(test_cases) AS test_case
  )
WHERE test_cases != '[]'::jsonb AND test_cases IS NOT NULL;

-- Add a comment to track the migration
COMMENT ON COLUMN public.coding_assignments.test_inputs IS 'Array of test case inputs';
COMMENT ON COLUMN public.coding_assignments.test_outputs IS 'Array of expected test case outputs';
