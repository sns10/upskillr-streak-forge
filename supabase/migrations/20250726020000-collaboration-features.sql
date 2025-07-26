-- Create collaboration_messages table
CREATE TABLE IF NOT EXISTS collaboration_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  sender_avatar TEXT,
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'code', 'system')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create study_groups table
CREATE TABLE IF NOT EXISTS study_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  member_count INTEGER DEFAULT 1,
  max_members INTEGER DEFAULT 10,
  is_public BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tags TEXT[] DEFAULT '{}'
);

-- Create study_group_members table
CREATE TABLE IF NOT EXISTS study_group_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES study_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  UNIQUE(group_id, user_id)
);

-- Create code_reviews table
CREATE TABLE IF NOT EXISTS code_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL,
  language TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  likes INTEGER DEFAULT 0,
  dislikes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'closed'))
);

-- Create code_review_comments table
CREATE TABLE IF NOT EXISTS code_review_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID REFERENCES code_reviews(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies for collaboration_messages
ALTER TABLE collaboration_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all public messages" ON collaboration_messages
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own messages" ON collaboration_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their own messages" ON collaboration_messages
  FOR UPDATE USING (auth.uid() = sender_id);

CREATE POLICY "Users can delete their own messages" ON collaboration_messages
  FOR DELETE USING (auth.uid() = sender_id);

-- Create RLS policies for study_groups
ALTER TABLE study_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view public groups" ON study_groups
  FOR SELECT USING (is_public = true OR auth.uid() = created_by);

CREATE POLICY "Users can create groups" ON study_groups
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group creators can update their groups" ON study_groups
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Group creators can delete their groups" ON study_groups
  FOR DELETE USING (auth.uid() = created_by);

-- Create RLS policies for study_group_members
ALTER TABLE study_group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view group members" ON study_group_members
  FOR SELECT USING (true);

CREATE POLICY "Users can join groups" ON study_group_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave groups" ON study_group_members
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for code_reviews
ALTER TABLE code_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all code reviews" ON code_reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can create code reviews" ON code_reviews
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their reviews" ON code_reviews
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete their reviews" ON code_reviews
  FOR DELETE USING (auth.uid() = author_id);

-- Create RLS policies for code_review_comments
ALTER TABLE code_review_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all comments" ON code_review_comments
  FOR SELECT USING (true);

CREATE POLICY "Users can create comments" ON code_review_comments
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their comments" ON code_review_comments
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete their comments" ON code_review_comments
  FOR DELETE USING (auth.uid() = author_id);

-- Create functions for collaboration features

-- Function to increment likes/dislikes
CREATE OR REPLACE FUNCTION increment()
RETURNS INTEGER AS $$
BEGIN
  RETURN 1;
END;
$$ LANGUAGE plpgsql;

-- Function to get collaboration stats
CREATE OR REPLACE FUNCTION get_collaboration_stats(user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_messages', (SELECT COUNT(*) FROM collaboration_messages WHERE sender_id = user_id),
    'total_groups', (SELECT COUNT(*) FROM study_group_members WHERE user_id = user_id),
    'total_reviews', (SELECT COUNT(*) FROM code_reviews WHERE author_id = user_id),
    'total_likes', (SELECT COALESCE(SUM(likes), 0) FROM code_reviews WHERE author_id = user_id),
    'total_comments', (SELECT COUNT(*) FROM code_review_comments WHERE author_id = user_id)
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to join a study group
CREATE OR REPLACE FUNCTION join_study_group(group_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  group_record study_groups%ROWTYPE;
BEGIN
  -- Get group info
  SELECT * INTO group_record FROM study_groups WHERE id = group_id;
  
  -- Check if group exists and has space
  IF group_record IS NULL THEN
    RETURN FALSE;
  END IF;
  
  IF group_record.member_count >= group_record.max_members THEN
    RETURN FALSE;
  END IF;
  
  -- Check if user is already a member
  IF EXISTS (SELECT 1 FROM study_group_members WHERE group_id = group_id AND user_id = user_id) THEN
    RETURN FALSE;
  END IF;
  
  -- Add user to group
  INSERT INTO study_group_members (group_id, user_id) VALUES (group_id, user_id);
  
  -- Update member count
  UPDATE study_groups SET member_count = member_count + 1 WHERE id = group_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_collaboration_messages_created_at ON collaboration_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_collaboration_messages_sender_id ON collaboration_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_study_groups_created_at ON study_groups(created_at);
CREATE INDEX IF NOT EXISTS idx_study_groups_is_public ON study_groups(is_public);
CREATE INDEX IF NOT EXISTS idx_code_reviews_created_at ON code_reviews(created_at);
CREATE INDEX IF NOT EXISTS idx_code_reviews_author_id ON code_reviews(author_id);
CREATE INDEX IF NOT EXISTS idx_code_reviews_status ON code_reviews(status); 