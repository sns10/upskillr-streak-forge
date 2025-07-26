
import { useAuth } from "@/hooks/useAuth";
import { AdminLayout } from "@/components/AdminLayout";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Play, Code, Users } from "lucide-react";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface DashboardStats {
  totalCourses: number;
  totalLessons: number;
  totalAssignments: number;
  totalStudents: number;
}

interface RecentActivity {
  newStudents: number;
  completedAssignments: number;
  quizAttempts: number;
  activeStudents: number;
}

export const AdminDashboard = () => {
  const { user, isAdmin, loading } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalCourses: 0,
    totalLessons: 0,
    totalAssignments: 0,
    totalStudents: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity>({
    newStudents: 0,
    completedAssignments: 0,
    quizAttempts: 0,
    activeStudents: 0,
  });
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setDataLoading(true);
        
        // Fetch overview statistics
        const [coursesResult, lessonsResult, assignmentsResult, studentsResult] = await Promise.all([
          supabase.from('courses').select('id', { count: 'exact', head: true }),
          supabase.from('lessons').select('id', { count: 'exact', head: true }),
          supabase.from('coding_assignments').select('id', { count: 'exact', head: true }),
          supabase.from('user_profiles').select('id', { count: 'exact', head: true })
        ]);

        setStats({
          totalCourses: coursesResult.count || 0,
          totalLessons: lessonsResult.count || 0,
          totalAssignments: assignmentsResult.count || 0,
          totalStudents: studentsResult.count || 0,
        });

        // Fetch recent activity (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const [newStudentsResult, completedAssignmentsResult, quizAttemptsResult, activeStudentsResult] = await Promise.all([
          supabase
            .from('user_profiles')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', sevenDaysAgo.toISOString()),
          supabase
            .from('submissions')
            .select('id', { count: 'exact', head: true })
            .eq('is_correct', true)
            .gte('submitted_at', sevenDaysAgo.toISOString()),
          supabase
            .from('quiz_attempts')
            .select('id', { count: 'exact', head: true })
            .gte('completed_at', sevenDaysAgo.toISOString()),
          supabase
            .from('student_activities')
            .select('student_id', { count: 'exact', head: true })
            .gte('created_at', sevenDaysAgo.toISOString())
        ]);

        setRecentActivity({
          newStudents: newStudentsResult.count || 0,
          completedAssignments: completedAssignmentsResult.count || 0,
          quizAttempts: quizAttemptsResult.count || 0,
          activeStudents: activeStudentsResult.count || 0,
        });

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setDataLoading(false);
      }
    };

    if (user && isAdmin) {
      fetchDashboardData();
    }
  }, [user, isAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <AdminLayout user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Manage your learning platform content</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dataLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : stats.totalCourses}
              </div>
              <p className="text-xs text-muted-foreground">Active courses</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lessons</CardTitle>
              <Play className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dataLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : stats.totalLessons}
              </div>
              <p className="text-xs text-muted-foreground">Total lessons</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assignments</CardTitle>
              <Code className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dataLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : stats.totalAssignments}
              </div>
              <p className="text-xs text-muted-foreground">Coding challenges</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dataLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : stats.totalStudents}
              </div>
              <p className="text-xs text-muted-foreground">Enrolled students</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">• Create new course</p>
                <p className="text-sm text-gray-600">• Add coding assignment</p>
                <p className="text-sm text-gray-600">• Manage student batches</p>
                <p className="text-sm text-gray-600">• Review submissions</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest platform updates (last 7 days)</CardDescription>
            </CardHeader>
            <CardContent>
              {dataLoading ? (
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">• New student registrations: {recentActivity.newStudents}</p>
                  <p className="text-sm text-gray-600">• Assignments completed: {recentActivity.completedAssignments}</p>
                  <p className="text-sm text-gray-600">• Quiz attempts: {recentActivity.quizAttempts}</p>
                  <p className="text-sm text-gray-600">• Active students: {recentActivity.activeStudents}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};
