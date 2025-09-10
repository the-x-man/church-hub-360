import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Eye,
  EyeOff,
  Loader2,
  Lock,
} from 'lucide-react';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Button } from '../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useAuth } from '../../contexts/AuthContext';

interface PasswordValidation {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

interface ValidationItemProps {
  isValid: boolean;
  text: string;
}

function ValidationItem({ isValid, text }: ValidationItemProps) {
  return (
    <div className="flex items-center space-x-2">
      <CheckCircle
        className={`h-4 w-4 ${isValid ? 'text-green-500' : 'text-gray-300'}`}
      />
      <span
        className={`text-sm ${isValid ? 'text-green-700' : 'text-gray-500'}`}
      >
        {text}
      </span>
    </div>
  );
}

export function NewPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get data from location state (from password reset flow or first login)
  const { isFirstLogin } = location.state || {};

  const validatePassword = (password: string): PasswordValidation => {
    return {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
  };

  const validation = validatePassword(newPassword);
  const isPasswordValid = Object.values(validation).every(Boolean);
  const passwordsMatch = newPassword === confirmPassword;

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPasswordValid || !passwordsMatch) {
      setError(
        'Please ensure password meets all requirements and passwords match'
      );
      return;
    }

    setError('');
    setLoading(true);

    try {
      const result = await updatePassword({
        newPassword,
        type: isFirstLogin ? 'first_time_login' : 'password_reset',
      });

      if (result.success) {
        setSuccess(true);
        // Redirect based on context
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError((err as any).message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  // Success step
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Password Updated Successfully!
              </h2>
              <p className="text-gray-600 mb-4">
                {isFirstLogin
                  ? 'Welcome! Redirecting to dashboard...'
                  : 'Your password has been updated. Redirecting to dashboard...'}
              </p>
              <Button
                variant="outline"
                onClick={() => navigate('/dashboard', { replace: true })}
              >
                Continue to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            {isFirstLogin ? 'Set Your Password' : 'Create New Password'}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            {isFirstLogin
              ? 'Welcome! Please set a secure password for your account'
              : 'Choose a strong password for your account'}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Lock className="h-5 w-5" />
              <span>
                {isFirstLogin ? 'Set Your Password' : 'Set New Password'}
              </span>
            </CardTitle>
            <CardDescription>
              {isFirstLogin
                ? 'Create a secure password to complete your account setup'
                : 'Create a secure password for your account'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter your new password"
                    className={`pr-10 ${loading ? 'opacity-50' : ''}`}
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Password Validation */}
              {newPassword && (
                <div className="space-y-2 p-3 bg-gray-50 rounded-md">
                  <p className="text-sm font-medium text-gray-700">
                    Password Requirements:
                  </p>
                  <ValidationItem
                    isValid={validation.minLength}
                    text="At least 8 characters"
                  />
                  <ValidationItem
                    isValid={validation.hasUppercase}
                    text="One uppercase letter"
                  />
                  <ValidationItem
                    isValid={validation.hasLowercase}
                    text="One lowercase letter"
                  />
                  <ValidationItem
                    isValid={validation.hasNumber}
                    text="One number"
                  />
                  <ValidationItem
                    isValid={validation.hasSpecialChar}
                    text="One special character"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your new password"
                    className={`pr-10 ${loading ? 'opacity-50' : ''}`}
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={loading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {confirmPassword && !passwordsMatch && (
                  <p className="text-sm text-red-600">Passwords do not match</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading || !isPasswordValid || !passwordsMatch}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading
                  ? 'Updating Password...'
                  : isFirstLogin
                  ? 'Set Password & Continue'
                  : 'Update Password'}
              </Button>

              {!isFirstLogin && (
                <div className="flex justify-center w-full">
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    disabled={loading}
                    className="text-sm text-gray-600 hover:text-gray-500 flex items-center justify-center space-x-1 transition-colors disabled:opacity-50"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    <span>Back to login</span>
                  </button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
