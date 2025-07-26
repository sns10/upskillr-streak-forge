
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Medal, Award, Flame } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BatchLeaderboardCardProps {
  profile: any;
}

interface LeaderboardEntry {
  id: string;
  name: string;
  xp: number;
  streak: number;
  bits: number;
  rank: number;
  completed_assignments: number;
}

export const BatchLeaderboardCard = ({ profile }: BatchLeaderboardCardProps) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (profile?.batch_id) {
      fetchBatchLeaderboard();
      
      // Set up real-time subscription for profile updates
      const channel = supabase
        .channel('leaderboard-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_profiles',
            filter: `batch_id=eq.${profile.batch_id}`
          },
          () => {
            // Refetch leaderboard when any profile in the batch updates
            fetchBatchLeaderboard();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'submissions'
          },
          () => {
            // Refetch when submissions change (affects completed assignments)
            fetchBatchLeaderboard();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setLoading(false);
    }
  }, [profile?.batch_id]);

  const fetchBatchLeaderboard = async () => {
    try {
      setLoading(true);
      // Get batch members with their stats
      const { data: profilesData, error: profilesError } = await supabase
        .from("user_profiles")
        .select("id, name, xp, streak, bits")
        .eq("batch_id", profile.batch_id)
        .order("xp", { ascending: false });

      if (profilesError) throw profilesError;

      // Get completed assignments count for each user
      const { data: submissionsData, error: submissionsError } = await supabase
        .from("submissions")
        .select("student_id, assignment_id")
        .eq("is_correct", true)
        .in("student_id", profilesData?.map(p => p.id) || []);

      if (submissionsError) throw submissionsError;

      // Count completed assignments per user
      const completedCounts = submissionsData?.reduce((acc, submission) => {
        acc[submission.student_id] = (acc[submission.student_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const formattedLeaderboard = profilesData?.map((user, index) => ({
        ...user,
        rank: index + 1,
        completed_assignments: completedCounts[user.id] || 0
      })) || [];

      setLeaderboard(formattedLeaderboard);
    } catch (error: any) {
      console.error("Error fetching batch leaderboard:", error);
      toast({
        title: "Error",
        description: "Failed to load batch leaderboard",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-4 w-4 text-yellow-500" />;
      case 2:
        return <Medal className="h-4 w-4 text-gray-400" />;
      case 3:
        return <Award className="h-4 w-4 text-amber-600" />;
      default:
        return <span className="text-sm font-medium text-gray-500">#{rank}</span>;
    }
  };

  if (!profile?.batch_id) {
    return (
      <Card className="bg-white shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Batch Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No batch assigned</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-gray-900">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Batch Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : leaderboard.length > 0 ? (
          <div className="space-y-3">
            {leaderboard.map((user) => (
              <div
                key={user.id}
                className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                  user.id === profile.id 
                    ? 'bg-blue-50 border-l-4 border-blue-500' 
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 flex items-center justify-center">
                    {getRankIcon(user.rank)}
                  </div>
                  <div>
                    <h4 className={`font-medium ${
                      user.id === profile.id ? 'text-blue-900' : 'text-gray-900'
                    }`}>
                      {user.name} {user.id === profile.id && '(You)'}
                    </h4>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Flame className="h-3 w-3 text-orange-500" />
                        <span>{user.streak} streak</span>
                      </div>
                      <span>•</span>
                      <span>{user.completed_assignments} completed</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-blue-600">{user.xp} XP</div>
                  <div className="text-sm text-gray-500">{user.bits} bits</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No batch members found</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
