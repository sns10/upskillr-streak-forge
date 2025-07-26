
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AdminLayout } from "@/components/AdminLayout";
import { Navigate, useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2, ArrowLeft, Calendar, Trophy, Zap, Target, Code2, 
  TrendingUp, BookOpen, Activity, Clock, Award, BarChart3,
  Brain, CheckCircle, XCircle, Users, Flame
} from "lucide-react";

interface StudentProfile {
  id: string;
  name: string;
  email: string;
  xp: number;
  bits: number;
  streak: number;
  last_activity_date: string | null;
  created_at: string;
  batches?: {
    batch_name: string;
    start_date: string;
  };
}

interface Submission {
  id: string;
  assignment_id: string;
  submitted_code: string;
  is_correct: boolean;
  submitted_at: string;
}

interface QuizAttempt {
  id: string;
  quiz_id: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  completed_at: string;
  time_taken_minutes: number | null;
}

interface StudentActivity {
  id: string;
  activity_type: string;
  activity_data: any;
  created_at: string;
}

interface CourseProgress {
  course_id: string;
  course_title: string;
  total_lessons: number;
  completed_lessons: number;
  progress_percentage: number;
}

interface StudentAnalytics {
  total_quizzes: number;
  completed_quizzes: number;
  average_score: number;
  total_assignments: number;
  correct_assignments: number;
  success_rate: number;
  current_streak: number;
  longest_streak: number;
  days_active: number;
}

