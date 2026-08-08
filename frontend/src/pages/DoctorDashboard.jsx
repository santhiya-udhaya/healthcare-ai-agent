import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import Button from '../components/UI/Button';
import Card from '../components/UI/Card';
import Input from '../components/UI/Input';
import { useAuth } from '../context/AuthContext';

function normalizeMedicines(rawMedicines) {
  if (!Array.isArray(rawMedicines)) return [{ name: '', dose: '', frequency: '', duration: '' }];
  return rawMedicines.map((item) => ({
    name: item.name || item.medicine || item.medicineName || '',
    dose: item.dose || item.dosage || '',
    frequency: item.frequency || '',
    duration: item.duration || '',
  }));
}

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [patientId, setPatientId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [sex, setSex] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [phone, setPhone] = useState('');
  const [allergies, setAllergies] = useState('');
  const [currentMedications, setCurrentMedications] = useState('');
  const [medicalHistory, setMedicalHistory] = useState([]);
  const [appointmentId, setAppointmentId] = useState('');
  const [symptoms, setSymptoms] = useState('Fever, headache, body pain');
  const [draft, setDraft] = useState(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [medicines, setMedicines] = useState([{ name: '', dose: '', frequency: '', duration: '' }]);
  const [advice, setAdvice] = useState('');
  const [confidenceScore, setConfidenceScore] = useState('');
  const [recommendedTests, setRecommendedTests] = useState('');
  const [specialistReferral, setSpecialistReferral] = useState('');
  const [isEmergency, setIsEmergency] = useState(false);
  const [emergencyNote, setEmergencyNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState(false);

  const generatePrescription = async () => {
    if (!patientId.trim()) {
      toast.error('Please select a patient from the appointment list');
      return;
    }
    if (!symptoms.trim()) {
      toast.error('Please enter patient symptoms');
      return;
    }

    setLoading(true);

    try {
      const { data } = await api.post('/ai/generate-prescription', {
        patientId,
        patientAge: Number(patientAge) || null,
        sex,
        diagnosis,
        symptoms,
        allergies,
        currentMedications,
      });

      const payload = data.data;
      setDraft(payload);
      setDiagnosis(payload.diagnosis || '');
      setMedicines(normalizeMedicines(payload.medicines));
      setAdvice(payload.advice || '');
      setConfidenceScore(payload.confidenceScore ?? '');
      setRecommendedTests(payload.recommendedTests || '');
      setSpecialistReferral(payload.specialistReferral || '');
      setIsEmergency(payload.isEmergency || false);
      setEmergencyNote(payload.emergencyNote || '');
      toast.success('AI draft prescription generated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to generate AI prescription');
    } finally {
      setLoading(false);
    }
  };

  const approveAndSend = async () => {
    if (!patientId.trim()) {
      toast.error('Please select a patient from the appointment list');
      return;
    }
    if (!diagnosis.trim()) {
      toast.error('Please fill in a diagnosis');
      return;
    }
    if (!advice.trim()) {
      toast.error('Please fill in advice');
      return;
    }

    const medicinesToSend = medicines.filter((m) => m.name.trim() !== '');
    if (!isEmergency && medicinesToSend.length === 0) {
      toast.error('Please add at least one medicine');
      return;
    }

    setApproving(true);

    try {
      await api.post('/prescriptions/approve', {
        appointmentId: appointmentId || null,
        patientId,
        diagnosis,
        medicines: medicinesToSend,
        advice,
        confidenceScore: confidenceScore || null,
        recommendedTests: recommendedTests || null,
        specialistReferral: specialistReferral || null,
        isEmergency,
        emergencyNote: emergencyNote || null,
      });

      if (appointmentId) {
        await api.put(`/appointments/${appointmentId}/status`, {
          status: 'completed',
        });
        loadAppointments();
      }

      toast.success('Prescription approved and sent to the patient');
      setDraft(null);
      setDiagnosis('');
      setMedicines([{ name: '', dose: '', frequency: '', duration: '' }]);
      setAdvice('');
      setConfidenceScore('');
      setRecommendedTests('');
      setSpecialistReferral('');
      setIsEmergency(false);
      setEmergencyNote('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not approve prescription');
    } finally {
      setApproving(false);
    }
  };

  const updateMedicine = (index, field, value) => {
    setMedicines((current) =>
      current.map((medicine, idx) => (idx === index ? { ...medicine, [field]: value } : medicine))
    );
  };

  const addMedicine = () => {
    setMedicines((current) => [...current, { name: '', dose: '', frequency: '', duration: '' }]);
  };

  const removeMedicine = (index) => {
    setMedicines((current) => current.filter((_, idx) => idx !== index));
  };

  const loadAppointments = async () => {
    setAppointmentsLoading(true);
    try {
      const { data } = await api.get('/appointments/doctor');
      setAppointments(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to load appointments');
    } finally {
      setAppointmentsLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);
const loadPatient = async (patientId) => {
    try {
      const { data } = await api.get(`/users/${patientId}`);

      setPatientAge(data.data.age || '');
      setSex(data.data.gender || '');
      setBloodGroup(data.data.blood_group || '');
      setPhone(data.data.phone || '');
      setAllergies(data.data.allergies || '');
      setMedicalHistory(data.data.medicalRecords || []);
      setCurrentMedications('');
    } catch (err) {
      toast.error('Unable to load patient details');
    }
  };

  const openAppointment = async (appointment) => {
    setPatientId(appointment.patientId);
    setPatientName(appointment.patientName);
    setAppointmentId(appointment.appointmentId);
    setSymptoms(appointment.symptoms || '');

    await loadPatient(appointment.patientId);

    setDraft(null);
    setDiagnosis('');
    setMedicines([{ name: '', dose: '', frequency: '', duration: '' }]);
    setAdvice('');
    setConfidenceScore('');
    setRecommendedTests('');
    setSpecialistReferral('');
    setIsEmergency(false);
    setEmergencyNote('');
  };
  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="font-display text-3xl font-semibold">Doctor Dashboard</h1>
        <p className="text-sm text-ink-700/80 dark:text-ink-100/80">
          Generate AI prescriptions, edit them, and approve them for your patients.
        </p>
      </div>

      <Card className="space-y-4 p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-semibold">Today's Appointments</h2>
            <p className="text-sm text-ink-700/80 dark:text-ink-100/80">
              Select an appointment to pre-fill the prescription form.
            </p>
          </div>
          <Button variant="secondary" onClick={loadAppointments} disabled={appointmentsLoading}>
            {appointmentsLoading ? 'Refreshing…' : 'Refresh'}
          </Button>
        </div>

        {appointmentsLoading ? (
          <p className="text-sm text-ink-700/80 dark:text-ink-100/80">Loading appointments…</p>
        ) : appointments.length === 0 ? (
          <p className="text-sm text-ink-700/80 dark:text-ink-100/80">No appointments scheduled for today.</p>
        ) : (
          <div className="space-y-3">
            {appointments.map((appointment) => (
              <div key={appointment.appointmentId} className="rounded-2xl border border-ink-100 p-4 dark:border-white/10">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-ink-900 dark:text-white">{appointment.patientName}</p>
                    <p className="text-sm text-ink-700/80 dark:text-ink-100/80">{appointment.time}</p>
                    <p className="text-sm text-ink-700/80 dark:text-ink-100/80">{appointment.symptoms}</p>
                  </div>
                  <Button type="button" onClick={() => openAppointment(appointment)}>
                    Open
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="grid gap-4 md:grid-cols-2">
        <Card className="mb-4 p-4 col-span-full">
          <h3 className="text-lg font-semibold">Selected Patient</h3>
          <p className="mt-3 text-sm">
            <strong>Name:</strong> {patientName || 'No patient selected'}
          </p>
          <p className="text-sm">
            <strong>Patient ID:</strong> {patientId || '-'}
          </p>
          <p className="text-sm">
            <strong>Appointment ID:</strong> {appointmentId || '-'}</p>
          <p className="text-sm">
            <strong>Age:</strong> {patientAge || '-'}
          </p>
          <p className="text-sm">
            <strong>Gender:</strong> {sex || '-'}</p>
          <p className="text-sm">
            <strong>Allergies:</strong> {allergies || 'None'}</p>
        </Card>

        <Input
          label="Blood Group"
          value={bloodGroup}
          readOnly
        />

        <Input
          label="Phone"
          value={phone}
          readOnly
        />
        <Input
          label="Allergies"
          value={allergies}
          onChange={(e) => setAllergies(e.target.value)}
          placeholder="Known allergies"
        />
        <Input
          label="Current medications"
          value={currentMedications}
          onChange={(e) => setCurrentMedications(e.target.value)}
          placeholder="Current medications"
        />
        <div className="md:col-span-2">
          <h3 className="text-sm font-semibold text-ink-900 dark:text-white mb-2">Medical history</h3>
          {medicalHistory.length > 0 ? (
            <ul className="space-y-2 rounded-3xl border border-ink-100 bg-white p-4 text-sm dark:border-white/10 dark:bg-ink-950/60">
              {medicalHistory.slice(0, 5).map((record) => (
                <li key={record.id}>
                  <p className="font-medium">{record.title || record.record_type || 'Record'}</p>
                  <p>{record.description || record.doctor_notes || 'No description available'}</p>
                  <p className="text-xs text-ink-600 dark:text-ink-300">{new Date(record.record_date).toLocaleDateString()}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-3xl border border-ink-100 bg-white/80 p-4 text-sm text-ink-700 dark:border-white/10 dark:bg-ink-950/60 dark:text-ink-100">
              No recent medical history available.
            </p>
          )}
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-ink-800 dark:text-ink-100 mb-2">Symptoms</label>
          <textarea
            rows={4}
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            className="w-full rounded-xl border border-ink-100 bg-white/80 px-4 py-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-white/10 dark:bg-ink-800/50 dark:text-white"
          />
        </div>
        <div className="md:col-span-2 flex flex-wrap gap-3">
          <Button onClick={generatePrescription} disabled={loading || approving}>
            {loading ? 'Generating…' : 'Generate AI Prescription'}
          </Button>
          <Button variant="secondary" onClick={() => setDraft(null)} disabled={loading || approving}>
            Clear Draft
          </Button>
          <Button variant="primary" onClick={approveAndSend} disabled={loading || approving}>
            {approving ? 'Sending…' : 'Create Manual Prescription'}
          </Button>
        </div>
      </Card>

      {draft && (
        <Card className="space-y-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-2xl font-semibold">AI Prescription Draft</h2>
              <p className="text-sm text-ink-700/80 dark:text-ink-100/80">
                Suggested by the AI for {patientName || user?.full_name || 'the patient'}.
              </p>
            </div>
            <Button onClick={approveAndSend} disabled={approving}>
              {approving ? 'Approving…' : 'Approve & Send'}
            </Button>
          </div>

          <div className="space-y-4">
            {isEmergency && (
              <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-950/20 dark:text-red-200">
                <p className="font-semibold">Emergency Condition Detected</p>
                <p>{emergencyNote || 'The AI has identified a potentially serious condition. Please follow the recommended tests and referrals before prescribing medicines.'}</p>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-ink-800 dark:text-ink-100 mb-2">Diagnosis</label>
                <textarea
                  rows={3}
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  className="w-full rounded-xl border border-ink-100 bg-white/80 px-4 py-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-white/10 dark:bg-ink-800/50 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-800 dark:text-ink-100 mb-2">Confidence score</label>
                <input
                  value={confidenceScore}
                  onChange={(e) => setConfidenceScore(e.target.value)}
                  placeholder="e.g. 82"
                  className="w-full rounded-xl border border-ink-100 bg-white/80 px-4 py-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-white/10 dark:bg-ink-800/50 dark:text-white"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-ink-900 dark:text-white">Medicines</h3>
                <Button variant="secondary" onClick={addMedicine} type="button">
                  Add medicine
                </Button>
              </div>
              <div className="space-y-3 mt-3">
                {medicines.map((medicine, index) => (
                  <div key={index} className="grid gap-3 rounded-2xl border border-ink-100 p-4 dark:border-white/10 md:grid-cols-4">
                    <Input
                      label="Name"
                      value={medicine.name}
                      onChange={(e) => updateMedicine(index, 'name', e.target.value)}
                      placeholder="Medicine name"
                    />
                    <Input
                      label="Dose"
                      value={medicine.dose}
                      onChange={(e) => updateMedicine(index, 'dose', e.target.value)}
                      placeholder="Dose"
                    />
                    <Input
                      label="Frequency"
                      value={medicine.frequency}
                      onChange={(e) => updateMedicine(index, 'frequency', e.target.value)}
                      placeholder="Frequency"
                    />
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-ink-800 dark:text-ink-100">Duration</label>
                      <div className="flex items-center gap-2">
                        <input
                          value={medicine.duration}
                          onChange={(e) => updateMedicine(index, 'duration', e.target.value)}
                          placeholder="Duration"
                          className="w-full rounded-xl border border-ink-100 bg-white/80 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-white/10 dark:bg-ink-800/50 dark:text-white"
                        />
                        {medicines.length > 1 && (
                          <Button
                            variant="danger"
                            type="button"
                            className="shrink-0"
                            onClick={() => removeMedicine(index)}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {isEmergency && (
              <div className="space-y-4 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/20 dark:text-amber-100">
                <div>
                  <label className="block text-sm font-medium text-ink-800 dark:text-ink-100 mb-2">Recommended tests</label>
                  <textarea
                    rows={3}
                    value={recommendedTests}
                    onChange={(e) => setRecommendedTests(e.target.value)}
                    className="w-full rounded-xl border border-ink-100 bg-white/80 px-4 py-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-white/10 dark:bg-ink-800/50 dark:text-white"
                    placeholder="Recommended tests"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-800 dark:text-ink-100 mb-2">Specialist referral</label>
                  <input
                    value={specialistReferral}
                    onChange={(e) => setSpecialistReferral(e.target.value)}
                    placeholder="e.g. Cardiology, Neurology"
                    className="w-full rounded-xl border border-ink-100 bg-white/80 px-4 py-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-white/10 dark:bg-ink-800/50 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-800 dark:text-ink-100 mb-2">Emergency notes</label>
                  <textarea
                    rows={2}
                    value={emergencyNote}
                    onChange={(e) => setEmergencyNote(e.target.value)}
                    className="w-full rounded-xl border border-ink-100 bg-white/80 px-4 py-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-white/10 dark:bg-ink-800/50 dark:text-white"
                    placeholder="Emergency note"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-ink-800 dark:text-ink-100 mb-2">Advice</label>
              <textarea
                rows={4}
                value={advice}
                onChange={(e) => setAdvice(e.target.value)}
                className="w-full rounded-xl border border-ink-100 bg-white/80 px-4 py-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-white/10 dark:bg-ink-800/50 dark:text-white"
              />
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
