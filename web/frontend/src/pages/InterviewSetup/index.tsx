import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useInterviewStore } from '../../store/interviewStore';
import { interviewAPI } from '../../api/client';
import NeuralLoader from '../../components/common/NeuralLoader';

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
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const companyParam = searchParams.get('company');

  const setupSession = useInterviewStore((s) => s.setupSession);
  const setQuestions = useInterviewStore((s) => s.setQuestions);
  
  const [selectedRole, setSelectedRole] = useState('Senior Software Engineer');
  const [selectedCompany, setSelectedCompany] = useState(companyParam || 'Google');
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
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <NeuralLoader message="Preparing your interview session..." />
      </div>
    );
  }

  return (
    <div className="w-full pb-xl animate-fade-in flex flex-col gap-xl">
      
      {/* Header */}
      <section className="flex flex-col gap-xs">
        <h1 className="font-display text-display text-primary leading-none tracking-tighter">Practice Interview Setup</h1>
        <p className="font-body-lg text-body-lg text-secondary">Choose the job role and company you are applying for, and set up your practice session.</p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg items-start">
        
        {/* Main Config Column */}
        <div className="lg:col-span-8 flex flex-col gap-lg">
          
          {/* Target Parameters */}
          <article className="bg-surface-container-low border border-outline-variant rounded-pebble p-lg md:p-xl lg:p-container-padding flex flex-col gap-lg">
            <div className="flex justify-between items-start border-b border-outline-variant pb-md">
              <h2 className="font-headline-md text-headline-md text-primary">Job Details</h2>
              <span className="material-symbols-outlined text-[24px] text-secondary">work</span>
            </div>

            <div className="flex flex-col gap-xl">
              {/* Role */}
              <div className="flex flex-col gap-md">
                <label className="font-label-bold text-label-sm text-secondary uppercase tracking-widest pl-1">Job Position</label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-secondary group-focus-within:text-primary transition-colors text-[18px]">search</span>
                  <input
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-pebble py-md pl-12 pr-lg font-body-md text-body-md text-primary outline-none focus:border-primary transition-colors"
                    placeholder="e.g. Principal Architect"
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                  />
                </div>
                <div className="flex flex-wrap gap-sm">
                  {POPULAR_ROLES.map(role => (
                    <button
                      key={role}
                      onClick={() => setSelectedRole(role)}
                      className={`px-md py-xs rounded-full text-label-sm font-label-bold uppercase tracking-widest border transition-all ${
                        selectedRole === role 
                          ? 'bg-primary text-on-primary border-primary' 
                          : 'bg-surface text-secondary border-outline-variant hover:border-primary hover:text-primary'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              {/* Company */}
              <div className="flex flex-col gap-md">
                <label className="font-label-bold text-label-sm text-secondary uppercase tracking-widest pl-1">Company Name</label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-secondary group-focus-within:text-primary transition-colors text-[18px]">apartment</span>
                  <input
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-pebble py-md pl-12 pr-lg font-body-md text-body-md text-primary outline-none focus:border-primary transition-colors"
                    placeholder="e.g. OpenAI"
                    value={selectedCompany}
                    onChange={(e) => setSelectedCompany(e.target.value)}
                  />
                </div>
                <div className="flex flex-wrap gap-sm">
                  {POPULAR_COMPANIES.map(company => (
                    <button
                      key={company}
                      onClick={() => setSelectedCompany(company)}
                      className={`px-md py-xs rounded-full text-label-sm font-label-bold uppercase tracking-widest border transition-all ${
                        selectedCompany === company 
                          ? 'bg-primary text-on-primary border-primary' 
                          : 'bg-surface text-secondary border-outline-variant hover:border-primary hover:text-primary'
                      }`}
                    >
                      {company}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </article>

          {/* Persona & Intensity Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
            {/* Interviewer Persona */}
            <article className="bg-surface-container-low border border-outline-variant rounded-pebble p-lg md:p-xl lg:p-container-padding flex flex-col gap-lg">
              <div className="flex justify-between items-start border-b border-outline-variant pb-md">
                <h2 className="font-headline-md text-headline-md text-primary">Interview Style</h2>
                <span className="material-symbols-outlined text-[24px] text-secondary">psychology</span>
              </div>
              <div className="flex flex-col gap-sm">
                {[
                  { id: 'analytical', icon: 'analytics', label: 'Technical', desc: 'Technical questions' },
                  { id: 'challenging', icon: 'gavel', label: 'Challenging', desc: 'Tough questions' },
                  { id: 'conversational', icon: 'handshake', label: 'Casual', desc: 'Conversational' },
                ].map((p) => {
                  const isSelected = selectedPersona === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPersona(p.id)}
                      className={`w-full flex items-center gap-lg p-md rounded-pebble text-left transition-all border ${
                        isSelected 
                          ? 'bg-primary text-on-primary border-primary' 
                          : 'bg-surface-container-lowest text-primary border-outline-variant hover:border-primary'
                      }`}
                    >
                      <span className={`material-symbols-outlined text-[20px] ${isSelected ? 'text-on-primary' : 'text-secondary'}`}>{p.icon}</span>
                      <div className="flex flex-col gap-0">
                        <h3 className="font-label-bold text-sm leading-none">{p.label}</h3>
                        <p className={`text-[10px] font-bold uppercase tracking-widest ${isSelected ? 'text-on-primary/60' : 'text-secondary'}`}>{p.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </article>

            {/* Rigor Intensity */}
            <article className="bg-surface-container-low border border-outline-variant rounded-pebble p-lg md:p-xl lg:p-container-padding flex flex-col gap-lg">
              <div className="flex justify-between items-start border-b border-outline-variant pb-md">
                <h2 className="font-headline-md text-headline-md text-primary">Difficulty</h2>
                <span className="material-symbols-outlined text-[24px] text-secondary">tune</span>
              </div>
              <div className="flex flex-col gap-xl py-lg">
                <div className="flex flex-col gap-sm">
                  <input
                    type="range"
                    max={5}
                    min={1}
                    value={rigorLevel}
                    onChange={(e) => setRigorLevel(Number(e.target.value))}
                    className="w-full h-1 bg-outline-variant rounded-full appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-[10px] font-bold text-secondary uppercase tracking-widest">
                    <span>Easy</span>
                    <span>Hard</span>
                  </div>
                </div>
                <div className="flex flex-col gap-sm">
                  <div className="flex justify-between items-center">
                    <p className="font-label-bold text-sm text-primary">Difficulty Level</p>
                    <span className="font-display text-2xl font-bold text-primary">{rigorLevel}</span>
                  </div>
                  <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">{rigorLabels[rigorLevel-1]}</p>
                </div>
              </div>
            </article>
          </div>
        </div>

        {/* Sidebar Summary & Action */}
        <aside className="lg:col-span-4 lg:sticky lg:top-32 flex flex-col gap-lg">
          <article className="bg-primary text-on-primary rounded-pebble p-lg md:p-xl lg:p-container-padding flex flex-col gap-lg shadow-lg">
            <h3 className="font-headline-md text-headline-md italic">Practice Summary</h3>
            
            <div className="flex flex-col gap-lg border-t border-on-primary/10 pt-lg">
              {[
                { label: 'Position', val: selectedRole },
                { label: 'Company', val: selectedCompany },
                { label: 'Style', val: selectedPersona.toUpperCase() },
                { label: 'Difficulty', val: rigorLabels[rigorLevel-1] }
              ].map((item, i) => (
                <div key={i} className="flex flex-col gap-0">
                  <span className="text-on-primary/60 font-label-bold text-[9px] uppercase tracking-widest">{item.label}</span>
                  <span className="font-label-bold text-sm">{item.val}</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleStart}
              disabled={loading}
              className="w-full bg-on-primary text-primary font-label-bold text-label-bold py-md rounded-pebble flex items-center justify-center gap-sm active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? <span className="material-symbols-outlined animate-spin text-[20px]">sync</span> : <span className="material-symbols-outlined text-[20px]">arrow_forward</span>}
              {loading ? 'Loading...' : 'Start Practice'}
            </button>
          </article>
        </aside>
      </div>
    </div>
  );
}
