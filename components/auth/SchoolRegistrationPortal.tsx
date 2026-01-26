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

  if (isRegistered) {
    return (
      <div className="max-w-4xl mx-auto animate-in zoom-in-95 duration-700">
        <div className="bg-slate-900 rounded-[3rem] p-10 md:p-16 shadow-2xl border border-white/10 text-center space-y-10">
           <h2 className="text-4xl font-black text-white uppercase tracking-tight leading-none">Hub Registration Success</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: 'Institution Hub ID', val: settings.schoolNumber },
                { label: 'System Access Key', val: settings.accessCode },
                { label: 'Institution Name', val: settings.schoolName },
                { label: 'Registered Director', val: settings.registrantName }
              ].map(f => (
                <div key={f.label} className="bg-white/5 border border-white/10 p-6 rounded-3xl text-left">
                  <span className="text-[9px] font-black text-blue-400 uppercase block mb-1">{f.label}</span>
                  <p className="text-lg font-black text-white truncate">{f.val}</p>
                </div>
              ))}
           </div>
           <button onClick={onComplete} className="w-full bg-white text-slate-900 py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em]">Return to Gateway</button>
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