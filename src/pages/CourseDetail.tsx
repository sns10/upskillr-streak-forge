
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Play, BookOpen, Trophy, Clock, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Module {
  id: string;
  title: string;
  description: string;
  order_index: number;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'quiz' | 'assignment';
  xp_reward: number;
  order_index: number;
  completed?: boolean;
}

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string | null;
  modules: Module[];
}

const CourseDetail = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();

  const { data: course, isLoading, error } = useQuery({
    queryKey: ['course-detail', courseId],
    queryFn: async () => {
      if (!courseId) throw new Error('Course ID is required');

      // Fetch course with modules and lessons
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          description,
          thumbnail_url,
          modules (
            id,
            title,
            description,
            order_index,
            lessons (
              id,
              title,
              description,
              type,
              xp_reward,
              order_index
            )
          )
        `)
        .eq('id', courseId)
        .eq('status', 'published')
        .single();

      if (courseError) throw courseError;

      // Fetch user progress if authenticated
      let progressData = [];
      if (user) {
        const { data, error: progressError } = await supabase
          .from('user_progress')
          .select('lesson_id, completed')
          .eq('user_id', user.id);

        if (!progressError) {
          progressData = data || [];
        }
      }

      // Add completion status to lessons
      const courseWithProgress = {
        ...courseData,
        modules: courseData.modules
          .sort((a, b) => a.order_index - b.order_index)
          .map((module: any) => ({
            ...module,
            lessons: module.lessons
              .sort((a: any, b: any) => a.order_index - b.order_index)
              .map((lesson: any) => ({
                ...lesson,
                completed: progressData.some(p => p.lesson_id === lesson.id && p.completed)
              }))
          }))
      };

      return courseWithProgress as Course;
    },
    enabled: !!courseId
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
        <div className="max-w-4xl mx-auto text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Course Not Found</h1>
          <p className="text-gray-600 mb-6">The course you're looking for doesn't exist or isn't published yet.</p>
          <Link to="/">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const totalLessons = course.modules.reduce((acc, module) => acc + module.lessons.length, 0);
  const completedLessons = course.modules.reduce((acc, module) => 
    acc + module.lessons.filter(lesson => lesson.completed).length, 0
  );
  const progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
  const totalXP = course.modules.reduce((acc, module) => 
    acc + module.lessons.reduce((lessonAcc, lesson) => lessonAcc + lesson.xp_reward, 0), 0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <Link to="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Courses
            </Button>
          </Link>

          <Card className="bg-white/80 backdrop-blur-md border-white/20">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-3xl font-bold mb-2">{course.title}</CardTitle>
                  <CardDescription className="text-lg">{course.description}</CardDescription>
                </div>
                {course.thumbnail_url && (
                  <img 
                    src={course.thumbnail_url} 
                    alt={course.title}
                    className="w-24 h-24 object-cover rounded-lg ml-6"
                  />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{course.modules.length}</div>
                  <div className="text-sm text-gray-600">Modules</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{totalLessons}</div>
                  <div className="text-sm text-gray-600">Lessons</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{totalXP}</div>
                  <div className="text-sm text-gray-600">Total XP</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{Math.round(progressPercentage)}%</div>
                  <div className="text-sm text-gray-600">Complete</div>
                </div>
              </div>
              
              {user && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Modules and Lessons */}
        <div className="space-y-6">
          {course.modules.map((module, moduleIndex) => (
            <Card key={module.id} className="bg-white/80 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                    Module {moduleIndex + 1}
                  </span>
                  {module.title}
                </CardTitle>
                {module.description && (
                  <CardDescription>{module.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {module.lessons.map((lesson, lessonIndex) => (
                    <div key={lesson.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          {lesson.completed ? (
                            <CheckCircle className="w-6 h-6 text-green-500" />
                          ) : lesson.type === 'video' ? (
                            <Play className="w-6 h-6 text-blue-500" />
                          ) : lesson.type === 'quiz' ? (
                            <BookOpen className="w-6 h-6 text-purple-500" />
                          ) : (
                            <Clock className="w-6 h-6 text-orange-500" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {lessonIndex + 1}. {lesson.title}
                          </h4>
                          {lesson.description && (
                            <p className="text-sm text-gray-600">{lesson.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge variant="secondary" className="flex items-center space-x-1">
                          <Trophy className="w-3 h-3" />
                          <span>{lesson.xp_reward} XP</span>
                        </Badge>
                        <Link to={`/lesson/${lesson.id}`}>
                          <Button size="sm">
                            {lesson.completed ? 'Review' : 'Start'}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
