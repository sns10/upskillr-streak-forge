import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Save, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CreateAssignmentData {
  lesson_id: string;
  title: string;
  description: string;
  instructions: string;
  max_file_size?: number;
  allowed_file_types?: string[];
  due_date?: string;
  xp_reward: number;
}

interface AssignmentCreatorProps {
  lessonId: string;
  onSave: (assignmentData: CreateAssignmentData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const AssignmentCreator = ({ lessonId, onSave, onCancel, isLoading }: AssignmentCreatorProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [xpReward, setXpReward] = useState(100);
  const [maxFileSize, setMaxFileSize] = useState<number | undefined>(10 * 1024 * 1024); // 10MB
  const [allowedFileTypes, setAllowedFileTypes] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [enableFileUpload, setEnableFileUpload] = useState(false);
  const { toast } = useToast();

  const commonFileTypes = [
    { value: 'pdf', label: 'PDF' },
    { value: 'doc', label: 'Word Document' },
    { value: 'docx', label: 'Word Document (DOCX)' },
    { value: 'txt', label: 'Text File' },
    { value: 'jpg', label: 'JPEG Image' },
    { value: 'png', label: 'PNG Image' },
    { value: 'zip', label: 'ZIP Archive' },
    { value: 'pptx', label: 'PowerPoint' },
    { value: 'xlsx', label: 'Excel' }
  ];

  const handleFileTypeToggle = (fileType: string) => {
    setAllowedFileTypes(prev => 
      prev.includes(fileType) 
        ? prev.filter(type => type !== fileType)
        : [...prev, fileType]
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
    return Math.round(bytes / (1024 * 1024)) + ' MB';
  };

  const validateAssignment = () => {
    if (!title.trim()) {
      throw new Error('Assignment title is required');
    }
    if (!instructions.trim()) {
      throw new Error('Assignment instructions are required');
    }
    if (xpReward < 0) {
      throw new Error('XP reward must be a positive number');
    }
  };

  const handleSave = () => {
    try {
      validateAssignment();
      
      const assignmentData: CreateAssignmentData = {
        lesson_id: lessonId,
        title,
        description,
        instructions,
        xp_reward: xpReward,
        ...(enableFileUpload && {
          max_file_size: maxFileSize,
          allowed_file_types: allowedFileTypes.length > 0 ? allowedFileTypes : undefined
        }),
        ...(dueDate && { due_date: new Date(dueDate).toISOString() })
      };

      onSave(assignmentData);
    } catch (error) {
      toast({
        title: "Validation Error",
        description: error instanceof Error ? error.message : "Please check your assignment details",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Assignment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="assignment-title">Assignment Title *</Label>
            <Input
              id="assignment-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter assignment title"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="assignment-description">Description</Label>
            <Textarea
              id="assignment-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the assignment"
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="assignment-instructions">Instructions *</Label>
            <Textarea
              id="assignment-instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Detailed instructions for completing the assignment"
              rows={6}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="xp-reward">XP Reward</Label>
              <Input
                id="xp-reward"
                type="number"
                value={xpReward}
                onChange={(e) => setXpReward(parseInt(e.target.value) || 0)}
                min="0"
                max="1000"
              />
            </div>

            <div>
              <Label htmlFor="due-date">Due Date (Optional)</Label>
              <Input
                id="due-date"
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File Upload Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Checkbox
              checked={enableFileUpload}
              onCheckedChange={(checked) => setEnableFileUpload(checked as boolean)}
            />
            <span>Enable File Submissions</span>
          </CardTitle>
        </CardHeader>
        {enableFileUpload && (
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="max-file-size">Maximum File Size</Label>
              <Select
                value={maxFileSize?.toString() || ''}
                onValueChange={(value) => setMaxFileSize(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select max file size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={(1024 * 1024).toString()}>1 MB</SelectItem>
                  <SelectItem value={(5 * 1024 * 1024).toString()}>5 MB</SelectItem>
                  <SelectItem value={(10 * 1024 * 1024).toString()}>10 MB</SelectItem>
                  <SelectItem value={(25 * 1024 * 1024).toString()}>25 MB</SelectItem>
                  <SelectItem value={(50 * 1024 * 1024).toString()}>50 MB</SelectItem>
                </SelectContent>
              </Select>
              {maxFileSize && (
                <p className="text-sm text-gray-500 mt-1">
                  Max size: {formatFileSize(maxFileSize)}
                </p>
              )}
            </div>

            <div>
              <Label>Allowed File Types</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {commonFileTypes.map((fileType) => (
                  <div key={fileType.value} className="flex items-center space-x-2">
                    <Checkbox
                      checked={allowedFileTypes.includes(fileType.value)}
                      onCheckedChange={() => handleFileTypeToggle(fileType.value)}
                    />
                    <label className="text-sm">{fileType.label}</label>
                  </div>
                ))}
              </div>
              {allowedFileTypes.length === 0 && (
                <p className="text-sm text-gray-500 mt-2">
                  No file type restrictions (all files allowed)
                </p>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isLoading}>
          <Save className="w-4 h-4 mr-2" />
          {isLoading ? 'Saving...' : 'Save Assignment'}
        </Button>
      </div>
    </div>
  );
};

export default AssignmentCreator;