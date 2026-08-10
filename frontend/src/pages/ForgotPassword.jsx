import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { MdOutlineFavorite } from 'react-icons/md';
import api from '../services/api';
import Input from '../components/UI/Input';
import Button from '../components/UI/Button';

export default function ForgotPassword() {
  const { register, handleSubmit } = useForm();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', data);
      setSent(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
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
        <h1 className="font-display text-2xl font-semibold">Reset your password</h1>
        {sent ? (
          <p className="mt-4 text-sm text-ink-800/80 dark:text-ink-50/80">
            If that email is registered, a reset link is on its way. Check your inbox.
          </p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <Input label="Email" type="email" {...register('email', { required: true })} />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Sending…' : 'Send reset link'}
            </Button>
          </form>
        )}
        <p className="mt-6 text-center text-sm text-ink-800/70 dark:text-ink-50/70">
          <Link to="/login" className="font-medium text-brand-600 hover:underline">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
