import { useState } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { Logo } from '@/components/Logo';
import { Button, Input } from '@/components/ui';
import type { UserRole } from '@/lib/types';
import { GraduationCap, Users, Sparkles, ArrowRight, BookOpen, Route, UsersRound } from 'lucide-react';

type SignupRole = Exclude<UserRole, 'admin'>;

interface AuthPageProps {
  onBackToLanding?: () => void;
}

export function AuthPage({ onBackToLanding }: AuthPageProps) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<SignupRole>('student');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === 'signup') {
      const { error: signUpError } = await signUp(email, password, fullName, role);
      if (signUpError) {
        setError(signUpError);
        setLoading(false);
      } else {
        // Auto-login after signup since email confirmation is off
        const { error: loginError } = await signIn(email, password);
        if (loginError) {
          setError(loginError);
        }
        setLoading(false);
      }
    } else {
      const { error: loginError } = await signIn(email, password);
      if (loginError) {
        setError(loginError);
      }
      setLoading(false);
    }
  };

  const roleOptions = [
    { value: 'student' as const, label: 'Student', icon: GraduationCap, desc: 'Find mentors and grow your career' },
    { value: 'mentor' as const, label: 'Mentor', icon: Users, desc: 'Guide students and share expertise' },
  ];

  return (
    <div className="theme-page bg-grid flex items-center justify-center p-4 sm:p-8 relative overflow-hidden">
      <div className="absolute left-[8%] top-[14%] hidden rotate-[-12deg] text-slate-900/20 md:block"><BookOpen size={30} strokeWidth={1.5} /></div>
      <div className="absolute right-[11%] top-[22%] hidden rotate-[10deg] text-slate-900/20 md:block"><UsersRound size={32} strokeWidth={1.5} /></div>
      <div className="absolute bottom-[18%] left-[15%] hidden rotate-[8deg] text-slate-900/20 md:block"><Route size={32} strokeWidth={1.5} /></div>
      <div className="absolute right-[19%] bottom-[12%] hidden h-24 w-24 border-t-2 border-dotted border-slate-900/15 rotate-[-25deg] md:block" />

      <div className="relative w-full max-w-md">
        {/* Logo header */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Logo size={48} className="text-sky-700" />
          </div>
          <h1 className="text-slate-900 font-extrabold text-2xl tracking-tight">Mento</h1>
          <p className="text-slate-500 text-xs font-bold tracking-[0.18em] uppercase">Guidance that moves you forward</p>
        </div>

        {/* Auth card */}
        <div className="glass-surface rounded-[1.75rem] p-6 sm:p-8 animate-slideUp">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="text-sky-600" size={18} />
            <h2 className="text-slate-800 font-extrabold text-lg">
              {mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
          </div>

          {/* Tab switcher */}
          <div className="flex gap-1 p-1 bg-sky-100/70 rounded-xl mb-6">
            <button
              onClick={() => { setMode('login'); setError(null); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                mode === 'login' ? 'bg-white text-black' : 'text-white/50 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('signup'); setError(null); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                mode === 'signup' ? 'bg-white text-black' : 'text-white/50 hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <Input
                label="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                required
              />
            )}

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@dhaanish.edu.in"
              required
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />

            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">I am a</label>
                <div className="grid grid-cols-2 gap-2">
                  {roleOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setRole(option.value)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all ${
                          role === option.value
                            ? 'border-sky-500 bg-white text-sky-800 shadow-sm'
                            : 'border-sky-900/10 text-slate-500 hover:border-sky-300 hover:bg-white/60'
                        }`}
                      >
                        <Icon size={20} />
                        <span className="text-xs font-medium">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  {roleOptions.find((option) => option.value === role)?.desc}
                  {role === 'mentor' && ' Mentor profiles require administrator approval.'}
                </p>
              </div>
            )}

            {error && (
              <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                {error}
              </div>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
              {!loading && <ArrowRight size={18} />}
            </Button>
          </form>
        </div>

        <div className="mt-5 flex items-center justify-between px-1 text-xs font-semibold text-slate-500">
          <button type="button" onClick={onBackToLanding} className="transition hover:text-sky-700">Back to overview</button>
          <button type="button" onClick={() => setError('Password reset is available through your institute administrator.')} className="transition hover:text-sky-700">Forgot password?</button>
        </div>
      </div>
    </div>
  );
}
