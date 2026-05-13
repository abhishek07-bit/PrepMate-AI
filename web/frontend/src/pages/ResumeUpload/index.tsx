import { Upload, FolderOpen, Sparkles, Brain, Briefcase } from 'lucide-react';

export default function ResumeUploadPage() {
  return (
    <>
      <header className="mb-xl max-w-3xl">
        <h2 className="font-display text-display text-primary mb-md">Resume Calibration</h2>
        <p className="font-body-lg text-body-lg text-secondary">
          Upload your most recent resume to configure the AI for personalized mock interviews. We extract your experience to generate targeted technical and behavioral questions.
        </p>
      </header>

      <div className="flex flex-col lg:flex-row gap-xl items-start">
        {/* Upload Zone */}
        <section className="w-full lg:w-5/12 flex-shrink-0">
          <div className="border-2 border-dashed border-outline-variant bg-surface-container-low rounded-pebble p-xl flex flex-col items-center justify-center text-center min-h-[400px] transition-colors hover:border-primary group cursor-pointer relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-surface-variant opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
            <div className="bg-surface border border-outline-variant rounded-full p-4 mb-lg flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
              <Upload size={32} className="text-primary" strokeWidth={1.5} />
            </div>
            <h3 className="font-headline-md text-headline-md text-primary mb-sm">Drag &amp; Drop Resume</h3>
            <p className="font-body-md text-body-md text-secondary mb-lg max-w-[250px]">
              Supported formats: PDF, DOCX. Maximum file size: 5MB.
            </p>
            <button className="bg-surface border border-outline-variant text-primary font-label-bold text-label-bold py-3 px-6 rounded-btn hover:bg-surface-container-highest transition-colors inline-flex items-center gap-2 relative z-10">
              <FolderOpen size={18} strokeWidth={1.5} />
              Browse Files
            </button>
          </div>
        </section>

        {/* Parsed Extraction Preview */}
        <section className="w-full lg:w-7/12 flex flex-col gap-lg opacity-70">
          <div className="flex items-center justify-between mb-sm">
            <h3 className="font-headline-md text-headline-md text-primary">Parsed Extraction Preview</h3>
            <span className="font-label-sm text-label-sm text-secondary bg-surface-container-highest px-3 py-1 rounded-full flex items-center gap-1">
              <Sparkles size={14} strokeWidth={1.5} /> Awaiting Upload
            </span>
          </div>

          {/* Extracted Skills */}
          <div className="bg-surface-container-low border border-outline-variant rounded-pebble p-lg">
            <h4 className="font-label-bold text-label-bold text-secondary uppercase tracking-widest mb-md flex items-center gap-2">
              <Brain size={18} strokeWidth={1.5} /> Extracted Skills
            </h4>
            <div className="flex flex-wrap gap-sm">
              <div className="bg-surface border border-outline-variant text-secondary font-label-sm text-label-sm px-4 py-2 rounded-full border-dashed">Python</div>
              <div className="bg-surface border border-outline-variant text-secondary font-label-sm text-label-sm px-4 py-2 rounded-full border-dashed">React Architecture</div>
              <div className="bg-surface border border-outline-variant text-secondary font-label-sm text-label-sm px-4 py-2 rounded-full border-dashed">System Design</div>
              <div className="bg-surface border border-outline-variant text-secondary font-label-sm text-label-sm px-4 py-2 rounded-full border-dashed">Agile</div>
              <div className="bg-surface border border-outline-variant text-surface-tint font-label-sm text-label-sm px-4 py-2 rounded-full border-dashed">+ detecting...</div>
            </div>
          </div>

          {/* Structural Parsing */}
          <div className="bg-surface-container-low border border-outline-variant rounded-pebble p-lg">
            <h4 className="font-label-bold text-label-bold text-secondary uppercase tracking-widest mb-md flex items-center gap-2">
              <Briefcase size={18} strokeWidth={1.5} /> Structural Parsing
            </h4>
            <div className="flex flex-col gap-md">
              <div className="flex gap-md p-md rounded bg-surface border border-outline-variant border-dashed">
                <div className="w-1/4">
                  <div className="h-4 bg-surface-variant rounded w-3/4 mb-2" />
                  <div className="h-3 bg-surface-variant rounded w-1/2" />
                </div>
                <div className="w-3/4">
                  <div className="h-5 bg-surface-variant rounded w-1/2 mb-3" />
                  <div className="h-3 bg-surface-variant rounded w-full mb-2" />
                  <div className="h-3 bg-surface-variant rounded w-5/6" />
                </div>
              </div>
              <div className="flex gap-md p-md rounded bg-surface border border-outline-variant border-dashed">
                <div className="w-1/4">
                  <div className="h-4 bg-surface-variant rounded w-2/3 mb-2" />
                  <div className="h-3 bg-surface-variant rounded w-1/3" />
                </div>
                <div className="w-3/4">
                  <div className="h-5 bg-surface-variant rounded w-2/5 mb-3" />
                  <div className="h-3 bg-surface-variant rounded w-full mb-2" />
                  <div className="h-3 bg-surface-variant rounded w-4/5" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
