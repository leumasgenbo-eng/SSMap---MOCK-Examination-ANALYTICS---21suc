
import React from 'react';
import { SchoolRegistryEntry } from '../../types';

interface RegistryViewProps {
  registry: SchoolRegistryEntry[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onRemoteView: (schoolId: string) => void;
}

const RegistryView: React.FC<RegistryViewProps> = ({ registry, searchTerm, setSearchTerm, onRemoteView }) => {
  const filtered = registry.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="p-8 border-b border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-900/50">
        <div className="space-y-1">
          <h2 className="text-xl font-black uppercase text-white flex items-center gap-3">
             <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
             Network Ledger
          </h2>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Institutional Deployments</p>
        </div>
        <div className="relative w-full md:w-96">
           <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
           </div>
           <input 
             type="text" 
             placeholder="Filter network nodes..." 
             value={searchTerm} 
             onChange={(e) => setSearchTerm(e.target.value)} 
             className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-6 py-4 text-xs font-bold text-white outline-none focus:ring-4 focus:ring-blue-500/20 transition-all"
           />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-950 text-slate-500 uppercase text-[9px] font-black tracking-[0.3em]">
            <tr>
              <th className="px-8 py-6">State</th>
              <th className="px-8 py-6">Institution Identity</th>
              <th className="px-8 py-6">Enrollment Key</th>
              <th className="px-8 py-6 text-center">Pupil Census</th>
              <th className="px-8 py-6 text-right">Access Terminal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filtered.map(school => (
              <tr key={school.id} className="hover:bg-slate-800/40 transition-colors group">
                <td className="px-8 py-6">
                  <div className={`w-3 h-3 rounded-full border-2 ${school.status === 'active' ? 'bg-emerald-500/20 border-emerald-500' : 'bg-red-500/20 border-red-500'}`} title={school.status}></div>
                </td>
                <td className="px-8 py-6">
                   <div className="flex flex-col">
                      <span className="font-black text-white uppercase group-hover:text-blue-400 transition-colors">{school.name}</span>
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1">Registrant: {school.registrant}</span>
                   </div>
                </td>
                <td className="px-8 py-6 font-mono text-blue-500 text-xs font-black tracking-tighter">{school.id}</td>
                <td className="px-8 py-6 text-center font-black text-lg text-slate-300">{school.studentCount}</td>
                <td className="px-8 py-6 text-right">
                  <button 
                    onClick={() => onRemoteView(school.id)} 
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl text-[9px] font-black uppercase shadow-lg shadow-indigo-900/20 transition-all active:scale-95 flex items-center gap-2 ml-auto"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"></path><path d="M10 14L21 3"></path><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path></svg>
                    Access Hub
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="py-32 text-center">
                   <div className="flex flex-col items-center gap-4 opacity-20">
                      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                      <p className="text-white font-black uppercase text-sm tracking-[0.5em]">No matching institutions</p>
                   </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RegistryView;
