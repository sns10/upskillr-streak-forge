
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, Calendar, Target } from "lucide-react";

interface StreakCardProps {
  profile: any;
}

export const StreakCard = ({ profile }: StreakCardProps) => {
  const getStreakMessage = () => {
    const streak = profile?.streak || 0;
    
    if (streak === 0) {
      return "Start your learning journey today!";
    } else if (streak === 1) {
      return "Great start! Keep it up tomorrow to build your streak!";
    } else if (streak < 7) {
      return `Excellent! You're building momentum with ${streak} days!`;
    } else if (streak < 30) {
      return `Amazing dedication! ${streak} days of consistent learning!`;
    } else {
      return `Incredible! You're a learning champion with ${streak} days!`;
    }
  };

  const getStreakColor = () => {
    const streak = profile?.streak || 0;
    
    if (streak === 0) return "text-gray-400";
    if (streak < 7) return "text-orange-500";
    if (streak < 30) return "text-red-500";
    return "text-red-600";
  };

  const getLastActivityInfo = () => {
    if (!profile?.last_activity_date) return null;
    
    const lastActivity = new Date(profile.last_activity_date);
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    
    today.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);
    lastActivity.setHours(0, 0, 0, 0);
    
    if (lastActivity.getTime() === today.getTime()) {
      return "Active today";
    } else if (lastActivity.getTime() === yesterday.getTime()) {
      return "Active yesterday";
    } else {
      return `Last active: ${lastActivity.toLocaleDateString()}`;
    }
  };

  return (
    <Card className="bg-white shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-gray-900">
          <Flame className="h-5 w-5 text-orange-500" />
          Learning Streak
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        <div className="mb-4">
          <div className={`text-5xl font-bold mb-2 ${getStreakColor()}`}>
            {profile?.streak || 0}
          </div>
          <p className="text-gray-600 font-medium">
            {profile?.streak === 1 ? 'Day' : 'Days'} Streak
          </p>
        </div>
        
        <div className="bg-orange-50 rounded-lg p-3 mb-3">
          <p className="text-sm text-orange-700">
            {getStreakMessage()}
          </p>
        </div>

        {getLastActivityInfo() && (
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
            <Calendar className="h-3 w-3" />
            <span>{getLastActivityInfo()}</span>
          </div>
        )}

        {profile?.streak > 0 && (
          <div className="mt-3 flex items-center justify-center gap-4 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              <span>XP: {profile.xp || 0}</span>
            </div>
            <span>•</span>
            <span>Bits: {profile.bits || 0}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
