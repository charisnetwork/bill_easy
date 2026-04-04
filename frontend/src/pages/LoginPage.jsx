import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Building2, Mail, Lock, Eye, EyeOff, ArrowLeft, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import api from '../services/api';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetStep, setResetStep] = useState(1); // 1: email, 2: OTP, 3: new password
  const [resetData, setResetData] = useState({
    email: '',
    resetToken: '',
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(formData.email, formData.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (error) {
      const errorCode = error.response?.data?.error;
      if (errorCode === 'ACCOUNT_EXISTS') {
        toast.error(`Account already exists. Email: ${error.response.data.maskedEmail}`);
      } else {
        toast.error(error.response?.data?.error || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password Handlers
  const handleRequestReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/auth/request-reset', { email: resetData.email });
      setResetData(prev => ({ ...prev, resetToken: response.data.resetToken }));
      toast.success(`OTP sent to ${response.data.maskedEmail}`);
      setResetStep(2);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to send reset OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyReset = async (e) => {
    e.preventDefault();
    if (resetData.newPassword !== resetData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (resetData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/verify-reset', {
        resetToken: resetData.resetToken,
        otp: resetData.otp,
        newPassword: resetData.newPassword
      });
      toast.success('Password reset successful! Please login.');
      setForgotMode(false);
      setResetStep(1);
      setResetData({ email: '', resetToken: '', otp: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  // Render Forgot Password UI
  if (forgotMode) {
    return (
      <div className="min-h-screen flex">
        <div className="flex-1 flex items-center justify-center p-8 bg-white">
          <div className="w-full max-w-md">
            <button 
              onClick={() => setForgotMode(false)}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </button>

            <Card className="border-0 shadow-none">
              <CardHeader className="px-0">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
                  <KeyRound className="w-6 h-6 text-emerald-600" />
                </div>
                <CardTitle className="font-heading text-2xl">Reset Password</CardTitle>
                <CardDescription>
                  {resetStep === 1 && "Enter your email to receive a 6-digit OTP"}
                  {resetStep === 2 && "Enter the 6-digit OTP sent to your email"}
                  {resetStep === 3 && "Create a new password for your account"}
                </CardDescription>
              </CardHeader>
              <CardContent className="px-0">
                {resetStep === 1 && (
                  <form onSubmit={handleRequestReset} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reset-email">Email</Label>
                      <div 
                        className="flex items-center px-4 py-3 border border-slate-200 rounded-lg bg-white focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all"
                        style={{ display: 'flex', alignItems: 'center' }}
                      >
                        <Mail className="w-4 h-4 text-slate-400 mr-3 flex-shrink-0" style={{ marginRight: '12px' }} />
                        <input
                          id="reset-email"
                          type="email"
                          placeholder="you@company.com"
                          value={resetData.email}
                          onChange={(e) => setResetData({ ...resetData, email: e.target.value })}
                          className="flex-1 bg-transparent border-none outline-none text-slate-900 placeholder:text-slate-400"
                          style={{ flex: 1, border: 'none' }}
                          required
                        />
                      </div>
                    </div>
                    <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
                      {loading ? 'Sending OTP...' : 'Send OTP'}
                    </Button>
                  </form>
                )}

                {resetStep === 2 && (
                  <form onSubmit={(e) => { e.preventDefault(); setResetStep(3); }} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="otp">6-Digit OTP</Label>
                      <Input
                        id="otp"
                        type="text"
                        placeholder="123456"
                        maxLength={6}
                        value={resetData.otp}
                        onChange={(e) => setResetData({ ...resetData, otp: e.target.value })}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
                      Verify OTP
                    </Button>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      className="w-full"
                      onClick={() => setResetStep(1)}
                    >
                      Resend OTP
                    </Button>
                  </form>
                )}

                {resetStep === 3 && (
                  <form onSubmit={handleVerifyReset} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <div 
                        className="flex items-center px-4 py-3 border border-slate-200 rounded-lg bg-white focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all"
                        style={{ display: 'flex', alignItems: 'center' }}
                      >
                        <Lock className="w-4 h-4 text-slate-400 mr-3 flex-shrink-0" style={{ marginRight: '12px' }} />
                        <input
                          id="new-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={resetData.newPassword}
                          onChange={(e) => setResetData({ ...resetData, newPassword: e.target.value })}
                          className="flex-1 bg-transparent border-none outline-none text-slate-900 placeholder:text-slate-400"
                          style={{ flex: 1, border: 'none' }}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm Password</Label>
                      <div 
                        className="flex items-center px-4 py-3 border border-slate-200 rounded-lg bg-white focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all"
                        style={{ display: 'flex', alignItems: 'center' }}
                      >
                        <Lock className="w-4 h-4 text-slate-400 mr-3 flex-shrink-0" style={{ marginRight: '12px' }} />
                        <input
                          id="confirm-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={resetData.confirmPassword}
                          onChange={(e) => setResetData({ ...resetData, confirmPassword: e.target.value })}
                          className="flex-1 bg-transparent border-none outline-none text-slate-900 placeholder:text-slate-400"
                          style={{ flex: 1, border: 'none' }}
                          required
                        />
                      </div>
                    </div>
                    <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
                      {loading ? 'Resetting...' : 'Reset Password'}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right side - Branding */}
        <div className="hidden lg:flex flex-1 hero-gradient items-center justify-center p-12">
          <div className="max-w-md text-center">
            <h2 className="font-heading text-3xl font-bold text-white mb-4">
              Reset Your Password
            </h2>
            <p className="text-slate-300 text-lg">
              Securely reset your password with email verification.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="font-heading font-bold text-2xl text-slate-900">Bill Easy</span>
          </Link>

          <Card className="border-0 shadow-none">
            <CardHeader className="px-0">
              <CardTitle className="font-heading text-2xl">Welcome back</CardTitle>
              <CardDescription>Enter your credentials to access your account</CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div 
                    className="flex items-center px-4 py-3 border border-slate-200 rounded-lg bg-white focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all"
                    style={{ display: 'flex', alignItems: 'center' }}
                  >
                    <Mail className="w-4 h-4 text-slate-400 mr-3 flex-shrink-0" style={{ marginRight: '12px' }} />
                    <input
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="flex-1 bg-transparent border-none outline-none text-slate-900 placeholder:text-slate-400"
                      style={{ flex: 1, border: 'none' }}
                      required
                      data-testid="login-email-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <button
                      type="button"
                      onClick={() => setForgotMode(true)}
                      className="text-sm text-emerald-600 hover:underline font-medium"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div 
                    className="flex items-center px-4 py-3 border border-slate-200 rounded-lg bg-white focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all"
                    style={{ display: 'flex', alignItems: 'center' }}
                  >
                    <Lock className="w-4 h-4 text-slate-400 mr-3 flex-shrink-0" style={{ marginRight: '12px' }} />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="flex-1 bg-transparent border-none outline-none text-slate-900 placeholder:text-slate-400"
                      style={{ flex: 1, border: 'none' }}
                      required
                      data-testid="login-password-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="ml-2 text-slate-400 hover:text-slate-600 flex-shrink-0"
                      style={{ marginLeft: '8px' }}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  disabled={loading}
                  data-testid="login-submit-btn"
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>

              <p className="text-center text-sm text-slate-600 mt-6">
                Don't have an account?{' '}
                <Link to="/register" className="text-emerald-600 hover:underline font-medium" data-testid="register-link">
                  Create one
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right side - Branding */}
      <div className="hidden lg:flex flex-1 hero-gradient items-center justify-center p-12">
        <div className="max-w-md text-center">
          <h2 className="font-heading text-3xl font-bold text-white mb-4">
            Manage Your Business with Ease
          </h2>
          <p className="text-slate-300 text-lg">
            Create invoices, track inventory, and manage your finances all in one place.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4 text-left">
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-2xl font-bold text-white font-mono">10K+</p>
              <p className="text-sm text-slate-300">Active Users</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-2xl font-bold text-white font-mono">₹50Cr+</p>
              <p className="text-sm text-slate-300">Invoices Generated</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
