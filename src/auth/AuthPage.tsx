import { useState } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { Logo } from '@/components/Logo';
import { Button, Input, Select } from '@/components/ui';
import type { UserRole } from '@/lib/types';
import { GraduationCap, Users, Shield, Sparkles, ArrowRight } from 'lucide-react';

export function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('student');
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
    { value: 'student', label: 'Student', icon: GraduationCap, desc: 'Find mentors and grow your career' },
    { value: 'mentor', label: 'Mentor', icon: Users, desc: 'Guide students and share expertise' },
    { value: 'admin', label: 'Admin', icon: Shield, desc: 'Manage the platform' },
  ];

  return (
    <div className="min-h-screen bg-black bg-grid flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-white/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-white/3 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Logo header */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Logo size={48} className="text-white" />
          </div>
          <h1 className="text-white font-bold text-xl tracking-tight">Dhaanish Ahmed</h1>
          <p className="text-white/40 text-xs font-medium tracking-widest uppercase">
            Institute of Technology
          </p>
        </div>

        {/* Auth card */}
        <div className="bg-neutral-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 animate-slideUp">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="text-white/60" size={18} />
            <h2 className="text-white font-bold text-lg">
              {mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
          </div>

          {/* Tab switcher */}
          <div className="flex gap-1 p-1 bg-neutral-800 rounded-lg mb-6">
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
                <label className="block text-sm font-medium text-white/70 mb-2">I am a</label>
                <div className="grid grid-cols-3 gap-2">
                  {roleOptions.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setRole(opt.value as UserRole)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all ${
                          role === opt.value
                            ? 'border-white bg-white/10 text-white'
                            : 'border-white/10 text-white/40 hover:border-white/20 hover:text-white/60'
                        }`}
                      >
                        <Icon size={20} />
                        <span className="text-xs font-medium">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-white/40 mt-2">
                  {roleOptions.find((r) => r.value === role)?.desc}
                </p>
              </div>
            )}

            {error && (
              <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
              {!loading && <ArrowRight size={18} />}
            </Button>
          </form>
        </div>

        <p className="text-center text-white/30 text-xs mt-6">
          Mentor-Student Connection Platform
        </p>
      </div>
    </div>
  );
}
