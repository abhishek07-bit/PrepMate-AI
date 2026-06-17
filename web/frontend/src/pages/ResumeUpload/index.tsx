import { useState, useRef, useEffect } from 'react';
import { resumeAPI } from '../../api/client';
import { useResumeStore } from '../../store/resumeStore';

const isSynthesisSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

export default function ResumeUploadPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { 
    id, file, analysis, matchAnalysis, isUploading, isAnalyzing, isMatching,
    setResumeId, setFile, setParsedData, setAnalysis, setMatchAnalysis, setUploading, setAnalyzing, setMatching, clearResume 
  } = useResumeStore();
  
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [jobDescription, setJobDescription] = useState('');
  const [analyzingStep, setAnalyzingStep] = useState<string | null>(null);

  // Web Speech API for TTS
  useEffect(() => {
    if (isSynthesisSupported && analysis?.voiceSummary) {
      speakSummary(analysis.voiceSummary);
    }
    return () => {
      if (isSynthesisSupported) {
        try {
          window.speechSynthesis.cancel();
        } catch {
          // ignore
        }
      }
    };
  }, [analysis]);

  const speakSummary = (text: string) => {
    if (!isSynthesisSupported) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => v.name.includes('Google UK English Male') || v.name.includes('Google US English') || v.lang.includes('en-GB'));
      if (preferredVoice) utterance.voice = preferredVoice;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error('[PrepMate] Speech synthesis failed:', e);
      setIsSpeaking(false);
    }
  };

  const toggleSpeech = () => {
    if (!isSynthesisSupported) return;
    if (isSpeaking) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
      setIsSpeaking(false);
    } else if (analysis?.voiceSummary) {
      speakSummary(analysis.voiceSummary);
    }
  };

  const handleFileSelect = async (selectedFile: File) => {
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File too large. Maximum 5MB.');
      return;
    }
    if (!selectedFile.name.toLowerCase().match(/\.(pdf|docx)$/)) {
      setError('Only PDF and DOCX files are supported.');
      return;
    }

    setError(null);
    setUploading(true);
    setFile({ name: selectedFile.name, size: selectedFile.size });
    setAnalysis(null);
    setMatchAnalysis(null);
    if (isSynthesisSupported) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
    setIsSpeaking(false);

    try {
      const { data } = await resumeAPI.upload(selectedFile);
      setResumeId(data.id);
      setParsedData({
        skills: data.skills || [],
        experience: [],
      });
    } catch (err: any) {
      console.error('Upload failed:', err);
      setError(err.response?.data?.detail || 'Upload failed. Please try again.');
      clearResume();
    } finally {
      setUploading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!id) return;
    setAnalyzing(true);
    setError(null);
    setAnalyzingStep('Extracting structure...');
    
    const stepInterval = setInterval(() => {
      setAnalyzingStep(prev => 
        prev === 'Extracting structure...' ? 'ATS Audit...' : 
        prev === 'ATS Audit...' ? 'Evaluating Impact...' :
        'Finalizing Report...'
      );
    }, 2500);

    try {
      const { data } = await resumeAPI.analyze(id);
      clearInterval(stepInterval);
      setAnalyzingStep(null);
      setAnalysis(data);
    } catch (err: any) {
      clearInterval(stepInterval);
      setAnalyzingStep(null);
      setError(err.response?.data?.detail || 'Analysis failed.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleMatch = async () => {
    if (!id || !jobDescription.trim()) return;
    setMatching(true);
    setError(null);
    try {
      const { data } = await resumeAPI.match(id, jobDescription);
      setMatchAnalysis(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Matching failed.');
    } finally {
      setMatching(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileSelect(droppedFile);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) handleFileSelect(selected);
  };

  const handleRemove = () => {
    clearResume();
    setError(null);
    if (isSynthesisSupported) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
    setIsSpeaking(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-primary';
    return 'text-error';
  };

  return (
    <div className="w-full pb-xl animate-fade-in flex flex-col gap-xl">
      
      {/* Header */}
      <header className="flex flex-col gap-xs">
        <h1 className="font-display text-display text-primary leading-none tracking-tighter">Resume Review</h1>
        <p className="font-body-lg text-body-lg text-secondary">Get detailed feedback on your resume to improve your job applications.</p>
      </header>

      {error && (
        <div className="bg-error/10 border border-error/20 text-error px-md py-sm rounded-pebble flex items-center gap-sm">
          <span className="material-symbols-outlined text-[18px]">error</span>
          <p className="font-label-bold text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg items-start">
        
        {/* Operations Panel */}
        <aside className="lg:col-span-4 flex flex-col gap-lg">
          
          {/* Upload Card */}
          <article className="bg-surface-container-low border border-outline-variant rounded-pebble p-lg md:p-xl lg:p-container-padding flex flex-col gap-lg">
            <h3 className="font-label-bold text-label-sm text-secondary uppercase tracking-widest flex items-center gap-md">
              <span className="material-symbols-outlined text-[14px]">upload_file</span> Upload Resume
            </h3>

            {file && !isUploading ? (
              <div className="flex flex-col gap-md">
                <div className="flex items-center gap-md p-md rounded-pebble bg-surface border border-outline-variant">
                  <div className="w-10 h-10 rounded-pebble bg-primary/5 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[20px]">check_circle</span>
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col gap-0">
                    <p className="font-label-bold text-sm text-primary truncate">{file.name}</p>
                    <p className="text-[10px] text-secondary uppercase font-bold tracking-widest">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                  </div>
                  <button onClick={handleRemove} className="text-secondary hover:text-error transition-colors">
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
                <button 
                  onClick={handleAnalyze} 
                  disabled={isAnalyzing} 
                  className="w-full bg-primary text-on-primary font-label-bold text-label-bold py-lg rounded-pebble transition-all active:scale-95 flex items-center justify-center gap-md disabled:opacity-50"
                >
                  {isAnalyzing ? <span className="material-symbols-outlined text-[18px] animate-spin">sync</span> : <span className="material-symbols-outlined text-[18px]">auto_awesome</span>}
                  <span>{isAnalyzing ? (analyzingStep || 'Auditing...') : 'Start Deep Audit'}</span>
                </button>
              </div>
            ) : (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border border-dashed rounded-pebble p-xl flex flex-col items-center justify-center text-center transition-all cursor-pointer bg-surface hover:bg-surface-container-low gap-lg ${
                  dragOver ? 'border-primary bg-primary/5' : 'border-outline-variant'
                }`}
              >
                {isUploading ? (
                  <div className="flex flex-col items-center gap-md">
                    <span className="material-symbols-outlined text-[32px] text-primary animate-spin">sync</span>
                    <p className="font-label-bold text-[10px] text-primary uppercase tracking-widest">Uploading...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-md">
                    <span className="material-symbols-outlined text-[32px] text-secondary opacity-50">upload_file</span>
                    <div className="flex flex-col gap-xs">
                      <h4 className="font-label-bold text-label-bold text-primary">Initiate Upload</h4>
                      <p className="text-[10px] text-secondary uppercase font-bold tracking-widest">PDF, DOCX • MAX 5MB</p>
                    </div>
                  </div>
                )}
              </div>
            )}
            <input ref={fileInputRef} type="file" accept=".pdf,.docx" onChange={handleInputChange} className="hidden" />
          </article>

          {/* Target Card */}
          <article className="bg-surface-container-low border border-outline-variant rounded-pebble p-lg md:p-xl lg:p-container-padding flex flex-col gap-lg">
            <h3 className="font-label-bold text-label-sm text-secondary uppercase tracking-widest flex items-center gap-md">
              <span className="material-symbols-outlined text-[14px]">track_changes</span> Job Description
            </h3>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here..."
              className="w-full h-40 bg-surface border border-outline-variant rounded-pebble p-md font-body-md text-body-md text-primary placeholder:text-secondary/50 outline-none focus:border-primary transition-all resize-none custom-scrollbar"
            />
            <button
              onClick={handleMatch}
              disabled={!id || !jobDescription.trim() || isMatching}
              className="w-full bg-primary text-on-primary font-label-bold text-label-bold py-md rounded-pebble flex items-center justify-center gap-sm disabled:opacity-50 transition-all"
            >
              {isMatching ? <span className="material-symbols-outlined animate-spin text-[20px]">sync</span> : <span className="material-symbols-outlined text-[20px]">analytics</span>}
              {isMatching ? 'Analyzing...' : 'Analyze Match'}
            </button>
          </article>
        </aside>

        <main className="lg:col-span-8 flex flex-col gap-lg">
          {!id ? (
            <div className="py-xl text-center bg-surface-container-low border border-dashed border-outline-variant rounded-pebble flex flex-col gap-lg items-center">
              <span className="material-symbols-outlined text-[48px] text-secondary opacity-20">shield</span>
              <div className="flex flex-col gap-xs">
                <p className="font-headline-sm text-headline-sm text-secondary">Profile pending upload</p>
                <p className="text-[10px] text-secondary opacity-50 uppercase tracking-widest font-bold">Awaiting secure data entry</p>
              </div>
            </div>
          ) : !analysis ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border border-dashed rounded-pebble p-xl flex flex-col items-center justify-center text-center transition-all cursor-pointer bg-surface hover:bg-surface-container-low gap-lg ${
                dragOver ? 'border-primary bg-primary/5' : 'border-outline-variant'
              }`}
            >
              {isUploading ? (
                <div className="flex flex-col items-center gap-md">
                  <span className="material-symbols-outlined text-[32px] text-primary animate-spin">sync</span>
                  <p className="font-label-bold text-[10px] text-primary uppercase tracking-widest">Uploading...</p>
                </div>
              ) : (
                <div className="flex flex-col gap-md">
                  <span className="material-symbols-outlined text-[48px] text-secondary opacity-30">upload_file</span>
                  <div className="flex flex-col gap-xs">
                    <p className="font-headline-sm text-headline-sm text-primary">Upload New Resume</p>
                    <p className="text-[10px] text-secondary uppercase tracking-widest font-bold">PDF, DOCX • MAX 5MB</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-lg animate-fade-in">
              {/* Score Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
                {[
                  { label: 'ATS Match', val: analysis.atsScore },
                  { label: 'Impact', val: analysis.impactScore },
                  { label: 'Brevity', val: analysis.brevityScore },
                  { label: 'LaTeX', val: analysis.latexStructureScore }
                ].map((s, i) => (
                  <div key={i} className="bg-surface-container-low border border-outline-variant rounded-pebble p-md text-center flex flex-col gap-xs">
                    <p className="text-[9px] font-bold text-secondary uppercase tracking-widest">{s.label}</p>
                    <p className={`font-display text-3xl font-bold ${getScoreColor(s.val)}`}>{s.val}</p>
                  </div>
                ))}
              </div>

              {/* Kill-Ratio Verdict */}
              {matchAnalysis && (
                <article className="bg-surface-container-low border border-primary/20 rounded-pebble p-lg md:p-xl lg:p-container-padding flex flex-col md:flex-row items-center gap-lg animate-scale-in">
                  <div className="flex-1 flex flex-col gap-xs text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-md text-error font-bold text-[10px] uppercase tracking-widest">
                      <span className="material-symbols-outlined text-[14px]">warning</span> Match Assessment
                    </div>
                    <h3 className="font-display text-2xl font-bold text-primary italic">"{matchAnalysis.killRatioVerdict}"</h3>
                  </div>
                  <div className="shrink-0 text-center flex flex-col gap-xs">
                    <div className={`font-display text-5xl font-bold leading-none ${matchAnalysis.rejectionProbability >= 70 ? 'text-error' : 'text-primary'}`}>
                      {matchAnalysis.rejectionProbability}%
                    </div>
                    <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">Rejection Risk</span>
                  </div>
                </article>
              )}

              {/* Audit Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                <article className="bg-surface-container-low border border-outline-variant rounded-pebble p-lg md:p-xl lg:p-container-padding flex flex-col gap-lg">
                  <h4 className="font-label-bold text-label-sm text-error uppercase tracking-widest flex items-center gap-md">
                    <span className="material-symbols-outlined text-[14px]">warning</span> Weaknesses
                  </h4>
                  <ul className="flex flex-col gap-md">
                    {analysis.weaknesses.map((w, i) => (
                      <li key={i} className="flex gap-md text-body-sm text-primary">
                        <span className="text-error font-bold">•</span> {w}
                      </li>
                    ))}
                  </ul>
                </article>
                <article className="bg-surface-container-low border border-outline-variant rounded-pebble p-lg md:p-xl lg:p-container-padding flex flex-col gap-lg">
                  <h4 className="font-label-bold text-label-sm text-success uppercase tracking-widest flex items-center gap-md">
                    <span className="material-symbols-outlined text-[14px]">check_circle</span> Strengths
                  </h4>
                  <ul className="flex flex-col gap-md">
                    {analysis.strengths.map((s, i) => (
                      <li key={i} className="flex gap-md text-body-sm text-primary">
                        <span className="text-success font-bold">•</span> {s}
                      </li>
                    ))}
                  </ul>
                </article>
              </div>

              {/* Assessment */}
              <article className="bg-surface-container-low border border-outline-variant rounded-pebble p-lg md:p-xl lg:p-container-padding flex flex-col gap-lg">
                <div className="flex justify-between items-center border-b border-outline-variant pb-md">
                  <h4 className="font-headline-sm text-headline-sm text-primary flex items-center gap-md">
                    <span className="material-symbols-outlined text-[20px]">auto_awesome</span> Overall Feedback
                  </h4>
                  <button 
                    onClick={toggleSpeech} 
                    className={`w-10 h-10 rounded-pebble flex items-center justify-center transition-all ${isSpeaking ? 'bg-primary text-on-primary' : 'bg-surface border border-outline-variant text-secondary'}`}
                  >
                    {isSpeaking ? <span className="material-symbols-outlined text-[18px]">volume_off</span> : <span className="material-symbols-outlined text-[18px]">volume_up</span>}
                  </button>
                </div>
                <p className="font-body-lg text-body-lg text-secondary leading-relaxed italic">
                  "{analysis.overallSummary}"
                </p>
              </article>

              {/* Projects Table */}
              <article className="bg-surface-container-low border border-outline-variant rounded-pebble p-lg md:p-xl lg:p-container-padding flex flex-col gap-lg">
                <h4 className="font-headline-sm text-headline-sm text-primary flex items-center gap-md">
                  <span className="material-symbols-outlined text-[20px]">work</span> Projects
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-outline-variant text-[10px] font-bold uppercase tracking-widest text-secondary">
                        <th className="pb-md pr-md">Project</th>
                        <th className="pb-md pr-md">Stack</th>
                        <th className="pb-md">Links</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysis.projects.map((p, i) => (
                        <tr key={i} className="border-b border-outline-variant">
                          <td className="py-md pr-md font-label-bold text-sm text-primary">{p.name}</td>
                          <td className="py-md pr-md">
                            <span className="text-[9px] font-bold text-secondary">{p.stack}</span>
                          </td>
                          <td className="py-md">
                            <div className="flex gap-xs">
                              {p.github && (
                                <a href={p.github} target="_blank" rel="noreferrer" className="text-secondary hover:text-primary text-[10px] font-bold uppercase tracking-widest">
                                  GitHub
                                </a>
                              )}
                              {p.live && (
                                <a href={p.live} target="_blank" rel="noreferrer" className="text-secondary hover:text-primary text-[10px] font-bold uppercase tracking-widest">
                                  Live
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
