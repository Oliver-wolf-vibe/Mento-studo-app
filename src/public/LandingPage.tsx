import { ArrowRight, Award, CalendarCheck, CheckCircle2, ChevronDown, GraduationCap, HeartHandshake, LineChart, MessageCircle, ShieldCheck, Sparkles, Target, Users, Zap } from 'lucide-react';
import { Button } from '@/components/ui';
import { Logo } from '@/components/Logo';

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

const doodles = [
  { icon: GraduationCap, className: 'left-[7%] top-[18%] rotate-[-12deg]' },
  { icon: Users, className: 'right-[12%] top-[22%] rotate-[10deg]' },
  { icon: Target, className: 'left-[17%] top-[58%] rotate-[8deg]' },
  { icon: MessageCircle, className: 'right-[8%] top-[60%] rotate-[-8deg]' },
  { icon: Award, className: 'left-[43%] top-[11%] rotate-[12deg]' },
];

const steps = [
  { number: '01', icon: Users, title: 'Create your profile', text: 'Share your goals, interests, and the kind of support that would move you forward.' },
  { number: '02', icon: HeartHandshake, title: 'Find your mentor', text: 'Discover approved mentors by expertise, format, and availability.' },
  { number: '03', icon: CalendarCheck, title: 'Meet with purpose', text: 'Book focused sessions and leave every conversation with a next step.' },
  { number: '04', icon: LineChart, title: 'Build momentum', text: 'Post progress, receive advice, and earn recognition for showing up.' },
];

const features = [
  { icon: Users, title: 'Mentor discovery', text: 'Browse people who understand the path you want to take.' },
  { icon: CalendarCheck, title: 'Session booking', text: 'Turn a good intention into a scheduled conversation.' },
  { icon: Target, title: 'Progress tracking', text: 'Make goals visible through small, meaningful updates.' },
  { icon: MessageCircle, title: 'Advice and feedback', text: 'Keep guidance connected to the work you are actually doing.' },
  { icon: Award, title: 'Recognition', text: 'Earn points for consistency, reflection, and growth.' },
  { icon: ShieldCheck, title: 'Trusted community', text: 'Admin verification keeps the network thoughtful and accountable.' },
];

