import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, 
  Target, 
  TrendingUp, 
  Clock, 
  Award, 
  Calendar,
  CheckCircle,
  Play,
  Code,
  HelpCircle,
  BarChart3,
  Trophy,
  Star,
  Zap
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

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

interface LearningPath {
  courseId: string;
  courseTitle: string;
  lessons: {
    id: string;
    title: string;
    type: 'video' | 'coding' | 'quiz';
    completed: boolean;
    xp_reward: number;
    order_num: number;
  }[];
}

interface ProgressTrackerProps {
  userId: string;
  userProfile: any;
}

export const ProgressTracker = ({ userId, userProfile }: ProgressTrackerProps) => {
  const { toast } = useToast();
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([]);
  const [analytics, setAnalytics] = useState<StudentAnalytics | null>(null);
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    loadProgressData();
  }, [userId]);

  const loadProgressData = async () => {
    try {
      setLoading(true);
      
      // Load course progress
      const { data: progressData, error: progressError } = await supabase
        .rpc('get_student_progress', { student_uuid: userId });

      if (progressError) throw progressError;
      setCourseProgress(progressData || []);

      // Load analytics
      const { data: analyticsData, error: analyticsError } = await supabase
        .rpc('get_student_analytics', { student_uuid: userId });

      if (analyticsError) throw analyticsError;
      if (analyticsData && analyticsData.length > 0) {
        setAnalytics(analyticsData[0]);
      }

      // Load detailed learning paths
      await loadLearningPaths();

    } catch (error) {
      console.error('Error loading progress data:', error);
      toast({
        title: "Error",
        description: "Failed to load progress data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadLearningPaths = async () => {
    try {
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          lessons (
            id,
            title,
            lesson_type,
            xp_reward,
            order_num
          )
        `)
        .order('title');

      if (coursesError) throw coursesError;

      // Get completed lessons for this user
      const { data: submissions, error: submissionsError } = await supabase
        .from('submissions')
        .select('assignment_id, is_correct')
        .eq('student_id', userId)
        .eq('is_correct', true);

      if (submissionsError) throw submissionsError;

      const completedAssignmentIds = new Set(
        submissions?.map(s => s.assignment_id) || []
      );

      const paths: LearningPath[] = courses?.map(course => ({
        courseId: course.id,
        courseTitle: course.title,
        lessons: course.lessons?.map(lesson => ({
          id: lesson.id,
          title: lesson.title,
          type: lesson.lesson_type,
          completed: completedAssignmentIds.has(lesson.id),
          xp_reward: lesson.xp_reward,
          order_num: lesson.order_num
        })).sort((a, b) => a.order_num - b.order_num) || []
      })) || [];

      setLearningPaths(paths);
    } catch (error) {
      console.error('Error loading learning paths:', error);
    }
  };

  const getLessonIcon = (type: string) => {
    switch (type) {
      case 'video': return <Play className="h-4 w-4" />;
      case 'coding': return <Code className="h-4 w-4" />;
      case 'quiz': return <HelpCircle className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return "bg-green-500";
    if (percentage >= 60) return "bg-yellow-500";
    if (percentage >= 40) return "bg-orange-500";
    return "bg-red-500";
  };

  const getProgressVariant = (percentage: number) => {
    if (percentage >= 80) return "default";
    if (percentage >= 60) return "secondary";
    return "outline";
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Learning Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner text="Loading your progress..." />
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalCourses = courseProgress.length;
  const completedCourses = courseProgress.filter(c => c.progress_percentage === 100).length;
  const averageProgress = courseProgress.length > 0 
    ? courseProgress.reduce((sum, c) => sum + c.progress_percentage, 0) / courseProgress.length 
    : 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Learning Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="roadmap">Learning Roadmap</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{totalCourses}</div>
                <div className="text-sm text-blue-600">Total Courses</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{completedCourses}</div>
                <div className="text-sm text-green-600">Completed</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{Math.round(averageProgress)}%</div>
                <div className="text-sm text-purple-600">Avg Progress</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{userProfile?.streak || 0}</div>
                <div className="text-sm text-orange-600">Day Streak</div>
              </div>
            </div>

            {/* Course Progress */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Target className="h-5 w-5" />
                Course Progress
              </h3>
              {courseProgress.map((course) => (
                <div key={course.course_id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{course.course_title}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant={getProgressVariant(course.progress_percentage)}>
                        {course.progress_percentage}%
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {course.completed_lessons}/{course.total_lessons}
                      </span>
                    </div>
                  </div>
                  <Progress 
                    value={course.progress_percentage} 
                    className="h-2"
                  />
                </div>
              ))}
              {courseProgress.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No courses enrolled yet</p>
                  <p className="text-sm">Start your learning journey!</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Learning Roadmap Tab */}
          <TabsContent value="roadmap" className="space-y-6">
            <div className="space-y-6">
              {learningPaths.map((path) => (
                <div key={path.courseId} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg">{path.courseTitle}</h3>
                    <Badge variant="outline">
                      {path.lessons.filter(l => l.completed).length}/{path.lessons.length} completed
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    {path.lessons.map((lesson, index) => (
                      <div 
                        key={lesson.id} 
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                          lesson.completed 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                          lesson.completed 
                            ? 'bg-green-500 text-white' 
                            : 'bg-gray-300 text-gray-600'
                        }`}>
                          {lesson.completed ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <span className="text-sm font-medium">{index + 1}</span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 flex-1">
                          {getLessonIcon(lesson.type)}
                          <span className={`font-medium ${
                            lesson.completed ? 'text-green-700' : 'text-gray-700'
                          }`}>
                            {lesson.title}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {lesson.xp_reward} XP
                          </Badge>
                          {lesson.completed && (
                            <Star className="h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            {analytics && (
              <div className="space-y-6">
                {/* Performance Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {analytics.success_rate}%
                    </div>
                    <div className="text-sm text-blue-600">Success Rate</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {analytics.average_score}%
                    </div>
                    <div className="text-sm text-green-600">Avg Quiz Score</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {analytics.days_active}
                    </div>
                    <div className="text-sm text-purple-600">Days Active</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {analytics.longest_streak}
                    </div>
                    <div className="text-sm text-orange-600">Best Streak</div>
                  </div>
                </div>

                {/* Detailed Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5" />
                        Quiz Performance
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span>Total Quizzes</span>
                        <span className="font-medium">{analytics.total_quizzes}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Completed</span>
                        <span className="font-medium">{analytics.completed_quizzes}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Average Score</span>
                        <span className="font-medium">{analytics.average_score}%</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Code className="h-5 w-5" />
                        Assignment Stats
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span>Total Assignments</span>
                        <span className="font-medium">{analytics.total_assignments}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Correct Solutions</span>
                        <span className="font-medium">{analytics.correct_assignments}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Success Rate</span>
                        <span className="font-medium">{analytics.success_rate}%</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Achievement Suggestions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="h-5 w-5" />
                      Next Milestones
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analytics.current_streak < 7 && (
                        <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                          <Zap className="h-5 w-5 text-yellow-600" />
                          <div>
                            <div className="font-medium">7-Day Streak</div>
                            <div className="text-sm text-muted-foreground">
                              {7 - analytics.current_streak} more days to go!
                            </div>
                          </div>
                        </div>
                      )}
                      {analytics.success_rate < 80 && (
                        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                          <Target className="h-5 w-5 text-blue-600" />
                          <div>
                            <div className="font-medium">80% Success Rate</div>
                            <div className="text-sm text-muted-foreground">
                              {Math.round(80 - analytics.success_rate)}% more to achieve!
                            </div>
                          </div>
                        </div>
                      )}
                      {analytics.completed_quizzes < 10 && (
                        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <div>
                            <div className="font-medium">Quiz Master</div>
                            <div className="text-sm text-muted-foreground">
                              Complete {10 - analytics.completed_quizzes} more quizzes!
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}; 