import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { MdOutlineFavorite } from 'react-icons/md';
import { useAuth } from '../context/AuthContext';
import Input from '../components/UI/Input';
import Button from '../components/UI/Button';

export default function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const user = await login(data.email, data.password);

toast.success('Welcome back!');

if (user.role === 'doctor') {
  navigate('/doctor-dashboard');
} else if (user.role === 'admin') {
  navigate('/admin');
} else {
  navigate('/dashboard');
}
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
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
        <h1 className="font-display text-2xl font-semibold text-ink-900 dark:text-white">Welcome back</h1>
        <p className="mb-6 mt-1 text-sm text-ink-800/70 dark:text-ink-50/70">Sign in to manage your health.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            {...register('email', { required: 'Email is required' })}
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password', { required: 'Password is required' })}
          />
          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-sm font-medium text-brand-600 hover:underline">
              Forgot password?
            </Link>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-800/70 dark:text-ink-50/70">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-brand-600 hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
