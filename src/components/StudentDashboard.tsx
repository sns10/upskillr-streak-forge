
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, User, Settings, Award } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import StudentStats from './StudentStats';
import CourseList from './CourseList';
import BadgeDisplay from './BadgeDisplay';
import AchievementNotification from './AchievementNotification';
import { useBadgeSystem } from '@/hooks/useBadgeSystem';
import { useState } from 'react';
import React from 'react';

interface StudentDashboardProps {
  onLogout: () => void;
}

const StudentDashboard = ({ onLogout }: StudentDashboardProps) => {
  const { user } = useAuth();
  const { 
    userBadges, 
    checkForNewBadges, 
    currentAchievement, 
    dismissAchievement 
  } = useBadgeSystem();
  const [showBadgeModal, setShowBadgeModal] = useState(false);

  // Check for new badges when component mounts
  React.useEffect(() => {
    checkForNewBadges();
  }, [checkForNewBadges]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-white/20 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Student Dashboard
            </h1>
            <p className="text-gray-600">Welcome back, {user?.user_metadata?.full_name || 'Student'}!</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <Button onClick={onLogout} variant="outline" size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Overview */}
        <StudentStats />

        {/* Recent Badges */}
        {userBadges.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Recent Badges</h2>
                <p className="text-gray-600">Your latest achievements</p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setShowBadgeModal(true)}
                className="flex items-center gap-2"
              >
                <Award className="w-4 h-4" />
                View All Badges
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {userBadges.slice(0, 6).map((userBadge) => (
                <BadgeDisplay
                  key={userBadge.id}
                  badge={{
                    ...userBadge.badge,
                    earned_at: userBadge.earned_at
                  }}
                  earned={true}
                  size="sm"
                  showDescription={false}
                />
              ))}
            </div>
          </section>
        )}

        {/* Main Content */}
        <div className="space-y-8">
          {/* Available Courses */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Available Courses</h2>
                <p className="text-gray-600">Continue your learning journey</p>
              </div>
            </div>
            <CourseList />
          </section>

          {/* Recent Activity */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h2>
            <Card>
              <CardHeader>
                <CardTitle>Activity Feed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Recent Activity</h3>
                  <p className="text-gray-600">Start learning to see your progress here.</p>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>

      {/* Achievement Notification */}
      <AchievementNotification
        achievement={currentAchievement}
        onDismiss={dismissAchievement}
      />
    </div>
  );
};

export default StudentDashboard;
