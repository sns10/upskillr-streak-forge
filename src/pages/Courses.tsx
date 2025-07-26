import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { MainLayout } from "@/components/MainLayout";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useResponsive } from "@/hooks/useResponsive";
import { BookOpen, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { CourseCard } from "@/components/CourseCard";

interface Course {
  id: string;
  title: string;
  description: string;
  image_url: string;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  lesson_type: 'video' | 'coding' | 'quiz';
  order_num: number;
  xp_reward: number;
  bits_reward: number;
  assignmentId?: string;
  originalLessonId?: string;
  hasQuiz?: boolean;
}

export const Courses = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const { isMobile, isTablet } = useResponsive();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!loading && user) {
      fetchCourses();
      fetchCompletedLessons();
    }
  }, [loading, user]);

  const fetchCourses = async () => {
    try {
      console.log("Fetching courses with lessons...");
      
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          lessons(
            id,
            title,
            lesson_type,
            order_num,
            xp_reward,
            bits_reward
          )
        `)
        .order('created_at');

      if (error) {
        console.error("Error fetching courses:", error);
        throw error;
      }

      console.log("Courses data:", data);

      // Fetch coding assignments and quizzes to expand lessons
      const { data: codingAssignments } = await supabase
        .from('coding_assignments')
        .select(`
          id,
          problem_statement,
          lesson_id,
          created_at
        `);

      const { data: quizzes } = await supabase
        .from('quizzes')
        .select(`
          id,
          title,
          lesson_id
        `);

      const coursesWithExpandedLessons = data?.map(course => {
        const expandedLessons: Lesson[] = [];
        
        (course.lessons as Lesson[])?.forEach(lesson => {
          // Check if lesson has a quiz
          const hasQuiz = quizzes?.some(quiz => quiz.lesson_id === lesson.id) || false;
          
          if (lesson.lesson_type === 'coding') {
            // Find all coding assignments for this lesson
            const assignmentsForLesson = codingAssignments?.filter(
              assignment => assignment.lesson_id === lesson.id
            ) || [];
            
            if (assignmentsForLesson.length > 1) {
              // Create separate lesson entries for each assignment
              assignmentsForLesson.forEach((assignment, index) => {
                expandedLessons.push({
                  ...lesson,
                  id: assignment.id,
                  title: `${lesson.title} - Assignment ${index + 1}`,
                  assignmentId: assignment.id,
                  originalLessonId: lesson.id,
                  hasQuiz: hasQuiz
                });
              });
            } else if (assignmentsForLesson.length === 1) {
              // Single assignment, keep as is but add assignment ID
              expandedLessons.push({
                ...lesson,
                assignmentId: assignmentsForLesson[0].id,
                originalLessonId: lesson.id,
                hasQuiz: hasQuiz
              });
            } else {
              // No assignments found, keep original lesson
              expandedLessons.push({
                ...lesson,
                hasQuiz: hasQuiz
              });
            }
          } else {
            // Video lessons stay as is
            expandedLessons.push({
              ...lesson,
              hasQuiz: hasQuiz
            });
          }
        });
        
        return {
          ...course,
          lessons: expandedLessons.sort((a, b) => a.order_num - b.order_num)
        };
      }) || [];

      console.log("Processed courses with expanded assignments and quiz indicators:", coursesWithExpandedLessons);
      setCourses(coursesWithExpandedLessons);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast({
        title: "Error",
        description: "Failed to fetch courses",
        variant: "destructive",
      });
    } finally {
      setLoadingCourses(false);
    }
  };

  const fetchCompletedLessons = async () => {
    if (!user) return;
    
    try {
      // Get completed coding assignments
      const { data: submissions } = await supabase
        .from('submissions')
        .select('assignment_id')
        .eq('student_id', user.id)
        .eq('is_correct', true);

      // Get completed quizzes
      const { data: quizAttempts } = await supabase
        .from('quiz_attempts')
        .select('quiz_id')
        .eq('user_id', user.id)
        .eq('status', 'Mastered');

      const completed = new Set<string>();

      // Add completed assignments
      submissions?.forEach(sub => {
        completed.add(sub.assignment_id);
        // If it's a video lesson, extract the lesson ID
        if (sub.assignment_id.startsWith('video_')) {
          const lessonId = sub.assignment_id.replace('video_', '');
          completed.add(lessonId);
        }
      });

      // Add completed quizzes - need to get lesson IDs from quiz IDs
      if (quizAttempts && quizAttempts.length > 0) {
        const { data: quizzes } = await supabase
          .from('quizzes')
          .select('id, lesson_id')
          .in('id', quizAttempts.map(qa => qa.quiz_id));
        
        quizzes?.forEach(quiz => {
          completed.add(quiz.lesson_id);
        });
      }

      console.log("Completed lessons:", completed);
      setCompletedLessons(completed);
    } catch (error) {
      console.error('Error fetching completed lessons:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <MainLayout user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Courses</h1>
          <p className="text-gray-600">Explore and learn from our available courses</p>
        </div>

        {loadingCourses ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : courses.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No courses available</h3>
              <p className="text-gray-500 text-center">
                Check back later for new courses and learning materials.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : isTablet ? 'grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'}`}>
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                completedLessons={completedLessons}
                isMobile={isMobile}
                isTablet={isTablet}
              />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};
