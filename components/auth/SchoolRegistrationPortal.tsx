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
  const [authErrorCode, setAuthErrorCode] = useState<string | null>(null);
  
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
    setAuthErrorCode(null);

    try {
      const hubId = `UBA-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const accessKey = `SEC-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      // Use a deterministic system email for Auth to prevent login mismatches
      const systemAuthEmail = `${hubId.toLowerCase()}@unitedbaylor.edu`;

      // 1. AUTH PROVISIONING
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: systemAuthEmail,
        password: accessKey, 
        options: {
          data: {
            hubId: hubId, 
            schoolName: formData.schoolName.toUpperCase(),
            directorEmail: formData.registrantEmail.toLowerCase().trim(),
            role: 'school_admin'
          }
        }
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
           setAuthErrorCode('USER_EXISTS');
           setIsSyncing(false);
           return;
        }
        throw signUpError;
      }

      const userId = authData.user?.id;
      if (!userId) throw new Error("Security node failed to generate identity.");

      const ts = new Date().toISOString();

      // 2. PRIVATE SETTINGS SHARD
      const newSettings = {
        ...settings,
        schoolName: formData.schoolName.toUpperCase(),
        schoolAddress: formData.location.toUpperCase(),
        registrantName: formData.registrant.toUpperCase(),
        registrantEmail: formData.registrantEmail.toLowerCase(),
        schoolEmail: formData.schoolEmail.toLowerCase(),
        schoolContact: formData.contact,
        schoolNumber: hubId,
        accessCode: accessKey,
        systemAuthEmail: systemAuthEmail, // Store for login reference
        enrollmentDate: new Date().toLocaleDateString()
      };

      // Ensure settings are saved before continuing
      const { error: settingsError } = await supabase.from('uba_persistence').insert({ 
        id: `${hubId}_settings`, 
        payload: newSettings, 
        last_updated: ts,
        user_id: userId 
      });

      if (settingsError) throw new Error("Settings Allocation Failed: " + settingsError.message);

      // 3. NETWORK REGISTRY NODE
      const newRegistryEntry: SchoolRegistryEntry = {
        id: hubId,
        name: formData.schoolName.toUpperCase(),
        registrant: formData.registrant.toUpperCase(),
        accessCode: accessKey,
        enrollmentDate: new Date().toLocaleDateString(),
        studentCount: 0,
        avgAggregate: 0,
        performanceHistory: [],
        status: 'active',
        lastActivity: ts
      };

      const { error: regError } = await supabase.from('uba_persistence').insert({ 
        id: `registry_${hubId}`, 
        payload: [newRegistryEntry], 
        last_updated: ts,
        user_id: userId
      });

      if (regError) throw new Error("Network Registry Sync Failed: " + regError.message);

      onBulkUpdate(newSettings);
      if (onResetStudents) onResetStudents();
      
      setRegisteredData(newSettings);
      setIsRegistered(true);
      
    } catch (err: any) {
      console.error("Enrollment sequence interrupted:", err);
      alert(err.message || "Registration Node Error: Request failed.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDownloadCredentials = () => {
    const text = `SS-MAP - INSTITUTIONAL ACCESS PACK\n` +
                 `==================================================\n\n` +
                 `USE THESE FIELDS TO LOGIN TO YOUR HUB:\n\n` +
                 `1. Institution Hub ID:  ${registeredData?.schoolNumber}\n` +
                 `2. System Login Email:  ${registeredData?.systemAuthEmail}\n` +
                 `3. System Access Key:   ${registeredData?.accessCode}\n\n` +
                 `--------------------------------------------------\n` +
                 `REGISTRATION METADATA:\n` +
                 `Academy Name: ${registeredData?.schoolName}\n` +
                 `Director:     ${registeredData?.registrantName}\n` +
                 `Locality:     ${registeredData?.schoolAddress}\n\n` +
                 `* IMPORTANT: Save this file. Your Access Key is required for every session.`;
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SSMap_Hub_Credentials_${registeredData?.schoolNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isSyncing) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-8 animate-in fade-in zoom-in-95 duration-500">
        <div className="w-24 h-24 border-8 border-slate-100 border-t-blue-900 rounded-full animate-spin"></div>
        <div className="text-center space-y-2">
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Establishing Secure Node...</h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Generating cryptographic keys and data shards</p>
        </div>
      </div>
    );
  }

  if (isRegistered) {
    return (
      <div className="max-w-4xl mx-auto animate-in zoom-in-95 duration-700">
        <div className="bg-slate-900 rounded-[3rem] p-10 md:p-16 shadow-2xl border border-white/10 text-center space-y-10">
           <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-3xl flex items-center justify-center mx-auto shadow-2xl mb-4 border border-emerald-500/30">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
           </div>
           <div className="space-y-2">
              <h2 className="text-4xl font-black text-white uppercase tracking-tight leading-none">Institutional Node Established</h2>
              <p className="text-emerald-400/60 font-black text-[10px] uppercase tracking-[0.4em]">Registry Handshake Complete</p>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: 'Institution Hub ID', val: registeredData?.schoolNumber },
                { label: 'System Login ID (Email)', val: registeredData?.systemAuthEmail },
                { label: 'System Access Key', val: registeredData?.accessCode },
                { label: 'Academy Name', val: registeredData?.schoolName }
              ].map(f => (
                <div key={f.label} className="bg-white/5 border border-white/10 p-6 rounded-3xl text-left hover:bg-white/10 transition-colors">
                  <span className="text-[9px] font-black text-blue-400 uppercase block mb-1">{f.label}</span>
                  <p className="text-lg font-black text-white truncate font-mono">{f.val}</p>
                </div>
              ))}
           </div>
           <div className="flex flex-wrap justify-center gap-4">
              <button onClick={handleDownloadCredentials} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase shadow-lg transition-all">Download Credentials Pack</button>
              <button onClick={() => onComplete?.(registeredData)} className="w-full bg-white text-slate-900 py-7 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-emerald-50 transition-all active:scale-95">Proceed to Secure Portal</button>
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
            <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none">Register Institution Hub</h2>
            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.4em]">Establish your encrypted node on the UBA network</p>
        </div>

        {authErrorCode === 'USER_EXISTS' && (
          <div className="bg-amber-50 border-2 border-amber-200 p-8 rounded-[2rem] text-center space-y-4 animate-in fade-in zoom-in-95">
             <div className="text-amber-600 font-black text-xs uppercase tracking-[0.2em]">Registry Conflict Detected</div>
             <p className="text-sm font-bold text-amber-900 leading-relaxed">
               This institutional identity already exists in the network database.
             </p>
             <button onClick={onSwitchToLogin} className="bg-amber-600 text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase shadow-lg hover:bg-amber-700 transition-all">Go to Sign In</button>
          </div>
        )}

        <form onSubmit={handleEnrollment} className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
            <div className="md:col-span-2 space-y-1.5"><label className="text-[10px] font-black text-blue-900 uppercase tracking-[0.2em]">Official Academy Name</label><input type="text" value={formData.schoolName} onChange={(e) => setFormData({...formData, schoolName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-5 text-sm font-black outline-none focus:ring-4 focus:ring-blue-500/10 uppercase" required placeholder="E.G. UNITED BAYLOR ACADEMY" /></div>
            <div className="md:col-span-2 space-y-1.5"><label className="text-[10px] font-black text-blue-900 uppercase tracking-[0.2em]">Locality / Address</label><input type="text" placeholder="TOWN, REGION..." value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-5 text-sm font-black outline-none focus:ring-4 focus:ring-blue-500/10 uppercase" required /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-blue-900 uppercase tracking-[0.2em]">Director Name</label><input type="text" placeholder="FULL NAME..." value={formData.registrant} onChange={(e) => setFormData({...formData, registrant: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-5 text-sm font-black outline-none focus:ring-4 focus:ring-blue-500/10 uppercase" required /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-blue-900 uppercase tracking-[0.2em]">Management Email</label><input type="email" placeholder="ADMIN@EMAIL.COM" value={formData.registrantEmail} onChange={(e) => setFormData({...formData, registrantEmail: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-5 text-sm font-black outline-none focus:ring-4 focus:ring-blue-500/10" required /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-blue-900 uppercase tracking-[0.2em]">School Official Email</label><input type="email" placeholder="OFFICE@ACADEMY.COM" value={formData.schoolEmail} onChange={(e) => setFormData({...formData, schoolEmail: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-5 text-sm font-black outline-none focus:ring-4 focus:ring-blue-500/10" required /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-blue-900 uppercase tracking-[0.2em]">Primary Contact Node</label><input type="text" placeholder="PHONE..." value={formData.contact} onChange={(e) => setFormData({...formData, contact: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-5 text-sm font-black outline-none focus:ring-4 focus:ring-blue-500/10" required /></div>
            <div className="md:col-span-2 pt-10 space-y-6">
              <button type="submit" disabled={isSyncing} className="w-full bg-blue-900 text-white py-7 rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] shadow-2xl hover:bg-black transition-all active:scale-95 disabled:opacity-50">{isSyncing ? "Syncing Shards..." : "Execute Enrollment Protocol"}</button>
              <div className="text-center"><button type="button" onClick={onSwitchToLogin} className="text-[10px] font-black text-blue-900 uppercase tracking-[0.3em] hover:text-indigo-600 transition-colors border-b-2 border-transparent hover:border-indigo-600 pb-1">Already Registered? Hub Access</button></div>
            </div>
        </form>
      </div>
    </div>
  );
};

export default SchoolRegistrationPortal;