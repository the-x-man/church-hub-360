import { AlertCircle, ArrowLeft, Loader2, Mail, Timer } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

type ResetStep = 'email' | 'otp';

export function PasswordReset() {
  const [step, setStep] = useState<ResetStep>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [remainingRequests, setRemainingRequests] = useState(4);

  const { requestOtp, verifyOtp, checkFirstTimeLogin } = useAuth();
  const navigate = useNavigate();

  // Cooldown timer
  useEffect(() => {
    if (cooldownSeconds > 0) {
      const timer = setTimeout(() => {
        setCooldownSeconds((prev) => {
          const newValue = prev - 1;
          if (newValue === 0) {
            setError(''); // Clear error when countdown hits zero
          }
          return newValue;
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownSeconds]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await requestOtp(email);

      if (result.success) {
        setStep('otp');
        setRemainingRequests(result.remainingRequests || 0);
      } else {
        setError(result.message);
        if (result.cooldownMinutes) {
          const cooldownSeconds = result.cooldownMinutes * 60;
          setCooldownSeconds(cooldownSeconds);
        }
        if (result.remainingRequests !== undefined) {
          setRemainingRequests(result.remainingRequests);
        }
      }
    } catch (err) {
      setError((err as any).message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await verifyOtp(email, otp);

      if (result.success) {
        // Check if it's the first time login
        const isFirstLogin = await checkFirstTimeLogin(result.session.user.id);

        navigate('/new-password', {
          state: { email, isFirstLogin },
        });
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError((err as any).message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldownSeconds > 0) return;

    setError('');
    setLoading(true);

    try {
      const result = await requestOtp(email);

      if (result.success) {
        setRemainingRequests(result.remainingRequests || 4);
        // Don't set cooldown on success - let the backend handle it on next request
        setError('');
      } else {
        setError(result.message);
        if (result.cooldownMinutes) {
          const cooldownSeconds = result.cooldownMinutes * 60;
          setCooldownSeconds(cooldownSeconds);
        }
        if (result.remainingRequests !== undefined) {
          setRemainingRequests(result.remainingRequests);
        }
      }
    } catch (err) {
      setError((err as any).message || 'Failed to resend verification code');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Reset Password</h1>
          <p className="mt-2 text-sm text-gray-600">
            {step === 'email' &&
              'Enter your email to receive a verification code'}
            {step === 'otp' && 'Enter the verification code sent to your email'}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {step === 'email' && <Mail className="h-5 w-5" />}
              {step === 'otp' && <Timer className="h-5 w-5" />}
              <span>
                {step === 'email' && 'Enter Email Address'}
                {step === 'otp' && 'Verify Code'}
              </span>
            </CardTitle>
            <CardDescription>
              {step === 'email' &&
                "We'll send a verification code to your email"}
              {step === 'otp' && `Code sent to ${email}`}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Email Step */}
            {step === 'email' && (
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    required
                    className={loading ? 'opacity-50' : ''}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || cooldownSeconds > 0}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {loading
                    ? 'Sending...'
                    : cooldownSeconds > 0
                    ? `Wait ${formatTime(cooldownSeconds)}`
                    : 'Send Verification Code'}
                </Button>

                <div className="text-center">
                  <Link
                    to="/login"
                    className="text-sm text-blue-600 hover:text-blue-500 flex items-center justify-center space-x-1 transition-colors"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    <span>Back to login</span>
                  </Link>
                </div>
              </form>
            )}

            {/* OTP Step */}
            {step === 'otp' && (
              <form onSubmit={handleOtpSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="otp">Verification Code</Label>
                  <Input
                    id="otp"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    className={`text-center text-lg tracking-widest ${
                      loading ? 'opacity-50' : ''
                    }`}
                    required
                  />
                </div>

                <div className="text-sm text-gray-600">
                  <p>Remaining requests: {remainingRequests}</p>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || !otp || cooldownSeconds > 0}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {loading
                    ? 'Verifying...'
                    : cooldownSeconds > 0
                    ? `Wait ${formatTime(cooldownSeconds)}`
                    : 'Verify Code'}
                </Button>

                <div className="flex justify-between text-sm">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={
                      cooldownSeconds > 0 || remainingRequests <= 0 || loading
                    }
                    className="text-blue-600 hover:text-blue-500 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    Resend Code
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep('email')}
                    disabled={loading}
                    className="text-gray-600 hover:text-gray-500 flex items-center space-x-1 transition-colors disabled:opacity-50"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    <span>Change Email</span>
                  </button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
