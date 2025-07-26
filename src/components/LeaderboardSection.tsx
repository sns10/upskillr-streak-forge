import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Medal, Award, Flame, Zap, Users, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LeaderboardUser {
  id: string;
  name: string;
  xp: number;
  streak: number;
  bits: number;
  batch_id?: string;
  batch_name?: string;
}

interface Batch {
  id: string;
  batch_name: string;
}

interface LeaderboardSectionProps {
  currentUserId?: string;
}

export const LeaderboardSection = ({ currentUserId }: LeaderboardSectionProps) => {
  const [allUsers, setAllUsers] = useState<LeaderboardUser[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchLeaderboards();
    
    // Set up real-time subscription for profile updates
    const channel = supabase
      .channel('global-leaderboard-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_profiles'
        },
        () => {
          fetchLeaderboards();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchLeaderboards = async () => {
    try {
      // Fetch all user profiles with batch information
      const { data: profilesData, error: profilesError } = await supabase
        .from("user_profiles")
        .select(`
          id, 
          name, 
          xp, 
          streak, 
          bits,
          batch_id
        `)
        .order("xp", { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all batches for the filter dropdown
      const { data: batchesData, error: batchesError } = await supabase
        .from("batches")
        .select("id, batch_name")
        .order("batch_name");

      if (batchesError) throw batchesError;

      const users = profilesData?.map(user => {
        const userBatch = batchesData?.find(batch => batch.id === user.batch_id);
        return {
          ...user,
          batch_name: userBatch?.batch_name || "No Batch"
        };
      }) || [];

      setAllUsers(users);
      setBatches(batchesData || []);

    } catch (error: any) {
      console.error("Error fetching leaderboards:", error);
      toast({
        title: "Error",
        description: "Failed to load leaderboards",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter users based on selected batch
  const getFilteredUsers = (type: 'xp' | 'streak') => {
    let filteredUsers = allUsers;
    
    if (selectedBatch !== "all") {
      filteredUsers = allUsers.filter(user => user.batch_id === selectedBatch);
    }

    if (type === 'streak') {
      return [...filteredUsers].sort((a, b) => b.streak - a.streak);
    }
    
    return filteredUsers; // Already sorted by XP
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return (
          <div className="w-5 h-5 flex items-center justify-center">
            <span className="text-sm font-medium text-gray-500">#{rank}</span>
          </div>
        );
    }
  };

  const LeaderboardList = ({ 
    users, 
    type 
  }: { 
    users: LeaderboardUser[]; 
    type: 'xp' | 'streak' 
  }) => (
    <div className="space-y-3">
      {users.slice(0, 20).map((user, index) => {
        const rank = index + 1;
        const isCurrentUser = user.id === currentUserId;
        
        return (
          <div
            key={user.id}
            className={`flex items-center justify-between p-4 rounded-lg transition-all duration-200 ${
              isCurrentUser 
                ? 'bg-primary/10 border-2 border-primary/20 shadow-md' 
                : 'bg-white hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 flex items-center justify-center">
                {getRankIcon(rank)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className={`font-semibold ${
                    isCurrentUser ? 'text-primary' : 'text-gray-900'
                  }`}>
                    {user.name}
                    {isCurrentUser && <span className="text-sm font-normal text-primary/80">(You)</span>}
                  </h4>
                </div>
                <p className="text-sm text-gray-500">{user.batch_name}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              {type === 'xp' ? (
                <>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-blue-600 font-bold">
                      <Zap className="h-4 w-4" />
                      <span>{user.xp.toLocaleString()} XP</span>
                    </div>
                    <div className="text-sm text-gray-500">{user.bits} bits</div>
                  </div>
                  <div className="flex items-center gap-1 text-orange-500">
                    <Flame className="h-4 w-4" />
                    <span className="font-medium">{user.streak}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-orange-500 font-bold">
                      <Flame className="h-4 w-4" />
                      <span>{user.streak} day streak</span>
                    </div>
                    <div className="text-sm text-gray-500">{user.bits} bits</div>
                  </div>
                  <div className="flex items-center gap-1 text-blue-600">
                    <Zap className="h-4 w-4" />
                    <span className="font-medium">{user.xp.toLocaleString()}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Leaderboards
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
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
          <Trophy className="h-5 w-5 text-yellow-500" />
          Community Leaderboards
        </CardTitle>
        <p className="text-sm text-gray-600">
          See how you rank among all learners in the community
        </p>
      </CardHeader>
      <CardContent>
        {/* Batch Filter */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filter by Batch</span>
          </div>
          <Select value={selectedBatch} onValueChange={setSelectedBatch}>
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue placeholder="Select batch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Batches</SelectItem>
              {batches.map(batch => (
                <SelectItem key={batch.id} value={batch.id}>
                  {batch.batch_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="xp" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="xp" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              XP Leaderboard
            </TabsTrigger>
            <TabsTrigger value="streak" className="flex items-center gap-2">
              <Flame className="h-4 w-4" />
              Streak Leaderboard
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="xp" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Top XP Earners</h3>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Users className="h-4 w-4" />
                  <span>{getFilteredUsers('xp').length} learners</span>
                </div>
              </div>
              <LeaderboardList users={getFilteredUsers('xp')} type="xp" />
            </div>
          </TabsContent>
          
          <TabsContent value="streak" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Longest Streaks</h3>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Users className="h-4 w-4" />
                  <span>{getFilteredUsers('streak').length} learners</span>
                </div>
              </div>
              <LeaderboardList users={getFilteredUsers('streak')} type="streak" />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};