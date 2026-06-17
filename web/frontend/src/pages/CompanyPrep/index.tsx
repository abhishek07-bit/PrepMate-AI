import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, Variants } from 'framer-motion';
import { companyAPI } from '../../api/client';

const iconMap: Record<string, string> = {
  Brain: 'psychology',
  Code: 'code',
  Globe: 'globe',
  Target: 'track_changes',
  Zap: 'bolt'
};

interface PrepScenario {
  title: string;
  category: string;
  time: string;
  desc: string;
}

interface PrepPhilosophy {
  title: string;
  desc: string;
  icon: string;
}

interface CompanyPrepData {
  company: string;
  description: string;
  corePhilosophy: PrepPhilosophy[];
  targetedScenarios: PrepScenario[];
  isFallback?: boolean;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function CompanyPrepPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCompany = searchParams.get('company') || '';
  
  const [company, setCompany] = useState(initialCompany);
  const [searchInput, setSearchInput] = useState(initialCompany);
  const [data, setData] = useState<CompanyPrepData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');



  useEffect(() => {
    async function fetchData() {
      if (!company) return;
      setLoading(true);
      setError('');
      try {
        const response = await companyAPI.getPrep(company);
        setData(response.data as CompanyPrepData);
      } catch (err: unknown) {
        setError('Strategic intelligence retrieval failed.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [company]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setCompany(searchInput.trim());
      setSearchParams({ company: searchInput.trim() });
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="w-full flex flex-col gap-xl pb-xl"
    >
      
      {/* Header */}
      <header className="flex flex-col gap-sm md:gap-md mb-lg md:mb-xl">
        <div className="flex items-center gap-sm">
          <div className="flex items-center gap-sm relative">
            <span className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_rgba(var(--color-primary-rgb),0.4)]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">
              Company Research
            </span>
            <div className="absolute -bottom-1 left-0 w-8 h-[1px] bg-gradient-to-r from-primary to-transparent opacity-40" />
          </div>
        </div>
        <h1 className="font-display text-display text-primary leading-none tracking-tighter">Company Preparation</h1>
        <p className="font-body-lg text-body-lg text-secondary">Research companies and prepare for your interviews with specific company information.</p>
      </header>
        
      <motion.form variants={itemVariants} onSubmit={handleSearch} className="w-full md:w-96 flex flex-col gap-sm">
        <div className="bg-surface-container-low border border-outline-variant rounded-pebble p-xs flex gap-sm items-center">
          <div className="flex-1 relative flex items-center">
            <span className="material-symbols-outlined absolute left-md text-secondary text-[18px]">search</span>
            <input 
              type="text" 
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search companies..." 
              className="w-full bg-transparent pl-11 pr-md py-md font-label-bold text-sm text-primary placeholder:text-secondary/50 outline-none focus:ring-0 border-none"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading || !searchInput.trim() || searchInput.trim() === company} 
            className="bg-primary text-on-primary font-label-bold text-label-bold px-lg py-md rounded-pebble transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? <span className="material-symbols-outlined animate-spin text-[18px]">sync</span> : 'Search'}
          </button>
        </div>
      </motion.form>

      {loading ? (
        <motion.div variants={itemVariants} className="py-xl flex flex-col items-center justify-center gap-lg text-center">
          <span className="material-symbols-outlined text-[48px] text-primary animate-spin">sync</span>
          <div className="flex flex-col gap-xs">
            <p className="font-headline-sm text-headline-sm text-primary">Searching for {company}...</p>
            <p className="text-[10px] text-secondary opacity-50 uppercase tracking-widest font-bold">Loading company information</p>
          </div>
        </motion.div>
      ) : error ? (
        <motion.div variants={itemVariants} className="py-xl flex flex-col items-center justify-center gap-lg">
          <div className="bg-error/10 text-error p-lg rounded-pebble border border-error/20 font-label-bold text-label-bold uppercase tracking-widest">
            {error}
          </div>
        </motion.div>
      ) : data ? (
        <motion.div variants={containerVariants} className="flex flex-col gap-xl">
          <motion.article variants={itemVariants} className="bg-surface-container-low border border-outline-variant rounded-pebble p-md md:p-lg md:p-xl lg:p-container-padding flex flex-col gap-lg">
            <div className="flex flex-wrap gap-xl">
              <div className="flex items-center gap-sm relative">
                <span className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_rgba(var(--color-primary-rgb),0.4)]" />
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary flex items-center gap-xs">
                  <span className="material-symbols-outlined text-[12px]">verified_user</span> {data.company}
                </span>
                <div className="absolute -bottom-1 left-0 w-8 h-[1px] bg-gradient-to-r from-primary to-transparent opacity-40" />
              </div>
              {data.isFallback && (
                <div className="flex items-center gap-sm relative">
                  <span className="w-1.5 h-1.5 bg-secondary rounded-full opacity-50" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-secondary flex items-center gap-xs">
                    <span className="material-symbols-outlined text-[12px]">warning</span> Cached Data
                  </span>
                  <div className="absolute -bottom-1 left-0 w-8 h-[1px] bg-gradient-to-r from-secondary to-transparent opacity-20" />
                </div>
              )}
            </div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-lg">
              <div className="flex flex-col gap-md flex-1">
                <h2 className="font-display text-headline-sm md:text-headline-lg text-primary italic leading-none tracking-tight">"{data.company}"</h2>
                <p className="font-body-sm md:text-body-lg text-secondary leading-relaxed">
                  {data.description}
                </p>
              </div>
              <button 
                onClick={() => navigate(`/interview/setup?company=${encodeURIComponent(data.company)}`)}
                className="w-full md:w-auto bg-primary text-on-primary font-label-bold text-label-bold px-lg py-md rounded-pebble transition-all active:scale-95 shadow-lg flex items-center justify-center gap-md group shrink-0"
              >
                <span>Practice for {data.company}</span>
                <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </button>
            </div>
          </motion.article>

          {/* Core Values Grid */}
          <motion.section variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-md md:gap-lg">
            {data.corePhilosophy?.map((card, idx) => {
              const iconName = iconMap[card.icon] || 'psychology';
              return (
                <article key={idx} className="bg-surface-container-low border border-outline-variant rounded-pebble p-md md:p-lg md:p-xl lg:p-container-padding flex flex-col gap-md md:gap-lg transition-all hover:border-primary group">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-pebble bg-surface-container-lowest border border-outline-variant flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[20px] md:text-[24px]">{iconName}</span>
                  </div>
                  <div className="flex flex-col gap-xs">
                    <h3 className="font-headline-sm md:text-headline-sm text-primary">{card.title}</h3>
                    <p className="text-body-sm md:text-body-md text-secondary leading-relaxed">{card.desc}</p>
                  </div>
                  <div className="mt-auto pt-md flex justify-end">
                    <span className="material-symbols-outlined text-[18px] text-secondary group-hover:text-primary group-hover:translate-x-1 transition-all">arrow_forward</span>
                  </div>
                </article>
              );
            })}
          </motion.section>

          {/* Strategic Scenarios */}
          <motion.section variants={itemVariants} className="flex flex-col gap-md md:gap-lg">
            <div className="flex items-end justify-between border-b border-outline-variant pb-md">
              <h2 className="font-headline-sm md:text-headline-md text-primary">Strategic Scenarios</h2>
              <span className="text-[9px] md:text-[10px] font-bold text-secondary uppercase tracking-widest">
                {data.targetedScenarios?.length} Vectors
              </span>
            </div>
            
            <div className="flex flex-col gap-md">
              {data.targetedScenarios?.map((question, idx) => (
                <article key={idx} className="bg-surface-container-low border border-outline-variant rounded-pebble p-md md:p-lg flex flex-col md:flex-row md:items-center justify-between gap-md md:gap-lg hover:border-primary transition-all group">
                  <div className="flex-1 flex flex-col gap-sm md:gap-md">
                    <div className="flex items-center gap-md">
                      <div className="flex items-center gap-sm relative">
                        <span className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_rgba(var(--color-primary-rgb),0.4)]" />
                        <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-primary">
                          {question.category}
                        </span>
                        <div className="absolute -bottom-1 left-0 w-6 h-[1px] bg-gradient-to-r from-primary to-transparent opacity-40" />
                      </div>
                      <div className="flex items-center gap-xs text-secondary font-bold text-[9px] uppercase tracking-widest">
                        <span className="material-symbols-outlined text-[12px]">schedule</span> {question.time}
                      </div>
                    </div>
                    <div className="flex flex-col gap-xs">
                      <h4 className="font-label-bold text-label-bold text-primary">{question.title}</h4>
                      <p className="text-body-sm text-secondary leading-relaxed italic">"{question.desc}"</p>
                    </div>
                  </div>
                  <button className="w-full md:w-14 h-10 md:h-14 rounded-pebble bg-surface-container-lowest border border-outline-variant flex items-center justify-center text-secondary transition-all group-hover:bg-primary group-hover:text-on-primary group-hover:border-primary group-hover:shadow-lg">
                    <span className="material-symbols-outlined text-[20px]">play_arrow</span>
                  </button>
                </article>
              ))}
            </div>
          </motion.section>
        </motion.div>
      ) : null}
    </motion.div>
  );
}
