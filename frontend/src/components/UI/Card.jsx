export default function Card({ children, className = '', gradient = false }) {
  return (
    <div className={`${gradient ? 'gradient-card text-white' : 'glass-card'} p-5 ${className}`}>
      {children}
    </div>
  );
}
