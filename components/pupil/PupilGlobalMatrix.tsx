
import React, { useState, useMemo } from 'react';
import { SchoolRegistryEntry, ProcessedStudent, ExamSubScore } from '../../types';

interface PupilGlobalMatrixProps {
  registry: SchoolRegistryEntry[];
  student: ProcessedStudent;
}

type SortKey = 'avgScore' | 'best6Avg' | 'avgGrade' | 'best6Agg' | 'avgObj' | 'avgThy';

interface GlobalPupilRow {
  studentName: string;
  studentId: number;
  schoolName: string;
  schoolId: string;
  avgScore: number;
  best6Avg: number;
  avgGrade: number;
  best6Agg: number;
  avgObj: number;
  avgThy: number;
  isMe: boolean;
}

const PupilGlobalMatrix: React.FC<PupilGlobalMatrixProps> = ({ registry, student }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('best6Agg');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterMode, setFilterMode] = useState<'all' | 'top50' | 'nearMe'>('all');

  const rankingData: GlobalPupilRow[] = useMemo(() => {
    const list: GlobalPupilRow[] = [];

    registry.forEach(school => {
      if (!school.fullData?.students) return;
      const schoolSettings = school.fullData.settings;
      const activeMock = schoolSettings.activeMock;

      school.fullData.students.forEach(s => {
        const mockSet = s.mockData?.[activeMock];
        if (!mockSet) return;

        // Fix: Explicitly cast to prevent 'unknown' arithmetic errors
        const scores = Object.values(mockSet.scores || {}) as number[];
        const subScores = Object.values(mockSet.examSubScores || {}) as ExamSubScore[];
        
        const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
        const best6Avg = [...scores].sort((a, b) => b - a).slice(0, 6).reduce((a, b) => a + b, 0) / 6;
        const avgObj = subScores.length > 0 ? subScores.reduce((a, b) => a + (b.sectionA || 0), 0) / subScores.length : 0;
        const avgThy = subScores.length > 0 ? subScores.reduce((a, b) => a + (b.sectionB || 0), 0) / subScores.length : 0;

        const committed = s.seriesHistory?.[activeMock];
        const best6Agg = committed?.aggregate || 36;
        const avgGrade = (best6Agg + 24) / 10;

        list.push({
          studentName: s.name,
          studentId: s.id,
          schoolName: school.name,
          schoolId: school.id,
          avgScore,
          best6Avg,
          avgGrade,
          best6Agg,
          avgObj,
          avgThy,
          isMe: s.id === student.id && school.name === student.name // Approximate check if not globally unique ID
        });
      });
    });

    return list;
  }, [registry, student.id, student.name]);

  const processedData = useMemo(() => {
    let sorted = [...rankingData].sort((a, b) => {
      const isBetterLower = sortKey === 'best6Agg' || sortKey === 'avgGrade';
      let valA = a[sortKey];
      let valB = b[sortKey];
      if (sortOrder === 'asc') return valA - valB;
      return valB - valA;
    });

    if (searchTerm) {
      sorted = sorted.filter(p => p.studentName.toLowerCase().includes(searchTerm.toLowerCase()) || p.schoolName.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    if (filterMode === 'top50') {
      return sorted.slice(0, 50);
    } else if (filterMode === 'nearMe') {
      const myIdx = sorted.findIndex(p => p.isMe);
      if (myIdx === -1) return sorted;
      return sorted.slice(Math.max(0, myIdx - 10), Math.min(sorted.length, myIdx + 11));
    }

    return sorted;
  }, [rankingData, searchTerm, sortKey, sortOrder, filterMode]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else {
      setSortKey(key);
      setSortOrder(key === 'best6Agg' || key === 'avgGrade' ? 'asc' : 'desc');
    }
  };

  const ColumnHeader = ({ label, k }: { label: string, k: SortKey }) => (
    <th 
      onClick={() => handleSort(k)} 
      className={`px-4 py-5 cursor-pointer hover:bg-gray-50 transition-colors group ${sortKey === k ? 'bg-blue-50/50' : ''}`}
    >
      <div className="flex flex-col items-center">
         <span className="text-[7px] text-gray-400 uppercase tracking-widest block mb-1">{label}</span>
         <div className="flex items-center gap-1">
            <span className={`text-[10px] font-black uppercase tracking-tighter ${sortKey === k ? 'text-blue-900' : 'text-gray-500'}`}>
               {k === 'best6Agg' ? 'Aggregate' : k === 'avgScore' ? 'Mean Score' : k === 'best6Avg' ? 'Core Mean' : k === 'avgGrade' ? 'Mean Grade' : k === 'avgObj' ? 'Obj' : 'Theory'}
            </span>
            <div className={`flex flex-col text-[8px] transition-opacity ${sortKey === k ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
               <span className={sortKey === k && sortOrder === 'asc' ? 'text-blue-600' : ''}>▲</span>
               <span className={sortKey === k && sortOrder === 'desc' ? 'text-blue-600' : ''}>▼</span>
            </div>
         </div>
      </div>
    </th>
  );

  return (
    <div className="bg-white rounded-[3rem] shadow-xl border border-gray-100 overflow-hidden flex flex-col min-h-[700px]">
      <div className="p-8 border-b border-gray-100 bg-gray-50/50 flex flex-col lg:flex-row justify-between items-center gap-8">
        <div className="space-y-2">
           <h3 className="text-2xl font-black uppercase text-slate-900 tracking-tight flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              Global Talent Matrix
           </h3>
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Network-Wide Performance Ranking Index</p>
        </div>

        <div className="flex flex-wrap gap-4 w-full lg:w-auto">
           <div className="flex bg-gray-200 p-1 rounded-2xl border border-gray-200 shadow-inner">
              {[
                { id: 'all', label: 'All Candidates' },
                { id: 'top50', label: 'Top 50 Elite' },
                { id: 'nearMe', label: 'Relative Position' }
              ].map(f => (
                <button 
                  key={f.id} 
                  onClick={() => setFilterMode(f.id as any)}
                  className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all whitespace-nowrap ${filterMode === f.id ? 'bg-blue-900 text-white shadow-lg' : 'text-gray-500 hover:text-blue-900'}`}
                >
                  {f.label}
                </button>
              ))}
           </div>
           <div className="relative flex-1 lg:w-72">
              <input 
                type="text" 
                placeholder="Find a candidate..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="w-full bg-white border border-gray-200 rounded-2xl pl-10 pr-6 py-3.5 text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
              />
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
           </div>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-auto max-h-[600px] custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50/80 backdrop-blur-sm sticky top-0 z-20 shadow-sm border-b border-gray-100">
            <tr>
              <th className="px-8 py-5 text-[8px] font-black text-gray-400 uppercase tracking-widest w-16">Rank</th>
              <th className="px-8 py-5 text-[8px] font-black text-gray-400 uppercase tracking-widest">Candidate profile</th>
              <ColumnHeader label="Efficiency" k="avgScore" />
              <ColumnHeader label="Core Mastery" k="best6Avg" />
              <ColumnHeader label="Distribution" k="avgGrade" />
              <ColumnHeader label="Network Cap" k="best6Agg" />
              <ColumnHeader label="Objective" k="avgObj" />
              <ColumnHeader label="Theory" k="avgThy" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {processedData.map((p, i) => (
              <tr key={`${p.schoolId}-${p.studentId}`} className={`hover:bg-blue-50/20 transition-colors group ${p.isMe ? 'bg-blue-50 ring-2 ring-inset ring-blue-500/20' : ''}`}>
                <td className="px-8 py-5">
                   <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-black text-[10px] ${i < 3 ? 'bg-yellow-500 text-white shadow-lg' : p.isMe ? 'bg-blue-900 text-white' : 'bg-gray-100 text-gray-400'}`}>
                      {i + 1}
                   </div>
                </td>
                <td className="px-8 py-5">
                   <div className="space-y-1">
                      <p className={`text-sm font-black uppercase leading-none ${p.isMe ? 'text-blue-900' : 'text-gray-800'}`}>
                        {p.studentName} {p.isMe && <span className="ml-2 bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[7px]">YOU</span>}
                      </p>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest truncate max-w-[150px]">{p.schoolName}</p>
                   </div>
                </td>
                <td className="px-4 py-5 text-center font-mono font-black text-blue-700">{p.avgScore.toFixed(1)}%</td>
                <td className="px-4 py-5 text-center font-mono font-black text-indigo-700">{p.best6Avg.toFixed(1)}%</td>
                <td className="px-4 py-5 text-center font-mono font-black text-amber-600">{p.avgGrade.toFixed(2)}</td>
                <td className="px-4 py-5 text-center">
                   <span className={`px-4 py-1 rounded-full font-mono font-black text-base ${p.best6Agg <= 10 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : p.best6Agg <= 20 ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-gray-50 text-gray-400 border border-gray-100'}`}>
                      {p.best6Agg}
                   </span>
                </td>
                <td className="px-4 py-5 text-center font-mono font-bold text-gray-400">{p.avgObj.toFixed(1)}</td>
                <td className="px-4 py-5 text-center font-mono font-bold text-gray-400">{p.avgThy.toFixed(1)}</td>
              </tr>
            ))}
            {processedData.length === 0 && (
              <tr>
                <td colSpan={8} className="py-40 text-center opacity-30">
                   <div className="flex flex-col items-center gap-4">
                      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                      <p className="font-black uppercase text-xs tracking-[0.4em] text-gray-500">Global candidates not yet synchronized</p>
                   </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="p-8 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center text-[11px] font-black uppercase text-gray-400 tracking-widest italic">
         <span>Matrix synchronized with SS-Map Network Registry</span>
         <span className="text-blue-900">{rankingData.length} Evaluated Population</span>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}} />
    </div>
  );
};

export default PupilGlobalMatrix;
