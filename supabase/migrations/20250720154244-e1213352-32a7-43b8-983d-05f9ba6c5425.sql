
-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('admin', 'student');

-- Create user_roles table to manage role assignments
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'student',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles table
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.user_roles WHERE user_id = user_uuid LIMIT 1;
$$;

-- Create helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own role" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.is_current_user_admin());

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.is_current_user_admin());

-- Update existing table policies to allow admin access

-- Courses: Allow admins to manage courses
CREATE POLICY "Admins can manage courses" ON public.courses
  FOR ALL TO authenticated USING (public.is_current_user_admin());

-- Lessons: Allow admins to manage lessons  
CREATE POLICY "Admins can manage lessons" ON public.lessons
  FOR ALL TO authenticated USING (public.is_current_user_admin());

-- Coding assignments: Allow admins to manage assignments
CREATE POLICY "Admins can manage coding assignments" ON public.coding_assignments
  FOR ALL TO authenticated USING (public.is_current_user_admin());

-- Batches: Allow admins to manage batches
CREATE POLICY "Admins can manage batches" ON public.batches
  FOR ALL TO authenticated USING (public.is_current_user_admin());

-- User profiles: Allow admins to view and update user profiles
CREATE POLICY "Admins can view all profiles" ON public.user_profiles
  FOR SELECT TO authenticated USING (public.is_current_user_admin());

CREATE POLICY "Admins can update profiles" ON public.user_profiles
  FOR UPDATE TO authenticated USING (public.is_current_user_admin());

-- Update the user creation trigger to assign default student role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create user profile
  INSERT INTO public.user_profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    NEW.email
  );
  
  -- Assign default student role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert a test admin user role (replace with actual user ID after signup)
-- This will need to be updated with a real user ID after someone signs up
-- INSERT INTO public.user_roles (user_id, role) VALUES ('your-user-id-here', 'admin');
