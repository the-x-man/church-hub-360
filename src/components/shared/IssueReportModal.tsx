import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Card, CardContent } from '../ui/card';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../utils/supabase';

interface IssueReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface IssueFormData {
  issueType: string;
  description: string;
  email: string;
  screenshot?: File;
}

export function IssueReportModal({ isOpen, onClose }: IssueReportModalProps) {
  const [formData, setFormData] = useState<IssueFormData>({
    issueType: '',
    description: '',
    email: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(
    null
  );

  const issueTypes = [
    {
      value: 'bug_report',
      label: 'Bug Report',
      description: 'Report software issues',
    },
    {
      value: 'feedback',
      label: 'Feedback',
      description: 'Related to subscription, payment, quota, etc.',
    },
    {
      value: 'suggestion',
      label: 'Suggestions',
      description: 'Suggest new features or improvements',
    },
  ];

  const handleInputChange = (field: keyof IssueFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        toast.error('File size must be less than 5MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }

      setFormData((prev) => ({ ...prev, screenshot: file }));

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setScreenshotPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeScreenshot = () => {
    setFormData((prev) => ({ ...prev, screenshot: undefined }));
    setScreenshotPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.issueType || !formData.description || !formData.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      // Get Supabase session for authentication
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('Session error:', sessionError);
        toast.error('Authentication error. Please try logging in again.');
        setIsSubmitting(false);
        return;
      }

      if (!session?.access_token) {
        toast.error(
          'You must be logged in to submit an issue. Please log in and try again.'
        );
        setIsSubmitting(false);
        return;
      }

      // Verify the session is still valid
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('User verification error:', userError);
        toast.error('Your session has expired. Please log in again.');
        setIsSubmitting(false);
        return;
      }

      // Prepare form data for submission (including potential file upload)
      const submissionFormData = new FormData();
      submissionFormData.append('issueType', formData.issueType);
      submissionFormData.append('description', formData.description);
      submissionFormData.append('email', formData.email);
      submissionFormData.append('userAgent', navigator.userAgent);
      submissionFormData.append('platform', navigator.platform);

      // Add screenshot file if present
      if (formData.screenshot) {
        submissionFormData.append('screenshot', formData.screenshot);
      }

      // Submit to Supabase edge function with required authentication
      const headers: Record<string, string> = {
        Authorization: `Bearer ${session.access_token}`,
      };

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-issue`,
        {
          method: 'POST',
          headers,
          body: submissionFormData,
        }
      );

      if (!response.ok) {
        let errorMessage = 'Failed to submit issue';
        let debugInfo = null;

        try {
          const errorData = await response.json();
          debugInfo = errorData;
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          // If response is not JSON, use status-based error messages
          if (response.status === 400) {
            errorMessage =
              'Invalid data provided. Please check your input and try again.';
          } else if (response.status === 401) {
            errorMessage =
              'Authentication required. Please log in and try again.';
          } else if (response.status === 403) {
            errorMessage =
              'Access denied. Please verify your email or contact support.';
          } else if (response.status === 413) {
            errorMessage = 'File is too large. Please use a smaller image.';
          } else if (response.status >= 500) {
            errorMessage = 'Server error. Please try again later.';
          } else {
            errorMessage = `Request failed (${response.status}). Please try again.`;
          }
          debugInfo = {
            status: response.status,
            statusText: response.statusText,
            parseError:
              parseError instanceof Error
                ? parseError.message
                : String(parseError),
          };
        }

        // Log detailed error for debugging
        console.error('Issue submission failed:', {
          status: response.status,
          statusText: response.statusText,
          errorMessage,
          debugInfo,
          timestamp: new Date().toISOString(),
          url: response.url,
        });

        throw new Error(errorMessage);
      }

      toast.success(
        "Issue submitted successfully! We'll get back to you soon."
      );

      // Reset form
      setFormData({
        issueType: '',
        description: '',
        email: '',
      });
      setScreenshotPreview(null);
      onClose();
    } catch (error) {
      console.error('Error submitting issue:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to submit issue. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Report an Issue</DialogTitle>
          <DialogDescription>
            Help us improve by reporting bugs, providing feedback, or suggesting
            new features.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Issue Type */}
          <div className="space-y-2">
            <Label htmlFor="issueType">Issue Type *</Label>
            <Select
              value={formData.issueType}
              onValueChange={(value) => handleInputChange('issueType', value)}
            >
              <SelectTrigger className="text-left flex items-baseline leading-6 overflow-hidden w-full">
                <SelectValue placeholder="Select issue type" />
              </SelectTrigger>
              <SelectContent>
                {issueTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div>
                      <div className="font-medium">{type.label}</div>
                      <div className="text-sm text-muted-foreground">
                        {type.description}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Please describe the issue in detail..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={5}
              className="resize-none"
            />
          </div>

          {/* Screenshot Upload */}
          <div className="space-y-2">
            <Label>Screenshot (Optional)</Label>
            <div className="space-y-3">
              {!screenshotPreview ? (
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                  <div className="text-center">
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <div className="text-sm text-muted-foreground mb-2">
                      Upload a screenshot to help us understand the issue
                    </div>
                    <Button type="button" variant="outline" size="sm" asChild>
                      <label htmlFor="screenshot" className="cursor-pointer">
                        Choose File
                        <input
                          id="screenshot"
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    </Button>
                    <div className="text-xs text-muted-foreground mt-1">
                      Max file size: 5MB
                    </div>
                  </div>
                </div>
              ) : (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <ImageIcon className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            {formData.screenshot?.name}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={removeScreenshot}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <img
                          src={screenshotPreview}
                          alt="Screenshot preview"
                          className="max-w-full h-auto max-h-32 rounded border"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="your.email@example.com"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
            />
            <div className="text-xs text-muted-foreground">
              We'll use this email to follow up on your issue
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Issue'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
