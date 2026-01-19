
import React from 'react';
import { ProcessedStudent } from '../../types';

interface PupilPerformanceSummaryProps {
  student: ProcessedStudent;
  mockSeriesNames: string[];
  type: 'aggregate' | 'technical';
}

const PupilPerformanceSummary: React.FC<PupilPerformanceSummaryProps> = ({ student, mockSeriesNames, type }) => {
  const history = student.seriesHistory || {};

  if (type === 'aggregate') {
    return (
      <div className="space-y-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {mockSeriesNames.map((name, idx) => {
            const record = history[name];
            const agg = record?.aggregate;
            
            return (
              <div key={name} className={`p-6 rounded-[2rem] border transition-all duration-500 flex flex-col items-center text-center space-y-4 ${agg ? 'bg-blue-50 border-blue-100 shadow-lg scale-105' : 'bg-gray-50 border-gray-100 opacity-40'}`}>
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{name}</span>
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl shadow-inner ${agg && agg <= 10 ? 'bg-emerald-600 text-white' : agg && agg <= 20 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                   {agg || '—'}
                </div>
                <div className="space-y-1">
                   <span className="text-[8px] font-black text-blue-900 uppercase">Rank</span>
                   <p className="text-xs font-bold text-gray-700">{record?.rank ? `#${record.rank}` : 'TBA'}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100">
           <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 bg-blue-900 text-white rounded-xl flex items-center justify-center font-black text-xs">TR</div>
              <h4 className="text-[11px] font-black text-blue-900 uppercase tracking-widest">Temporal Growth Analysis</h4>
           </div>
           <p className="text-sm font-medium text-gray-600 leading-relaxed italic">
              Your academic trajectory indicates a <span className="font-black text-blue-900 uppercase">Mastery Baseline</span>. Consistent lowering of the aggregate number (e.g. from 24 to 12) signifies exponential improvement in core competency acquisition.
           </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {student.subjects.map((sub) => (
          <div key={sub.subject} className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-xl hover:shadow-2xl transition-all duration-300 group">
             <div className="flex justify-between items-start mb-6">
                <div className="space-y-1">
                   <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">{sub.subject}</span>
                   <h4 className="text-lg font-black text-gray-900 uppercase">{sub.grade} - {sub.remark}</h4>
                </div>
                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center font-black text-blue-900 border border-gray-100 group-hover:bg-blue-900 group-hover:text-white transition-colors">
                   {sub.gradeValue}
                </div>
             </div>

             <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 space-y-1">
                      <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Section A (Obj)</span>
                      <p className="text-xl font-black text-blue-900 font-mono">{sub.sectionA ?? '—'}</p>
                   </div>
                   <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 space-y-1">
                      <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Section B (Theory)</span>
                      <p className="text-xl font-black text-indigo-900 font-mono">{sub.sectionB ?? '—'}</p>
                   </div>
                </div>

                <div className="space-y-2">
                   <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-gray-400">
                      <span>Sectional Balance</span>
                      <span className="text-blue-600">Distribution Impact</span>
                   </div>
                   <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden flex">
                      <div 
                        className="bg-blue-500 transition-all duration-1000" 
                        style={{ width: `${((sub.sectionA ?? 0)/((sub.sectionA??0)+(sub.sectionB??0)||1))*100}%` }}
                      ></div>
                      <div 
                        className="bg-indigo-500 transition-all duration-1000" 
                        style={{ width: `${((sub.sectionB ?? 0)/((sub.sectionA??0)+(sub.sectionB??0)||1))*100}%` }}
                      ></div>
                   </div>
                </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PupilPerformanceSummary;
