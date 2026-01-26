import React, { useState } from 'react';
import { GlobalSettings, SchoolRegistryEntry } from '../../types';
import { supabase } from '../../supabaseClient';

interface SchoolRegistrationPortalProps {
  settings: GlobalSettings;
  onBulkUpdate: (updates: Partial<GlobalSettings>) => void;
  onSave: () => void;
  onComplete?: () => void;
  onExit?: () => void;
  onResetStudents?: () => void;
  onSwitchToLogin?: () => void;
}

const ACADEMY_ICON = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH6AMXDA0YOT8bkgAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmhuAAAAsklEQVR42u3XQQqAMAxE0X9P7n8pLhRBaS3idGbgvYVAKX0mSZI0SZIU47X2vPcZay1rrfV+S6XUt9ba9621pLXWfP9PkiRJkiRpqgB7/X/f53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le578HAAB//6B+n9VvAAAAAElFTkSuQmCC";

const SchoolRegistrationPortal: React.FC<SchoolRegistrationPortalProps> = ({ 
  settings, onBulkUpdate, onSave, onComplete, onExit, onResetStudents, onSwitchToLogin 
}) => {
  const [isRegistered, setIsRegistered] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [formData, setFormData] = useState({
    schoolName: '',
    location: '',
    registrant: '',
    registrantEmail: '',
    schoolEmail: '',
    contact: ''
  });

  const handleEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSyncing(true);

    try {
      // 1. Fetch current global registry from Supabase
      const { data: regData } = await supabase.from('uba_persistence').select('payload').eq('id', 'registry').single();
      const currentRegistry: SchoolRegistryEntry[] = regData?.payload || [];

      // Check duplicate
      if (currentRegistry.some(r => r.name.toUpperCase() === formData.schoolName.trim().toUpperCase())) {
        alert("This institution is already registered.");
        setIsSyncing(false);
        return;
      }

      // 2. Generate Credentials
      const hubId = `UBA-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const accessKey = `SEC-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

      const newEntry: SchoolRegistryEntry = {
        id: hubId,
        name: formData.schoolName.toUpperCase(),
        registrant: formData.registrant.toUpperCase(),
        accessCode: accessKey,
        enrollmentDate: new Date().toLocaleDateString(),
        studentCount: 0,
        avgAggregate: 0,
        performanceHistory: [],
        status: 'active',
        lastActivity: new Date().toISOString()
      };

      // 3. Update Registry in Cloud
      const nextRegistry = [...currentRegistry, newEntry];
      await supabase.from('uba_persistence').upsert({ id: 'registry', payload: nextRegistry, last_updated: new Date().toISOString() });

      // 4. Update Local State & Save Initial Shard
      onBulkUpdate({
        schoolName: formData.schoolName.toUpperCase(),
        schoolAddress: formData.location.toUpperCase(),
        registrantName: formData.registrant.toUpperCase(),
        registrantEmail: formData.registrantEmail.toLowerCase(),
        schoolEmail: formData.schoolEmail.toLowerCase(),
        schoolContact: formData.contact,
        schoolNumber: hubId,
        accessCode: accessKey
      });

      if (onResetStudents) onResetStudents();
      
      setIsRegistered(true);
      setTimeout(() => onSave(), 500); // Saves specific school shard
    } catch (err) {
      alert("Registration failed. Check connectivity.");
    } finally {
      setIsSyncing(false);
    }
  };

  const copyCredentials = () => {
    const text = `SS-MAP ACCESS PACK\nInstitution: ${settings.schoolName}\nHub ID: ${settings.schoolNumber}\nAccess Key: ${settings.accessCode}\nDirector: ${settings.registrantName}`;
    navigator.clipboard.writeText(text);
    alert("Credentials copied to clipboard.");
  };

  const downloadCredentials = () => {
    const text = `SS-MAP - INSTITUTIONAL ACCESS PACK\n` +
                 `==================================================\n\n` +
                 `LOGIN CREDENTIALS:\n\n` +
                 `1. Institution Name:   ${settings.schoolName}\n` +
                 `2. Institution Hub ID: ${settings.schoolNumber}\n` +
                 `3. System Access Key:  ${settings.accessCode}\n` +
                 `4. Registered Director: ${settings.registrantName}\n\n` +
                 `--------------------------------------------------\n` +
                 `REGISTRATION DETAILS:\n` +
                 `Address:   ${settings.schoolAddress}\n` +
                 `Contact:   ${settings.schoolContact}\n` +
                 `Email:     ${settings.schoolEmail}\n` +
                 `Date:      ${new Date().toLocaleDateString()}\n\n` +
                 `* KEEP THIS FILE SECURE. DO NOT SHARE THE ACCESS KEY.`;
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SSMap_Hub_Credentials_${settings.schoolNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const emailCredentials = () => {
    const subject = encodeURIComponent(`SS-MAP Hub Access Pack: ${settings.schoolName}`);
    const body = encodeURIComponent(
      `OFFICIAL INSTITUTIONAL ACCESS PACK\n` +
      `==================================\n\n` +
      `Institution Name:   ${settings.schoolName}\n` +
      `Institution Hub ID: ${settings.schoolNumber}\n` +
      `System Access Key:  ${settings.accessCode}\n` +
      `Registered Director: ${settings.registrantName}\n\n` +
      `----------------------------------\n` +
      `Please store these credentials securely.\n\n` +
      `Date Generated: ${new Date().toLocaleDateString()}`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  if (isRegistered) {
    return (
      <div className="max-w-4xl mx-auto animate-in zoom-in-95 duration-700">
        <div className="bg-slate-900 rounded-[3rem] p-10 md:p-16 shadow-2xl border border-white/10 text-center space-y-10">
           <div className="space-y-4">
              <div className="w-20 h-20 bg-green-500/20 text-green-400 rounded-3xl flex items-center justify-center mx-auto border border-green-500/30">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <h2 className="text-4xl font-black text-white uppercase tracking-tight leading-none">Hub Registration Success</h2>
              <p className="text-blue-300 font-bold text-xs uppercase tracking-[0.3em]">Your institutional records are now active on the cloud.</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: 'Institution Hub ID', val: settings.schoolNumber },
                { label: 'System Access Key', val: settings.accessCode, secret: true },
                { label: 'Institution Name', val: settings.schoolName },
                { label: 'Registered Director', val: settings.registrantName }
              ].map(f => (
                <div key={f.label} className="bg-white/5 border border-white/10 p-6 rounded-3xl text-left group hover:bg-white/10 transition-colors">
                  <span className="text-[9px] font-black text-blue-400 uppercase block mb-1">{f.label}</span>
                  <p className={`text-lg font-black text-white truncate ${f.secret ? 'font-mono tracking-widest text-emerald-400' : ''}`}>{f.val}</p>
                </div>
              ))}
           </div>

           <div className="flex flex-wrap justify-center gap-4">
              <button onClick={copyCredentials} className="flex-1 min-w-[140px] bg-white/10 hover:bg-white text-white hover:text-slate-900 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                 Copy Pack
              </button>
              <button onClick={downloadCredentials} className="flex-1 min-w-[140px] bg-blue-600 hover:bg-blue-500 text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-2">
                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                 Save to Device
              </button>
              <button onClick={emailCredentials} className="flex-1 min-w-[140px] bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-2">
                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                 Email Credentials
              </button>
           </div>

           <div className="pt-6 border-t border-white/5">
             <button onClick={onComplete} className="w-full bg-white text-slate-900 py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] hover:bg-blue-400 transition-all">Enter Institutional Hub</button>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="bg-white rounded-[3rem] p-10 md:p-16 shadow-2xl border border-slate-100 space-y-12">
        <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-blue-900 text-white rounded-3xl flex items-center justify-center mx-auto shadow-2xl mb-2">
               <img src={ACADEMY_ICON} alt="Shield" className="w-12 h-12" />
            </div>
            <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none">Onboard Institution</h2>
            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.4em]">Establish your academy hub on the network</p>
        </div>

        <form onSubmit={handleEnrollment} className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
            <div className="md:col-span-2 space-y-1.5">
               <label className="text-[10px] font-black text-blue-900 uppercase tracking-[0.2em]">Official Academy Name</label>
               <input type="text" value={formData.schoolName} onChange={(e) => setFormData({...formData, schoolName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-5 text-sm font-black outline-none focus:ring-4 focus:ring-blue-500/10 uppercase" required placeholder="E.G. UNITED BAYLOR ACADEMY" />
            </div>
            <div className="md:col-span-2 space-y-1.5">
               <label className="text-[10px] font-black text-blue-900 uppercase tracking-[0.2em]">Locality / Address</label>
               <input type="text" placeholder="TOWN, REGION..." value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-5 text-sm font-black outline-none focus:ring-4 focus:ring-blue-500/10 uppercase" required />
            </div>
            <div className="space-y-1.5">
               <label className="text-[10px] font-black text-blue-900 uppercase tracking-[0.2em]">Registrant Name</label>
               <input type="text" placeholder="FULL NAME..." value={formData.registrant} onChange={(e) => setFormData({...formData, registrant: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-5 text-sm font-black outline-none focus:ring-4 focus:ring-blue-500/10 uppercase" required />
            </div>
            <div className="space-y-1.5">
               <label className="text-[10px] font-black text-blue-900 uppercase tracking-[0.2em]">Contact Node</label>
               <input type="text" placeholder="PHONE..." value={formData.contact} onChange={(e) => setFormData({...formData, contact: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-5 text-sm font-black outline-none focus:ring-4 focus:ring-blue-500/10" required />
            </div>
            <div className="md:col-span-2 pt-10">
              <button type="submit" disabled={isSyncing} className="w-full bg-blue-900 text-white py-7 rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] shadow-2xl hover:bg-black transition-all active:scale-95 disabled:opacity-50">
                {isSyncing ? "Establishing Secure Node..." : "Execute Enrollment Protocol"}
              </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default SchoolRegistrationPortal;