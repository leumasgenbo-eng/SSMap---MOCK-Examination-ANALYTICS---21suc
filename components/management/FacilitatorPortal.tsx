
import React, { useState, useMemo } from 'react';
import { StaffAssignment, StaffRole, InvigilationSlot, GlobalSettings } from '../../types';

interface FacilitatorPortalProps {
  subjects: string[];
  facilitators: Record<string, StaffAssignment>;
  setFacilitators: React.Dispatch<React.SetStateAction<Record<string, StaffAssignment>>>;
  settings: GlobalSettings;
  isFacilitator?: boolean;
  activeFacilitator?: { name: string; subject: string } | null;
}

const FacilitatorPortal: React.FC<FacilitatorPortalProps> = ({ subjects, facilitators, setFacilitators, settings, isFacilitator, activeFacilitator }) => {
  const roles: StaffRole[] = ['FACILITATOR', 'INVIGILATOR', 'EXAMINER', 'SUPERVISOR', 'OFFICER'];
  const [showEnrollment, setShowEnrollment] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<StaffRole>('INVIGILATOR');
  const [newStaffTaughtSubject, setNewStaffTaughtSubject] = useState('');

  const emptySlots = (): InvigilationSlot[] => Array.from({ length: 9 }, () => ({
    dutyDate: '',
    timeSlot: '',
    subject: ''
  }));

  const updateStaff = (key: string, updates: Partial<StaffAssignment>) => {
    setFacilitators(prev => {
      const existing = prev[key] || {
        name: '',
        role: 'FACILITATOR',
        enrolledId: 'TBA',
        invigilations: emptySlots(),
        marking: { dateTaken: '', dateReturned: '', inProgress: false }
      };
      return {
        ...prev,
        [key]: { ...existing, ...updates }
      };
    });
  };

  const handleManualEnroll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim()) return;

    const isPrimarySubject = subjects.includes(newStaffTaughtSubject);
    const targetKey = isPrimarySubject ? newStaffTaughtSubject : `FLOAT_${Date.now()}`;
    
    const staffCount = Object.keys(facilitators).length;
    const newSubId = `FAC-${(staffCount + 1).toString().padStart(3, '0')}`;

    updateStaff(targetKey, { 
      name: newStaffName.toUpperCase(), 
      role: newStaffRole,
      enrolledId: newSubId,
      taughtSubject: newStaffTaughtSubject || 'N/A',
      invigilations: emptySlots()
    });
    
    setNewStaffName('');
    setNewStaffTaughtSubject('');
    setShowEnrollment(false);
  };

  const deleteStaff = (key: string) => {
    if (window.confirm("Remove this staff record from the hub?")) {
      setFacilitators(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const dutyRoster = useMemo(() => {
    const list: { staffName: string; staffId: string; role: string; date: string; time: string; subject: string }[] = [];
    Object.values(facilitators).forEach((staff: StaffAssignment) => {
      // If viewed by a facilitator, only include their own duties in the list calculation if needed,
      // but usually the roster is a global document. For now, we filter visibility elsewhere.
      staff.invigilations.forEach(slot => {
        if (slot.dutyDate && slot.subject) {
          list.push({
            staffName: staff.name,
            staffId: `${settings.schoolNumber}/${staff.enrolledId || 'TBA'}`,
            role: staff.role,
            date: slot.dutyDate,
            time: slot.timeSlot || 'TBA',
            subject: slot.subject
          });
        }
      });
    });
    return list.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.time.localeCompare(b.time);
    });
  }, [facilitators, settings.schoolNumber]);

  // Personalized Filtering Logic
  const visibleSubjects = isFacilitator && activeFacilitator 
    ? subjects.filter(s => s === activeFacilitator.subject)
    : subjects;

  const floatingStaffKeys = isFacilitator 
    ? [] 
    : Object.keys(facilitators).filter(key => !subjects.includes(key));

  const renderStaffCard = (key: string, isSubjectBound: boolean, index: number) => {
    const staff = facilitators[key] || { 
      name: '', 
      role: 'FACILITATOR', 
      enrolledId: 'TBA',
      invigilations: emptySlots(),
      marking: { dateTaken: '', dateReturned: '', inProgress: false }
    };
    const taughtSubject = isSubjectBound ? key : (staff.taughtSubject || 'N/A');
    const subjectContext = isSubjectBound ? key : "SUPPORT STAFF";
    
    const assignedCount = staff.invigilations.filter(s => s.subject !== '').length;
    const hasConflicts = staff.invigilations.some(s => s.subject === taughtSubject && staff.name.trim() !== '');

    const institutionalId = `${settings.schoolNumber}/${staff.enrolledId || 'TBA'}`;

    return (
      <div key={key} className={`bg-white border rounded-3xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 relative group/card ${hasConflicts ? 'border-red-500 ring-4 ring-red-100' : 'border-gray-100 hover:border-blue-200'}`}>
        <div className={`absolute top-0 left-0 w-8 h-8 flex items-center justify-center font-black text-[10px] rounded-br-2xl z-20 shadow-md ${hasConflicts ? 'bg-red-700 text-white' : isSubjectBound ? 'bg-blue-800 text-white' : 'bg-indigo-800 text-white'}`}>
           #{index + 1}
        </div>

        <div className={`px-6 py-4 pl-12 flex justify-between items-center transition-colors ${hasConflicts ? 'bg-red-600' : isSubjectBound ? 'bg-blue-900' : 'bg-indigo-900'}`}>
          <div className="flex flex-col">
            <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">{subjectContext}</h4>
            <span className="text-[8px] text-white/70 font-bold uppercase tracking-widest">{isSubjectBound ? 'Subject Specialist' : 'Administrative / Support'}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1 rounded-full text-[9px] font-black shadow-inner ${assignedCount > 0 ? 'bg-white text-blue-900' : 'bg-white/20 text-white'}`}>
              {assignedCount}/9 DUTIES
            </div>
            {!isSubjectBound && !isFacilitator && (
              <button onClick={() => deleteStaff(key)} className="text-white/40 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            )}
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex flex-col items-center bg-gray-50 py-3 rounded-2xl border border-dashed border-gray-200">
             <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Enrolled Institutional ID</span>
             <code className="text-sm font-mono font-black text-blue-900">{institutionalId}</code>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Legal Identity</label>
              <input 
                type="text" 
                value={staff.name} 
                onChange={(e) => updateStaff(key, { name: e.target.value.toUpperCase() })} 
                placeholder="ENTER NAME..."
                className="w-full border-b-2 border-gray-100 focus:border-blue-600 outline-none font-black text-blue-900 text-sm py-1 transition-all uppercase bg-transparent"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Hub Role</label>
              <select 
                value={staff.role} 
                onChange={(e) => updateStaff(key, { role: e.target.value as StaffRole })}
                className="w-full border-b-2 border-gray-100 focus:border-blue-600 outline-none font-black text-gray-700 text-xs py-1 transition-all uppercase bg-transparent"
              >
                {roles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-gray-50 pb-2">
              <h5 className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Invigilation Register (1-9)</h5>
              {hasConflicts && <span className="text-[8px] font-black text-red-600 animate-pulse">CONFLICT DETECTED</span>}
            </div>
            
            <div className="grid grid-cols-1 gap-3 max-h-[200px] overflow-y-auto pr-2 no-scrollbar">
              {staff.invigilations.map((slot, slotIdx) => {
                const isConflict = slot.subject === taughtSubject && staff.name.trim() !== '';
                return (
                  <div key={slotIdx} className={`p-3 rounded-2xl border transition-all flex flex-wrap gap-2 items-center ${isConflict ? 'bg-red-50 border-red-200 shadow-inner' : slot.subject ? 'bg-blue-50/30 border-blue-100' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
                    <span className="text-[8px] font-black text-gray-400 w-4">{slotIdx + 1}.</span>
                    <input 
                      type="date" 
                      value={slot.dutyDate}
                      onChange={(e) => {
                        const next = [...staff.invigilations];
                        next[slotIdx].dutyDate = e.target.value;
                        updateStaff(key, { invigilations: next });
                      }}
                      className="bg-white border border-gray-100 rounded-lg p-1.5 text-[9px] font-bold outline-none flex-1 min-w-[100px]"
                    />
                    <input 
                      type="text" 
                      placeholder="TIME"
                      value={slot.timeSlot}
                      onChange={(e) => {
                        const next = [...staff.invigilations];
                        next[slotIdx].timeSlot = e.target.value;
                        updateStaff(key, { invigilations: next });
                      }}
                      className="bg-white border border-gray-100 rounded-lg p-1.5 text-[9px] font-bold outline-none w-20"
                    />
                    <select 
                      value={slot.subject}
                      onChange={(e) => {
                        const next = [...staff.invigilations];
                        next[slotIdx].subject = e.target.value;
                        updateStaff(key, { invigilations: next });
                      }}
                      className={`flex-1 min-w-[120px] bg-white border rounded-lg p-1.5 text-[9px] font-bold outline-none ${isConflict ? 'border-red-400 text-red-700' : 'border-gray-100'}`}
                    >
                      <option value="">SELECT SUBJECT...</option>
                      {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Printable Duty Roster Modal Overlay */}
      {showPrintPreview && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] overflow-y-auto p-4 md:p-10 flex justify-center">
           <div className="bg-white w-full max-w-[210mm] min-h-[297mm] p-12 shadow-2xl relative animate-in zoom-in-95 duration-300 flex flex-col">
              <button onClick={() => setShowPrintPreview(false)} className="no-print absolute top-6 -right-16 bg-white text-black w-10 h-10 rounded-full flex items-center justify-center shadow-2xl font-black">✕</button>
              
              <div className="text-center border-b-4 border-blue-900 pb-6 mb-8">
                 {settings.schoolLogo && <img src={settings.schoolLogo} alt="Logo" className="w-20 h-20 mx-auto mb-4 object-contain" />}
                 <h1 className="text-3xl font-black uppercase text-blue-900 tracking-tighter">{settings.schoolName}</h1>
                 <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{settings.schoolAddress}</p>
                 <div className="mt-4 bg-red-50 py-2 border-y border-red-100">
                    <h2 className="text-lg font-black text-red-700 uppercase">{settings.examTitle}</h2>
                    <p className="text-[9px] font-black text-red-900 tracking-[0.4em] uppercase">OFFICIAL MOCK DUTY ROSTER (TIME-PERSON LIST)</p>
                 </div>
                 <div className="flex justify-between items-center mt-4 text-[10px] font-black uppercase">
                    <span>Academy Hub ID: {settings.schoolNumber}</span>
                    <span>Series: {settings.activeMock}</span>
                    <span>AY: {settings.academicYear}</span>
                 </div>
              </div>

              <div className="flex-1">
                 <table className="w-full border-collapse text-[10px]">
                    <thead>
                       <tr className="bg-blue-900 text-white uppercase text-[7px] tracking-widest">
                          <th className="p-2.5 border border-blue-800 text-left">Exam Date</th>
                          <th className="p-2.5 border border-blue-800 text-center">Time</th>
                          <th className="p-2.5 border border-blue-800 text-left">Subject Area</th>
                          <th className="p-2.5 border border-blue-800 text-left">Institutional Staff ID</th>
                          <th className="p-2.5 border border-blue-800 text-left">Name</th>
                          <th className="p-2.5 border border-blue-800 text-center">Role</th>
                       </tr>
                    </thead>
                    <tbody>
                       {dutyRoster.map((duty, idx) => (
                          <tr key={idx} className="even:bg-gray-50 border-b border-gray-100 font-bold">
                             <td className="p-2.5 uppercase">{new Date(duty.date).toLocaleDateString(undefined, { weekday: 'short', day: '2-digit', month: 'short' })}</td>
                             <td className="p-2.5 text-center text-blue-700 font-mono">{duty.time}</td>
                             <td className="p-2.5 uppercase text-gray-900">{duty.subject}</td>
                             <td className="p-2.5 font-mono text-[9px] text-blue-600">{duty.staffId}</td>
                             <td className="p-2.5 uppercase text-blue-900 font-black">{duty.staffName}</td>
                             <td className="p-2.5 text-center"><span className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded-full text-[7px]">{duty.role}</span></td>
                          </tr>
                       ))}
                       {dutyRoster.length === 0 && (
                          <tr><td colSpan={6} className="p-20 text-center text-gray-400 uppercase font-black italic">No duty assignments have been synchronized in this series yet.</td></tr>
                       )}
                    </tbody>
                 </table>
              </div>

              <div className="mt-12 pt-8 border-t-2 border-gray-200 grid grid-cols-2 gap-20">
                 <div className="text-center space-y-1">
                    <div className="border-t border-black pt-1 font-black uppercase text-[9px]">Examination Officer Signature</div>
                    <p className="text-[7px] text-gray-400 italic">Verified for deployment</p>
                 </div>
                 <div className="text-center space-y-1">
                    <div className="border-t border-black pt-1 font-black uppercase text-[9px]">Institutional Director Approval</div>
                    <p className="text-[7px] text-gray-400 italic">Academy Seal Required</p>
                 </div>
              </div>

              <div className="no-print mt-12 flex justify-center">
                 <button onClick={() => window.print()} className="bg-blue-900 text-white px-12 py-4 rounded-2xl font-black uppercase tracking-widest shadow-2xl hover:scale-105 transition-all">Print Master Copy</button>
              </div>
           </div>
        </div>
      )}
      
      {/* Enrollment Command Center - Visible only to Admins */}
      <section className="bg-white rounded-3xl border border-gray-200 p-8 shadow-2xl overflow-hidden relative group">
         <div className="absolute top-0 right-0 w-48 h-48 bg-blue-50 rounded-bl-full -mr-24 -mt-24 opacity-50 group-hover:scale-110 transition-transform duration-700"></div>
         <div className="relative flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="space-y-1 text-center md:text-left">
               <h3 className="text-[11px] font-black text-blue-900 uppercase tracking-[0.4em]">Academy HR Command</h3>
               <p className="text-2xl font-black text-gray-800 uppercase tracking-tight">Staff Deployment Hub</p>
               <p className="text-[10px] text-gray-400 font-bold uppercase italic">Manage unique institutional identities and logistics.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
               {!isFacilitator && (
                 <>
                   <button 
                     onClick={() => setShowPrintPreview(true)}
                     className="flex items-center gap-2 bg-indigo-900 hover:bg-black text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase shadow-xl transition-all active:scale-95"
                   >
                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                     Generate Master Roster
                   </button>
                   <button 
                     onClick={() => setShowEnrollment(!showEnrollment)}
                     className="flex items-center gap-2 bg-blue-900 hover:bg-black text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase shadow-xl transition-all active:scale-95"
                   >
                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                     Add New Staff
                   </button>
                 </>
               )}
               {isFacilitator && (
                 <div className="bg-blue-50 text-blue-900 px-6 py-4 rounded-2xl font-black text-[10px] uppercase border border-blue-100 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                    Facilitator Identity Verified
                 </div>
               )}
            </div>
         </div>

         {showEnrollment && !isFacilitator && (
           <form onSubmit={handleManualEnroll} className="mt-8 pt-8 border-t border-gray-100 animate-in slide-in-from-top-4 grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                 <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Full Name</label>
                 <input 
                   type="text" 
                   placeholder="ENTER NAME..." 
                   value={newStaffName}
                   onChange={(e) => setNewStaffName(e.target.value)}
                   className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/10 uppercase"
                 />
              </div>
              <div className="space-y-2">
                 <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Core Role</label>
                 <select 
                   value={newStaffRole}
                   onChange={(e) => setNewStaffRole(e.target.value as StaffRole)}
                   className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-xs font-bold outline-none"
                 >
                   {roles.map(r => <option key={r} value={r}>{r}</option>)}
                 </select>
              </div>
              <div className="space-y-2">
                 <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Subject Specialist</label>
                 <select 
                   value={newStaffTaughtSubject}
                   onChange={(e) => setNewStaffTaughtSubject(e.target.value)}
                   className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-xs font-bold outline-none"
                 >
                   <option value="">N/A (ADMIN/SUPPORT)</option>
                   {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                 </select>
              </div>
              <div className="flex items-end">
                 <button type="submit" className="w-full bg-yellow-500 text-blue-900 font-black text-[10px] uppercase h-[52px] rounded-2xl shadow-lg hover:bg-yellow-600 transition-all active:scale-95">Enroll Staff</button>
              </div>
           </form>
         )}
      </section>

      {/* Staff Grid - Filtered based on role */}
      <div className="space-y-12">
         <div className="space-y-6">
            <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-3">
               <div className="w-3 h-3 bg-blue-600 rounded-full shadow-lg shadow-blue-200"></div>
               Specialist Facilitator Cadre
            </h4>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               {visibleSubjects.map((sub, idx) => renderStaffCard(sub, true, idx))}
            </div>
         </div>

         {floatingStaffKeys.length > 0 && !isFacilitator && (
           <div className="space-y-6">
              <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-3">
                 <div className="w-3 h-3 bg-indigo-600 rounded-full shadow-lg shadow-indigo-200"></div>
                 Administrative & Support Index
              </h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 {floatingStaffKeys.map((key, idx) => renderStaffCard(key, false, idx))}
              </div>
           </div>
         )}
      </div>

    </div>
  );
};

export default FacilitatorPortal;
