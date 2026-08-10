import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { MdOutlineFavorite } from 'react-icons/md';
import { useAuth } from '../context/AuthContext';
import Input from '../components/UI/Input';
import Button from '../components/UI/Button';

export default function Register() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { register: signUp } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
     await signUp({
  fullName: data.fullName,
  email: data.email,
  password: data.password,
  phone: data.phone,
  dateOfBirth: data.dateOfBirth,
  gender: data.gender,
  bloodGroup: data.bloodGroup,
});
      toast.success('Account created!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50 px-4 py-10 dark:bg-ink-900">
      <div className="w-full max-w-md glass-card p-8">
        <div className="mb-6 flex items-center gap-2">
          <MdOutlineFavorite className="text-2xl text-brand-600" />
          <span className="font-display text-xl font-semibold">HealthAI</span>
        </div>
        <h1 className="font-display text-2xl font-semibold text-ink-900 dark:text-white">Create your account</h1>
        <p className="mb-6 mt-1 text-sm text-ink-800/70 dark:text-ink-50/70">Start managing your health with AI.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

  <Input
    label="Full Name"
    error={errors.fullName?.message}
    {...register("fullName", {
      required: "Full name is required",
    })}
  />

  <Input
    label="Email"
    type="email"
    error={errors.email?.message}
    {...register("email", {
      required: "Email is required",
    })}
  />

  <Input
    label="Phone"
    type="tel"
    error={errors.phone?.message}
    {...register("phone")}
  />

  <Input
    label="Date of Birth"
    type="date"
    error={errors.dateOfBirth?.message}
    {...register("dateOfBirth", {
      required: "Date of Birth is required",
    })}
  />

  <div>
    <label className="block mb-2 text-sm font-medium">
      Gender
    </label>

    <select
      {...register("gender", {
        required: "Gender is required",
      })}
      className="w-full rounded-xl border border-gray-300 px-4 py-3"
    >
      <option value="">Select Gender</option>
      <option value="Male">Male</option>
      <option value="Female">Female</option>
      <option value="Other">Other</option>
    </select>

    {errors.gender && (
      <p className="mt-1 text-sm text-red-500">
        {errors.gender.message}
      </p>
    )}
  </div>

  <div>
    <label className="block mb-2 text-sm font-medium">
      Blood Group
    </label>

    <select
      {...register("bloodGroup", {
        required: "Blood Group is required",
      })}
      className="w-full rounded-xl border border-gray-300 px-4 py-3"
    >
      <option value="">Select Blood Group</option>

      <option value="A+">A+</option>
      <option value="A-">A-</option>

      <option value="B+">B+</option>
      <option value="B-">B-</option>

      <option value="AB+">AB+</option>
      <option value="AB-">AB-</option>

      <option value="O+">O+</option>
      <option value="O-">O-</option>
    </select>

    {errors.bloodGroup && (
      <p className="mt-1 text-sm text-red-500">
        {errors.bloodGroup.message}
      </p>
    )}
  </div>

  <Input
    label="Password"
    type="password"
    error={errors.password?.message}
    {...register("password", {
      required: "Password is required",
      minLength: {
        value: 8,
        message: "At least 8 characters",
      },
    })}
  />

  <Button
    type="submit"
    className="w-full"
    disabled={loading}
  >
    {loading ? "Creating account..." : "Create Account"}
  </Button>

</form>
        <p className="mt-6 text-center text-sm text-ink-800/70 dark:text-ink-50/70">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
