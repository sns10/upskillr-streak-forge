
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Save, X, Trash2, HelpCircle, FileText } from 'lucide-react';
import { useCourseManagement } from '@/hooks/useCourseManagement';
import QuizCreator from '@/components/QuizCreator';
import AssignmentCreator from '@/components/AssignmentCreator';
import { useQuizManagement } from '@/hooks/useQuizManagement';
import { useAssignmentManagement } from '@/hooks/useAssignmentManagement';

interface Module {
  title: string;
  description: string;
  lessons: Lesson[];
}

interface Lesson {
  title: string;
  description: string;
  type: 'video' | 'quiz' | 'assignment';
  content_url: string;
  xp_reward: number;
}

interface CourseCreationFormProps {
  onClose: () => void;
}

const CourseCreationForm = ({ onClose }: CourseCreationFormProps) => {
  const { createCourseMutation, createModuleMutation, createLessonMutation } = useCourseManagement();
  const { createQuizMutation } = useQuizManagement();
  const { createAssignmentMutation } = useAssignmentManagement();
  
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [modules, setModules] = useState<Module[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [showQuizCreator, setShowQuizCreator] = useState<{ moduleIndex: number; lessonIndex: number } | null>(null);
  const [showAssignmentCreator, setShowAssignmentCreator] = useState<{ moduleIndex: number; lessonIndex: number } | null>(null);

  const addModule = () => {
    setModules([...modules, { title: '', description: '', lessons: [] }]);
  };

  const removeModule = (index: number) => {
    setModules(modules.filter((_, i) => i !== index));
  };

  const updateModule = (index: number, field: keyof Omit<Module, 'lessons'>, value: string) => {
    const updated = [...modules];
    updated[index] = { ...updated[index], [field]: value };
    setModules(updated);
  };

  const addLesson = (moduleIndex: number) => {
    const updated = [...modules];
    updated[moduleIndex].lessons.push({
      title: '',
      description: '',
      type: 'video',
      content_url: '',
      xp_reward: 50
    });
    setModules(updated);
  };

  const removeLesson = (moduleIndex: number, lessonIndex: number) => {
    const updated = [...modules];
    updated[moduleIndex].lessons = updated[moduleIndex].lessons.filter((_, i) => i !== lessonIndex);
    setModules(updated);
  };

  const updateLesson = (moduleIndex: number, lessonIndex: number, field: keyof Lesson, value: string | number) => {
    const updated = [...modules];
    updated[moduleIndex].lessons[lessonIndex] = {
      ...updated[moduleIndex].lessons[lessonIndex],
      [field]: value
    };
    setModules(updated);
  };

  const validateForm = () => {
    if (!courseTitle.trim()) {
      throw new Error('Course title is required');
    }
    
    if (modules.length === 0) {
      throw new Error('At least one module is required');
    }

    modules.forEach((module, moduleIndex) => {
      if (!module.title.trim()) {
        throw new Error(`Module ${moduleIndex + 1} title is required`);
      }
      
      if (module.lessons.length === 0) {
        throw new Error(`Module "${module.title}" must have at least one lesson`);
      }

      module.lessons.forEach((lesson, lessonIndex) => {
        if (!lesson.title.trim()) {
          throw new Error(`Lesson ${lessonIndex + 1} in "${module.title}" must have a title`);
        }
        if (lesson.xp_reward < 0) {
          throw new Error(`Lesson "${lesson.title}" XP reward must be positive`);
        }
      });
    });
  };

  const handleSubmit = async () => {
    setIsCreating(true);
    try {
      validateForm();

      // Create course
      const course = await createCourseMutation.mutateAsync({
        title: courseTitle,
        description: courseDescription
      });

      // Create modules and lessons
      for (let i = 0; i < modules.length; i++) {
        const moduleData = modules[i];
        const module = await createModuleMutation.mutateAsync({
          course_id: course.id,
          title: moduleData.title,
          description: moduleData.description,
          order_index: i
        });

        // Create lessons for this module
        for (let j = 0; j < moduleData.lessons.length; j++) {
          const lessonData = moduleData.lessons[j];
          const lesson = await createLessonMutation.mutateAsync({
            module_id: module.id,
            title: lessonData.title,
            description: lessonData.description,
            type: lessonData.type,
            content_url: lessonData.content_url,
            xp_reward: lessonData.xp_reward,
            order_index: j
          });

          // Create quiz or assignment if specified
          if (lessonData.type === 'quiz' && (lessonData as any).quizData) {
            await createQuizMutation.mutateAsync({
              lesson_id: lesson.id,
              title: `${lessonData.title} Quiz`,
              questions: (lessonData as any).quizData.questions,
              xp_reward: lessonData.xp_reward
            });
          }

          if (lessonData.type === 'assignment' && (lessonData as any).assignmentData) {
            const assignmentData = { ...(lessonData as any).assignmentData };
            // Remove lesson_id if it's "temp" and use the actual lesson id
            delete assignmentData.lesson_id;
            await createAssignmentMutation.mutateAsync({
              lesson_id: lesson.id,
              ...assignmentData
            });
          }
        }
      }

      onClose();
    } catch (error) {
      console.error('Error creating course:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Create New Course</CardTitle>
                <CardDescription>Build a comprehensive learning experience</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Course Details */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="course-title">Course Title *</Label>
                <Input
                  id="course-title"
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  placeholder="Enter course title"
                  required
                />
              </div>
              <div>
                <Label htmlFor="course-description">Course Description</Label>
                <Textarea
                  id="course-description"
                  value={courseDescription}
                  onChange={(e) => setCourseDescription(e.target.value)}
                  placeholder="Describe what students will learn"
                  rows={3}
                />
              </div>
            </div>

            {/* Modules */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Modules</h3>
                <Button onClick={addModule} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Module
                </Button>
              </div>

              {modules.length === 0 && (
                <p className="text-gray-500 text-center py-4">No modules yet. Add your first module to get started.</p>
              )}

              {modules.map((module, moduleIndex) => (
                <Card key={moduleIndex} className="border-l-4 border-l-blue-500">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1 space-y-2">
                        <Input
                          value={module.title}
                          onChange={(e) => updateModule(moduleIndex, 'title', e.target.value)}
                          placeholder="Module title *"
                          required
                        />
                        <Textarea
                          value={module.description}
                          onChange={(e) => updateModule(moduleIndex, 'description', e.target.value)}
                          placeholder="Module description"
                          rows={2}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeModule(moduleIndex)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">Lessons</h4>
                        <Button
                          onClick={() => addLesson(moduleIndex)}
                          size="sm"
                          variant="outline"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Lesson
                        </Button>
                      </div>

                      {module.lessons.length === 0 && (
                        <p className="text-gray-400 text-sm">No lessons in this module yet.</p>
                      )}

                      {module.lessons.map((lesson, lessonIndex) => (
                        <div key={lessonIndex} className="p-3 bg-gray-50 rounded-lg space-y-3">
                            <div className="flex justify-between items-start">
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                              <Input
                                value={lesson.title}
                                onChange={(e) => updateLesson(moduleIndex, lessonIndex, 'title', e.target.value)}
                                placeholder="Lesson title *"
                                required
                              />
                              <Select
                                value={lesson.type}
                                onValueChange={(value: 'video' | 'quiz' | 'assignment') => 
                                  updateLesson(moduleIndex, lessonIndex, 'type', value)
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="video">Video</SelectItem>
                                  <SelectItem value="quiz">Quiz</SelectItem>
                                  <SelectItem value="assignment">Assignment</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex items-center space-x-2">
                              {lesson.type === 'quiz' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setShowQuizCreator({ moduleIndex, lessonIndex })}
                                >
                                  <HelpCircle className="w-4 h-4 mr-1" />
                                  Quiz
                                </Button>
                              )}
                              {lesson.type === 'assignment' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setShowAssignmentCreator({ moduleIndex, lessonIndex })}
                                >
                                  <FileText className="w-4 h-4 mr-1" />
                                  Assignment
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeLesson(moduleIndex, lessonIndex)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <Input
                            value={lesson.content_url}
                            onChange={(e) => updateLesson(moduleIndex, lessonIndex, 'content_url', e.target.value)}
                            placeholder="Content URL (YouTube link, etc.)"
                          />
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <Textarea
                              value={lesson.description}
                              onChange={(e) => updateLesson(moduleIndex, lessonIndex, 'description', e.target.value)}
                              placeholder="Lesson description"
                              rows={2}
                            />
                            <Input
                              type="number"
                              value={lesson.xp_reward}
                              onChange={(e) => updateLesson(moduleIndex, lessonIndex, 'xp_reward', parseInt(e.target.value) || 0)}
                              placeholder="XP Reward"
                              min="0"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button variant="outline" onClick={onClose} disabled={isCreating}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={!courseTitle.trim() || isCreating}>
                <Save className="w-4 h-4 mr-2" />
                {isCreating ? 'Creating...' : 'Create Course'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quiz Creator Modal */}
        {showQuizCreator && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <QuizCreator
                lessonId="temp"
                onSave={(title, questions, xpReward) => {
                  const updated = [...modules];
                  (updated[showQuizCreator.moduleIndex].lessons[showQuizCreator.lessonIndex] as any).quizData = {
                    questions,
                    title
                  };
                  updated[showQuizCreator.moduleIndex].lessons[showQuizCreator.lessonIndex].xp_reward = xpReward;
                  setModules(updated);
                  setShowQuizCreator(null);
                }}
                onCancel={() => setShowQuizCreator(null)}
              />
            </div>
          </div>
        )}

        {/* Assignment Creator Modal */}
        {showAssignmentCreator && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <AssignmentCreator
                lessonId="temp"
                onSave={(assignmentData) => {
                  const updated = [...modules];
                  (updated[showAssignmentCreator.moduleIndex].lessons[showAssignmentCreator.lessonIndex] as any).assignmentData = assignmentData;
                  updated[showAssignmentCreator.moduleIndex].lessons[showAssignmentCreator.lessonIndex].xp_reward = assignmentData.xp_reward;
                  setModules(updated);
                  setShowAssignmentCreator(null);
                }}
                onCancel={() => setShowAssignmentCreator(null)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseCreationForm;