export const AdminStudentDetail = () => {
  const { user, isAdmin, loading } = useAuth();
  const { id } = useParams<{ id: string }>(); // Fixed: changed from studentId to id
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // State management
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
  const [activities, setActivities] = useState<StudentActivity[]>([]);
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([]);
  const [analytics, setAnalytics] = useState<StudentAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Data fetching
  useEffect(() => {
    if (id) {
      loadAllData();
    }
  }, [id]);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchStudentData(),
        fetchSubmissions(),
        fetchQuizAttempts(),
        fetchActivities(),
        fetchCourseProgress(),
        fetchAnalytics()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStudentData = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select(`
          *,
          batches (
            batch_name,
            start_date
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setStudent(data);
    } catch (error) {
      console.error('Error fetching student:', error);
      toast({
        title: "Error",
        description: "Failed to fetch student data",
        variant: "destructive",
      });
    }
  };

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('student_id', id)
        .order('submitted_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    }
  };

  const fetchQuizAttempts = async () => {
    try {
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('user_id', id)
        .order('completed_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setQuizAttempts(data || []);
    } catch (error) {
      console.error('Error fetching quiz attempts:', error);
    }
  };

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('student_activities')
        .select('*')
        .eq('student_id', id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  const fetchCourseProgress = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_student_progress', { student_uuid: id });

      if (error) throw error;
      setCourseProgress(data || []);
    } catch (error) {
      console.error('Error fetching course progress:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_student_analytics', { student_uuid: id });

      if (error) throw error;
      if (data && data.length > 0) {
        setAnalytics(data[0]);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  // Utility functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getActivityStatus = (lastActivity: string | null) => {
    if (!lastActivity) return { text: "Never active", variant: "secondary" as const };
    
    const daysSince = Math.floor((Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSince === 0) return { text: "Active today", variant: "default" as const };
    if (daysSince === 1) return { text: "Active yesterday", variant: "default" as const };
    if (daysSince <= 7) return { text: `${daysSince} days ago`, variant: "secondary" as const };
    return { text: `${daysSince} days ago`, variant: "destructive" as const };
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'lesson_view': return <BookOpen className="h-4 w-4" />;
      case 'quiz_attempt': return <Brain className="h-4 w-4" />;
      case 'assignment_submit': return <Code2 className="h-4 w-4" />;
      case 'login': return <Activity className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'lesson_view': return 'text-blue-500';
      case 'quiz_attempt': return 'text-purple-500';
      case 'assignment_submit': return 'text-green-500';
      case 'login': return 'text-gray-500';
      default: return 'text-gray-500';
    }
  };

  // Loading and auth checks
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (isLoading || !student) {
    return (
      <AdminLayout user={user}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  const activityStatus = getActivityStatus(student.last_activity_date);
  const totalSubmissions = submissions.length;
  const correctSubmissions = submissions.filter(s => s.is_correct).length;
  const submissionSuccessRate = totalSubmissions > 0 ? Math.round((correctSubmissions / totalSubmissions) * 100) : 0;

  return (
    <AdminLayout user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin/students')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Students</span>
          </Button>
        </div>

        {/* Student Profile Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl">{student.name}</h2>
                <p className="text-muted-foreground font-normal">{student.email}</p>
              </div>
              <Badge variant={activityStatus.variant}>
                {activityStatus.text}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Overview Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-6">
              <div className="flex items-center space-x-3">
                <Trophy className="h-8 w-8 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">{student.xp}</p>
                  <p className="text-sm text-muted-foreground">Total XP</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Zap className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{student.bits}</p>
                  <p className="text-sm text-muted-foreground">Bits</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Flame className="h-8 w-8 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">{student.streak}</p>
                  <p className="text-sm text-muted-foreground">Day Streak</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <BarChart3 className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{submissionSuccessRate}%</p>
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Users className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-sm font-medium">{student.batches?.batch_name || "No batch"}</p>
                  <p className="text-sm text-muted-foreground">Batch</p>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Enhanced Analytics */}
            {analytics && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="font-medium text-muted-foreground">Quiz Performance</p>
                  <p className="text-lg">{analytics.completed_quizzes}/{analytics.total_quizzes} completed</p>
                  <p className="text-sm text-muted-foreground">Avg: {analytics.average_score || 0}%</p>
                </div>
                
                <div>
                  <p className="font-medium text-muted-foreground">Assignment Success</p>
                  <p className="text-lg">{analytics.correct_assignments}/{analytics.total_assignments}</p>
                  <p className="text-sm text-muted-foreground">{analytics.success_rate || 0}% success rate</p>
                </div>
                
                <div>
                  <p className="font-medium text-muted-foreground">Activity</p>
                  <p className="text-lg">{analytics.days_active} days active</p>
                  <p className="text-sm text-muted-foreground">Since joining</p>
                </div>
                
                <div>
                  <p className="font-medium text-muted-foreground">Joined</p>
                  <p className="text-lg">{formatDate(student.created_at)}</p>
                  <p className="text-sm text-muted-foreground">Member since</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabbed Content */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Course Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5" />
                  <span>Course Progress</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {courseProgress.map((course) => (
                    <div key={course.course_id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{course.course_title}</span>
                        <span className="text-sm text-muted-foreground">
                          {course.completed_lessons}/{course.total_lessons} lessons
                        </span>
                      </div>
                      <Progress value={course.progress_percentage} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {course.progress_percentage}% complete
                      </p>
                    </div>
                  ))}
                  {courseProgress.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">
                      No course progress data available
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Quiz Attempts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="h-5 w-5" />
                  <span>Recent Quiz Performance</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {quizAttempts.slice(0, 5).map((attempt) => (
                    <div key={attempt.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Badge variant={attempt.score >= 70 ? "default" : "destructive"}>
                          {attempt.score}%
                        </Badge>
                        <div>
                          <p className="font-medium">Quiz {attempt.quiz_id.slice(0, 8)}</p>
                          <p className="text-sm text-muted-foreground">
                            {attempt.correct_answers}/{attempt.total_questions} correct
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">{formatDate(attempt.completed_at)}</p>
                        {attempt.time_taken_minutes && (
                          <p className="text-xs text-muted-foreground">
                            {attempt.time_taken_minutes}min
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  {quizAttempts.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">
                      No quiz attempts found
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Detailed Course Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {courseProgress.map((course) => (
                    <div key={course.course_id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-semibold">{course.course_title}</h3>
                        <Badge variant={course.progress_percentage === 100 ? "default" : "secondary"}>
                          {course.progress_percentage}% Complete
                        </Badge>
                      </div>
                      <Progress value={course.progress_percentage} className="h-3 mb-2" />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{course.completed_lessons} of {course.total_lessons} lessons completed</span>
                        <span>{course.total_lessons - course.completed_lessons} remaining</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Recent Activity Timeline</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activities.slice(0, 20).map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                      <div className={`${getActivityColor(activity.activity_type)} mt-1`}>
                        {getActivityIcon(activity.activity_type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium capitalize">
                              {activity.activity_type.replace('_', ' ')}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {JSON.stringify(activity.activity_data) !== '{}' && 
                                Object.keys(activity.activity_data).length > 0 && (
                                <span>
                                  {activity.activity_data.lesson_title || 
                                   activity.activity_data.quiz_title || 
                                   activity.activity_data.assignment_title || 
                                   'Activity completed'}
                                </span>
                              )}
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatDateTime(activity.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {activities.length === 0 && (
                    <p className="text-muted-foreground text-center py-8">
                      No recent activity found
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            {/* Submissions Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Code2 className="h-5 w-5" />
                  <span>Assignment Submissions</span>
                </CardTitle>
                <CardDescription>
                  Complete history of coding assignment submissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Assignment</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Code</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.map((submission) => (
                      <TableRow key={submission.id}>
                        <TableCell className="font-medium">
                          <div className="max-w-xs truncate">
                            {submission.assignment_id}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={submission.is_correct ? "default" : "destructive"}
                            className="flex items-center space-x-1"
                          >
                            {submission.is_correct ? (
                              <CheckCircle className="h-3 w-3" />
                            ) : (
                              <XCircle className="h-3 w-3" />
                            )}
                            <span>{submission.is_correct ? "Correct" : "Incorrect"}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDateTime(submission.submitted_at)}</TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Code2 className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[80vh]">
                              <DialogHeader>
                                <DialogTitle>Submitted Code</DialogTitle>
                                <DialogDescription>
                                  Assignment: {submission.assignment_id}
                                </DialogDescription>
                              </DialogHeader>
                              <ScrollArea className="h-96 w-full">
                                <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
                                  <code>{submission.submitted_code}</code>
                                </pre>
                              </ScrollArea>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                    {submissions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          No submissions found for this student.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Quiz Performance Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="h-5 w-5" />
                  <span>Quiz Performance History</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Quiz</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Correct/Total</TableHead>
                      <TableHead>Time Taken</TableHead>
                      <TableHead>Completed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quizAttempts.map((attempt) => (
                      <TableRow key={attempt.id}>
                        <TableCell className="font-medium">
                          Quiz {attempt.quiz_id.slice(0, 8)}...
                        </TableCell>
                        <TableCell>
                          <Badge variant={attempt.score >= 70 ? "default" : "destructive"}>
                            {attempt.score}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {attempt.correct_answers}/{attempt.total_questions}
                        </TableCell>
                        <TableCell>
                          {attempt.time_taken_minutes ? `${attempt.time_taken_minutes}min` : 'N/A'}
                        </TableCell>
                        <TableCell>{formatDateTime(attempt.completed_at)}</TableCell>
                      </TableRow>
                    ))}
                    {quizAttempts.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No quiz attempts found for this student.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};
