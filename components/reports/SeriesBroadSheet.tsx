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
      {/* Universal Academy Particulars Header */}
      <div className="text-center mb-10 space-y-2 no-print border-b-4 border-blue-900 pb-6">
        <h1 className="text-4xl font-black uppercase text-blue-950 tracking-tighter">
          <EditableField value={settings.schoolName} onChange={(v) => onSettingChange('schoolName', v)} className="text-center w-full font-black" />
        </h1>
        <p className="text-xs font-black text-gray-400 uppercase tracking-[0.4em]">
          <EditableField value={settings.schoolAddress || "CULBURY ACADEMY ADDRESS"} onChange={(v) => onSettingChange('schoolAddress', v)} className="text-center w-full" />
        </p>
        <div className="flex justify-center items-center gap-4 mt-4">
           <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-5 py-1 rounded-full border border-blue-100 uppercase tracking-widest shadow-sm">
             Hub ID: <EditableField value={settings.schoolNumber || "UBA-2025-XXX"} onChange={(v) => onSettingChange('schoolNumber', v)} className="inline-block" />
           </span>
        </div>
        <div className="pt-4 flex flex-col items-center">
           <div className="bg-blue-900 text-white px-10 py-2 rounded-full text-[11px] font-black uppercase tracking-[0.5em] shadow-2xl flex items-center gap-4">
             <span>Series Tracker 1-10</span>
             <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></span>
             <span>AY: {settings.academicYear}</span>
           </div>
        </div>
      </div>

      {/* Main Sliding Matrix */}
      <div className="shadow-2xl border border-gray-200 rounded-[2.5rem] bg-white overflow-hidden relative group">
        <div className="overflow-x-auto custom-scrollbar-horizontal scroll-smooth">
          <table className="w-full text-[10px] border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-blue-950 text-white uppercase text-[8px] tracking-widest">
                <th className="p-5 text-left min-w-[240px] border-r border-blue-900 sticky left-0 bg-blue-950 z-40 shadow-[4px_0_10px_rgba(0,0,0,0.3)]">
                  Candidate Profile
                </th>
                {mockSeriesNames.map((m) => (
                  <th key={m} className="p-3 border-r border-blue-900 text-center min-w-[140px]" colSpan={4}>{m}</th>
                ))}
                <th className="p-3 bg-red-700 text-center font-black min-w-[180px]" colSpan={3}>Live State</th>
              </tr>
              <tr className="bg-blue-50 text-blue-900 uppercase text-[7px] font-black border-b-2 border-blue-900">
                <th className="p-3 border-r border-blue-100 sticky left-0 bg-blue-50 z-40">Identity</th>
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
                  <tr key={student.id} className="border-b border-gray-100 hover:bg-blue-50/20 transition-colors group leading-none">
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
                          <td className="p-2 border-r border-gray-50 text-center font-mono font-bold text-gray-500">{record?.aggregate || '-'}</td>
                          <td className="p-2 border-r border-gray-50 text-center font-mono text-[9px] text-indigo-400">{rate !== '-' ? rate + '%' : '-'}</td>
                          <td className={`p-2 border-r border-gray-50 text-center font-black text-[9px] ${gradeInfo?.color || ''}`}>{gradeInfo?.label || '-'}</td>
                          <td className="p-2 border-r border-gray-100 text-center text-xs bg-gray-50/30">{progression}</td>
                        </React.Fragment>
                      );
                    })}
                    <td className="p-3 bg-red-50 text-center font-black text-red-700 text-sm border-r border-red-100">{live?.aggregate || '-'}</td>
                    <td className="p-3 bg-red-50 text-center font-mono text-xs text-red-600 border-r border-red-100">{live ? ((live.totalScore / (subjectCount * 100)) * 100).toFixed(1) + '%' : '-'}</td>
                    <td className="p-3 bg-red-50 text-center font-black text-[8px] uppercase text-red-800">{live?.category || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-12 flex justify-between items-end border-t-2 border-blue-900 pt-6">
         <div className="text-center w-[30%] border-t border-black pt-1">
            <span className="text-[9px] font-black uppercase text-gray-400">Hub Controller</span>
         </div>
         <div className="text-center w-[30%] border-t border-black pt-1">
            <span className="text-[9px] font-black uppercase text-gray-400">Academy Director</span>
            <p className="text-[10px] font-black text-blue-900 uppercase truncate mt-1">{settings.headTeacherName}</p>
         </div>
      </div>
    </div>
  );
};

export default SeriesBroadSheet;