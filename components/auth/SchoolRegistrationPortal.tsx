import React, { useState } from 'react';
import { GlobalSettings, SchoolRegistryEntry } from '../../types';
import { supabase } from '../../supabaseClient';

interface SchoolRegistrationPortalProps {
  settings: GlobalSettings;
  onBulkUpdate: (updates: Partial<GlobalSettings>) => void;
  onSave: () => void;
  onComplete?: (credentials: any) => void;
  onExit?: () => void;
  onResetStudents?: () => void;
  onSwitchToLogin?: () => void;
}

const ACADEMY_ICON = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH6AMXDA0YOT8bkgAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmhuAAAAsklEQVR42u3XQQqAMAxE0X9P7n8pLhRBaS3idGbgvYVAKX0mSZI0SZIU47X2vPcZay1rrV+S6XUt9ba9621pLXWfP9PkiRJkiRpqgB7/X/f53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le578HAAB//6B+n9VvAAAAAElFTkSuQmCC";

const SchoolRegistrationPortal: React.FC<SchoolRegistrationPortalProps> = ({ 
  settings, onBulkUpdate, onSave, onComplete, onExit, onResetStudents, onSwitchToLogin 
}) => {
  const [isRegistered, setIsRegistered] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [registeredData, setRegisteredData] = useState<any>(null);
  
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
      const { data: regData } = await supabase.from('uba_persistence').select('payload').eq('id', 'registry').single();
      const currentRegistry: SchoolRegistryEntry[] = regData?.payload || [];

      if (currentRegistry.some(r => r.name.toUpperCase() === formData.schoolName.trim().toUpperCase())) {
        alert("This institution is already registered.");
        setIsSyncing(false);
        return;
      }

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

      const nextRegistry = [...currentRegistry, newEntry];
      await supabase.from('uba_persistence').upsert({ id: 'registry', payload: nextRegistry, last_updated: new Date().toISOString() });

      const newSettings = {
        schoolName: formData.schoolName.toUpperCase(),
        schoolAddress: formData.location.toUpperCase(),
        registrantName: formData.registrant.toUpperCase(),
        registrantEmail: formData.registrantEmail.toLowerCase(),
        schoolEmail: formData.schoolEmail.toLowerCase(),
        schoolContact: formData.contact,
        schoolNumber: hubId,
        accessCode: accessKey
      };

      onBulkUpdate(newSettings);
      if (onResetStudents) onResetStudents();
      
      setRegisteredData(newSettings);
      setIsRegistered(true);
      setTimeout(() => onSave(), 500);
    } catch (err) {
      alert("Registration failed. Check connectivity.");
    } finally {
      setIsSyncing(false);
    }
  };

  if (isRegistered) {
    return (
      <div className="max-w-4xl mx-auto animate-in zoom-in-95 duration-700">
        <div className="bg-slate-900 rounded-[3rem] p-10 md:p-16 shadow-2xl border border-white/10 text-center space-y-10">
           <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-3xl flex items-center justify-center mx-auto shadow-2xl mb-4 border border-emerald-500/30">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
           </div>
           <h2 className="text-4xl font-black text-white uppercase tracking-tight leading-none">Hub Registration Success</h2>
           <p className="text-blue-300/60 font-bold text-xs uppercase tracking-widest">Authentication keys generated and synchronized</p>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: 'Institution Hub ID', val: registeredData?.schoolNumber },
                { label: 'System Access Key', val: registeredData?.accessCode },
                { label: 'Institution Name', val: registeredData?.schoolName },
                { label: 'Registered Director', val: registeredData?.registrantName }
              ].map(f => (
                <div key={f.label} className="bg-white/5 border border-white/10 p-6 rounded-3xl text-left hover:bg-white/10 transition-colors">
                  <span className="text-[9px] font-black text-blue-400 uppercase block mb-1">{f.label}</span>
                  <p className="text-lg font-black text-white truncate">{f.val}</p>
                </div>
              ))}
           </div>
           
           <div className="space-y-4">
              <p className="text-[10px] text-gray-500 uppercase font-black leading-relaxed italic px-8">
                Important: Take a screenshot or write down these keys. This is the only time the system access key will be shown in plain text.
              </p>
              <button 
                onClick={() => onComplete?.(registeredData)} 
                className="w-full bg-white text-slate-900 py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-emerald-50 transition-all active:scale-95"
              >
                Launch Institutional Hub
              </button>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="bg-white rounded-[3rem] p-10 md:p-16 shadow-2xl border border-slate-100 space-y-12">
        <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-blue-900 text-white rounded-3xl flex items-center justify-center mx-auto shadow-2xl mb-2 transition-transform hover:rotate-12">
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
               <label className="text-[10px] font-black text-blue-900 uppercase tracking-[0.2em]">Registrant Director</label>
               <input type="text" placeholder="FULL NAME..." value={formData.registrant} onChange={(e) => setFormData({...formData, registrant: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-5 text-sm font-black outline-none focus:ring-4 focus:ring-blue-500/10 uppercase" required />
            </div>
            <div className="space-y-1.5">
               <label className="text-[10px] font-black text-blue-900 uppercase tracking-[0.2em]">Contact Node</label>
               <input type="text" placeholder="PHONE..." value={formData.contact} onChange={(e) => setFormData({...formData, contact: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-5 text-sm font-black outline-none focus:ring-4 focus:ring-blue-500/10" required />
            </div>
            <div className="md:col-span-2 pt-10 space-y-6">
              <button type="submit" disabled={isSyncing} className="w-full bg-blue-900 text-white py-7 rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] shadow-2xl hover:bg-black transition-all active:scale-95 disabled:opacity-50">
                {isSyncing ? "Establishing Secure Node..." : "Execute Enrollment Protocol"}
              </button>
              
              <div className="text-center">
                <button 
                  type="button"
                  onClick={onSwitchToLogin}
                  className="text-[10px] font-black text-blue-900 uppercase tracking-[0.3em] hover:text-indigo-600 transition-colors border-b-2 border-transparent hover:border-indigo-600 pb-1"
                >
                  Already Registered? Sign In
                </button>
              </div>
            </div>
        </form>
      </div>
    </div>
  );
};

export default SchoolRegistrationPortal;