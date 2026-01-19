
import React, { useState, useMemo } from 'react';
import { SchoolRegistryEntry } from '../../types';

interface NetworkRewardsViewProps {
  registry: SchoolRegistryEntry[];
}

const NetworkRewardsView: React.FC<NetworkRewardsViewProps> = ({ registry }) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  
  const rewardLogs = useMemo(() => {
    return registry.map(school => {
      const data = school.fullData;
      if (!data) return null;
      
      const students = data.students;
      const subjects = Object.keys(data.facilitators);
      const activeMock = data.settings.activeMock;

      // Extract top metrics per school
      const topPupil = students.map(s => {
          const hist = s.seriesHistory?.[activeMock];
          return { name: s.name, agg: hist?.aggregate || 36 };
      }).sort((a,b) => a.agg - b.agg)[0];

      // Calculate avg TEI for school's facilitators
      // (Simplified proxy since we don't have the full series history calculation available directly in registry)
      const mockHist = school.performanceHistory?.[school.performanceHistory.length-1];
      const schoolTEI = mockHist ? (mockHist.avgComposite / (mockHist.avgAggregate || 1)) * 5 : 0;

      return {
        id: school.id,
        name: school.name,
        tei: schoolTEI,
        topPupil: topPupil?.name || 'N/A',
        topAgg: topPupil?.agg || 'N/A',
        studentCount: school.studentCount,
        status: school.status
      };
    }).filter(x => x !== null);
  }, [registry]);

  return (
    <div className="p-10 space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-black uppercase text-white tracking-tight">Institutional Reward Ledger</h2>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Network-Wide Excellence Rerating</p>
        </div>
        <select 
           value={selectedYear} 
           onChange={(e) => setSelectedYear(e.target.value)}
           className="bg-slate-950 text-white font-black py-4 px-8 rounded-2xl border border-slate-800 text-xs uppercase"
        >
          {['2024', '2025', '2026'].map(y => <option key={y} value={y}>{y} Academic Year</option>)}
        </select>
      </div>

      <div className="overflow-x-auto border border-slate-800 rounded-[2.5rem]">
        <table className="w-full text-left">
          <thead className="bg-slate-950 text-slate-500 uppercase text-[8px] font-black tracking-widest">
            <tr>
              <th className="px-10 py-6">Institution Node</th>
              <th className="px-6 py-6 text-center">Efficiency (TEI)</th>
              <th className="px-6 py-6 text-center">Elite Scholar</th>
              <th className="px-6 py-6 text-center">BSA Aggregate</th>
              <th className="px-6 py-6 text-center">Census</th>
              <th className="px-10 py-6 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {rewardLogs.map((log) => (
              <tr key={log?.id} className="hover:bg-slate-800/50 transition-colors">
                <td className="px-10 py-6">
                   <div className="flex flex-col">
                      <span className="font-black text-white uppercase">{log?.name}</span>
                      <span className="text-[9px] font-mono text-blue-500 uppercase tracking-tighter">{log?.id}</span>
                   </div>
                </td>
                <td className="px-6 py-6 text-center">
                   <span className="text-lg font-black text-emerald-400 font-mono">{log?.tei.toFixed(2)}</span>
                </td>
                <td className="px-6 py-6 text-center font-black text-slate-300 uppercase text-xs">
                   {log?.topPupil}
                </td>
                <td className="px-6 py-6 text-center">
                   <span className={`px-4 py-1 rounded-lg font-black text-xs ${Number(log?.topAgg) <= 10 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>
                      {log?.topAgg}
                   </span>
                </td>
                <td className="px-6 py-6 text-center font-black text-slate-500">{log?.studentCount}</td>
                <td className="px-10 py-6 text-right">
                   <span className={`text-[8px] font-black uppercase px-3 py-1 rounded-full ${log?.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {log?.status}
                   </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="bg-slate-950 p-10 rounded-[3rem] border border-slate-800 text-center">
         <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.5em] leading-relaxed">
            Excellence metrics are aggregated annually to determine instructional standard persistence across the network.
         </p>
      </div>
    </div>
  );
};

export default NetworkRewardsView;
