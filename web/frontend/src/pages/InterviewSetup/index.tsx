import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Brain, SlidersHorizontal, Search, Building, Play, BarChart3, Gavel, Handshake, Loader2, Target, Zap, ChevronRight } from 'lucide-react';
import { useInterviewStore } from '../../store/interviewStore';
import { interviewAPI } from '../../api/client';

const POPULAR_ROLES = [
  'Software Engineer', 'Product Manager', 'Data Scientist', 'Frontend Developer', 'Backend Engineer',
  'Fullstack Developer', 'System Architect', 'UI/UX Designer', 'DevOps Engineer', 'AI Researcher'
];

const POPULAR_COMPANIES = [
  'Google', 'Amazon', 'Meta', 'Netflix', 'Microsoft',
  'Apple', 'Stripe', 'OpenAI', 'Tesla', 'Airbnb'
];

export default function InterviewSetupPage() {
  const navigate = useNavigate();
  const setupSession = useInterviewStore((s) => s.setupSession);
  const setQuestions = useInterviewStore((s) => s.setQuestions);
  
  const [selectedRole, setSelectedRole] = useState('Senior Software Engineer');
  const [selectedCompany, setSelectedCompany] = useState('Google');
  const [selectedPersona, setSelectedPersona] = useState('analytical');
  const [rigorLevel, setRigorLevel] = useState(4);
  const [loading, setLoading] = useState(false);

  const rigorLabels = ['Baseline', 'Standard', 'Advanced', 'Expert', 'Bar Raiser'];

  const handleStart = async () => {
    if (!selectedRole || !selectedCompany) return;
    setLoading(true);
    try {
      const { data } = await interviewAPI.setup({
        role: selectedRole,
        company: selectedCompany,
        persona: selectedPersona,
        rigorLevel: rigorLevel,
      });

      if (data.sessionId) {
        setupSession({
          sessionId: data.sessionId,
          role: selectedRole,
          company: selectedCompany,
          persona: selectedPersona,
        });

        const qRes = await interviewAPI.getQuestions(data.sessionId);
        setQuestions(qRes.data);
        navigate('/interview/session');
      }
    } catch (error) {
      console.error('Failed to setup interview:', error);
      alert('Failed to initialize session. Please check your API configuration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-6 py-12 animate-fade-in">
      <header className="mb-16 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-label-bold text-[10px] uppercase tracking-widest mb-6">
          <Zap size={14} />
          Simulation Core
        </div>
        <h1 className="font-display text-5xl font-bold text-primary mb-6 leading-tight">
          Configure Your Chamber.
        </h1>
        <p className="font-body-lg text-secondary text-xl">
          Set your target parameters and adjust the neural simulation intensity.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column: Configuration */}
        <div className="lg:col-span-8 space-y-10">
          
          {/* Target Identification */}
          <div className="bg-surface-container-low/40 backdrop-blur-xl border border-outline-variant rounded-[32px] p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <Target size={24} className="text-primary" />
              <h2 className="font-headline-md text-2xl font-bold text-primary">Target Parameters</h2>
            </div>
            
            <div className="space-y-10">
              {/* Position Selection */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <label className="block font-label-bold text-xs text-secondary uppercase tracking-wider">Target Position</label>
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors" size={20} />
                    <input
                      className="w-full bg-surface-container-lowest border border-outline-variant rounded-2xl py-4 pl-12 pr-4 font-body-md text-primary focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none shadow-sm"
                      placeholder="e.g. Staff Frontend Engineer"
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_ROLES.map(role => (
                    <button
                      key={role}
                      onClick={() => setSelectedRole(role)}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-label-bold transition-all border ${
                        selectedRole === role 
                          ? 'bg-primary text-on-primary border-primary shadow-md' 
                          : 'bg-surface-container-lowest text-secondary border-outline-variant hover:border-primary/40'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              {/* Company Selection */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <label className="block font-label-bold text-xs text-secondary uppercase tracking-wider">Target Company</label>
                  <div className="relative group">
                    <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors" size={20} />
                    <input
                      className="w-full bg-surface-container-lowest border border-outline-variant rounded-2xl py-4 pl-12 pr-4 font-body-md text-primary focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none shadow-sm"
                      placeholder="e.g. OpenAI, Stripe"
                      value={selectedCompany}
                      onChange={(e) => setSelectedCompany(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_COMPANIES.map(company => (
                    <button
                      key={company}
                      onClick={() => setSelectedCompany(company)}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-label-bold transition-all border ${
                        selectedCompany === company 
                          ? 'bg-primary text-on-primary border-primary shadow-md' 
                          : 'bg-surface-container-lowest text-secondary border-outline-variant hover:border-primary/40'
                      }`}
                    >
                      {company}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Persona & Rigor Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Persona */}
            <div className="bg-surface-container-low/40 backdrop-blur-xl border border-outline-variant rounded-[32px] p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <Brain size={22} className="text-primary" />
                <h2 className="font-headline-md text-xl font-bold text-primary">Interviewer Mindset</h2>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { id: 'analytical', icon: BarChart3, label: 'Analytical', desc: 'Frameworks & Logic' },
                  { id: 'challenging', icon: Gavel, label: 'Challenging', desc: 'High Pressure & Critical' },
                  { id: 'conversational', icon: Handshake, label: 'Warm', desc: 'Behavioral & Collaborative' },
                ].map((p) => {
                  const Icon = p.icon;
                  const isSelected = selectedPersona === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPersona(p.id)}
                      className={`flex items-center gap-4 p-4 rounded-2xl text-left transition-all duration-300 border ${
                        isSelected 
                          ? 'bg-primary text-on-primary border-primary shadow-lg shadow-primary/10' 
                          : 'bg-surface-container-lowest text-primary border-outline-variant hover:border-primary/30'
                      }`}
                    >
                      <div className={`p-2 rounded-xl ${isSelected ? 'bg-white/20' : 'bg-primary/5'}`}>
                        <Icon size={20} />
                      </div>
                      <div>
                        <h3 className="font-label-bold text-sm leading-none mb-1">{p.label}</h3>
                        <p className={`text-[10px] ${isSelected ? 'text-white/70' : 'text-secondary'}`}>{p.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Rigor */}
            <div className="bg-surface-container-low/40 backdrop-blur-xl border border-outline-variant rounded-[32px] p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <SlidersHorizontal size={22} className="text-primary" />
                <h2 className="font-headline-md text-xl font-bold text-primary">Rigor Index</h2>
              </div>
              <div className="space-y-8 h-full flex flex-col justify-center pb-8">
                <input
                  type="range"
                  max={5}
                  min={1}
                  value={rigorLevel}
                  onChange={(e) => setRigorLevel(Number(e.target.value))}
                  className="w-full h-2 bg-outline-variant rounded-full appearance-none cursor-pointer accent-primary"
                />
                <div className="grid grid-cols-5 gap-1">
                  {rigorLabels.map((label, i) => (
                    <div key={label} className="text-center">
                      <span className={`text-[9px] font-label-bold uppercase tracking-tighter block ${rigorLevel === i + 1 ? 'text-primary scale-110' : 'text-outline'} transition-all`}>
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Mission Briefing */}
        <div className="lg:col-span-4 lg:sticky lg:top-8">
          <div className="bg-surface-container-highest border border-primary/20 rounded-[40px] p-10 shadow-2xl relative overflow-hidden">
            {/* Design Accent */}
            <div className="absolute right-0 top-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
            
            <div className="flex items-center justify-between mb-10">
              <h3 className="font-display text-2xl font-bold text-primary">Mission Briefing</h3>
              <div className="bg-primary/10 text-primary p-2 rounded-xl">
                <Zap size={18} />
              </div>
            </div>
            
            <div className="space-y-6 mb-12">
              <div className="flex justify-between items-center py-4 border-b border-outline-variant/30">
                <span className="text-secondary text-xs uppercase font-label-bold tracking-wider">Position</span>
                <span className="text-primary font-label-bold text-sm">{selectedRole}</span>
              </div>
              <div className="flex justify-between items-center py-4 border-b border-outline-variant/30">
                <span className="text-secondary text-xs uppercase font-label-bold tracking-wider">Target</span>
                <span className="text-primary font-label-bold text-sm">{selectedCompany}</span>
              </div>
              <div className="flex justify-between items-center py-4 border-b border-outline-variant/30">
                <span className="text-secondary text-xs uppercase font-label-bold tracking-wider">Interviewer</span>
                <span className="text-primary font-label-bold text-sm">{selectedPersona.toUpperCase()}</span>
              </div>
              <div className="flex justify-between items-center py-4 border-b border-outline-variant/30">
                <span className="text-secondary text-xs uppercase font-label-bold tracking-wider">Intensity</span>
                <span className="text-primary font-label-bold text-sm">{rigorLabels[rigorLevel-1]}</span>
              </div>
            </div>

            <button
              onClick={handleStart}
              disabled={loading}
              className="w-full bg-primary text-on-primary font-display text-lg font-bold py-5 rounded-[24px] shadow-lg shadow-primary/30 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" /> : <ChevronRight size={24} />}
              {loading ? 'Initializing...' : 'Engage Simulation'}
            </button>
            
            <p className="text-center text-outline text-[10px] mt-6 leading-relaxed font-label-bold uppercase tracking-widest">
              Neural Network Standby
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