export function LandingPage({ onGetStarted, onSignIn }: LandingPageProps) {
  return (
    <div className="theme-page overflow-hidden text-slate-800">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        {doodles.map(({ icon: Icon, className }) => (
          <div key={className} className={`absolute hidden md:flex h-11 w-11 items-center justify-center rounded-2xl border-2 border-slate-900/15 text-slate-900/35 ${className}`}>
            <Icon size={21} strokeWidth={1.6} />
          </div>
        ))}
        <div className="absolute left-[18%] top-[26%] hidden h-24 w-24 border-t-2 border-dotted border-slate-900/15 rotate-[20deg] md:block" />
        <div className="absolute right-[18%] top-[39%] hidden h-28 w-28 border-t-2 border-dotted border-slate-900/15 rotate-[-32deg] md:block" />
      </div>

      <header className="sticky top-0 z-30 border-b border-white/60 bg-white/55 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <Logo size={38} className="text-sky-700" />
            <div className="leading-tight"><div className="font-extrabold tracking-tight text-slate-800">Mento</div><div className="text-[10px] font-bold uppercase tracking-[0.22em] text-sky-700/70">Grow together</div></div>
          </div>
          <nav className="hidden items-center gap-7 text-sm font-semibold text-slate-600 md:flex">
            <a href="#how-it-works" className="transition-colors hover:text-sky-700">How it works</a>
            <a href="#features" className="transition-colors hover:text-sky-700">Features</a>
            <a href="#community" className="transition-colors hover:text-sky-700">Community</a>
          </nav>
          <div className="flex items-center gap-2"><Button variant="ghost" size="sm" onClick={onSignIn}>Sign in</Button><Button size="sm" onClick={onGetStarted}>Get started <ArrowRight size={15} /></Button></div>
        </div>
      </header>

      <main className="relative z-10">
        <section className="mx-auto grid min-h-[690px] max-w-7xl items-center gap-12 px-5 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-24">
          <div className="animate-floatIn">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/60 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-sky-800 shadow-sm"><Sparkles size={14} /> Guidance with momentum</div>
            <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.08] tracking-[-0.04em] text-slate-900 sm:text-6xl">The right mentor can change the shape of your future.</h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">Mento connects students with thoughtful mentors, turns conversations into action, and makes progress feel visible.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row"><Button size="lg" onClick={onGetStarted}>Join Mento <ArrowRight size={18} /></Button><a href="#how-it-works" className="inline-flex items-center justify-center gap-2 rounded-xl border border-sky-900/10 bg-white/55 px-6 py-3.5 text-base font-semibold text-slate-700 transition hover:bg-white/80">See how it works <ChevronDown size={18} /></a></div>
            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-slate-600"><span className="flex items-center gap-2"><CheckCircle2 size={17} className="text-emerald-500" /> Verified mentors</span><span className="flex items-center gap-2"><CheckCircle2 size={17} className="text-emerald-500" /> Goal-led sessions</span><span className="flex items-center gap-2"><CheckCircle2 size={17} className="text-emerald-500" /> Progress you can see</span></div>
          </div>
          <div className="relative mx-auto w-full max-w-xl animate-floatIn [animation-delay:120ms]">
            <div className="absolute -inset-8 rounded-[3rem] bg-white/35 blur-3xl" />
            <div className="relative rounded-[2rem] border border-white/80 bg-white/65 p-4 shadow-2xl shadow-sky-900/15 backdrop-blur-xl sm:p-6">
              <div className="flex items-center justify-between border-b border-slate-900/10 pb-4"><div><div className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">Your growth board</div><div className="mt-1 text-xl font-extrabold text-slate-800">Small steps. Real direction.</div></div><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-emerald-400 text-white"><Zap size={19} /></div></div>
              <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_0.78fr]">
                <div className="rounded-2xl bg-sky-50/80 p-4"><div className="flex items-center justify-between"><span className="text-xs font-bold text-sky-800">This week</span><span className="text-xs font-semibold text-emerald-600">+24 pts</span></div><div className="mt-5 text-3xl font-extrabold text-slate-800">3 goals</div><div className="mt-1 text-xs text-slate-500">moving from idea to action</div><div className="mt-5 h-2 rounded-full bg-sky-100"><div className="h-2 w-3/4 rounded-full bg-gradient-to-r from-sky-500 to-emerald-400" /></div></div>
                <div className="rounded-2xl bg-emerald-50/90 p-4"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm"><MessageCircle size={17} /></div><div className="mt-5 text-sm font-bold text-slate-800">Next session</div><div className="mt-1 text-xs leading-5 text-slate-500">Portfolio review with Asha</div><div className="mt-4 text-xs font-bold text-emerald-700">Tomorrow · 4:30 PM</div></div>
              </div>
              <div className="mt-3 flex items-center gap-3 rounded-2xl bg-white/75 p-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-sky-700"><GraduationCap size={19} /></div><div className="flex-1"><div className="text-sm font-bold text-slate-800">Asha is ready with advice</div><div className="text-xs text-slate-500">“Make the next step smaller.”</div></div><ArrowRight size={17} className="text-sky-600" /></div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="mx-auto grid max-w-7xl gap-10 px-5 py-20 lg:grid-cols-[0.28fr_0.72fr] lg:px-8"><div className="section-title-sticky self-start"><div className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">A clearer path</div><h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">From wondering to doing.</h2><p className="mt-4 max-w-xs text-sm leading-6 text-slate-600">A simple rhythm that keeps mentorship useful between sessions, too.</p></div><div className="relative grid gap-4 sm:grid-cols-2">{steps.map((step, index) => { const Icon = step.icon; return <div key={step.number} className="glass-surface relative rounded-2xl p-6"><div className="flex items-center justify-between"><span className="text-sm font-extrabold text-sky-600">{step.number}</span><Icon size={22} className="text-emerald-600" /></div><h3 className="mt-8 text-lg font-extrabold text-slate-800">{step.title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{step.text}</p>{index < steps.length - 1 && <div className="pointer-events-none absolute -right-3 top-1/2 hidden h-px w-6 border-t-2 border-dotted border-sky-400/50 sm:block" />}</div>; })}</div></section>

        <section id="features" className="mx-auto grid max-w-7xl gap-10 px-5 py-20 lg:grid-cols-[0.28fr_0.72fr] lg:px-8"><div className="section-title-sticky self-start"><div className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Built for momentum</div><h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Everything around the conversation.</h2></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{features.map((feature) => { const Icon = feature.icon; return <div key={feature.title} className="rounded-2xl border border-white/70 bg-white/55 p-5 transition hover:-translate-y-1 hover:bg-white/75"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700"><Icon size={19} /></div><h3 className="mt-5 font-extrabold text-slate-800">{feature.title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{feature.text}</p></div>; })}</div></section>

        <section id="community" className="mx-auto max-w-7xl px-5 py-20 lg:px-8"><div className="rounded-[2rem] border border-white/80 bg-slate-900/90 p-8 !text-white shadow-2xl shadow-sky-900/20 sm:p-12"><div className="grid gap-10 lg:grid-cols-[0.65fr_1fr]"><div><div className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">One community, three perspectives</div><h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Everyone has a role in better guidance.</h2></div><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-white/10 p-4"><GraduationCap className="text-sky-300" size={20} /><h3 className="mt-5 font-bold">Students</h3><p className="mt-2 text-xs leading-5 !text-white/65">Find clarity, accountability, and a next step that feels possible.</p></div><div className="rounded-2xl bg-white/10 p-4"><Users className="text-emerald-300" size={20} /><h3 className="mt-5 font-bold">Mentors</h3><p className="mt-2 text-xs leading-5 !text-white/65">Share hard-won perspective and see someone grow with it.</p></div><div className="rounded-2xl bg-white/10 p-4"><ShieldCheck className="text-amber-300" size={20} /><h3 className="mt-5 font-bold">Administrators</h3><p className="mt-2 text-xs leading-5 !text-white/65">Build a trusted, visible culture of student support.</p></div></div></div><div className="mt-10 grid grid-cols-2 gap-3 border-t border-white/15 pt-8 sm:grid-cols-4"><div><div className="text-2xl font-extrabold">120+</div><div className="text-xs !text-white/55">mentor conversations</div></div><div><div className="text-2xl font-extrabold">8</div><div className="text-xs !text-white/55">departments connected</div></div><div><div className="text-2xl font-extrabold">92%</div><div className="text-xs !text-white/55">students return</div></div><div><div className="text-2xl font-extrabold">1</div><div className="text-xs !text-white/55">shared direction</div></div></div></div></section>

        <section className="mx-auto max-w-7xl px-5 pb-20 pt-4 lg:px-8"><div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-sky-500 to-emerald-400 p-8 text-white shadow-2xl shadow-sky-700/20 sm:p-12"><div className="absolute -right-10 -top-16 h-48 w-48 rounded-full border border-white/25" /><div className="absolute bottom-[-6rem] left-1/3 h-48 w-48 rounded-full border border-white/20" /><div className="relative max-w-2xl"><div className="text-xs font-bold uppercase tracking-[0.18em] text-white/75">Your next chapter is not a solo project</div><h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-5xl">Start with one conversation.</h2><p className="mt-4 max-w-xl text-sm leading-6 text-white/85 sm:text-base">Join a focused network where guidance becomes progress and progress gets noticed.</p><Button className="mt-7 !bg-white !text-sky-800 hover:!bg-white/90" size="lg" onClick={onGetStarted}>Create your account <ArrowRight size={18} /></Button></div></div></section>
      </main>
      <footer className="border-t border-white/50 px-5 py-7 text-center text-xs font-semibold text-slate-500">Mento · Grow with guidance</footer>
    </div>
  );
}
