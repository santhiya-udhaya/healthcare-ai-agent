export default function Button({ children, variant = 'primary', className = '', ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm hover:shadow-glass',
    secondary: 'bg-brand-50 text-brand-700 hover:bg-brand-100 dark:bg-white/5 dark:text-brand-300',
    outline: 'border border-brand-200 text-brand-700 hover:bg-brand-50 dark:border-white/10 dark:text-brand-300',
    danger: 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10',
    ghost: 'text-ink-700 hover:bg-ink-100 dark:text-ink-100 dark:hover:bg-white/5',
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
