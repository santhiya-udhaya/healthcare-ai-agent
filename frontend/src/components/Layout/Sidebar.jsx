import { NavLink } from 'react-router-dom';
import {
  MdSpaceDashboard, MdOutlineFolderShared, MdOutlineLocalHospital, MdOutlineCalendarMonth,
  MdOutlineMedication, MdOutlineHealthAndSafety, MdOutlineChatBubbleOutline, MdOutlineMap,
  MdOutlineNotifications, MdOutlineAdminPanelSettings, MdOutlineFavorite, MdOutlineCalendarToday,
} from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: MdSpaceDashboard },
  { to: '/records', label: 'Medical Records', icon: MdOutlineFolderShared },
  { to: '/medical-history', label: 'Medical History', icon: MdOutlineCalendarToday },
  { to: '/doctors', label: 'Find Doctors', icon: MdOutlineLocalHospital },
  { to: '/appointments', label: 'Appointments', icon: MdOutlineCalendarMonth },
  { to: '/prescriptions', label: 'Prescriptions', icon: MdOutlineMedication },
  { to: '/symptom-checker', label: 'Symptom Checker', icon: MdOutlineHealthAndSafety },
  { to: '/chatbot', label: 'AI Assistant', icon: MdOutlineChatBubbleOutline },
  { to: '/hospitals', label: 'Hospital Finder', icon: MdOutlineMap },
  { to: '/notifications', label: 'Notifications', icon: MdOutlineNotifications },
  { to: '/vitals', label: 'Vitals', icon: MdOutlineHealthAndSafety },
  { to: '/health-insights', label: 'Health Insights', icon: MdOutlineFavorite },
];

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();

  return (
    <>
      
      <aside
        className={`fixed z-40 h-full w-64 shrink-0 transform border-r border-white/40 bg-white/80 backdrop-blur-xs transition-transform dark:bg-ink-900/90 dark:border-white/5 lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-2 px-6 py-6">
          <MdOutlineFavorite className="text-2xl text-brand-600" />
          <span className="font-display text-lg font-semibold text-ink-900 dark:text-white">HealthAI</span>
        </div>

        <nav className="flex flex-col gap-1 px-3">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-glass'
                    : 'text-ink-800/70 hover:bg-brand-50 dark:text-ink-50/70 dark:hover:bg-white/5'
                }`
              }
            >
              <Icon className="text-lg" />
              {label}
            </NavLink>
          ))}

          {user?.role === 'admin' && (
            <NavLink
              to="/admin"
              onClick={onClose}
              className={({ isActive }) =>
                `mt-2 flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? 'bg-ink-900 text-white' : 'text-ink-800/70 hover:bg-brand-50 dark:text-ink-50/70 dark:hover:bg-white/5'
                }`
              }
            >
              <MdOutlineAdminPanelSettings className="text-lg" />
              Admin Panel
            </NavLink>
          )}
        </nav>
      </aside>
    </>
  );
}
