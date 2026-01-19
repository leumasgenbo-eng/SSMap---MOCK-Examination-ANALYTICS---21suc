
import React from 'react';
import { SchoolRegistryEntry, VerificationEntry } from '../../types';

interface AuditLogViewProps {
  registry: SchoolRegistryEntry[];
  selectedAuditId: string | null;
  setSelectedAuditId: (id: string | null) => void;
  onRemoteView: (schoolId: string) => void;
}

const AuditLogView: React.FC<AuditLogViewProps> = ({ registry, selectedAuditId, setSelectedAuditId, onRemoteView }) => {
  const auditSchool = registry.find(r => r.id === selectedAuditId);

  return (
    <div className="animate-in slide-in-from-left-8 duration-500">
      <div className="p-8 border-b border-slate-800 bg-slate-900/50 flex flex-wrap gap-4 items-center">
        <h2 className="text-xl font-black uppercase text-white mr-8">Network Audit Trail</h2>
        <select 
          value={selectedAuditId || ''} 
          onChange={(e) => setSelectedAuditId(e.target.value || null)}
          className="bg-slate-950 text-white font-black py-3 px-6 rounded-xl border border-slate-800 text-[10px] uppercase outline-none focus:ring-4 focus:ring-blue-500/20"
        >
          <option value="">SELECT HUB FOR AUDIT...</option>
          {registry.map(s => <option key={s.id} value={s.id}>{s.name} ({s.id})</option>)}
        </select>
        {selectedAuditId && (
          <button 
            onClick={() => onRemoteView(selectedAuditId)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-xl text-[9px] font-black uppercase transition-all"
          >
            Launch Command View
          </button>
        )}
      </div>
      <div className="p-8">
        {auditSchool ? (
          <div className="space-y-12">
            {/* Fix: Explicitly cast Object.entries result to resolve 'map' on unknown 'logs' */}
            {(Object.entries(auditSchool.verificationLogs || {}) as [string, VerificationEntry[]][]).map(([series, logs]) => (
              <div key={series} className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-0.5 flex-1 bg-slate-800"></div>
                  <h3 className="text-xs font-black text-blue-400 uppercase tracking-[0.4em]">{series} INTEGRITY LOG</h3>
                  <div className="h-0.5 flex-1 bg-slate-800"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {logs.map((log, li) => (
                    <div key={li} className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <p className="text-xs font-black text-white uppercase">{log.subject}</p>
                          <p className="text-[10px] font-black text-slate-500">Verified by: <span className="text-blue-400 uppercase">{log.verifiedBy}</span></p>
                        </div>
                        <span className="text-[8px] font-black bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20 uppercase">{log.status}</span>
                      </div>
                      <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800/50">
                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-3">Confirmation Indices:</p>
                        <div className="flex flex-wrap gap-2">
                          {/* Fix: Directly use confirmedScripts as logs is now correctly typed as VerificationEntry[] */}
                          {log.confirmedScripts.map((name, ni) => (
                            <span key={ni} className="bg-slate-900 text-blue-300 px-3 py-1 rounded-lg text-[9px] font-bold border border-slate-800 uppercase italic truncate max-w-[150px]">{name}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {(!auditSchool.verificationLogs || Object.keys(auditSchool.verificationLogs).length === 0) && (
              <div className="py-32 text-center">
                <p className="text-slate-600 font-black uppercase text-sm tracking-[0.5em]">No synchronization logs found for this hub</p>
              </div>
            )}
          </div>
        ) : (
          <div className="py-40 text-center flex flex-col items-center gap-6 opacity-30">
            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            </div>
            <p className="text-white font-black uppercase text-xs tracking-widest">Awaiting Institutional Target Selection</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogView;
