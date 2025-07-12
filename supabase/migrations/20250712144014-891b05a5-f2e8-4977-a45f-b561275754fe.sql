
-- Update the existing user role from 'student' to 'admin'
UPDATE public.user_roles 
SET role = 'admin'::app_role 
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'student@upskillr.com'
);
