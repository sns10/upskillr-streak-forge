import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useCourseManagement } from '@/hooks/useCourseManagement';

interface Course {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
}

interface CourseEditModalProps {
  course: Course;
  isOpen: boolean;
  onClose: () => void;
}

const CourseEditModal = ({ course, isOpen, onClose }: CourseEditModalProps) => {
  const [formData, setFormData] = useState({
    title: course.title,
    description: course.description || '',
    thumbnail_url: course.thumbnail_url || ''
  });

  const { updateCourseMutation } = useCourseManagement();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateCourseMutation.mutate({
      id: course.id,
      ...formData
    }, {
      onSuccess: () => {
        onClose();
      }
    });
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Course</DialogTitle>
          <DialogDescription>
            Update your course information below.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Course Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Enter course title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Enter course description"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="thumbnail">Thumbnail URL (optional)</Label>
            <Input
              id="thumbnail"
              value={formData.thumbnail_url}
              onChange={(e) => handleChange('thumbnail_url', e.target.value)}
              placeholder="https://example.com/image.jpg"
              type="url"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={updateCourseMutation.isPending}
            >
              {updateCourseMutation.isPending ? 'Updating...' : 'Update Course'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CourseEditModal;