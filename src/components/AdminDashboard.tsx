
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Clock,
  MoreVertical,
  Eye,
  Target,
  Award
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAdminStats } from '@/hooks/useAdminStats';
import { useCourseManagement } from '@/hooks/useCourseManagement';
import CourseCreationForm from './CourseCreationForm';
import CourseEditModal from './CourseEditModal';
import ModuleEditModal from './ModuleEditModal';
import LessonEditModal from './LessonEditModal';
import DeleteConfirmation from './DeleteConfirmation';
import { StudentDetailModal } from './StudentDetailModal';

interface AdminDashboardProps {
  onLogout: () => void;
}

const AdminDashboard = ({ onLogout }: AdminDashboardProps) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [editingModule, setEditingModule] = useState<any>(null);
  const [editingLesson, setEditingLesson] = useState<any>(null);
  const [deletingItem, setDeletingItem] = useState<{type: 'course' | 'module' | 'lesson', id: string, name: string} | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { 
    publishCourseMutation, 
    deleteCourseMutation, 
    deleteModuleMutation, 
    deleteLessonMutation 
  } = useCourseManagement();

  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ['admin-courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          modules (
            *,
            lessons (*)
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

  // Enhanced student query with more detailed analytics
  const { data: students = [] } = useQuery({
    queryKey: ['admin-students'],
    queryFn: async () => {
      // First get student user IDs from user_roles
      const { data: studentRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'student');

      if (rolesError) throw rolesError;
      if (!studentRoles || studentRoles.length === 0) return [];

      const studentIds = studentRoles.map(r => r.user_id);

      // Then get all students from profiles
      const { data: allStudents, error: studentsError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', studentIds);

      if (studentsError) throw studentsError;
      if (!allStudents || allStudents.length === 0) return [];

      // Then get detailed analytics for each student
      const studentsWithAnalytics = await Promise.all(
        allStudents.map(async (student) => {
          // Get XP data
          const { data: xpData } = await supabase
            .from('user_xp')
            .select('amount')
            .eq('user_id', student.id);

          // Get lesson progress data
          const { data: progressData } = await supabase
            .from('user_progress')
            .select('completed, lesson_id')
            .eq('user_id', student.id);

          // Get total lessons count for progress calculation
          const { data: allLessons } = await supabase
            .from('lessons')
            .select('id');

          // Get quiz results
          const { data: quizData } = await supabase
            .from('quiz_results')
            .select('score')
            .eq('user_id', student.id);

          // Get streak data
          const { data: streakData } = await supabase
            .from('streaks')
            .select('current_streak')
            .eq('user_id', student.id)
            .maybeSingle();

          // Get badge count
          const { data: badgeData } = await supabase
            .from('user_badges')
            .select('id')
            .eq('user_id', student.id);

          return {
            ...student,
            total_xp: xpData?.reduce((sum, record) => sum + record.amount, 0) || 0,
            completed_lessons: progressData?.filter(p => p.completed).length || 0,
            total_lessons: allLessons?.length || 0,
            quiz_results: quizData || [],
            current_streak: streakData?.current_streak || 0,
            badge_count: badgeData?.length || 0,
          };
        })
      );

      // Sort by total XP descending
      return studentsWithAnalytics.sort((a, b) => b.total_xp - a.total_xp);
    }
  });

  const handlePublishCourse = (courseId: string) => {
    publishCourseMutation.mutate(courseId);
  };

  const handleEditCourse = (course: any) => {
    setEditingCourse(course);
  };

  const handleDeleteCourse = (course: any) => {
    setDeletingItem({ type: 'course', id: course.id, name: course.title });
  };

  const handleEditModule = (module: any) => {
    setEditingModule(module);
  };

  const handleDeleteModule = (module: any) => {
    setDeletingItem({ type: 'module', id: module.id, name: module.title });
  };

  const handleEditLesson = (lesson: any) => {
    setEditingLesson(lesson);
  };

  const handleDeleteLesson = (lesson: any) => {
    setDeletingItem({ type: 'lesson', id: lesson.id, name: lesson.title });
  };

  const handleConfirmDelete = () => {
    if (!deletingItem) return;
    
    switch (deletingItem.type) {
      case 'course':
        deleteCourseMutation.mutate(deletingItem.id, {
          onSuccess: () => setDeletingItem(null)
        });
        break;
      case 'module':
        deleteModuleMutation.mutate(deletingItem.id, {
          onSuccess: () => setDeletingItem(null)
        });
        break;
      case 'lesson':
        deleteLessonMutation.mutate(deletingItem.id, {
          onSuccess: () => setDeletingItem(null)
        });
        break;
    }
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
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem onClick={() => handleEditCourse(course)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Course
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteCourse(course)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Course
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
                      
                      {/* Modules and Lessons */}
                      {course.modules && course.modules.length > 0 && (
                        <div className="mt-6 space-y-4">
                          <h4 className="font-medium text-gray-900">Modules</h4>
                          {course.modules.map((module: any) => (
                            <div key={module.id} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h5 className="font-medium">{module.title}</h5>
                                  <p className="text-sm text-gray-600">{module.description}</p>
                                  <p className="text-xs text-gray-500">Order: {module.order_index}</p>
                                </div>
                                <div className="flex space-x-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditModule(module)}
                                  >
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteModule(module)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                              
                              {module.lessons && module.lessons.length > 0 && (
                                <div className="mt-3 ml-4 space-y-2">
                                  <h6 className="text-sm font-medium text-gray-800">Lessons</h6>
                                  {module.lessons.map((lesson: any) => (
                                    <div key={lesson.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                      <div>
                                        <span className="text-sm font-medium">{lesson.title}</span>
                                        <Badge variant="outline" className="ml-2 text-xs">
                                          {lesson.type}
                                        </Badge>
                                        <span className="text-xs text-gray-500 ml-2">
                                          Order: {lesson.order_index} • {lesson.xp_reward} XP
                                        </span>
                                      </div>
                                      <div className="flex space-x-1">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleEditLesson(lesson)}
                                        >
                                          <Edit className="w-3 h-3" />
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleDeleteLesson(lesson)}
                                          className="text-red-600 hover:text-red-700"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
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
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Student Overview
                </CardTitle>
                <CardDescription>
                  Detailed student analytics and management
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Total XP</TableHead>
                      <TableHead>Lessons Completed</TableHead>
                      <TableHead>Avg Quiz Score</TableHead>
                      <TableHead>Current Streak</TableHead>
                      <TableHead>Badges</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => {
                      const avgScore = student.quiz_results?.length > 0
                        ? Math.round(student.quiz_results.reduce((sum: number, quiz: any) => sum + quiz.score, 0) / student.quiz_results.length)
                        : 0;
                      
                      return (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">
                            {student.full_name || 'Unnamed Student'}
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-primary">
                              {student.total_xp} XP
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span>{student.completed_lessons}</span>
                              <Progress 
                                value={student.total_lessons > 0 ? (student.completed_lessons / student.total_lessons) * 100 : 0} 
                                className="w-16 h-2" 
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={
                              avgScore >= 80 ? "bg-green-500" : 
                              avgScore >= 60 ? "bg-yellow-500" : 
                              "bg-red-500"
                            }>
                              {avgScore}%
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-500" />
                              {student.current_streak || 0}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              <Award className="w-3 h-3 mr-1" />
                              {student.badge_count || 0}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedStudentId(student.id)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Course Creation Modal */}
      {showCreateCourse && (
        <CourseCreationForm onClose={() => setShowCreateCourse(false)} />
      )}

      {/* Course Edit Modal */}
      {editingCourse && (
        <CourseEditModal
          course={editingCourse}
          isOpen={!!editingCourse}
          onClose={() => setEditingCourse(null)}
        />
      )}

      {/* Module Edit Modal */}
      {editingModule && (
        <ModuleEditModal
          module={editingModule}
          isOpen={!!editingModule}
          onClose={() => setEditingModule(null)}
        />
      )}

      {/* Lesson Edit Modal */}
      {editingLesson && (
        <LessonEditModal
          lesson={editingLesson}
          isOpen={!!editingLesson}
          onClose={() => setEditingLesson(null)}
        />
      )}

      {/* Delete Confirmation */}
      {deletingItem && (
        <DeleteConfirmation
          isOpen={!!deletingItem}
          onClose={() => setDeletingItem(null)}
          onConfirm={handleConfirmDelete}
          title={`Delete ${deletingItem.type}`}
          description={`Are you sure you want to delete this ${deletingItem.type}?`}
          itemName={deletingItem.name}
          isDeleting={
            deleteCourseMutation.isPending || 
            deleteModuleMutation.isPending || 
            deleteLessonMutation.isPending
          }
        />
      )}

      <StudentDetailModal 
        studentId={selectedStudentId}
        onClose={() => setSelectedStudentId(null)}
      />
    </div>
  );
};

export default AdminDashboard;
