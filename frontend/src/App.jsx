import { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import AppLayout from "./components/Layout/AppLayout";
import ProtectedRoute from "./components/Layout/ProtectedRoute";

const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const MedicalRecords = lazy(() => import("./pages/MedicalRecords"));
const MedicalHistory = lazy(() => import("./pages/MedicalHistory"));
const Doctors = lazy(() => import("./pages/Doctors"));
const DoctorDetails = lazy(() => import("./pages/DoctorDetails"));
const Appointments = lazy(() => import("./pages/Appointments"));
const Prescriptions = lazy(() => import("./pages/Prescriptions"));
const SymptomChecker = lazy(() => import("./pages/SymptomChecker"));
const Chatbot = lazy(() => import("./pages/Chatbot"));
const HospitalFinder = lazy(() => import("./pages/HospitalFinder"));
const Notifications = lazy(() => import("./pages/Notifications"));
const DoctorDashboard = lazy(() => import("./pages/DoctorDashboard"));
const AdminDashboard = lazy(() => import("./pages/Admin/AdminDashboard"));
const Vitals = lazy(() => import("./pages/Vitals"));
const HealthInsights = lazy(() => import("./pages/HealthInsights"));
const AddDoctor = lazy(() => import("./pages/Admin/AddDoctor"));

export default function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: "12px",
          },
        }}
      />

      <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-sm text-ink-800/70">Loading…</div>}>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/records" element={<MedicalRecords />} />
              <Route path="/medical-history" element={<MedicalHistory />} />
              <Route path="/doctors" element={<Doctors />} />
              <Route path="/doctors/:id" element={<DoctorDetails />} />
              <Route path="/appointments" element={<Appointments />} />
              <Route path="/prescriptions" element={<Prescriptions />} />
              <Route path="/symptom-checker" element={<SymptomChecker />} />
              <Route path="/chatbot" element={<Chatbot />} />
              <Route path="/hospitals" element={<HospitalFinder />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
              <Route path="/vitals" element={<Vitals />} />
<Route path="/health-insights" element={<HealthInsights />} />

            </Route>
          </Route>

          {/* Admin Routes */}
          <Route element={<ProtectedRoute roles={["admin"]} />}>
            <Route element={<AppLayout />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/add-doctor" element={<AddDoctor />} />
            </Route>
          </Route>

          {/* Default */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}