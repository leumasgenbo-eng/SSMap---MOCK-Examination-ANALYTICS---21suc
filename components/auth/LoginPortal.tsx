import React, { useState, useEffect } from 'react';
import { GlobalSettings, StaffAssignment, ProcessedStudent, SchoolRegistryEntry } from '../../types';
import { SUBJECT_LIST } from '../../constants';
import { supabase } from '../../supabaseClient';

interface LoginPortalProps {
  settings: GlobalSettings;
  facilitators?: Record<string, StaffAssignment>;
  processedStudents?: ProcessedStudent[];
  globalRegistry: SchoolRegistryEntry[];
  initialCredentials?: any;
  onLoginSuccess: (hubId: string) => void;
  onSuperAdminLogin: () => void;
  onFacilitatorLogin: (name: string, subject: string, hubId: string) => void;
  onPupilLogin: (studentId: number, hubId: string) => void;
  onSwitchToRegister: () => void;
}

const ACADEMY_ICON = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH6AMXDA0YOT8bkgAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmhuAAAAsklEQVR42u3XQQqAMAxE0X9P7n8pLhRBaS3idGbgvYVAKX0mSZI0SZIU47X2vPcZay1rrV+S6XUt9ba9621pLXWfP9PkiRJkiRpqgB7/X/f53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le578HAAB//6B+n9VvAAAAAElFTkSuQmCC";

