import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import api from "../services/api";
import Input from "../components/UI/Input";
import Button from "../components/UI/Button";
import Card from "../components/UI/Card";

export default function Vitals() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    height: "",
    weight: "",
    bmi: "",
    bpSystolic: "",
    bpDiastolic: "",
    heartRate: "",
    sugarLevel: "",
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const h = parseFloat(form.height);
    const w = parseFloat(form.weight);

    if (h > 0 && w > 0) {
      const bmi = (w / Math.pow(h / 100, 2)).toFixed(1);

      setForm((prev) => ({
        ...prev,
        bmi,
      }));
    }
  }, [form.height, form.weight]);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const calculateHealthScore = () => {
    let score = 100;

    const bmi = Number(form.bmi);
    const sys = Number(form.bpSystolic);
    const hr = Number(form.heartRate);
    const sugar = Number(form.sugarLevel);

    if (bmi < 18.5 || bmi > 25) score -= 15;

    if (sys < 90 || sys > 130) score -= 15;

    if (hr < 60 || hr > 100) score -= 15;

    if (sugar < 70 || sugar > 140) score -= 15;

    return Math.max(score, 0);
  };

  const healthScore = calculateHealthScore();

  const saveVitals = async (e) => {
    e.preventDefault();

    if (
      !form.height ||
      !form.weight ||
      !form.bpSystolic ||
      !form.bpDiastolic ||
      !form.heartRate ||
      !form.sugarLevel
    ) {
      toast.error("Please fill all fields");
      return;
    }

    setLoading(true);

    try {
      await api.post("/vitals", {
  bmi: Number(form.bmi),

  blood_pressure_systolic: Number(form.bpSystolic),

  blood_pressure_diastolic: Number(form.bpDiastolic),

  heart_rate: Number(form.heartRate),

  sugar_level: Number(form.sugarLevel),

  health_score: healthScore,
});
      toast.success("Vitals saved successfully");

      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to save vitals");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <Card>
        <h1 className="mb-6 text-3xl font-bold">
          Health Vitals
        </h1>

        <form onSubmit={saveVitals} className="space-y-5">

          <div className="grid grid-cols-2 gap-4">

            <Input
              label="Height (cm)"
              name="height"
              type="number"
              value={form.height}
              onChange={handleChange}
            />

            <Input
              label="Weight (kg)"
              name="weight"
              type="number"
              value={form.weight}
              onChange={handleChange}
            />

          </div>

          <Input
            label="BMI"
            value={form.bmi}
            readOnly
          />

          <div className="grid grid-cols-2 gap-4">

            <Input
              label="Blood Pressure (Systolic)"
              name="bpSystolic"
              type="number"
              value={form.bpSystolic}
              onChange={handleChange}
            />

            <Input
              label="Blood Pressure (Diastolic)"
              name="bpDiastolic"
              type="number"
              value={form.bpDiastolic}
              onChange={handleChange}
            />

          </div>

          <div className="grid grid-cols-2 gap-4">

            <Input
              label="Heart Rate (bpm)"
              name="heartRate"
              type="number"
              value={form.heartRate}
              onChange={handleChange}
            />

            <Input
              label="Sugar Level (mg/dL)"
              name="sugarLevel"
              type="number"
              value={form.sugarLevel}
              onChange={handleChange}
            />

          </div>

          <div className="rounded-xl bg-green-50 p-4">
            <h2 className="text-lg font-semibold">
              Health Score
            </h2>

            <p className="mt-2 text-4xl font-bold text-green-700">
              {healthScore}/100
            </p>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Vitals"}
          </Button>

        </form>
      </Card>
    </div>
  );
}