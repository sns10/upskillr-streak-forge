import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Medal, Award } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface LeaderboardUser {
  id: string;
  full_name: string;
  totalXP: number;
  current_streak: number;
}

const LeaderboardCard = () => {
  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ['public-leaderboard'],
    queryFn: async () => {
      // Get all user XP records
      const { data: xpData, error: xpError } = await supabase
        .from('user_xp')
        .select('user_id, amount');

      if (xpError) throw xpError;

      // Calculate total XP per user
      const userXpTotals: Record<string, number> = {};
      xpData?.forEach(record => {
        userXpTotals[record.user_id] = (userXpTotals[record.user_id] || 0) + record.amount;
      });

      // Get top 5 users for public display
      const topUsers = Object.entries(userXpTotals)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

      if (!topUsers.length) return [];

      // Get profiles and streaks for top users
      const leaderboardPromises = topUsers.map(async ([userId, totalXP]) => {
        const [profileResult, streakResult] = await Promise.all([
          supabase
            .from('profiles')
            .select('id, full_name')
            .eq('id', userId)
            .maybeSingle(),
          supabase
            .from('streaks')
            .select('current_streak')
            .eq('user_id', userId)
            .maybeSingle()
        ]);

        if (profileResult.data) {
          return {
            ...profileResult.data,
            totalXP,
            current_streak: streakResult.data?.current_streak || 0
          } as LeaderboardUser;
        }
        return null;
      });

      const results = await Promise.all(leaderboardPromises);
      return results.filter(Boolean) as LeaderboardUser[];
    }
  });

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-orange-500" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-gray-600">{rank}</span>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-3 p-2 animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {leaderboard?.length ? (
            leaderboard.map((user, index) => (
              <div key={user.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
                <div className="flex items-center justify-center w-8 h-8">
                  {getRankIcon(index + 1)}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {user.full_name || 'Student'}
                  </p>
                  <div className="flex items-center space-x-3 text-sm text-gray-600">
                    <span>{user.totalXP} XP</span>
                    <span>🔥 {user.current_streak}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">No users yet</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LeaderboardCard;