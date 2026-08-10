import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../services/api";
import Card from "../../components/UI/Card";
import Input from "../../components/UI/Input";
import Button from "../../components/UI/Button";

export default function AddDoctor() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    specialization: "",
    qualification: "",
    experience: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      await api.post("/admin/doctors", form);

      toast.success("Doctor created successfully");

      navigate("/admin");
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to create doctor"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <Card>
        <h1 className="mb-6 text-3xl font-bold">
          Add Doctor
        </h1>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <Input
            label="Doctor Name"
            name="fullName"
            value={form.fullName}
            onChange={handleChange}
          />

          <Input
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
          />

          <Input
            label="Phone"
            name="phone"
            value={form.phone}
            onChange={handleChange}
          />

          <Input
            label="Specialization"
            name="specialization"
            value={form.specialization}
            onChange={handleChange}
          />

          <Input
            label="Qualification"
            name="qualification"
            value={form.qualification}
            onChange={handleChange}
          />

          <Input
            label="Experience (Years)"
            name="experience"
            type="number"
            value={form.experience}
            onChange={handleChange}
          />

          <Input
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Doctor"}
          </Button>
        </form>
      </Card>
    </div>
  );
}