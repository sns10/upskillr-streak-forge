
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ScheduleCardProps {
  userId: string;
}

interface UpcomingLesson {
  id: string;
  title: string;
  course_title: string;
  lesson_type: string;
  order_num: number;
}

export const ScheduleCard = ({ userId }: ScheduleCardProps) => {
  const [upcomingLessons, setUpcomingLessons] = useState<UpcomingLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchUpcomingLessons();
  }, [userId]);

  const fetchUpcomingLessons = async () => {
    try {
      // For now, we'll show all lessons as "upcoming" since we don't have progress tracking
      const { data, error } = await supabase
        .from("lessons")
        .select(`
          id,
          title,
          lesson_type,
          order_num,
          courses(title)
        `)
        .order("order_num")
        .limit(5);

      if (error) throw error;

      const formattedLessons = data?.map(lesson => ({
        id: lesson.id,
        title: lesson.title,
        course_title: lesson.courses?.title || "Unknown Course",
        lesson_type: lesson.lesson_type,
        order_num: lesson.order_num
      })) || [];

      setUpcomingLessons(formattedLessons);
    } catch (error: any) {
      console.error("Error fetching upcoming lessons:", error);
      toast({
        title: "Error",
        description: "Failed to load upcoming lessons",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-white shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-gray-900">
          <Clock className="h-5 w-5 text-blue-600" />
          Your Schedule
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : upcomingLessons.length > 0 ? (
          <div className="space-y-3">
            {upcomingLessons.map((lesson) => (
              <div
                key={lesson.id}
                onClick={() => navigate(`/lesson/${lesson.id}`)}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <BookOpen className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{lesson.title}</h4>
                    <p className="text-sm text-gray-600">{lesson.course_title}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    lesson.lesson_type === 'video' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-purple-100 text-purple-700'
                  }`}>
                    {lesson.lesson_type === 'video' ? 'Video' : 'Coding'}
                  </span>
                  <span className="text-sm text-gray-500">#{lesson.order_num}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No upcoming lessons found</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
