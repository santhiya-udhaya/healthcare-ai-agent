import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { MdOutlineFavorite } from 'react-icons/md';
import api from '../services/api';
import Input from '../components/UI/Input';
import Button from '../components/UI/Button';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data) => {
    const token = searchParams.get('token');

    if (!token) {
      toast.error('Reset token is missing. Please request a new link.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        token,
        newPassword: data.password,
      });

      toast.success('Password reset successfully. Please sign in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50 px-4 dark:bg-ink-900">
      <div className="w-full max-w-md glass-card p-8">
        <div className="mb-6 flex items-center gap-2">
          <MdOutlineFavorite className="text-2xl text-brand-600" />
          <span className="font-display text-xl font-semibold">HealthAI</span>
        </div>
        <h1 className="font-display text-2xl font-semibold">Set a new password</h1>
        <p className="mt-2 text-sm text-ink-800/70 dark:text-ink-50/70">
          Choose a strong password for your account.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <Input
            label="New password"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password', {
              required: 'Password is required',
              minLength: { value: 8, message: 'Password must be at least 8 characters' },
            })}
          />
          <Input
            label="Confirm password"
            type="password"
            placeholder="••••••••"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword', {
              required: 'Please confirm your password',
              validate: (value) => value === watch('password') || 'Passwords do not match',
            })}
          />

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Updating…' : 'Reset password'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-800/70 dark:text-ink-50/70">
          <Link to="/login" className="font-medium text-brand-600 hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