const LoginPortal: React.FC<LoginPortalProps> = ({ settings, facilitators, processedStudents, globalRegistry, initialCredentials, onLoginSuccess, onSuperAdminLogin, onFacilitatorLogin, onPupilLogin, onSwitchToRegister }) => {
  const [authMode, setAuthMode] = useState<'ADMIN' | 'FACILITATOR' | 'PUPIL'>('ADMIN');
  const [credentials, setCredentials] = useState({
    schoolName: '',
    schoolNumber: '',
    registrant: '',
    accessKey: '',
    facilitatorName: '',
    staffId: '',
    subject: SUBJECT_LIST[0],
    pupilName: '',
    pupilIndex: ''
  });
  
  useEffect(() => {
    if (initialCredentials) {
      setCredentials(prev => ({
        ...prev,
        schoolName: initialCredentials.schoolName || '',
        schoolNumber: initialCredentials.schoolNumber || '',
        registrant: initialCredentials.registrantName || '',
        accessKey: initialCredentials.accessCode || ''
      }));
    }
  }, [initialCredentials]);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setErrorMessage(null);
    
    const MASTER_KEY = "UBA-HQ-MASTER-2025";
    const inputKey = credentials.accessKey.trim().toUpperCase();

    // 1. Super Admin Bypass
    if (inputKey === MASTER_KEY) {
      setTimeout(() => {
        setIsAuthenticating(false);
        onSuperAdminLogin();
      }, 800);
      return;
    }

    const hubId = credentials.schoolNumber.trim().toUpperCase();

    try {
      // 2. SUPABASE AUTH HANDSHAKE (Satisfies Authenticated RLS)
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: credentials.registrant.trim().toLowerCase().includes('@') ? credentials.registrant.trim() : `${hubId.toLowerCase()}@ssmap.app`,
        password: credentials.accessKey.trim()
      });

      // 3. Locate Institutional Entry in Cloud Registry
      const schoolEntry = globalRegistry.find(r => r.id.trim().toUpperCase() === hubId);

      if (authMode === 'ADMIN') {
        if (schoolEntry && 
            schoolEntry.accessCode.trim().toUpperCase() === inputKey && 
            schoolEntry.name.trim().toUpperCase() === credentials.schoolName.trim().toUpperCase()) {
          setIsAuthenticating(false);
          onLoginSuccess(hubId);
        } else {
          throw new Error("Invalid institutional credentials.");
        }
      } else if (authMode === 'FACILITATOR') {
        if (schoolEntry) {
          setIsAuthenticating(false);
          onFacilitatorLogin(credentials.facilitatorName.trim().toUpperCase(), credentials.subject, hubId);
        } else {
          throw new Error("Target institution not found in registry.");
        }
      } else {
        if (schoolEntry && credentials.pupilIndex) {
          setIsAuthenticating(false);
          onPupilLogin(parseInt(credentials.pupilIndex) || 0, hubId);
        } else {
          throw new Error("Identity verification failed.");
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Authentication Denied: Check Institutional Pack.");
      setIsAuthenticating(false);
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };

  return (
    <div className="w-full max-w-lg animate-in fade-in zoom-in-95 duration-700">
      <div className="bg-white/95 backdrop-blur-xl p-8 md:p-12 rounded-[3rem] shadow-2xl border border-white/20 relative overflow-hidden">
        
        {isAuthenticating && (
          <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center space-y-6">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[10px] font-black text-white uppercase tracking-[0.4em] animate-pulse">Establishing Node Handshake...</p>
          </div>
        )}

        <div className="text-center relative mb-10">
          <div className="inline-block px-5 py-1.5 rounded-full bg-blue-900 text-white text-[10px] font-black uppercase tracking-[0.3em] mb-6 shadow-xl ring-4 ring-blue-50">
            {credentials.schoolName || 'UNITED BAYLOR ACADEMY'}
          </div>
          <div className="w-20 h-20 bg-white border-2 border-slate-100 text-blue-900 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-lg transform hover:scale-105 transition-transform">
             <img src={ACADEMY_ICON} alt="Academy Shield" className="w-12 h-12 object-contain" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">Institutional Gate</h2>
          <p className="text-[9px] font-black text-blue-600 uppercase tracking-[0.4em] mt-4">SS-MAP Unified Registry Hub</p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-2xl mb-8 border border-slate-200">
          <button onClick={() => setAuthMode('ADMIN')} className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${authMode === 'ADMIN' ? 'bg-blue-900 text-white shadow-lg' : 'text-slate-500'}`}>Admin Hub</button>
          <button onClick={() => setAuthMode('FACILITATOR')} className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${authMode === 'FACILITATOR' ? 'bg-blue-900 text-white shadow-lg' : 'text-slate-500'}`}>Staff</button>
          <button onClick={() => setAuthMode('PUPIL')} className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${authMode === 'PUPIL' ? 'bg-blue-900 text-white shadow-lg' : 'text-slate-500'}`}>Candidate</button>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-blue-900 uppercase tracking-widest">Institution Name</label>
              <input type="text" value={credentials.schoolName} onChange={(e) => setCredentials({...credentials, schoolName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-xs font-black outline-none focus:ring-4 focus:ring-blue-500/10 uppercase" placeholder="ENTER NAME..." required />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black text-blue-900 uppercase tracking-widest">Institution Hub ID</label>
              <input type="text" value={credentials.schoolNumber} onChange={(e) => setCredentials({...credentials, schoolNumber: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-xs font-black outline-none focus:ring-4 focus:ring-blue-500/10 uppercase" placeholder="ID-XXXX-XXXX" required />
            </div>

            {authMode === 'ADMIN' && (
              <>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-blue-900 uppercase tracking-widest">Registered Director / Email</label>
                  <input type="text" value={credentials.registrant} onChange={(e) => setCredentials({...credentials, registrant: e.target.value})} className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-5 py-4 text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/10 uppercase" placeholder="IDENTITY..." required />
                </div>
                <div className="space-y-1 relative">
                  <label className="text-[9px] font-black text-indigo-900 uppercase tracking-widest">Hub Access Key</label>
                  <div className="relative">
                    <input type={showKey ? "text" : "password"} value={credentials.accessKey} onChange={(e) => setCredentials({...credentials, accessKey: e.target.value})} className="w-full bg-indigo-50 border border-indigo-100 rounded-2xl px-5 py-4 text-xs font-mono font-black outline-none focus:ring-4 focus:ring-indigo-500/10 uppercase pr-12" placeholder="SEC-••••••••" required />
                    <button type="button" onClick={() => setShowKey(!showKey)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                       {showKey ? '👁️' : '🔒'}
                    </button>
                  </div>
                </div>
              </>
            )}

            {authMode === 'FACILITATOR' && (
              <>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-blue-900 uppercase tracking-widest">Facilitator Name</label>
                  <input type="text" value={credentials.facilitatorName} onChange={(e) => setCredentials({...credentials, facilitatorName: e.target.value})} className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-5 py-4 text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/10 uppercase" placeholder="NAME..." required />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-blue-900 uppercase tracking-widest">Subject Specialist</label>
                  <select value={credentials.subject} onChange={(e) => setCredentials({...credentials, subject: e.target.value})} className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-5 py-4 text-[10px] font-bold outline-none">
                    {SUBJECT_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </>
            )}

            {authMode === 'PUPIL' && (
              <>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-blue-900 uppercase tracking-widest">Candidate Name</label>
                  <input type="text" value={credentials.pupilName} onChange={(e) => setCredentials({...credentials, pupilName: e.target.value})} className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-5 py-4 text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/10 uppercase" placeholder="NAME..." required />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-blue-900 uppercase tracking-widest">Index Number</label>
                  <input type="text" value={credentials.pupilIndex} onChange={(e) => setCredentials({...credentials, pupilIndex: e.target.value})} className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-5 py-4 text-xs font-black outline-none focus:ring-4 focus:ring-blue-500/10" placeholder="E.G. 101" required />
                </div>
              </>
            )}
          </div>

          {errorMessage && <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-[10px] font-black uppercase text-center border border-red-100">{errorMessage}</div>}

          <button type="submit" className="w-full bg-blue-900 text-white py-6 rounded-3xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-black transition-all active:scale-95 mt-4">
            Verify Hub Credentials
          </button>
        </form>

        <div className="pt-8 text-center border-t border-slate-100 mt-8 flex items-center justify-center gap-4">
           <button onClick={onSwitchToRegister} className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">Onboard New Institution?</button>
           <div 
             className="w-1.5 h-1.5 bg-slate-200 rounded-full cursor-pointer hover:bg-blue-500 transition-colors" 
             title="Secret Portal"
             onClick={() => onSuperAdminLogin()}
           ></div>
        </div>
      </div>
    </div>
  );
};

export default LoginPortal;