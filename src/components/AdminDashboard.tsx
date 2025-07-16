
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  BookOpen, 
  Users, 
  Trophy, 
  Settings, 
  Plus, 
  Edit, 
  Trash2,
  Star,
  TrendingUp,
  LogOut,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useAdminStats } from '@/hooks/useAdminStats';
import { useCourseManagement } from '@/hooks/useCourseManagement';
import CourseCreationForm from './CourseCreationForm';

interface AdminDashboardProps {
  onLogout: () => void;
}

const AdminDashboard = ({ onLogout }: AdminDashboardProps) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { publishCourseMutation } = useCourseManagement();

  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ['admin-courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          modules (
            id,
            lessons (id)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data.map(course => ({
        ...course,
        lessonCount: course.modules?.reduce((acc, module) => acc + (module.lessons?.length || 0), 0) || 0,
        moduleCount: course.modules?.length || 0
      }));
    }
  });

  const { data: studentLeaderboard } = useQuery({
    queryKey: ['student-leaderboard'],
    queryFn: async () => {
      // Get all user XP records
      const { data: xpData, error: xpError } = await supabase
        .from('user_xp')
        .select('user_id, amount');

      if (xpError) throw xpError;
      if (!xpData || !xpData.length) return [];

      // Calculate total XP per user
      const userXpTotals: Record<string, number> = {};
      xpData.forEach(record => {
        userXpTotals[record.user_id] = (userXpTotals[record.user_id] || 0) + record.amount;
      });

      // Get top 10 users by XP
      const topUsers = Object.entries(userXpTotals)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10);

      if (!topUsers.length) return [];

      // Get profiles and streaks for top users in parallel
      const leaderboardPromises = topUsers.map(async ([userId, totalXP]) => {
        const [profileResult, streakResult] = await Promise.all([
          supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single(),
          supabase
            .from('streaks')
            .select('current_streak, longest_streak')
            .eq('user_id', userId)
            .single()
        ]);

        if (profileResult.data) {
          return {
            ...profileResult.data,
            totalXP,
            current_streak: streakResult.data?.current_streak || 0,
            longest_streak: streakResult.data?.longest_streak || 0
          };
        }
        return null;
      });

      const leaderboardData = await Promise.all(leaderboardPromises);
      return leaderboardData.filter(Boolean);
    }
  });

  const handlePublishCourse = (courseId: string) => {
    publishCourseMutation.mutate(courseId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="px-6 py-4 bg-white/80 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-600">Manage courses and gamification</p>
            </div>
          </div>
          <Button variant="outline" onClick={onLogout} className="flex items-center space-x-2">
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statsLoading ? '...' : stats?.totalStudents || 0}</div>
                  <p className="text-xs text-muted-foreground">Registered users</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statsLoading ? '...' : stats?.activeCourses || 0}</div>
                  <p className="text-xs text-muted-foreground">Published courses</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completions</CardTitle>
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statsLoading ? '...' : stats?.totalCompletions || 0}</div>
                  <p className="text-xs text-muted-foreground">Lessons completed</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Engagement</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statsLoading ? '...' : stats?.avgEngagement || 0}%</div>
                  <p className="text-xs text-muted-foreground">Average completion rate</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Student Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {stats?.recentActivities?.length ? (
                  stats.recentActivities.map((activity, index) => (
                    <div key={`${activity.user_id}-${activity.lesson_id}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <div>
                          <p className="font-medium">{activity.profiles?.full_name || 'Student'}</p>
                          <p className="text-sm text-gray-600">Completed {activity.lessons?.title || 'lesson'}</p>
                        </div>
                      </div>
                      <Badge variant="outline">+{activity.lessons?.xp_reward || 0} XP</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No recent activity</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Courses Tab */}
          <TabsContent value="courses" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Course Management</h2>
              <Button 
                className="flex items-center space-x-2"
                onClick={() => setShowCreateCourse(true)}
              >
                <Plus className="w-4 h-4" />
                <span>Create Course</span>
              </Button>
            </div>

            <div className="grid gap-6">
              {coursesLoading ? (
                <div className="text-center py-8">Loading courses...</div>
              ) : !courses?.length ? (
                <div className="text-center py-12">
                  <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Courses Yet</h3>
                  <p className="text-gray-600 mb-6">Create your first course to get started.</p>
                  <Button onClick={() => setShowCreateCourse(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Course
                  </Button>
                </div>
              ) : (
                courses.map((course) => (
                  <Card key={course.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center space-x-2">
                            <span>{course.title}</span>
                            <Badge variant={course.status === 'published' ? 'default' : 'secondary'}>
                              {course.status}
                            </Badge>
                          </CardTitle>
                          <CardDescription>
                            {course.moduleCount} modules • {course.lessonCount} lessons
                          </CardDescription>
                        </div>
                        <div className="flex space-x-2">
                          {course.status === 'draft' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handlePublishCourse(course.id)}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Publish
                            </Button>
                          )}
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">{course.description}</p>
                      <div className="mt-4 flex items-center space-x-4 text-sm text-gray-500">
                        <span>Created {new Date(course.created_at).toLocaleDateString()}</span>
                        {course.status === 'published' ? (
                          <Badge variant="outline" className="text-green-600">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Live
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-orange-600">
                            <Clock className="w-3 h-3 mr-1" />
                            Draft
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Students Tab */}
          <TabsContent value="students" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Student Management</h2>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Student Leaderboard</CardTitle>
                <CardDescription>Top performing students</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {studentLeaderboard?.length ? (
                    studentLeaderboard.map((student, index) => (
                      <div key={student.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{student.full_name || 'Student'}</p>
                            <p className="text-sm text-gray-600">
                              Streak: {student.current_streak || 0} days
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <Badge variant="outline">{student.totalXP || 0} XP</Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">No students yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Course Creation Modal */}
      {showCreateCourse && (
        <CourseCreationForm onClose={() => setShowCreateCourse(false)} />
      )}
    </div>
  );
};

export default AdminDashboard;
