import React from 'react';
import { StudentData, GlobalSettings, MockSeriesRecord } from '../../types';
import EditableField from '../shared/EditableField';

interface SeriesBroadSheetProps {
  students: StudentData[];
  settings: GlobalSettings;
  onSettingChange: (key: keyof GlobalSettings, value: any) => void;
  currentProcessed: { id: number; aggregate: number; rank: number; totalScore: number; category: string }[];
}

const SeriesBroadSheet: React.FC<SeriesBroadSheetProps> = ({ students, settings, onSettingChange, currentProcessed }) => {
  const mockSeriesNames = settings.committedMocks || [];
  const subjectCount = 10;

  const getAggGrade = (agg: number) => {
    if (agg <= 10) return { label: 'EXC', color: 'text-emerald-600', weight: 4 };
    if (agg <= 20) return { label: 'HIGH', color: 'text-blue-600', weight: 3 };
    if (agg <= 36) return { label: 'PASS', color: 'text-orange-600', weight: 2 };
    return { label: 'REM', color: 'text-red-600', weight: 1 };
  };

  const getProgression = (currentWeight: number, prevWeight: number) => {
    if (prevWeight === 0) return null;
    if (currentWeight > prevWeight) return <span className="text-emerald-500 font-black" title="Improved Category">▲</span>;
    if (currentWeight < prevWeight) return <span className="text-red-500 font-black" title="Declined Category">▼</span>;
    return <span className="text-gray-300 font-black" title="Stable Category">▬</span>;
  };

  const calculateRate = (record: MockSeriesRecord | undefined) => {
    if (!record || !record.subScores) return '-';
    const total = Object.values(record.subScores).reduce((acc, sub) => acc + (sub.sectionA + sub.sectionB), 0);
    return ((total / (subjectCount * 100)) * 100).toFixed(1);
  };

  return (
    <div className="bg-white p-6 print:p-0 min-h-screen max-w-full">
      {/* Academy Particulars Header */}
      <div className="text-center mb-10 space-y-2 no-print">
        <h1 className="text-4xl font-black uppercase text-blue-950 tracking-tighter">
          <EditableField value={settings.schoolName} onChange={(v) => onSettingChange('schoolName', v)} className="text-center w-full" />
        </h1>
        <p className="text-xs font-black text-gray-400 uppercase tracking-[0.4em]">
          <EditableField value={settings.schoolAddress || "CULBURY ACADEMY ADDRESS"} onChange={(v) => onSettingChange('schoolAddress', v)} className="text-center w-full" />
        </p>
        <div className="pt-6 flex flex-col items-center">
           <div className="bg-blue-900 text-white px-10 py-2 rounded-full text-[11px] font-black uppercase tracking-[0.5em] shadow-2xl flex items-center gap-4">
             <span>Series Performance Integrity Engine</span>
             <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></span>
             <span>AY: {settings.academicYear}</span>
           </div>
           <div className="flex gap-2 items-center mt-3">
              <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Sliding Mode Active</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400 animate-bounce-x"><path d="m9 18 6-6-6-6"/></svg>
           </div>
        </div>
      </div>

      {/* Sliding Analytics Container */}
      <div className="shadow-2xl border border-gray-200 rounded-[2.5rem] bg-white overflow-hidden relative group">
        {/* Horizontal Scroll Wrapper */}
        <div className="overflow-x-auto custom-scrollbar-horizontal scroll-smooth">
          <table className="w-full text-[10px] border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-blue-950 text-white uppercase text-[8px] tracking-widest">
                <th className="p-5 text-left min-w-[240px] border-r border-blue-900 sticky left-0 bg-blue-950 z-40 shadow-[4px_0_10px_rgba(0,0,0,0.3)]">
                  Pupil Full Particulars
                </th>
                {mockSeriesNames.map((m) => (
                  <th key={m} className="p-3 border-r border-blue-900 text-center min-w-[140px]" colSpan={4}>{m}</th>
                ))}
                <th className="p-3 bg-red-700 text-center font-black min-w-[180px]" colSpan={3}>Live Data Hub</th>
              </tr>
              <tr className="bg-blue-50 text-blue-900 uppercase text-[7px] font-black border-b-2 border-blue-900">
                <th className="p-3 border-r border-blue-100 sticky left-0 bg-blue-50 z-40 shadow-[4px_0_10px_rgba(0,0,0,0.1)]">
                  Baseline Identity
                </th>
                {mockSeriesNames.map((m) => (
                  <React.Fragment key={m + '-sub'}>
                    <th className="p-1.5 border-r border-blue-100 w-10 text-center">Agg</th>
                    <th className="p-1.5 border-r border-blue-100 w-12 text-center">Rate%</th>
                    <th className="p-1.5 border-r border-blue-100 w-12 text-center">Grade</th>
                    <th className="p-1.5 border-r border-blue-100 w-8 text-center bg-white/50">Prog</th>
                  </React.Fragment>
                ))}
                <th className="p-1.5 border-r border-red-100 w-12 bg-red-50 text-red-700 text-center">Agg</th>
                <th className="p-1.5 border-r border-red-100 w-14 bg-red-50 text-red-700 text-center">Rate%</th>
                <th className="p-1.5 bg-red-50 text-red-700 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => {
                const live = currentProcessed.find(p => p.id === student.id);
                let previousWeight = 0; 

                return (
                  <tr key={student.id} className="border-b border-gray-100 hover:bg-blue-50/20 transition-colors group">
                    <td className="p-4 font-black uppercase text-blue-900 border-r border-gray-100 sticky left-0 bg-white group-hover:bg-blue-50/50 z-30 shadow-[4px_0_10px_rgba(0,0,0,0.05)]">
                      {student.name}
                    </td>
                    {mockSeriesNames.map((m) => {
                      const record = student.seriesHistory?.[m];
                      const rate = calculateRate(record);
                      const gradeInfo = record ? getAggGrade(record.aggregate) : null;
                      const progression = gradeInfo ? getProgression(gradeInfo.weight, previousWeight) : '-';
                      
                      if (gradeInfo) previousWeight = gradeInfo.weight;

                      return (
                        <React.Fragment key={m + student.id}>
                          <td className="p-2 border-r border-gray-50 text-center font-mono font-bold text-gray-500">
                            {record?.aggregate || '-'}
                          </td>
                          <td className="p-2 border-r border-gray-50 text-center font-mono text-[9px] text-indigo-400">
                            {rate !== '-' ? rate + '%' : '-'}
                          </td>
                          <td className={`p-2 border-r border-gray-50 text-center font-black text-[9px] ${gradeInfo?.color || ''}`}>
                            {gradeInfo?.label || '-'}
                          </td>
                          <td className="p-2 border-r border-gray-100 text-center text-xs bg-gray-50/30">
                            {progression}
                          </td>
                        </React.Fragment>
                      );
                    })}
                    <td className="p-3 bg-red-50 text-center font-black text-red-700 text-sm border-r border-red-100">
                      {live?.aggregate || '-'}
                    </td>
                    <td className="p-3 bg-red-50 text-center font-mono text-xs text-red-600 border-r border-red-100">
                      {live ? ((live.totalScore / (subjectCount * 100)) * 100).toFixed(1) + '%' : '-'}
                    </td>
                    <td className="p-3 bg-red-50 text-center font-black text-[8px] uppercase text-red-800">
                      {live?.category || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sliding Instruction & Interpretation */}
      <div className="mt-8 flex justify-center no-print">
         <div className="bg-gray-100 px-6 py-2 rounded-full border border-gray-200 flex items-center gap-4">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Swipe or scroll horizontally to navigate Mock 1 - Mock 10</span>
            <div className="flex gap-1">
               <div className="w-1.5 h-1.5 rounded-full bg-blue-900 animate-pulse"></div>
               <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse delay-75"></div>
               <div className="w-1.5 h-1.5 rounded-full bg-blue-200 animate-pulse delay-150"></div>
            </div>
         </div>
      </div>

      <div className="mt-12 bg-slate-900 text-slate-100 p-8 rounded-[3rem] shadow-2xl border border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-10 page-break-inside-avoid">
         <div className="space-y-4">
            <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
              Progression Analysis
            </h4>
            <p className="text-[9px] text-slate-400 leading-relaxed italic">
              The sliding interface allows for temporal performance tracking. Improvement (▲) indicates successful mastery acquisition over the series duration.
            </p>
         </div>
         <div className="space-y-4">
            <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 bg-indigo-400 rounded-full"></span>
              Grade Categorization
            </h4>
            <div className="grid grid-cols-4 gap-2 text-[8px] font-black text-center">
               <div className="bg-white/5 p-2 rounded-xl border border-white/10"><span className="text-emerald-400 block">EXC</span> Agg 6-10</div>
               <div className="bg-white/5 p-2 rounded-xl border border-white/10"><span className="text-blue-400 block">HIGH</span> Agg 11-20</div>
               <div className="bg-white/5 p-2 rounded-xl border border-white/10"><span className="text-orange-400 block">PASS</span> Agg 21-36</div>
               <div className="bg-white/5 p-2 rounded-xl border border-white/10"><span className="text-red-400 block">REM</span> Agg 37+</div>
            </div>
         </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar-horizontal::-webkit-scrollbar {
          height: 12px;
        }
        .custom-scrollbar-horizontal::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar-horizontal::-webkit-scrollbar-thumb {
          background: #1e3a8a;
          border-radius: 10px;
          border: 3px solid #f1f5f9;
        }
        .custom-scrollbar-horizontal::-webkit-scrollbar-thumb:hover {
          background: #1e40af;
        }
        @keyframes bounce-x {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(5px); }
        }
        .animate-bounce-x {
          animation: bounce-x 1s infinite;
        }
      `}} />
    </div>
  );
};

export default SeriesBroadSheet;