import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";

export default function Prescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    loadPrescriptions();
  }, []);

  const loadPrescriptions = async () => {
    try {
      const { data } = await api.get("/prescriptions/me");
      setPrescriptions(data.data);
    } catch (err) {
      console.log(err);
    }
  };

  const downloadPrescription = async (prescriptionId) => {
    if (!user) {
      toast.error('Please login to download prescriptions.');
      return;
    }

    try {
      const response = await api.get(`/prescriptions/${prescriptionId}/download`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `prescription-${prescriptionId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download error', error);
      toast.error('Failed to download prescription.');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-5">My Prescriptions</h1>

      {prescriptions.map((rx) => (
        <div key={rx.id} className="border rounded-lg p-5 mb-5">
          <h2 className="text-xl font-semibold mb-2">Dr. {rx.doctor_name}</h2>

          <p className="mb-2 text-sm text-slate-700 dark:text-slate-300">
            <strong>Diagnosis:</strong> {rx.diagnosis || 'N/A'}
          </p>

          <p className="mb-2 text-sm text-slate-700 dark:text-slate-300">
            <strong>Confidence score:</strong> {rx.confidence_score ?? 'N/A'}
          </p>

          {rx.is_emergency && (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-950/20 dark:text-red-200">
              <p className="font-semibold">Emergency recommendation</p>
              <p>{rx.emergency_note || 'This prescription was flagged as a serious condition by the AI.'}</p>
            </div>
          )}

          {rx.recommended_tests && (
            <p className="mb-2 text-sm text-slate-700 dark:text-slate-300">
              <strong>Recommended tests:</strong> {rx.recommended_tests}
            </p>
          )}

          {rx.specialist_referral && (
            <p className="mb-2 text-sm text-slate-700 dark:text-slate-300">
              <strong>Specialist referral:</strong> {rx.specialist_referral}
            </p>
          )}

          <div className="mb-3">
            <h3 className="font-semibold">Medicines</h3>
            {Array.isArray(rx.medicines) && rx.medicines.length > 0 ? (
              <ul className="space-y-2">
                {rx.medicines.map((medicine, index) => (
                  <li key={index} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-900">
                    <p className="font-medium">{medicine.name || 'Unnamed medicine'}</p>
                    <p>{medicine.dose || medicine.dosage || 'Dose unavailable'}</p>
                    <p>{medicine.frequency || 'Frequency unavailable'}</p>
                    <p>{medicine.duration || 'Duration unavailable'}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-600 dark:text-slate-400">No medicine suggestions were provided.</p>
            )}
          </div>

          <p className="mb-3 text-sm text-slate-700 dark:text-slate-300">
            <strong>Advice:</strong>
          </p>
          <p className="mb-4 text-sm text-slate-700 dark:text-slate-300">{rx.advice || 'No advice provided.'}</p>

          <button
            type="button"
            onClick={() => downloadPrescription(rx.id)}
            className="text-blue-600 hover:underline"
          >
            Download PDF
          </button>
        </div>
      ))}
    </div>
  );
}
