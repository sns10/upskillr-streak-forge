import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useCourseManagement } from '@/hooks/useCourseManagement';

interface Module {
  id: string;
  title: string;
  description: string | null;
  order_index: number;
}

interface ModuleEditModalProps {
  module: Module;
  isOpen: boolean;
  onClose: () => void;
}

const ModuleEditModal = ({ module, isOpen, onClose }: ModuleEditModalProps) => {
  const [formData, setFormData] = useState({
    title: module.title,
    description: module.description || '',
    order_index: module.order_index
  });

  const { updateModuleMutation } = useCourseManagement();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateModuleMutation.mutate({
      id: module.id,
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
          <DialogTitle>Edit Module</DialogTitle>
          <DialogDescription>
            Update module information below.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Module Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Enter module title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Enter module description"
              rows={3}
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

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={updateModuleMutation.isPending}
            >
              {updateModuleMutation.isPending ? 'Updating...' : 'Update Module'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ModuleEditModal;