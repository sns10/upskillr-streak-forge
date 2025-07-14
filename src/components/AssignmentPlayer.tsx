import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileText, Download, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Assignment {
  id: string;
  title: string;
  description: string;
  instructions: string;
  max_file_size?: number;
  allowed_file_types?: string[];
  due_date?: string;
  xp_reward: number;
}

interface AssignmentSubmission {
  id: string;
  text_submission?: string;
  file_url?: string;
  file_name?: string;
  submitted_at: string;
  grade?: number;
  feedback?: string;
  status: 'submitted' | 'graded' | 'returned';
}

interface AssignmentPlayerProps {
  assignment: Assignment;
  submission?: AssignmentSubmission;
  onSubmit: (textSubmission: string, file?: File) => void;
  isSubmitting: boolean;
}

const AssignmentPlayer = ({ assignment, submission, onSubmit, isSubmitting }: AssignmentPlayerProps) => {
  const [textSubmission, setTextSubmission] = useState(submission?.text_submission || '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size
    if (assignment.max_file_size && file.size > assignment.max_file_size) {
      toast({
        title: "File too large",
        description: `Maximum file size is ${formatFileSize(assignment.max_file_size)}`,
        variant: "destructive",
      });
      return;
    }

    // Check file type
    if (assignment.allowed_file_types && assignment.allowed_file_types.length > 0) {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (!fileExtension || !assignment.allowed_file_types.includes(fileExtension)) {
        toast({
          title: "Invalid file type",
          description: `Allowed file types: ${assignment.allowed_file_types.join(', ')}`,
          variant: "destructive",
        });
        return;
      }
    }

    setSelectedFile(file);
  };

  const handleSubmit = () => {
    if (!textSubmission.trim() && !selectedFile) {
      toast({
        title: "Submission required",
        description: "Please provide either a text submission or upload a file",
        variant: "destructive",
      });
      return;
    }

    onSubmit(textSubmission, selectedFile || undefined);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const isSubmitted = !!submission;
  const isGraded = submission?.status === 'graded';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {assignment.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Description</h3>
            <p className="text-gray-700">{assignment.description}</p>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Instructions</h3>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-blue-900 whitespace-pre-wrap">{assignment.instructions}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            {assignment.due_date && (
              <div>
                <span className="font-medium">Due Date:</span>
                <p>{new Date(assignment.due_date).toLocaleDateString()}</p>
              </div>
            )}
            <div>
              <span className="font-medium">XP Reward:</span>
              <p>{assignment.xp_reward} XP</p>
            </div>
            {assignment.max_file_size && (
              <div>
                <span className="font-medium">Max File Size:</span>
                <p>{formatFileSize(assignment.max_file_size)}</p>
              </div>
            )}
          </div>

          {assignment.allowed_file_types && assignment.allowed_file_types.length > 0 && (
            <div>
              <span className="font-medium text-sm">Allowed file types:</span>
              <p className="text-sm text-gray-600">{assignment.allowed_file_types.join(', ')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submission Status */}
      {isSubmitted && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Submission Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span>Submitted:</span>
              <span className="text-green-600">
                {new Date(submission.submitted_at).toLocaleDateString()}
              </span>
            </div>
            
            {isGraded && (
              <>
                <div className="flex justify-between items-center">
                  <span>Grade:</span>
                  <span className="font-semibold">
                    {submission.grade !== undefined ? `${submission.grade}%` : 'Not graded'}
                  </span>
                </div>
                
                {submission.feedback && (
                  <div>
                    <h4 className="font-medium mb-2">Instructor Feedback:</h4>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-gray-700">{submission.feedback}</p>
                    </div>
                  </div>
                )}
              </>
            )}

            {submission.file_url && (
              <div>
                <Label>Submitted File:</Label>
                <Button variant="outline" size="sm" className="mt-1">
                  <Download className="w-4 h-4 mr-2" />
                  {submission.file_name || 'Download File'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Submission Form */}
      {!isSubmitted && (
        <Card>
          <CardHeader>
            <CardTitle>Submit Assignment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="text-submission">Text Submission</Label>
              <Textarea
                id="text-submission"
                value={textSubmission}
                onChange={(e) => setTextSubmission(e.target.value)}
                placeholder="Enter your assignment submission here..."
                rows={8}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="file-upload">File Upload (Optional)</Label>
              <div className="mt-1 flex items-center space-x-2">
                <Input
                  id="file-upload"
                  type="file"
                  onChange={handleFileSelect}
                  accept={assignment.allowed_file_types?.map(type => `.${type}`).join(',')}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('file-upload')?.click()}
                  className="flex items-center space-x-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>Choose File</span>
                </Button>
                {selectedFile && (
                  <span className="text-sm text-gray-600">
                    {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  </span>
                )}
              </div>
            </div>

            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting || (!textSubmission.trim() && !selectedFile)}
              className="w-full"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Assignment'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AssignmentPlayer;