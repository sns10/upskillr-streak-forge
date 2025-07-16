import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  ChevronDown,
  ChevronRight,
  Play,
  BookOpen,
  Clock,
  CheckCircle,
  Trophy,
  ArrowLeft,
  List,
  X
} from 'lucide-react';

interface NavLesson {
  id: string;
  title: string;
  order_index: number;
  type: string;
  completed?: boolean;
}

interface NavModule {
  id: string;
  title: string;
  order_index: number;
  lessons: NavLesson[];
}

interface NavCourse {
  id: string;
  title: string;
  modules: NavModule[];
}

interface CourseNavigationProps {
  course: NavCourse;
  currentLessonId?: string;
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

const CourseNavigation = ({ course, currentLessonId, isOpen, onToggle, className = '' }: CourseNavigationProps) => {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  // Calculate course statistics
  const totalLessons = course.modules.reduce((acc, module) => acc + module.lessons.length, 0);
  const completedLessons = course.modules.reduce((acc, module) => 
    acc + module.lessons.filter(lesson => lesson.completed).length, 0
  );
  const progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

  // Find current lesson's module and expand it
  React.useEffect(() => {
    if (currentLessonId) {
      const moduleWithCurrentLesson = course.modules.find(module =>
        module.lessons.some(lesson => lesson.id === currentLessonId)
      );
      if (moduleWithCurrentLesson) {
        setExpandedModules(prev => new Set([...prev, moduleWithCurrentLesson.id]));
      }
    }
  }, [currentLessonId, course.modules]);

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  const getLessonIcon = (lesson: NavLesson) => {
    if (lesson.completed) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
    switch (lesson.type) {
      case 'video':
        return <Play className="w-4 h-4 text-blue-500" />;
      case 'quiz':
        return <BookOpen className="w-4 h-4 text-purple-500" />;
      case 'assignment':
        return <Clock className="w-4 h-4 text-orange-500" />;
      default:
        return <Play className="w-4 h-4 text-gray-500" />;
    }
  };

  const getNextLesson = () => {
    if (!currentLessonId) return null;
    
    let foundCurrent = false;
    for (const module of course.modules) {
      for (const lesson of module.lessons) {
        if (foundCurrent) {
          return lesson;
        }
        if (lesson.id === currentLessonId) {
          foundCurrent = true;
        }
      }
    }
    return null;
  };

  const getPreviousLesson = () => {
    if (!currentLessonId) return null;
    
    let previousLesson: NavLesson | null = null;
    for (const module of course.modules) {
      for (const lesson of module.lessons) {
        if (lesson.id === currentLessonId) {
          return previousLesson;
        }
        previousLesson = lesson;
      }
    }
    return null;
  };

  if (!isOpen) {
    return (
      <div className={`fixed left-4 top-4 z-50 ${className}`}>
        <Button
          onClick={onToggle}
          variant="default"
          size="sm"
          className="bg-white/90 backdrop-blur-sm text-gray-700 hover:bg-white shadow-lg"
        >
          <List className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
        onClick={onToggle}
      />
      
      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full w-80 bg-white/95 backdrop-blur-md border-r border-gray-200 shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${className}`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <Link to={`/course/${course.id}`}>
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Course
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={onToggle}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <h2 className="font-semibold text-gray-900 text-sm mb-2 line-clamp-2">
              {course.title}
            </h2>
            
            {/* Progress Summary */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-600">
                <span>{completedLessons} of {totalLessons} lessons</span>
                <span>{Math.round(progressPercentage)}% complete</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
          </div>

          {/* Navigation Buttons */}
          {currentLessonId && (
            <div className="p-4 border-b border-gray-200 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                {getPreviousLesson() ? (
                  <Link to={`/lesson/${getPreviousLesson()!.id}`}>
                    <Button variant="outline" size="sm" className="w-full text-xs">
                      ← Previous
                    </Button>
                  </Link>
                ) : (
                  <Button variant="outline" size="sm" disabled className="w-full text-xs">
                    ← Previous
                  </Button>
                )}
                
                {getNextLesson() ? (
                  <Link to={`/lesson/${getNextLesson()!.id}`}>
                    <Button size="sm" className="w-full text-xs">
                      Next →
                    </Button>
                  </Link>
                ) : (
                  <Button size="sm" disabled className="w-full text-xs">
                    Next →
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Modules and Lessons */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-2">
              {course.modules.map((module, moduleIndex) => {
                const moduleProgress = module.lessons.length > 0 
                  ? (module.lessons.filter(l => l.completed).length / module.lessons.length) * 100 
                  : 0;
                const isExpanded = expandedModules.has(module.id);

                return (
                  <Collapsible key={module.id} open={isExpanded} onOpenChange={() => toggleModule(module.id)}>
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                        <div className="flex items-center space-x-2 flex-1 text-left">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-500" />
                          )}
                          <div className="flex-1">
                            <div className="font-medium text-sm text-gray-900">
                              Module {moduleIndex + 1}: {module.title}
                            </div>
                            <div className="flex items-center space-x-2 mt-1">
                              <Progress value={moduleProgress} className="h-1 flex-1" />
                              <span className="text-xs text-gray-500">
                                {Math.round(moduleProgress)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent className="space-y-1 ml-2 mt-1">
                      {module.lessons.map((lesson, lessonIndex) => {
                        const isActive = lesson.id === currentLessonId;
                        
                        return (
                          <Link key={lesson.id} to={`/lesson/${lesson.id}`}>
                            <div className={`flex items-center space-x-2 p-2 rounded-lg transition-colors ${
                              isActive 
                                ? 'bg-blue-50 border-l-2 border-blue-500' 
                                : 'hover:bg-gray-50'
                            }`}>
                              <div className="flex-shrink-0">
                                {getLessonIcon(lesson)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className={`text-sm font-medium truncate ${
                                  isActive ? 'text-blue-700' : 'text-gray-900'
                                }`}>
                                  {lessonIndex + 1}. {lesson.title}
                                </div>
                                <div className="flex items-center space-x-2 mt-1">
                                  <Badge variant="secondary" className="text-xs px-1 py-0">
                                    <Trophy className="w-2 h-2 mr-1" />
                                    XP
                                  </Badge>
                                  <span className="text-xs text-gray-500 capitalize">
                                    {lesson.type}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </div>
    </>
  );
};

export default CourseNavigation;