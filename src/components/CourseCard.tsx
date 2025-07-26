
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";

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

interface Course {
  id: string;
  title: string;
  description: string;
  image_url: string;
  lessons: Lesson[];
}

interface CourseCardProps {
  course: Course;
  completedLessons: Set<string>;
  isMobile?: boolean;
  isTablet?: boolean;
}

export const CourseCard = ({ course, completedLessons, isMobile, isTablet }: CourseCardProps) => {
  const navigate = useNavigate();

  const calculateProgress = (lessons: Lesson[]) => {
    if (lessons.length === 0) return 0;
    
    const completedCount = lessons.filter(lesson => 
      completedLessons.has(lesson.id) || 
      (lesson.assignmentId && completedLessons.has(lesson.assignmentId)) ||
      (lesson.originalLessonId && completedLessons.has(lesson.originalLessonId))
    ).length;
    
    return Math.round((completedCount / lessons.length) * 100);
  };

  const handleCardClick = () => {
    navigate(`/courses/${course.id}`);
  };

  const totalXP = course.lessons.reduce((sum, lesson) => sum + lesson.xp_reward, 0);
  const totalBits = course.lessons.reduce((sum, lesson) => sum + lesson.bits_reward, 0);
  const progress = calculateProgress(course.lessons);

  return (
    <Card 
      className="overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer hover-scale"
      onClick={handleCardClick}
    >
      {course.image_url && (
        <div className="aspect-video overflow-hidden">
          <img
            src={course.image_url}
            alt={course.title}
            className="w-full h-full object-cover transition-transform duration-200 hover:scale-105"
          />
        </div>
      )}
      
      <CardHeader className={isMobile ? 'p-4' : ''}>
        <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-base' : ''}`}>
          <BookOpen className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} flex-shrink-0 text-primary`} />
          <span className="break-words">{course.title}</span>
        </CardTitle>
        <CardDescription className={isMobile ? 'text-sm' : ''}>{course.description}</CardDescription>
      </CardHeader>
      
      <CardContent className={`space-y-4 ${isMobile ? 'p-4 pt-0' : ''}`}>
        {/* Course Summary */}
        <div className={`flex items-center justify-between ${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
          <span>
            {course.lessons.length} Lesson{course.lessons.length !== 1 ? 's' : ''} • {totalXP} XP
          </span>
          {progress > 0 && (
            <Badge variant="secondary" className={isMobile ? 'text-xs px-2 py-1' : ''}>
              {progress}% Complete
            </Badge>
          )}
        </div>
        
        {/* Rewards Summary */}
        <div className="flex gap-2">
          <Badge variant="outline" className={`${isMobile ? 'text-xs px-2 py-1' : ''} bg-primary/5 text-primary border-primary/20`}>
            {totalXP} XP Total
          </Badge>
          <Badge variant="outline" className={`${isMobile ? 'text-xs px-2 py-1' : ''} bg-secondary/5 text-secondary-foreground border-secondary/20`}>
            {totalBits} Bits Total
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};
