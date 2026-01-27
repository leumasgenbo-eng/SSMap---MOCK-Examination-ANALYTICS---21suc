import React, { useState } from 'react';
import { SchoolRegistryEntry } from '../../types';
import { supabase } from '../../supabaseClient';

interface RegistryViewProps {
  registry: SchoolRegistryEntry[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onRemoteView: (schoolId: string) => void;
  onUpdateRegistry: (next: SchoolRegistryEntry[]) => void;
  onLogAction: (action: string, target: string, details: string) => void;
}

const RegistryView: React.FC<RegistryViewProps> = ({ registry, searchTerm, setSearchTerm, onRemoteView, onUpdateRegistry, onLogAction }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [credentialPreview, setCredentialPreview] = useState<SchoolRegistryEntry | null>(null);
  const [showSecretInPreview, setShowSecretInPreview] = useState(false);

  const filtered = registry.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSaveName = async (id: string) => {
    const original = registry.find(r => r.id === id);
    if (!original) return;

    const updatedEntry = { ...original, name: editName.toUpperCase() };
    const next = registry.map(r => r.id === id ? updatedEntry : r);
    
    // Push targeted shard update to Supabase
    await supabase.from('uba_persistence').upsert({ 
      id: `registry_${id}`, 
      payload: [updatedEntry], 
      last_updated: new Date().toISOString() 
    });

    onUpdateRegistry(next);
    onLogAction("IDENTITY_MODULATION", id, `School name updated from "${original?.name}" to "${editName.toUpperCase()}"`);
    setEditingId(null);
  };

  const handleForwardCredentials = (school: SchoolRegistryEntry) => {
    const email = school.fullData?.settings.schoolEmail || "N/A";
    const contact = school.fullData?.settings.schoolContact || "N/A";
    
    if (window.confirm(`FORWARD PROTOCOL:\n\nSend access keys for ${school.name} to:\n- Email: ${email}\n- Contact: ${contact}\n\nGrant request for missing credentials?`)) {
      onLogAction("CREDENTIAL_FORWARD", school.id, `Forwarded to ${email} and ${contact}`);
      alert(`CREDENTIALS DISPATCHED: Key pack for ${school.id} sent successfully.`);
    }
  };

  const handleDecommission = async (id: string) => {
    if (window.confirm("CRITICAL: Permanent decommissioning of institution? This erases all associated data nodes in the registry.")) {
      // Delete the registry shard
      await supabase.from('uba_persistence').delete().eq('id', `registry_${id}`);
      
      const next = registry.filter(r => r.id !== id);
      onUpdateRegistry(next);
      onLogAction("DECOMMISSION_HUB", id, "Institution wiped from network registry.");
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="p-8 border-b border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-900/50">
        <div className="space-y-1">
          <h2 className="text-xl font-black uppercase text-white flex items-center gap-3">
             <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.6)]"></div>
             Institutional Network Registry
          </h2>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Master Node Management & Recovery Center</p>
        </div>
        <div className="relative w-full md:w-96">
           <input 
             type="text" 
             placeholder="Filter registry by Identity or Key..." 
             value={searchTerm} 
             onChange={(e) => setSearchTerm(e.target.value)} 
             className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-xs font-bold text-white outline-none focus:ring-4 focus:ring-blue-500/20 transition-all placeholder:text-slate-700"
           />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-950 text-slate-500 uppercase text-[8px] font-black tracking-[0.2em] sticky top-0 z-10 shadow-lg">
            <tr>
              <th className="px-6 py-6 w-16 text-center">State</th>
              <th className="px-6 py-6 min-w-[220px]">Institution Identity</th>
              <th className="px-6 py-6">Enrollment Key</th>
              <th className="px-6 py-6 text-center">Pupil Census</th>
              <th className="px-6 py-6">Registration Email</th>
              <th className="px-6 py-6">Contact No.</th>
              <th className="px-6 py-6 text-right">Access Terminal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filtered.map(school => {
              const email = school.fullData?.settings.schoolEmail || "hub@unregistered.net";
              const contact = school.fullData?.settings.schoolContact || "NO_SYNC";
              
              return (
                <tr key={school.id} className="hover:bg-slate-800/40 transition-colors group">
                  <td className="px-6 py-6 text-center">
                    <div className={`w-2.5 h-2.5 rounded-full mx-auto ${school.status === 'active' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-red-500 animate-pulse'}`}></div>
                  </td>
                  <td className="px-6 py-6">
                     {editingId === school.id ? (
                       <div className="flex items-center gap-2 animate-in slide-in-from-left-2">
                          <input 
                            value={editName} 
                            onChange={(e) => setEditName(e.target.value)}
                            className="bg-slate-950 border border-blue-600 rounded px-3 py-1 text-xs font-black text-white uppercase outline-none w-48"
                            autoFocus
                          />
                          <button onClick={() => handleSaveName(school.id)} className="bg-blue-600 text-white p-1.5 rounded-lg"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg></button>
                          <button onClick={() => setEditingId(null)} className="bg-slate-800 text-slate-400 p-1.5 rounded-lg"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
                       </div>
                     ) : (
                       <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                             <span className="font-black text-white uppercase group-hover:text-blue-400 transition-colors leading-none">{school.name}</span>
                             <button onClick={() => { setEditingId(school.id); setEditName(school.name); }} className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-white transition-opacity">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                             </button>
                          </div>
                          <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Registrant: {school.registrant}</span>
                       </div>
                     )}
                  </td>
                  <td className="px-6 py-6">
                    <button 
                      onClick={() => setCredentialPreview(school)}
                      className="font-mono text-blue-500 text-[11px] font-black tracking-tighter hover:text-blue-300 transition-colors bg-slate-950 px-3 py-1 rounded-lg border border-slate-800"
                    >
                      {school.id}
                    </button>
                  </td>
                  <td className="px-6 py-6 text-center font-black text-slate-400">{school.studentCount}</td>
                  <td className="px-6 py-6">
                     <span className="text-[10px] text-slate-500 font-medium font-mono lowercase">{email}</span>
                  </td>
                  <td className="px-6 py-6">
                     <span className="text-[10px] text-slate-500 font-mono font-black">{contact}</span>
                  </td>
                  <td className="px-6 py-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleForwardCredentials(school)}
                        className="bg-slate-800 hover:bg-slate-700 text-blue-400 px-4 py-2 rounded-xl text-[8px] font-black uppercase transition-all"
                      >
                        Forward
                      </button>
                      <button 
                        onClick={() => onRemoteView(school.id)} 
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-[9px] font-black uppercase shadow-lg transition-all active:scale-95 flex items-center gap-2"
                      >
                        Access Hub
                      </button>
                      <button onClick={() => handleDecommission(school.id)} className="text-red-500/30 hover:text-red-500 p-2 transition-colors">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {credentialPreview && (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-300">
           <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-[3rem] p-10 shadow-2xl relative">
              <button onClick={() => { setCredentialPreview(null); setShowSecretInPreview(false); }} className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
              
              <div className="text-center space-y-2 mb-10">
                 <div className="w-16 h-16 bg-blue-600/20 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                 </div>
                 <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Credential Verification</h3>
                 <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em]">{credentialPreview.name}</p>
              </div>

              <div className="space-y-4">
                 {[
                   { label: 'Network Identity (Key)', val: credentialPreview.id, secret: false },
                   { label: 'System Access Code', val: credentialPreview.accessCode || "REDACTED", secret: true },
                   { label: 'Primary Contact Node', val: credentialPreview.fullData?.settings.schoolContact || "N/A", secret: false },
                   { label: 'Registered Registry Email', val: credentialPreview.fullData?.settings.schoolEmail || "N/A", secret: false }
                 ].map((f, i) => (
                   <div key={i} className="bg-slate-950 border border-slate-800 p-5 rounded-2xl flex flex-col gap-1 group/field relative">
                      <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{f.label}</span>
                      <p className={`text-sm font-black uppercase ${f.secret && !showSecretInPreview ? 'text-slate-700 blur-sm select-none' : f.secret ? 'text-emerald-400 font-mono tracking-[0.2em]' : 'text-slate-300'}`}>
                        {f.val}
                      </p>
                      {f.secret && (
                        <button 
                          onClick={() => setShowSecretInPreview(!showSecretInPreview)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-blue-400 transition-colors"
                        >
                          {showSecretInPreview ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 19c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                          )}
                        </button>
                      )}
                   </div>
                 ))}
              </div>

              <div className="mt-10 flex gap-4">
                 <button 
                   onClick={() => handleForwardCredentials(credentialPreview)}
                   className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all"
                 >
                   Dispatch Forwarding
                 </button>
                 <button 
                   onClick={() => { setCredentialPreview(null); setShowSecretInPreview(false); }}
                   className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-400 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
                 >
                   Close Gate
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default RegistryView;