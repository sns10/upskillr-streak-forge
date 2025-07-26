
-- Create enum for lesson types
CREATE TYPE public.lesson_type AS ENUM ('video', 'coding');

-- Create batches table
CREATE TABLE public.batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_name TEXT NOT NULL,
  start_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user profiles table (extending auth.users)
CREATE TABLE public.user_profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  batch_id UUID REFERENCES public.batches(id),
  xp INTEGER NOT NULL DEFAULT 0,
  bits INTEGER NOT NULL DEFAULT 0,
  streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create courses table
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lessons table
CREATE TABLE public.lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  order_num INTEGER NOT NULL,
  lesson_type lesson_type NOT NULL,
  video_url TEXT,
  xp_reward INTEGER NOT NULL DEFAULT 0,
  bits_reward INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create coding assignments table
CREATE TABLE public.coding_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  problem_statement TEXT NOT NULL,
  test_cases JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create submissions table
CREATE TABLE public.submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  assignment_id UUID NOT NULL REFERENCES public.coding_assignments(id) ON DELETE CASCADE,
  submitted_code TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coding_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for batches (readable by all authenticated users)
CREATE POLICY "Authenticated users can view batches" ON public.batches
  FOR SELECT TO authenticated USING (true);

-- Create RLS policies for user_profiles
CREATE POLICY "Users can view their own profile" ON public.user_profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.user_profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.user_profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Create RLS policies for courses (readable by all authenticated users)
CREATE POLICY "Authenticated users can view courses" ON public.courses
  FOR SELECT TO authenticated USING (true);

-- Create RLS policies for lessons (readable by all authenticated users)
CREATE POLICY "Authenticated users can view lessons" ON public.lessons
  FOR SELECT TO authenticated USING (true);

-- Create RLS policies for coding assignments (readable by all authenticated users)
CREATE POLICY "Authenticated users can view coding assignments" ON public.coding_assignments
  FOR SELECT TO authenticated USING (true);

-- Create RLS policies for submissions
CREATE POLICY "Users can view their own submissions" ON public.submissions
  FOR SELECT TO authenticated USING (auth.uid() = student_id);

CREATE POLICY "Users can create their own submissions" ON public.submissions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);

-- Create trigger to auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample data
INSERT INTO public.batches (batch_name, start_date) VALUES
  ('Web Development Bootcamp 2024', '2024-01-15'),
  ('Data Science Intensive', '2024-02-01'),
  ('Mobile App Development', '2024-03-01');

INSERT INTO public.courses (title, description, image_url) VALUES
  ('JavaScript Fundamentals', 'Master the basics of JavaScript programming', 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400'),
  ('React Development', 'Build modern web applications with React', 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400'),
  ('Python for Beginners', 'Learn Python programming from scratch', 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=400');

-- Get course IDs for lessons
DO $$
DECLARE
    js_course_id UUID;
    react_course_id UUID;
    python_course_id UUID;
BEGIN
    SELECT id INTO js_course_id FROM public.courses WHERE title = 'JavaScript Fundamentals';
    SELECT id INTO react_course_id FROM public.courses WHERE title = 'React Development';
    SELECT id INTO python_course_id FROM public.courses WHERE title = 'Python for Beginners';

    -- JavaScript lessons
    INSERT INTO public.lessons (title, course_id, order_num, lesson_type, video_url, xp_reward, bits_reward) VALUES
      ('Introduction to JavaScript', js_course_id, 1, 'video', 'https://example.com/video1', 100, 10),
      ('Variables and Data Types', js_course_id, 2, 'coding', NULL, 150, 15),
      ('Functions and Scope', js_course_id, 3, 'coding', NULL, 200, 20);

    -- React lessons
    INSERT INTO public.lessons (title, course_id, order_num, lesson_type, video_url, xp_reward, bits_reward) VALUES
      ('React Basics', react_course_id, 1, 'video', 'https://example.com/video2', 100, 10),
      ('Components and Props', react_course_id, 2, 'coding', NULL, 150, 15);

    -- Python lessons
    INSERT INTO public.lessons (title, course_id, order_num, lesson_type, video_url, xp_reward, bits_reward) VALUES
      ('Python Syntax', python_course_id, 1, 'video', 'https://example.com/video3', 100, 10),
      ('Data Structures', python_course_id, 2, 'coding', NULL, 150, 15);
END $$;
