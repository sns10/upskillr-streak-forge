
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Code, BookOpen, HelpCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AssignmentsCardProps {
  userId: string;
}

interface Assignment {
  id: string;
  title: string;
  description?: string;
  lesson_id: string;
  lesson_title: string;
  course_title: string;
  lesson_order: number;
  created_at: string;
  type: 'coding' | 'quiz';
  is_completed?: boolean;
}

export const AssignmentsCard = ({ userId }: AssignmentsCardProps) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchAssignments();
  }, [userId]);

  const fetchAssignments = async () => {
    try {
      // Get coding assignments
      const { data: codingAssignments, error: codingError } = await supabase
        .from("coding_assignments")
        .select(`
          id,
          problem_statement,
          lesson_id,
          created_at,
          lessons(
            id,
            title,
            order_num,
            courses(title)
          )
        `)
        .order("created_at", { ascending: false })
        .limit(10);

      if (codingError) throw codingError;

      // Get quiz assignments
      const { data: quizAssignments, error: quizError } = await supabase
        .from("quizzes")
        .select(`
          id,
          title,
          description,
          lesson_id,
          created_at,
          lessons(
            id,
            title,
            order_num,
            courses(title)
          )
        `)
        .order("created_at", { ascending: false })
        .limit(10);

      if (quizError) throw quizError;

      // Get user's completed coding submissions
      const { data: codingSubmissions, error: codingSubmissionsError } = await supabase
        .from("submissions")
        .select("assignment_id")
        .eq("student_id", userId)
        .eq("is_correct", true);

      if (codingSubmissionsError) throw codingSubmissionsError;

      // Get user's completed quiz attempts
      const { data: quizAttempts, error: quizAttemptsError } = await supabase
        .from("quiz_attempts")
        .select("quiz_id")
        .eq("user_id", userId)
        .eq("status", "Mastered");

      if (quizAttemptsError) throw quizAttemptsError;

      const completedCodingIds = new Set(
        codingSubmissions?.map(sub => sub.assignment_id) || []
      );

      const completedQuizIds = new Set(
        quizAttempts?.map(attempt => attempt.quiz_id) || []
      );

      // Format coding assignments
      const formattedCodingAssignments = codingAssignments?.map(assignment => ({
        id: assignment.id,
        title: assignment.lessons?.title || "Unknown Lesson",
        description: assignment.problem_statement,
        lesson_id: assignment.lesson_id,
        lesson_title: assignment.lessons?.title || "Unknown Lesson",
        course_title: assignment.lessons?.courses?.title || "Unknown Course",
        lesson_order: assignment.lessons?.order_num || 0,
        created_at: assignment.created_at,
        type: 'coding' as const,
        is_completed: completedCodingIds.has(assignment.id)
      })) || [];

      // Format quiz assignments
      const formattedQuizAssignments = quizAssignments?.map(quiz => ({
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        lesson_id: quiz.lesson_id,
        lesson_title: quiz.lessons?.title || "Unknown Lesson",
        course_title: quiz.lessons?.courses?.title || "Unknown Course",
        lesson_order: quiz.lessons?.order_num || 0,
        created_at: quiz.created_at,
        type: 'quiz' as const,
        is_completed: completedQuizIds.has(quiz.id)
      })) || [];

      // Combine and sort all assignments
      const allAssignments = [...formattedCodingAssignments, ...formattedQuizAssignments]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);

      setAssignments(allAssignments);
    } catch (error: any) {
      console.error("Error fetching assignments:", error);
      toast({
        title: "Error",
        description: "Failed to load assignments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getAssignmentTitle = (assignment: Assignment) => {
    const timestamp = new Date(assignment.created_at).toLocaleDateString();
    return `${assignment.title} - ${timestamp}`;
  };

  return (
    <Card className="bg-white shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-gray-900">
          <BookOpen className="h-5 w-5 text-purple-600" />
          Assignments & Quizzes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : assignments.length > 0 ? (
          <div className="space-y-3">
            {assignments.map((assignment) => (
              <div
                key={assignment.id}
                onClick={() => navigate(`/lesson/${assignment.lesson_id}`)}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    assignment.is_completed 
                      ? 'bg-green-100' 
                      : assignment.type === 'quiz' ? 'bg-blue-100' : 'bg-purple-100'
                  }`}>
                    {assignment.type === 'quiz' ? (
                      <HelpCircle className={`h-4 w-4 ${
                        assignment.is_completed 
                          ? 'text-green-600' 
                          : 'text-blue-600'
                      }`} />
                    ) : (
                      <Code className={`h-4 w-4 ${
                        assignment.is_completed 
                          ? 'text-green-600' 
                          : 'text-purple-600'
                      }`} />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">
                      {getAssignmentTitle(assignment)}
                    </h4>
                    <p className="text-sm text-gray-600">{assignment.course_title}</p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {assignment.description ? assignment.description.substring(0, 80) + "..." : "No description available"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {assignment.is_completed ? (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                      Completed
                    </span>
                  ) : (
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      assignment.type === 'quiz' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {assignment.type === 'quiz' ? 'Quiz' : 'Coding'}
                    </span>
                  )}
                  <span className="text-sm text-gray-500">#{assignment.lesson_order}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No assignments or quizzes found</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
