-- Add a new RLS policy to allow users to view basic leaderboard data from all users
CREATE POLICY "Users can view leaderboard data from all profiles" 
ON public.user_profiles 
FOR SELECT 
USING (true);