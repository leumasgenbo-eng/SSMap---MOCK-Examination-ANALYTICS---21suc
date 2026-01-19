
import React, { useState, useEffect } from 'react';
import { GlobalSettings, SchoolRegistryEntry } from '../../types';

interface SchoolRegistrationPortalProps {
  settings: GlobalSettings;
  onBulkUpdate: (updates: Partial<GlobalSettings>) => void;
  onSave: () => void;
  onComplete?: () => void;
  onExit?: () => void;
  onResetStudents?: () => void;
  onSwitchToLogin?: () => void;
}

const ACADEMY_ICON = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH6AMXDA0YOT8bkgAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmhuAAAAsklEQVR42u3XQQqAMAxE0X9P7n8pLhRBaS3idGbgvYVAKX0mSZI0SZIU47X2vPcZay1rrfV+S6XUt9ba9621pLXWfP9PkiRJkiRpqgB7/X/f53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le578HAAB//6B+n9VvAAAAAElFTkSuQmCC";

const SchoolRegistrationPortal: React.FC<SchoolRegistrationPortalProps> = ({ 
  settings, onBulkUpdate, onSave, onComplete, onExit, onResetStudents, onSwitchToLogin 
}) => {
  // If access code already exists, start at SUCCESS view (Credential viewer mode)
  const isExistingRegistration = !!settings.accessCode;
  const [step, setStep] = useState<'FORM' | 'SUCCESS'>(isExistingRegistration ? 'SUCCESS' : 'FORM');
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Force empty strings for new registrations regardless of DEFAULT_SETTINGS in App.tsx
  const [formData, setFormData] = useState({
    schoolName: isExistingRegistration ? settings.schoolName : '',
    location: isExistingRegistration ? settings.schoolAddress : '',
    registrant: isExistingRegistration ? settings.registrantName || '' : '',
    registrantEmail: isExistingRegistration ? settings.registrantEmail || '' : '',
    schoolEmail: isExistingRegistration ? settings.schoolEmail || '' : '',
    contact: isExistingRegistration ? settings.schoolContact || '' : ''
  });

  const handleEnrollment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSyncing(true);

    // 1. Cross-check for duplicate institutional identity in network registry
    const registryData = localStorage.getItem('uba_global_registry');
    if (registryData) {
      const existingRegistry: SchoolRegistryEntry[] = JSON.parse(registryData);
      const isDuplicate = existingRegistry.some(r => 
        r.name.trim().toLowerCase() === formData.schoolName.trim().toLowerCase()
      );

      if (isDuplicate) {
        setIsSyncing(false);
        alert(`NETWORK CONFLICT: The institution "${formData.schoolName.toUpperCase()}" is already registered on the SS-Map network. Please proceed to the Login Gate to access this hub or contact technical support for credential recovery.`);
        return;
      }
    }

    // 2. Simulate high-security network registration if no conflict found
    setTimeout(() => {
      const nameParts = formData.schoolName.trim().split(/\s+/);
      let prefix = nameParts.length > 1 
        ? nameParts.map(p => p[0]).join('').toUpperCase() 
        : formData.schoolName.substring(0, 3).toUpperCase();
      
      prefix = prefix.replace(/[^A-Z]/g, '');
      if (prefix.length < 2) prefix = "SCH";

      const newID = `${prefix}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const newKey = `SSMAP-SEC-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

      onBulkUpdate({
        schoolName: formData.schoolName.trim().toUpperCase(),
        schoolAddress: formData.location.trim().toUpperCase(),
        registrantName: formData.registrant.trim().toUpperCase(),
        registrantEmail: formData.registrantEmail.trim().toLowerCase(),
        schoolEmail: formData.schoolEmail.trim().toLowerCase(),
        schoolContact: formData.contact.trim(),
        schoolNumber: newID,
        accessCode: newKey,
        enrollmentDate: new Date().toLocaleDateString()
      });

      if (onResetStudents) onResetStudents();
      
      setIsSyncing(false);
      setStep('SUCCESS');
      
      // Delay save to allow bulk update to propagate
      setTimeout(() => onSave(), 100);
    }, 2000);
  };

  const downloadPack = () => {
    const text = `INSTITUTIONAL ACCESS PACK\n` +
                 `==================================================\n\n` +
                 `REQUIRED LOGIN CREDENTIALS:\n\n` +
                 `1. Institution Name:   ${settings.schoolName}\n` +
                 `2. Hub ID (Enroll #):  ${settings.schoolNumber}\n` +
                 `3. Registrant ID:      ${settings.registrantName}\n` +
                 `4. System Access Key:  ${settings.accessCode}\n\n` +
                 `--------------------------------------------------\n` +
                 `REGISTRATION METADATA:\n` +
                 `Location:   ${settings.schoolAddress}\n` +
                 `Contact:    ${settings.schoolContact}\n` +
                 `Date:       ${settings.enrollmentDate}\n\n` +
                 `* CAUTION: This key is unique to your academy instance.`;
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Institutional_Credentials_${settings.schoolNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyPack = () => {
    const text = `Institution: ${settings.schoolName}\nHub ID: ${settings.schoolNumber}\nIdentity: ${settings.registrantName}\nKey: ${settings.accessCode}`;
    navigator.clipboard.writeText(text);
    alert("Credentials copied to secure clipboard.");
  };

  const emailPack = () => {
    const targetEmail = settings.registrantEmail || formData.registrantEmail;
    const subject = encodeURIComponent(`SS-Map Access Pack: ${settings.schoolName}`);
    const body = encodeURIComponent(
      `Institutional Access Details:\n\n` +
      `Institution Name: ${settings.schoolName}\n` +
      `Hub ID: ${settings.schoolNumber}\n` +
      `Registrant: ${settings.registrantName}\n` +
      `Access Key: ${settings.accessCode}\n\n` +
      `Generated on: ${settings.enrollmentDate}`
    );
    window.location.href = `mailto:${targetEmail}?subject=${subject}&body=${body}`;
  };

  if (isSyncing) {
    return (
      <div className="flex flex-col items-center justify-center py-40 space-y-8 animate-in fade-in duration-500">
        <div className="w-24 h-24 bg-blue-900 rounded-[2rem] flex items-center justify-center shadow-2xl relative overflow-hidden">
           <img src={ACADEMY_ICON} alt="Shield" className="w-12 h-12 relative z-10" />
           <div className="absolute inset-0 border-4 border-white/20 border-t-white rounded-[2rem] animate-spin"></div>
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-xl font-black text-white uppercase tracking-tighter">Establishing Secure Node</h3>
          <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest animate-pulse">Checking institutional availability...</p>
        </div>
      </div>
    );
  }

  if (step === 'SUCCESS') {
    return (
      <div className="max-w-4xl mx-auto animate-in zoom-in-95 duration-700">
        <div className="bg-slate-900 rounded-[3rem] p-10 md:p-16 shadow-2xl border border-white/10 relative overflow-hidden space-y-10">
           <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full -mr-48 -mt-48 blur-[120px]"></div>
           
           <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-emerald-500 text-white rounded-3xl flex items-center justify-center mx-auto shadow-2xl border-4 border-white/10">
                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <h2 className="text-4xl font-black text-white uppercase tracking-tight">Institutional Credentials</h2>
              <p className="text-blue-300 font-bold text-xs uppercase tracking-widest">Secure identity particulars for hub authentication.</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: 'Institution Identity', val: settings.schoolName },
                { label: 'Generated Hub ID', val: settings.schoolNumber },
                { label: 'Registrant Identity', val: settings.registrantName },
                { label: 'System Access Key', val: settings.accessCode }
              ].map(field => (
                <div key={field.label} className="bg-white/5 border border-white/10 p-6 rounded-3xl group hover:bg-white/10 transition-all duration-300">
                  <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest block mb-1">{field.label}</span>
                  <p className="text-lg font-black text-white truncate group-hover:text-blue-300 transition-colors">{field.val}</p>
                </div>
              ))}
           </div>

           <div className="flex flex-wrap justify-center gap-4 py-4">
              <button onClick={copyPack} className="bg-white/10 hover:bg-white text-white hover:text-slate-900 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                Copy Details
              </button>
              <button onClick={downloadPack} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all active:scale-95 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                Download (.txt)
              </button>
              <button onClick={emailPack} className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all active:scale-95 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                Send to Email
              </button>
           </div>

           <div className="pt-10 border-t border-white/5 text-center">
              <button 
                onClick={onComplete}
                className="w-full max-w-md mx-auto bg-white text-slate-900 py-6 rounded-[2rem] font-black text-xs uppercase shadow-2xl transition-all active:scale-95 tracking-[0.3em]"
              >
                Return to Gateway
              </button>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="bg-white rounded-[3rem] p-10 md:p-16 shadow-2xl border border-slate-100 relative overflow-hidden">
        <div className="relative space-y-12">
          
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-20 h-20 bg-blue-900 text-white rounded-3xl flex items-center justify-center shadow-2xl mb-2">
               <img src={ACADEMY_ICON} alt="Shield" className="w-12 h-12" />
            </div>
            <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none">Institutional Onboarding</h2>
            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.4em]">Establish your academy instance on the SS-Map network</p>
          </div>

          <form onSubmit={handleEnrollment} className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
            <div className="space-y-1.5 md:col-span-2">
               <label className="text-[10px] font-black text-blue-900 uppercase tracking-[0.2em] ml-1">Official Academy Name</label>
               <input 
                 type="text" 
                 value={formData.schoolName}
                 onChange={(e) => setFormData({...formData, schoolName: e.target.value})}
                 className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-5 text-sm font-black outline-none focus:ring-4 focus:ring-blue-500/10 transition-all uppercase"
                 required
                 placeholder="NAME OF SCHOOL..."
               />
            </div>

            <div className="space-y-1.5 md:col-span-2">
               <label className="text-[10px] font-black text-blue-900 uppercase tracking-[0.2em] ml-1">Institutional Locality / Address</label>
               <input 
                 type="text" 
                 placeholder="TOWN, REGION, COUNTRY..."
                 value={formData.location}
                 onChange={(e) => setFormData({...formData, location: e.target.value})}
                 className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-5 text-sm font-black outline-none focus:ring-4 focus:ring-blue-500/10 transition-all uppercase"
                 required
               />
            </div>

            <div className="space-y-1.5">
               <label className="text-[10px] font-black text-blue-900 uppercase tracking-[0.2em] ml-1">Academy Registrant</label>
               <input 
                 type="text" 
                 placeholder="FULL NAME..."
                 value={formData.registrant}
                 onChange={(e) => setFormData({...formData, registrant: e.target.value})}
                 className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-5 text-sm font-black outline-none focus:ring-4 focus:ring-blue-500/10 transition-all uppercase"
                 required
               />
            </div>

            <div className="space-y-1.5">
               <label className="text-[10px] font-black text-blue-900 uppercase tracking-[0.2em] ml-1">Registrant Primary Email</label>
               <input 
                 type="email" 
                 placeholder="REGISTRANT@DOMAIN.COM"
                 value={formData.registrantEmail}
                 onChange={(e) => setFormData({...formData, registrantEmail: e.target.value})}
                 className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-5 text-sm font-black outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                 required
               />
            </div>

            <div className="space-y-1.5">
               <label className="text-[10px] font-black text-blue-900 uppercase tracking-[0.2em] ml-1">Academy Official Mail</label>
               <input 
                 type="email" 
                 placeholder="OFFICE@SCHOOL.COM"
                 value={formData.schoolEmail}
                 onChange={(e) => setFormData({...formData, schoolEmail: e.target.value})}
                 className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-5 text-sm font-black outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                 required
               />
            </div>

            <div className="space-y-1.5">
               <label className="text-[10px] font-black text-blue-900 uppercase tracking-[0.2em] ml-1">Institutional Contact</label>
               <input 
                 type="text" 
                 placeholder="PHONE / MOBILE..."
                 value={formData.contact}
                 onChange={(e) => setFormData({...formData, contact: e.target.value})}
                 className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-5 text-sm font-black outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                 required
               />
            </div>

            <div className="md:col-span-2 pt-10 space-y-6">
              <button 
                type="submit" 
                className="w-full bg-blue-900 text-white py-7 rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] shadow-2xl hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-4"
              >
                Execute Enrollment Protocol
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><polyline points="16 11 18 13 22 9"></polyline></svg>
              </button>
              
              {onSwitchToLogin && (
                <div className="text-center">
                  <button 
                    type="button"
                    onClick={onSwitchToLogin}
                    className="text-[10px] font-black text-blue-900 uppercase tracking-[0.3em] hover:text-indigo-600 transition-colors border-b-2 border-transparent hover:border-indigo-600 pb-1"
                  >
                    Already Registered? Return to Gate
                  </button>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SchoolRegistrationPortal;
