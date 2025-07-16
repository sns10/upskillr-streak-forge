import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCourseManagement } from '@/hooks/useCourseManagement';

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  type: 'video' | 'quiz' | 'assignment';
  content_url: string | null;
  xp_reward: number;
  order_index: number;
}

interface LessonEditModalProps {
  lesson: Lesson;
  isOpen: boolean;
  onClose: () => void;
}

const LessonEditModal = ({ lesson, isOpen, onClose }: LessonEditModalProps) => {
  const [formData, setFormData] = useState({
    title: lesson.title,
    description: lesson.description || '',
    type: lesson.type,
    content_url: lesson.content_url || '',
    xp_reward: lesson.xp_reward,
    order_index: lesson.order_index
  });

  const { updateLessonMutation } = useCourseManagement();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateLessonMutation.mutate({
      id: lesson.id,
      ...formData
    }, {
      onSuccess: () => {
        onClose();
      }
    });
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Lesson</DialogTitle>
          <DialogDescription>
            Update lesson information below.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Lesson Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Enter lesson title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Enter lesson description"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Lesson Type</Label>
            <Select value={formData.type} onValueChange={(value) => handleChange('type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select lesson type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="quiz">Quiz</SelectItem>
                <SelectItem value="assignment">Assignment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content_url">Content URL</Label>
            <Input
              id="content_url"
              value={formData.content_url}
              onChange={(e) => handleChange('content_url', e.target.value)}
              placeholder="Enter content URL (e.g., YouTube URL)"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="xp_reward">XP Reward</Label>
              <Input
                id="xp_reward"
                type="number"
                value={formData.xp_reward}
                onChange={(e) => handleChange('xp_reward', parseInt(e.target.value))}
                min="0"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="order">Order Index</Label>
              <Input
                id="order"
                type="number"
                value={formData.order_index}
                onChange={(e) => handleChange('order_index', parseInt(e.target.value))}
                min="0"
                required
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={updateLessonMutation.isPending}
            >
              {updateLessonMutation.isPending ? 'Updating...' : 'Update Lesson'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LessonEditModal;