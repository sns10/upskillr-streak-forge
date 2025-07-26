import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, Code, FileQuestion, CheckCircle } from "lucide-react";
import { MainLayout } from "@/components/MainLayout";
import { useAuth } from "@/hooks/useAuth";

interface Course {
  id: string;
  title: string;
  description: string;
  image_url: string;
}

interface Lesson {
  id: string;
  title: string;
  lesson_type: 'video' | 'coding' | 'quiz';
  order_num: number;
  xp_reward: number;
  bits_reward: number;
}

export const CourseDetail = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!courseId) return;

    const fetchCourseData = async () => {
      try {
        // Fetch course details
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('*')
          .eq('id', courseId)
          .single();

        if (courseError) throw courseError;

        // Fetch lessons for this course
        const { data: lessonsData, error: lessonsError } = await supabase
          .from('lessons')
          .select('*')
          .eq('course_id', courseId)
          .order('order_num', { ascending: true });

        if (lessonsError) throw lessonsError;

        setCourse(courseData);
        setLessons(lessonsData || []);
        
        if (user) {
          await fetchCompletedLessons(lessonsData || []);
        }
      } catch (error) {
        console.error('Error fetching course data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [courseId, user]);

  const getLessonIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Play className="h-4 w-4" />;
      case 'coding':
        return <Code className="h-4 w-4" />;
      case 'quiz':
        return <FileQuestion className="h-4 w-4" />;
      default:
        return <Play className="h-4 w-4" />;
    }
  };

  const fetchCompletedLessons = async (lessonsData: Lesson[]) => {
    try {
      // Fetch all correct submissions for video lessons (video_<lesson_id>)
      const { data: videoSubmissions, error: videoError } = await supabase
        .from("submissions")
        .select("assignment_id")
        .eq("student_id", user?.id)
        .eq("is_correct", true)
        .like("assignment_id", "video_%");

      if (videoError) throw videoError;

      // Fetch quiz attempts that passed
      const { data: quizAttempts, error: quizError } = await supabase
        .from("quiz_attempts")
        .select(`
          quiz_id,
          score,
          quizzes!inner(
            lesson_id,
            passing_score
          )
        `)
        .eq("user_id", user?.id);

      if (quizError) throw quizError;

      // Fetch completed coding assignments
      const { data: codingSubmissions, error: codingError } = await supabase
        .from("submissions")
        .select("assignment_id")
        .eq("student_id", user?.id)
        .eq("is_correct", true);

      if (codingError) throw codingError;

      const completed = new Set<string>();
      
      // Add completed video lessons
      videoSubmissions?.forEach(sub => {
        const lessonId = sub.assignment_id.replace("video_", "");
        completed.add(lessonId);
      });

      // Add passed quiz lessons
      quizAttempts?.forEach(attempt => {
        if (attempt.score >= attempt.quizzes.passing_score) {
          completed.add(attempt.quizzes.lesson_id);
        }
      });

      // Check for completed coding lessons (all assignments in lesson completed)
      for (const lesson of lessonsData) {
        if (lesson.lesson_type === 'coding') {
          const { data: assignments, error: assignmentError } = await supabase
            .from("coding_assignments")
            .select("id")
            .eq("lesson_id", lesson.id);

          if (assignmentError) continue;

          const completedAssignments = new Set(
            codingSubmissions?.map(sub => sub.assignment_id) || []
          );

          const allCompleted = assignments?.every(assignment => 
            completedAssignments.has(assignment.id)
          );

          if (allCompleted && assignments?.length > 0) {
            completed.add(lesson.id);
          }
        }
      }

      setCompletedLessons(completed);
    } catch (error: any) {
      console.error("Error fetching completed lessons:", error);
    }
  };

  const handleStartLesson = (lessonId: string) => {
    navigate(`/lesson/${lessonId}`);
  };

  if (loading) {
    return (
      <MainLayout user={user}>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
            <div className="h-20 bg-muted rounded mb-6"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!course) {
    return (
      <MainLayout user={user}>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Course Not Found</h1>
            <Link to="/courses">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to All Courses
              </Button>
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout user={user}>
      <div className="container mx-auto px-4 py-8">
        {/* Back link */}
        <Link to="/courses" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to All Courses
        </Link>

        {/* Course header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">{course.title}</h1>
          {course.description && (
            <p className="text-muted-foreground text-lg">{course.description}</p>
          )}
        </div>

        {/* Lessons list */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Course Lessons</h2>
          
          {lessons.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No lessons available for this course yet.</p>
              </CardContent>
            </Card>
          ) : (
            lessons.map((lesson, index) => (
              <Card key={lesson.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold">
                          {index + 1}
                        </div>
                        {completedLessons.has(lesson.id) && (
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <CheckCircle className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {getLessonIcon(lesson.lesson_type)}
                        <span className="text-xs text-muted-foreground uppercase tracking-wide">
                          {lesson.lesson_type}
                        </span>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold">{lesson.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {lesson.xp_reward} XP • {lesson.bits_reward} Bits
                        </p>
                      </div>
                    </div>
                    
                    <Button onClick={() => handleStartLesson(lesson.id)}>
                      Start
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </MainLayout>
  );
};