import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MdStar, MdOutlineWorkOutline, MdOutlineSchool } from 'react-icons/md';
import api from '../services/api';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import Skeleton from '../components/UI/Skeleton';

export default function DoctorDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    api.get(`/doctors/${id}`).then(({ data }) => setDoctor(data.data)).catch(() => toast.error('Doctor not found')).finally(() => setLoading(false));
  }, [id]);

  const handleBook = async (e) => {
    e.preventDefault();
    if (!date || !time) return toast.error('Please choose a date and time');
    setBooking(true);
    try {
      await api.post('/appointments', { doctorId: id, appointmentDate: date, appointmentTime: time, reason });
      toast.success('Appointment booked!');
      navigate('/appointments');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed');
    } finally {
      setBooking(false);
    }
  };

  if (loading) return <Skeleton className="h-64 w-full" />;
  if (!doctor) return <p>Doctor not found.</p>;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-700 font-display text-2xl font-semibold text-white">
            {doctor.full_name?.[0]}
          </div>
          <div>
            <h1 className="font-display text-xl font-semibold">Dr. {doctor.full_name}</h1>
            <p className="text-sm text-brand-600">{doctor.specialization}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-sm text-ink-800/70 dark:text-ink-50/70">
          <span className="flex items-center gap-1"><MdOutlineSchool /> {doctor.qualification || 'MBBS'}</span>
          <span className="flex items-center gap-1"><MdOutlineWorkOutline /> {doctor.experience_years}+ years</span>
          <span className="flex items-center gap-1"><MdStar className="text-amber-400" /> {Number(doctor.rating || 0).toFixed(1)} rating</span>
        </div>

        {doctor.bio && <p className="mt-4 text-sm leading-relaxed text-ink-800/80 dark:text-ink-50/80">{doctor.bio}</p>}

        <p className="mt-4 font-display text-lg font-semibold">
          {doctor.consultation_fee > 0 ? `₹${doctor.consultation_fee} per consultation` : 'Fee on request'}
        </p>
      </Card>

      <Card>
        <h2 className="mb-4 font-display text-lg font-semibold">Book an appointment</h2>
        <form onSubmit={handleBook} className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Date</span>
            <input type="date" min={new Date().toISOString().split('T')[0]} value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-ink-100 bg-white/80 px-4 py-2.5 text-sm dark:border-white/10 dark:bg-ink-800/50" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Time</span>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
              className="w-full rounded-xl border border-ink-100 bg-white/80 px-4 py-2.5 text-sm dark:border-white/10 dark:bg-ink-800/50" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Reason for visit</span>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
              className="w-full rounded-xl border border-ink-100 bg-white/80 px-4 py-2.5 text-sm dark:border-white/10 dark:bg-ink-800/50" />
          </label>
          <Button type="submit" className="w-full" disabled={booking}>{booking ? 'Booking…' : 'Confirm booking'}</Button>
        </form>
      </Card>
    </div>
  );
}
