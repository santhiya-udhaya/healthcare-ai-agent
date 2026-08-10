import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { MdOutlineUploadFile, MdOutlineDownload, MdOutlineDelete, MdOutlineDescription } from 'react-icons/md';
import api from '../services/api';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Skeleton from '../components/UI/Skeleton';

const TYPES = ['lab_report', 'scan', 'note', 'vaccination'];

export default function MedicalRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', recordType: 'lab_report', description: '' });
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/records');
      setRecords(data.data);
    } catch {
      toast.error('Could not load medical records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!form.title) return toast.error('Title is required');
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (file) fd.append('file', file);
      await api.post('/records', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Record added');
      setForm({ title: '', recordType: 'lab_report', description: '' });
      setFile(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/records/${id}`);
      setRecords((r) => r.filter((x) => x.id !== id));
      toast.success('Record deleted');
    } catch {
      toast.error('Could not delete record');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Medical Records</h1>
        <p className="text-sm text-ink-800/70 dark:text-ink-50/70">Store lab reports, scans, and doctor notes in one place.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1 h-fit">
          <h2 className="mb-4 font-display text-lg font-semibold">Add a record</h2>
          <form onSubmit={handleUpload} className="space-y-3">
            <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Type</span>
              <select
                className="w-full rounded-xl border border-ink-100 bg-white/80 px-4 py-2.5 text-sm dark:border-white/10 dark:bg-ink-800/50"
                value={form.recordType}
                onChange={(e) => setForm({ ...form, recordType: e.target.value })}
              >
                {TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select>
            </label>
            <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Attach file</span>
              <input type="file" onChange={(e) => setFile(e.target.files[0])} className="text-sm" />
            </label>
            <Button type="submit" className="w-full" disabled={submitting}>
              <MdOutlineUploadFile /> {submitting ? 'Saving…' : 'Save record'}
            </Button>
          </form>
        </Card>

        <div className="lg:col-span-2 space-y-3">
          {loading ? (
            [1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)
          ) : records.length === 0 ? (
            <Card><p className="text-sm text-ink-800/60 dark:text-ink-50/60">No medical records yet.</p></Card>
          ) : (
            records.map((r) => (
              <Card key={r.id} className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-brand-50 p-3 text-brand-600 dark:bg-white/5"><MdOutlineDescription /></div>
                  <div>
                    <p className="font-medium">{r.title}</p>
                    <p className="text-xs uppercase tracking-wide text-brand-600">{r.record_type?.replace('_', ' ')}</p>
                    {r.description && <p className="mt-1 text-sm text-ink-800/70 dark:text-ink-50/70">{r.description}</p>}
                    <p className="mt-1 text-xs text-ink-800/50">{new Date(r.record_date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  {r.file_url && (
                    <a href={r.file_url} target="_blank" rel="noreferrer">
                      <Button variant="ghost"><MdOutlineDownload /></Button>
                    </a>
                  )}
                  <Button variant="danger" onClick={() => handleDelete(r.id)}><MdOutlineDelete /></Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
