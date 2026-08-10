import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler,
} from 'chart.js';
import {
  MdOutlinePeople,
  MdOutlineLocalHospital,
  MdOutlineCalendarMonth,
  MdOutlineFolderShared,
  MdOutlineMedication,
  MdOutlineCheckCircle,
  MdOutlineDelete,
  MdOutlineToggleOn,
  MdOutlineToggleOff,
} from 'react-icons/md';
import api from '../../services/api';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Skeleton from '../../components/UI/Skeleton';
import { useNavigate } from "react-router-dom";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

const TABS = ['Overview', 'Users', 'Doctors', 'Appointments', 'Prescriptions'];

export default function AdminDashboard() {
  const [tab, setTab] = useState('Overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadAll = async () => {
    setLoading(true);
    try {
      const [s, u, d, a, p] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/users'),
        api.get('/admin/doctors'),
        api.get('/admin/appointments'),
        api.get('/admin/prescriptions'),
      ]);
      setStats(s.data.data);
      setUsers(u.data.data);
      setDoctors(d.data.data);
      setAppointments(a.data.data);
      setPrescriptions(p.data.data);
    } catch {
      toast.error('Could not load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const approveDoctor = async (id) => {
    try {
      await api.put(`/admin/doctors/${id}/approve`);
      toast.success('Doctor approved');
      loadAll();
    } catch {
      toast.error('Could not approve doctor');
    }
  };

  const deleteUser = async (id) => {
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers((u) => u.filter((x) => x.id !== id));
      toast.success('User deleted');
    } catch {
      toast.error('Could not delete user');
    }
  };

  const toggleActive = async (id) => {
    try {
      const { data } = await api.put(`/admin/users/${id}/toggle-active`);
      setUsers((u) => u.map((x) => (x.id === id ? { ...x, is_active: data.data.is_active } : x)));
    } catch {
      toast.error('Could not update user');
    }
  };

  const signupsChart = stats && {
    labels: [...stats.signupsByMonth].reverse().map((s) => s.month),
    datasets: [
      {
        label: 'Signups',
        data: [...stats.signupsByMonth].reverse().map((s) => Number(s.count)),
        borderColor: '#0fa38c',
        backgroundColor: 'rgba(15,163,140,0.15)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Admin Panel</h1>
        <p className="text-sm text-ink-800/70 dark:text-ink-50/70">Platform-wide analytics and management.</p>
      </div>

      <div className="flex gap-2 overflow-x-auto border-b border-ink-100 dark:border-white/10">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`shrink-0 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              tab === t ? 'border-brand-600 text-brand-600' : 'border-transparent text-ink-800/60 dark:text-ink-50/60'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : tab === 'Overview' ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
            <Card className="flex items-center gap-3"><MdOutlinePeople className="text-2xl text-brand-600" /><div><p className="text-xs text-ink-800/60">Users</p><p className="font-display text-xl font-semibold">{stats.totals.users}</p></div></Card>
            <Card className="flex items-center gap-3"><MdOutlineLocalHospital className="text-2xl text-brand-600" /><div><p className="text-xs text-ink-800/60">Doctors</p><p className="font-display text-xl font-semibold">{stats.totals.doctors}</p></div></Card>
            <Card className="flex items-center gap-3"><MdOutlineCalendarMonth className="text-2xl text-brand-600" /><div><p className="text-xs text-ink-800/60">Appointments</p><p className="font-display text-xl font-semibold">{stats.totals.appointments}</p></div></Card>
            <Card className="flex items-center gap-3"><MdOutlineFolderShared className="text-2xl text-brand-600" /><div><p className="text-xs text-ink-800/60">Records</p><p className="font-display text-xl font-semibold">{stats.totals.records}</p></div></Card>
            <Card className="flex items-center gap-3"><MdOutlineMedication className="text-2xl text-brand-600" /><div><p className="text-xs text-ink-800/60">Prescriptions</p><p className="font-display text-xl font-semibold">{stats.totals.prescriptions}</p></div></Card>
            <Card gradient className="flex items-center gap-3"><MdOutlineCheckCircle className="text-2xl" /><div><p className="text-xs text-white/80">Pending approvals</p><p className="font-display text-xl font-semibold">{stats.totals.pendingDoctorApprovals}</p></div></Card>
          </div>
          <Card>
            <h2 className="mb-4 font-display text-lg font-semibold">Signups (last 12 months)</h2>
            {signupsChart && <Line data={signupsChart} options={{ responsive: true, plugins: { legend: { display: false } } }} />}
          </Card>
        </>
      ) : tab === 'Users' ? (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-brand-50 text-left dark:bg-white/5">
              <tr>
                <th className="px-4 py-3">Name</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-ink-100 dark:border-white/5">
                  <td className="px-4 py-3">{u.full_name}</td>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3 capitalize">{u.role}</td>
                  <td className="px-4 py-3">{u.is_active ? <span className="text-brand-600">Active</span> : <span className="text-red-500">Inactive</span>}</td>
                  <td className="px-4 py-3 flex gap-2">
                    <Button variant="ghost" onClick={() => toggleActive(u.id)}>{u.is_active ? <MdOutlineToggleOn className="text-xl" /> : <MdOutlineToggleOff className="text-xl" />}</Button>
                    <Button variant="danger" onClick={() => deleteUser(u.id)}><MdOutlineDelete /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        
     ) : tab === 'Doctors' ? (
  <>
    <div className="flex justify-end mb-4">
      <Button onClick={() => navigate("/admin/add-doctor")}>
        Add Doctor
      </Button>
    </div>

    <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-brand-50 text-left dark:bg-white/5">
              <tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Specialization</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Actions</th></tr>
            </thead>
            <tbody>
              {doctors.map((d) => (
                <tr key={d.id} className="border-t border-ink-100 dark:border-white/5">
                  <td className="px-4 py-3">Dr. {d.full_name}</td>
                  <td className="px-4 py-3">{d.specialization}</td>
                  <td className="px-4 py-3">{d.is_approved ? <span className="text-brand-600">Approved</span> : <span className="text-amber-500">Pending</span>}</td>
                  <td className="px-4 py-3">
                    {!d.is_approved && <Button onClick={() => approveDoctor(d.id)}>Approve</Button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
  </>
      ) : tab === 'Appointments' ? (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-brand-50 text-left dark:bg-white/5">
              <tr><th className="px-4 py-3">Patient</th><th className="px-4 py-3">Doctor</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Status</th></tr>
            </thead>
            <tbody>
              {appointments.map((a) => (
                <tr key={a.id} className="border-t border-ink-100 dark:border-white/5">
                  <td className="px-4 py-3">{a.patient_name}</td>
                  <td className="px-4 py-3">Dr. {a.doctor_name}</td>
                  <td className="px-4 py-3">{new Date(a.appointment_date).toLocaleDateString()} {a.appointment_time}</td>
                  <td className="px-4 py-3 capitalize">{a.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-brand-50 text-left dark:bg-white/5">
              <tr><th className="px-4 py-3">Patient</th><th className="px-4 py-3">Doctor</th><th className="px-4 py-3">Diagnosis</th><th className="px-4 py-3">Created</th></tr>
            </thead>
            <tbody>
              {prescriptions.map((p) => (
                <tr key={p.id} className="border-t border-ink-100 dark:border-white/5">
                  <td className="px-4 py-3">{p.patient_name}</td>
                  <td className="px-4 py-3">Dr. {p.doctor_name}</td>
                  <td className="px-4 py-3">{p.diagnosis || '—'}</td>
                  <td className="px-4 py-3">{new Date(p.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
