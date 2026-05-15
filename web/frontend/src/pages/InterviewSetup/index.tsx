import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Brain, SlidersHorizontal, Search, Building, Play, BarChart3, Gavel, Handshake, Loader2, Target, Zap } from 'lucide-react';
import { useInterviewStore } from '../../store/interviewStore';
import { interviewAPI } from '../../api/client';
import PebbleCard from '../../components/common/PebbleCard';

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
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-label-bold text-xs uppercase tracking-widest mb-6">
          <Zap size={14} />
          Mission Configuration
        </div>
        <h1 className="font-display text-5xl font-bold text-primary mb-6 leading-tight">
          Enter the Interview Chamber.
        </h1>
        <p className="font-body-lg text-secondary text-xl">
          Define your target and the intensity of the simulation. Precision in setup leads to accuracy in performance.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column: Configuration */}
        <div className="lg:col-span-8 space-y-10">
          
          {/* Target Identification */}
          <div className="bg-surface-container-low/50 backdrop-blur-xl border border-outline-variant rounded-[32px] p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <Target size={24} className="text-primary" />
              <h2 className="font-headline-md text-2xl font-bold text-primary">Target Identification</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="block font-label-bold text-sm text-secondary uppercase tracking-wider">Target Position</label>
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors" size={20} />
                  <input
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-2xl py-4 pl-12 pr-4 font-body-md text-primary focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                    placeholder="e.g. Staff Frontend Engineer"
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="block font-label-bold text-sm text-secondary uppercase tracking-wider">Target Company</label>
                <div className="relative group">
                  <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors" size={20} />
                  <input
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-2xl py-4 pl-12 pr-4 font-body-md text-primary focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                    placeholder="e.g. OpenAI, Stripe"
                    value={selectedCompany}
                    onChange={(e) => setSelectedCompany(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Persona Selection */}
          <div className="bg-surface-container-low/50 backdrop-blur-xl border border-outline-variant rounded-[32px] p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <Brain size={24} className="text-primary" />
              <h2 className="font-headline-md text-2xl font-bold text-primary">Interviewer Intelligence</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { id: 'analytical', icon: BarChart3, label: 'Analytical', desc: 'Focuses on logic, frameworks, and metrics.' },
                { id: 'challenging', icon: Gavel, label: 'Challenging', desc: 'High pressure, questions all assumptions.' },
                { id: 'conversational', icon: Handshake, label: 'Warm', desc: 'Focuses on cultural fit and collaboration.' },
              ].map((p) => {
                const Icon = p.icon;
                const isSelected = selectedPersona === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPersona(p.id)}
                    className={`relative p-6 rounded-2xl text-left transition-all duration-300 border ${
                      isSelected 
                        ? 'bg-primary text-on-primary border-primary shadow-lg shadow-primary/20 scale-[1.02]' 
                        : 'bg-surface-container-lowest text-primary border-outline-variant hover:border-primary/50'
                    }`}
                  >
                    <Icon size={28} className={`mb-4 ${isSelected ? 'text-on-primary' : 'text-primary'}`} />
                    <h3 className="font-label-bold text-lg mb-1">{p.label}</h3>
                    <p className={`text-xs leading-relaxed ${isSelected ? 'text-on-primary/80' : 'text-secondary'}`}>
                      {p.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rigor Slider */}
          <div className="bg-surface-container-low/50 backdrop-blur-xl border border-outline-variant rounded-[32px] p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <SlidersHorizontal size={24} className="text-primary" />
              <h2 className="font-headline-md text-2xl font-bold text-primary">Simulation Intensity</h2>
            </div>
            
            <div className="space-y-8 px-2">
              <input
                type="range"
                max={5}
                min={1}
                value={rigorLevel}
                onChange={(e) => setRigorLevel(Number(e.target.value))}
                className="w-full h-2 bg-outline-variant rounded-full appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between">
                {rigorLabels.map((label, i) => (
                  <div key={label} className="flex flex-col items-center">
                    <div className={`w-1 h-1 rounded-full mb-2 ${rigorLevel === i + 1 ? 'bg-primary' : 'bg-outline-variant'}`} />
                    <span className={`text-[10px] font-label-bold uppercase tracking-tighter ${rigorLevel === i + 1 ? 'text-primary' : 'text-outline'}`}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Briefing Summary */}
        <div className="lg:col-span-4 lg:sticky lg:top-8">
          <div className="bg-primary text-on-primary rounded-[40px] p-10 shadow-2xl shadow-primary/20 relative overflow-hidden">
            {/* Background Accent */}
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
            
            <h3 className="font-display text-2xl font-bold mb-8 relative z-10">Mission Briefing</h3>
            
            <div className="space-y-6 mb-10 relative z-10">
              <div className="flex justify-between border-b border-white/10 pb-4">
                <span className="text-white/60 text-sm">Position</span>
                <span className="font-label-bold">{selectedRole}</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-4">
                <span className="text-white/60 text-sm">Company</span>
                <span className="font-label-bold">{selectedCompany}</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-4">
                <span className="text-white/60 text-sm">Interviewer</span>
                <span className="font-label-bold">{selectedPersona.charAt(0).toUpperCase() + selectedPersona.slice(1)}</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-4">
                <span className="text-white/60 text-sm">Intensity</span>
                <span className="font-label-bold">{rigorLabels[rigorLevel-1]}</span>
              </div>
            </div>

            <button
              onClick={handleStart}
              disabled={loading}
              className="w-full bg-white text-primary font-display text-lg font-bold py-5 rounded-[24px] hover:bg-opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Play fill="currentColor" size={20} />}
              {loading ? 'Initializing Chamber...' : 'Engage Simulation'}
            </button>
            
            <p className="text-center text-white/40 text-[11px] mt-6 leading-relaxed">
              AI will now generate {selectedCompany}-specific challenges based on your selected intensity.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
