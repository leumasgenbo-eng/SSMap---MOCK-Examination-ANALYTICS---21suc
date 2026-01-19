import React, { useState } from 'react';
import { GlobalSettings, StaffAssignment, ProcessedStudent } from '../../types';
import { SUBJECT_LIST } from '../../constants';

interface LoginPortalProps {
  settings: GlobalSettings;
  facilitators?: Record<string, StaffAssignment>;
  processedStudents?: ProcessedStudent[];
  onLoginSuccess: () => void;
  onSuperAdminLogin: () => void;
  onFacilitatorLogin: (name: string, subject: string) => void;
  onPupilLogin: (studentId: number) => void;
  onSwitchToRegister: () => void;
}

const ACADEMY_ICON = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH6AMXDA0YOT8bkgAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmhuAAAAsklEQVR42u3XQQqAMAxE0X9P7n8pLhRBaS3idGbgvYVAKX0mSZI0SZIU47X2vPcZay1rrfV+S6XUt9ba9621pLXWfP9PkiRJkiRpqgB7/X/f53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le578HAAB//6B+n9VvAAAAAElFTkSuQmCC";

const LoginPortal: React.FC<LoginPortalProps> = ({ settings, facilitators, processedStudents, onLoginSuccess, onSuperAdminLogin, onFacilitatorLogin, onPupilLogin, onSwitchToRegister }) => {
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
  
  const [error, setError] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  
  // Visibility States for Keys
  const [showAdminKey, setShowAdminKey] = useState(false);
  const [showFacilitatorKey, setShowFacilitatorKey] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    
    const MASTER_KEY = "HQ-MASTER-2025";
    const inputKey = credentials.accessKey.trim();
    const inputStaffId = credentials.staffId.trim();
    const inputPupilIndex = credentials.pupilIndex.trim();

    if (inputKey === MASTER_KEY || inputStaffId === MASTER_KEY || inputPupilIndex === MASTER_KEY) {
      setTimeout(() => {
        onSuperAdminLogin();
      }, 800);
      return;
    }

    const inputSchoolName = credentials.schoolName.trim().toLowerCase();
    const targetSchoolName = (settings.schoolName || "").trim().toLowerCase();
    const targetHubId = (settings.schoolNumber || "").trim().toUpperCase();

    setTimeout(() => {
      if (authMode === 'ADMIN') {
        const inputSchoolNumber = credentials.schoolNumber.trim().toUpperCase();
        const inputRegistrant = credentials.registrant.trim().toUpperCase();
        const targetRegistrant = (settings.registrantName || "").trim().toUpperCase();
        const targetAccessKey = (settings.accessCode || "").trim().toUpperCase();

        if (inputSchoolName === targetSchoolName && 
            inputSchoolNumber === targetHubId && 
            inputRegistrant === targetRegistrant && 
            inputKey.toUpperCase() === targetAccessKey) {
          onLoginSuccess();
        } else {
          failAuth();
        }
      } else if (authMode === 'FACILITATOR') {
        const inputFacName = credentials.facilitatorName.trim().toUpperCase();
        
        let isVerified = false;
        if (facilitators) {
          isVerified = Object.values(facilitators).some((f: StaffAssignment) => {
            const shortId = f.enrolledId.toUpperCase();
            const fullId = `${targetHubId}/${shortId}`;
            return (inputStaffId.toUpperCase() === shortId || inputStaffId.toUpperCase() === fullId) && 
                   f.name.toUpperCase() === inputFacName &&
                   f.taughtSubject === credentials.subject;
          });
        }

        if (inputSchoolName === targetSchoolName && isVerified) {
          onFacilitatorLogin(inputFacName, credentials.subject);
        } else {
          failAuth();
        }
      } else {
        const inputPupilName = credentials.pupilName.trim().toUpperCase();
        const indexNum = parseInt(inputPupilIndex) || 0;
        const inputHubId = credentials.schoolNumber.trim().toUpperCase();

        if (inputSchoolName === targetSchoolName && inputHubId === targetHubId && processedStudents) {
          const student = processedStudents.find(s => s.id === indexNum && s.name.toUpperCase() === inputPupilName);
          if (student) {
            onPupilLogin(student.id);
          } else {
            failAuth();
          }
        } else {
          failAuth();
        }
      }
    }, 600);
  };

  const failAuth = () => {
    setError(true);
    setIsAuthenticating(false);
    setTimeout(() => setError(false), 3000);
  };

  return (
    <div className="w-full max-w-lg animate-in fade-in zoom-in-95 duration-700">
      <div className="bg-white/95 backdrop-blur-xl p-8 md:p-12 rounded-[3rem] shadow-[0_20px_60px_rgba(0,0,0,0.1)] border border-white/20 relative overflow-hidden">
        
        {isAuthenticating && (
          <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center space-y-6 animate-in fade-in duration-300">
            <div className="relative">
               <div className="w-16 h-16 border-4 border-blue-900/10 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
            <p className="text-[10px] font-black text-white uppercase tracking-[0.4em] animate-pulse">Establishing Secure Node...</p>
          </div>
        )}

        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
        
        <div className="text-center relative mb-10">
          <div className="w-24 h-24 bg-blue-900 text-white rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl transform hover:rotate-6 transition-transform border-4 border-white/10">
             <img src={ACADEMY_ICON} alt="Academy Shield" className="w-16 h-16 object-contain" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">Mock Examination Analytics</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-3">School Supervision and Management Application SS-Map</p>
        </div>

        <div className="flex bg-slate-100/50 p-1 rounded-2xl mb-8 border border-slate-200 overflow-x-auto no-scrollbar">
          <button onClick={() => setAuthMode('ADMIN')} className={`flex-1 py-3 px-4 whitespace-nowrap rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${authMode === 'ADMIN' ? 'bg-blue-900 text-white shadow-lg' : 'text-slate-500'}`}>Admin Gate</button>
          <button onClick={() => setAuthMode('FACILITATOR')} className={`flex-1 py-3 px-4 whitespace-nowrap rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${authMode === 'FACILITATOR' ? 'bg-blue-900 text-white shadow-lg' : 'text-slate-500'}`}>Facilitator</button>
          <button onClick={() => setAuthMode('PUPIL')} className={`flex-1 py-3 px-4 whitespace-nowrap rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${authMode === 'PUPIL' ? 'bg-blue-900 text-white shadow-lg' : 'text-slate-500'}`}>Candidate Gate</button>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-blue-900 uppercase tracking-widest ml-1">Academy Full Name</label>
              <input type="text" value={credentials.schoolName} onChange={(e) => setCredentials({...credentials, schoolName: e.target.value})} className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-5 py-4 text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/10 uppercase transition-all" placeholder="CULBURY ACADEMY..." />
            </div>

            {authMode === 'ADMIN' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-blue-900 uppercase tracking-widest ml-1">Academy Hub ID</label>
                    <input type="text" value={credentials.schoolNumber} onChange={(e) => setCredentials({...credentials, schoolNumber: e.target.value})} className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-5 py-4 text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/10 uppercase transition-all" placeholder="ID-XXXX-XXX" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-blue-900 uppercase tracking-widest ml-1">Registrant</label>
                    <input type="text" value={credentials.registrant} onChange={(e) => setCredentials({...credentials, registrant: e.target.value})} className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-5 py-4 text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/10 uppercase transition-all" placeholder="IDENTITY..." />
                  </div>
                </div>
                <div className="space-y-1 relative">
                  <label className="text-[9px] font-black text-indigo-900 uppercase tracking-widest ml-1">Hub Access Key</label>
                  <div className="relative group/key">
                    <input 
                      type={showAdminKey ? "text" : "password"} 
                      value={credentials.accessKey} 
                      onChange={(e) => setCredentials({...credentials, accessKey: e.target.value})} 
                      className="w-full bg-indigo-50 border border-indigo-100 rounded-2xl px-5 py-4 text-xs font-mono font-black outline-none focus:ring-4 focus:ring-indigo-500/10 uppercase tracking-widest transition-all pr-12" 
                      placeholder="SSMAP-SEC-••••••••" 
                    />
                    <button 
                      type="button"
                      onClick={() => setShowAdminKey(!showAdminKey)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-300 hover:text-indigo-600 transition-colors"
                    >
                      {showAdminKey ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 19c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}

            {authMode === 'FACILITATOR' && (
              <>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-blue-900 uppercase tracking-widest ml-1">Facilitator Full Name</label>
                  <input type="text" value={credentials.facilitatorName} onChange={(e) => setCredentials({...credentials, facilitatorName: e.target.value})} className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-5 py-4 text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/10 uppercase transition-all" placeholder="SIR/MADAM NAME..." />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-blue-900 uppercase tracking-widest ml-1">Subject Specialization</label>
                  <select value={credentials.subject} onChange={(e) => setCredentials({...credentials, subject: e.target.value})} className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-5 py-4 text-[10px] font-bold outline-none focus:ring-4 focus:ring-blue-500/10 uppercase transition-all">
                    {SUBJECT_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-1 relative">
                  <label className="text-[9px] font-black text-indigo-900 uppercase tracking-widest ml-1">Institutional Staff ID</label>
                  <div className="relative">
                    <input 
                      type={showFacilitatorKey ? "text" : "password"} 
                      value={credentials.staffId} 
                      onChange={(e) => setCredentials({...credentials, staffId: e.target.value})} 
                      className="w-full bg-indigo-50 border border-indigo-100 rounded-2xl px-5 py-4 text-xs font-mono font-black outline-none focus:ring-4 focus:ring-indigo-500/10 uppercase tracking-widest transition-all pr-12" 
                      placeholder="E.G. HUB-ID/FAC-001" 
                    />
                    <button 
                      type="button"
                      onClick={() => setShowFacilitatorKey(!showFacilitatorKey)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-300 hover:text-indigo-600 transition-colors"
                    >
                      {showFacilitatorKey ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 19c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}

            {authMode === 'PUPIL' && (
              <>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-blue-900 uppercase tracking-widest ml-1">Candidate Full Name</label>
                  <input type="text" value={credentials.pupilName} onChange={(e) => setCredentials({...credentials, pupilName: e.target.value})} className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-5 py-4 text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/10 uppercase transition-all" placeholder="KWAME MENSAH..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-blue-900 uppercase tracking-widest ml-1">Academy Hub ID</label>
                    <input type="text" value={credentials.schoolNumber} onChange={(e) => setCredentials({...credentials, schoolNumber: e.target.value})} className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-5 py-4 text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/10 uppercase transition-all" placeholder="CBA-2025-..." />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-blue-900 uppercase tracking-widest ml-1">Index Number</label>
                    <input type="text" value={credentials.pupilIndex} onChange={(e) => setCredentials({...credentials, pupilIndex: e.target.value})} className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-5 py-4 text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/10 uppercase transition-all" placeholder="101..." />
                  </div>
                </div>
              </>
            )}
          </div>

          {error && <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-[10px] font-black uppercase text-center border border-red-100 animate-shake">Authentication Failed: Check Hub Particulars</div>}

          <button type="submit" className="w-full bg-blue-900 text-white py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-black transition-all active:scale-95 mt-4">
            Authorize System Entry
          </button>
        </form>

        <div className="pt-8 text-center border-t border-slate-100 mt-8 flex flex-col gap-3">
           <button onClick={onSwitchToRegister} className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">Register New Institution?</button>
           <button onClick={() => setShowSupport(true)} className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:underline">Protocol Verification & Support?</button>
        </div>
      </div>

      {showSupport && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl relative border border-slate-200 animate-in zoom-in-95 duration-300">
              <button onClick={() => setShowSupport(false)} className="absolute top-8 right-8 text-slate-400 hover:text-black">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
              <div className="text-center mb-8">
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">Network Support</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Verification Protocol</p>
              </div>
              <div className="space-y-6">
                <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 text-[11px] font-bold text-blue-900 leading-relaxed text-center">
                  Notice: PIN verification is deactivated for this environment. 
                  Use the master access key provided by the network registry.
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center bg-slate-50 px-6 py-4 rounded-2xl border border-slate-200">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Master Support</span>
                    <span className="text-xs font-black text-blue-900 tracking-widest">+233 24 350 4091</span>
                  </div>
                </div>
              </div>
           </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.2s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}} />
    </div>
  );
};

export default LoginPortal;