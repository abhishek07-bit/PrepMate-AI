import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore, type ThemeMode } from '../../store/settingsStore';
import { useAuthStore } from '../../store/authStore';
import { useResumeStore } from '../../store/resumeStore';
import Toggle from '../../components/common/Toggle';
import { resumeAPI, authAPI } from '../../api/client';

export default function SettingsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const resume = useResumeStore();
  const {
    difficulty,
    setDifficulty,
    targetRoles,
    addRole,
    removeRole,
    strictTiming,
    toggleStrictTiming,
    audioFeedback,
    toggleAudioFeedback,
    theme,
    setTheme,
  } = useSettingsStore();

  const [newRole, setNewRole] = useState('');
  const [showAddRole, setShowAddRole] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const settingsFileRef = useRef<HTMLInputElement>(null);

  const handleSettingsUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File too large. Max 5MB.');
      return;
    }
    setUploadError(null);
    resume.setUploading(true);
    resume.setFile({ name: file.name, size: file.size });
    try {
      const { data } = await resumeAPI.upload(file);
      resume.setParsedData({ skills: data.skills || [], experience: [] });
    } catch (err) {
      console.error('Upload failed:', err);
      resume.setFile(null);
      resume.setParsedData(null);
      setUploadError('Upload failed. Please try again.');
    } finally {
      resume.setUploading(false);
    }
  };

  const initials = user
    ? `${(user.firstName || '')[0] || ''}${(user.lastName || '')[0] || ''}`.toUpperCase() || '?'
    : '?';

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleAddRole = () => {
    if (newRole.trim() && !targetRoles.includes(newRole.trim())) {
      addRole(newRole.trim());
    }
    setNewRole('');
    setShowAddRole(false);
  };

  const themeOptions: { value: ThemeMode; label: string; icon: string }[] = [
    { value: 'light', label: 'Light', icon: 'light_mode' },
    { value: 'dark', label: 'Dark', icon: 'dark_mode' },
    { value: 'system', label: 'System', icon: 'monitor' },
  ];

  return (
    <div className="w-full pb-xl animate-fade-in">
      <header className="mb-xl flex justify-between items-end">
        <section className="flex flex-col gap-sm md:gap-md mb-lg md:mb-xl">
          <h1 className="font-display text-display text-primary leading-none tracking-tighter">Settings</h1>
          <p className="font-body-lg text-body-lg text-secondary">Manage your account and application preferences.</p>
        </section>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg">
        {/* Left Column: Profile & Resume */}
        <div className="lg:col-span-7 flex flex-col gap-lg">
          {/* Profile */}
          <section className="bg-surface-container-low border border-outline-variant rounded-pebble p-lg md:p-xl lg:p-container-padding">
            <h3 className="font-headline-md text-headline-md text-primary mb-lg border-b border-outline-variant pb-sm">Your Profile</h3>
            <div className="flex items-center gap-lg mb-xl">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-surface border border-outline-variant shrink-0 flex items-center justify-center">
                <span className="font-headline-md text-headline-md text-primary">{initials}</span>
              </div>
              <div className="flex flex-col gap-sm">
                <p className="font-label-bold text-label-bold text-primary">{user?.firstName} {user?.lastName}</p>
                <p className="font-label-sm text-label-sm text-secondary">{user?.email || 'No email set'}</p>
              </div>
            </div>
            <form className="flex flex-col gap-md" onSubmit={async (e) => {
              e.preventDefault();
              setIsUpdating(true);
              try {
                const { data } = await authAPI.updateProfile({ firstName, lastName });
                useAuthStore.getState().updateUser({
                  firstName: data.firstName,
                  lastName: data.lastName,
                });
                setSaveStatus('saved');
                setTimeout(() => setSaveStatus('idle'), 3000);
              } catch (error) {
                console.error("Profile update failed:", error);
              } finally {
                setIsUpdating(false);
              }
            }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                <div className="flex flex-col gap-sm">
                  <label className="font-label-bold text-label-sm text-secondary uppercase tracking-widest">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-pebble px-md py-sm font-body-md text-body-md text-primary focus:border-primary outline-none"
                  />
                </div>
                <div className="flex flex-col gap-sm">
                  <label className="font-label-bold text-label-sm text-secondary uppercase tracking-widest">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-pebble px-md py-sm font-body-md text-body-md text-primary focus:border-primary outline-none"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isUpdating}
                className="bg-primary text-on-primary border border-primary px-lg py-md rounded-pebble font-label-bold text-label-bold transition-colors"
              >
                {isUpdating ? 'Updating...' : 'Save Changes'}
              </button>
            </form>
            <div className="mt-md flex justify-end items-center gap-md">
              {saveStatus === 'saved' && <span className="font-label-sm text-label-sm text-primary animate-fade-in">Saved!</span>}
            </div>
          </section>

          {/* Resume Management Pebble */}
          <section className="bg-surface-container-low border border-outline-variant rounded-pebble p-lg md:p-xl lg:p-container-padding">
            <h3 className="font-headline-md text-headline-md text-primary mb-lg border-b border-outline-variant pb-sm">Your Resume</h3>
            <p className="font-body-md text-body-md text-secondary mb-md">Your resume is used to tailor interview questions to your experience.</p>

            {resume.file ? (
              <div className="bg-surface border border-outline-variant rounded-pebble p-md flex items-center justify-between mb-md">
                <div className="flex items-center gap-md">
                  <span className="material-symbols-outlined text-secondary text-headline-lg">description</span>
                  <div>
                    <p className="font-label-bold text-label-bold text-primary">{resume.file.name}</p>
                    <p className="font-label-sm text-label-sm text-secondary">{(resume.file.size / 1024 / 1024).toFixed(1)} MB</p>
                  </div>
                </div>
                <button
                  aria-label="Delete Resume"
                  onClick={() => { resume.setFile(null); resume.setParsedData(null); }}
                  className="text-error hover:text-on-error-container transition-colors p-sm rounded-full hover:bg-error-container"
                >
                  <span className="material-symbols-outlined">delete</span>
                </button>
              </div>
            ) : (
              <p className="font-label-sm text-label-sm text-secondary mb-md opacity-60">No resume uploaded yet.</p>
            )}

            <div
              onClick={() => settingsFileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files[0]) handleSettingsUpload(e.dataTransfer.files[0]);
              }}
              className="border-2 border-dashed border-outline-variant rounded-pebble p-lg flex flex-col items-center justify-center text-center gap-sm bg-surface-container-lowest cursor-pointer hover:border-primary transition-colors group"
            >
              {resume.isUploading ? (
                <>
                  <span className="material-symbols-outlined text-primary animate-spin text-headline-lg">sync</span>
                  <p className="font-label-bold text-label-bold text-primary">Uploading...</p>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-secondary group-hover:text-primary transition-colors text-headline-lg">upload_file</span>
                  <p className="font-label-bold text-label-bold text-primary group-hover:text-primary transition-colors">Click to upload or drag and drop</p>
                  <p className="font-label-sm text-label-sm text-secondary">PDF, DOCX up to 5MB</p>
                </>
              )}
            </div>
            {uploadError && <p className="font-label-sm text-label-sm text-error mt-xs">{uploadError}</p>}
            <input
              ref={settingsFileRef}
              type="file"
              accept=".pdf,.docx"
              onChange={(e) => e.target.files?.[0] && handleSettingsUpload(e.target.files[0])}
              className="hidden"
            />
          </section>
        </div>

        {/* Right Column: Preferences */}
        <div className="lg:col-span-5 flex flex-col gap-lg">
          {/* Interview Preferences */}
          <section className="bg-surface-container-low border border-outline-variant rounded-pebble p-lg md:p-xl lg:p-container-padding">
            <h3 className="font-headline-md text-headline-md text-primary mb-lg border-b border-outline-variant pb-sm">Interview Settings</h3>
            <div className="flex flex-col gap-lg">
              <div className="flex flex-col gap-sm">
                <label className="font-label-bold text-label-bold text-primary">Default Difficulty</label>
                <div className="flex flex-wrap gap-sm">
                  {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => setDifficulty(level)}
                      className={
                        difficulty === level
                          ? 'bg-primary text-on-primary border border-primary px-md py-xs rounded-full font-label-sm text-label-sm transition-colors'
                          : 'bg-surface-container-lowest border border-outline-variant px-md py-xs rounded-full font-label-sm text-label-sm text-primary hover:border-primary transition-colors'
                      }
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-sm">
                <label className="font-label-bold text-label-bold text-primary">Target Roles</label>
                <div className="flex flex-wrap gap-sm">
                  {targetRoles.map((role) => (
                    <span key={role} className="bg-surface-container border border-outline-variant px-md py-xs rounded-full font-label-sm text-label-sm text-primary flex items-center gap-xs">
                      {role}
                      <button onClick={() => removeRole(role)} className="hover:text-error flex items-center justify-center">
                        <span className="material-symbols-outlined text-[16px]">close</span>
                      </button>
                    </span>
                  ))}
                  {showAddRole ? (
                    <div className="flex items-center gap-xs">
                      <input
                        className="border border-outline-variant rounded-full px-md py-xs font-label-sm text-label-sm bg-surface-container-lowest text-on-background focus:border-primary outline-none w-40"
                        placeholder="e.g. Data Engineer"
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddRole()}
                        autoFocus
                      />
                      <button onClick={handleAddRole} className="text-primary flex items-center"><span className="material-symbols-outlined text-[16px]">add</span></button>
                      <button onClick={() => { setShowAddRole(false); setNewRole(''); }} className="text-secondary flex items-center"><span className="material-symbols-outlined text-[16px]">close</span></button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowAddRole(true)}
                      className="border border-dashed border-outline-variant px-md py-xs rounded-full font-label-sm text-label-sm text-secondary hover:text-primary hover:border-primary transition-colors flex items-center gap-xs"
                    >
                      <span className="material-symbols-outlined text-[16px]">add</span> Add Role
                    </button>
                  )}
                </div>
              </div>
              <div className="border-t border-outline-variant mt-sm">
                <Toggle checked={strictTiming} onChange={toggleStrictTiming} label="Strict Timing" description="Enforce time limits during practice interviews." />
              </div>
              <Toggle checked={audioFeedback} onChange={toggleAudioFeedback} label="Audio Feedback" description="Voice feedback during practice interviews." />
            </div>
          </section>

          {/* Appearance — Theme Switcher */}
          <section className="bg-surface-container-low border border-outline-variant rounded-pebble p-lg md:p-xl lg:p-container-padding">
            <h3 className="font-headline-md text-headline-md text-primary mb-lg border-b border-outline-variant pb-sm">Appearance</h3>
            <div className="flex flex-col gap-md">
              <p className="font-label-bold text-label-bold text-primary">Theme</p>
              <p className="font-label-sm text-label-sm text-secondary -mt-sm">Choose your preferred color scheme.</p>
              <div className="flex bg-surface-container border border-outline-variant rounded-full p-xs">
                {themeOptions.map(({ value, label, icon }) => (
                  <button
                    key={value}
                    onClick={() => setTheme(value)}
                    className={`flex-1 px-md py-sm rounded-full font-label-sm text-label-sm transition-all flex items-center justify-center gap-xs ${
                      theme === value
                        ? 'bg-surface-container-lowest text-primary shadow-sm'
                        : 'text-secondary hover:text-primary'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">{icon}</span>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Sign Out */}
          <section className="mt-auto pt-lg">
            <button onClick={handleLogout} className="text-error font-label-bold text-label-bold hover:underline transition-all flex items-center gap-xs">
              <span className="material-symbols-outlined text-[18px]">logout</span> Sign Out
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
