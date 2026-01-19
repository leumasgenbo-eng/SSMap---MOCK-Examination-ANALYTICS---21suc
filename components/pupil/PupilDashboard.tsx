import React, { useState, useMemo } from 'react';
import { ProcessedStudent, ClassStatistics, GlobalSettings, SchoolRegistryEntry } from '../../types';
import ReportCard from '../reports/ReportCard';
import PupilPerformanceSummary from './PupilPerformanceSummary';
import PupilGlobalMatrix from './PupilGlobalMatrix';
import PupilMeritView from './PupilMeritView';
import PupilBeceLedger from './PupilBeceLedger';

interface PupilDashboardProps {
  student: ProcessedStudent;
  stats: ClassStatistics;
  settings: GlobalSettings;
  classAverageAggregate: number;
  totalEnrolled: number;
  onSettingChange: (key: keyof GlobalSettings, value: any) => void;
  globalRegistry: SchoolRegistryEntry[];
}

const PupilDashboard: React.FC<PupilDashboardProps> = ({ student, stats, settings, classAverageAggregate, totalEnrolled, onSettingChange, globalRegistry }) => {
  const [activeSubTab, setActiveSubTab] = useState<'report' | 'merit' | 'progress' | 'bece' | 'detailed' | 'global'>('report');

  const globalRankInfo = useMemo(() => {
    const allPupils: { id: number; schoolId: string; agg: number }[] = [];
    globalRegistry.forEach(school => {
      if (!school.fullData?.students) return;
      const activeMock = school.fullData.settings.activeMock;
      school.fullData.students.forEach(s => {
        const history = s.seriesHistory?.[activeMock];
        if (history) {
          allPupils.push({ id: s.id, schoolId: school.id, agg: history.aggregate });
        }
      });
    });

    if (allPupils.length === 0) return { rank: '—', total: 0 };
    
    // Sort by aggregate ASC (Lower is better)
    allPupils.sort((a, b) => a.agg - b.agg);
    const myIndex = allPupils.findIndex(p => p.id === student.id && p.schoolId === settings.schoolNumber);
    
    return { 
      rank: myIndex > -1 ? myIndex + 1 : '—', 
      total: allPupils.length 
    };
  }, [globalRegistry, student.id, settings.schoolNumber]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
      
      {/* Personalized Welcome Header */}
      <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl border border-gray-100 flex flex-col xl:flex-row justify-between items-center gap-8 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full -mr-32 -mt-32 opacity-50"></div>
         <div className="flex items-center gap-6 relative">
            <div className="w-20 h-20 bg-emerald-600 text-white rounded-3xl flex items-center justify-center font-black text-3xl shadow-xl border-4 border-emerald-100">
               {student.name.charAt(0)}
            </div>
            <div className="space-y-2">
               <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none">{student.name}</h2>
               <div className="flex flex-wrap gap-3 items-center">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-full border border-gray-100">Index: {student.id}</span>
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">Candidate Hub</span>
                  <div className="flex items-center gap-1.5 bg-blue-900 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg border border-blue-800">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    Global Rank: #{globalRankInfo.rank} / {globalRankInfo.total}
                  </div>
               </div>
            </div>
         </div>
         <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-200 relative overflow-x-auto no-scrollbar max-w-full">
            <button 
              onClick={() => setActiveSubTab('report')}
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase whitespace-nowrap transition-all ${activeSubTab === 'report' ? 'bg-white text-blue-900 shadow-md' : 'text-gray-500 hover:text-blue-700'}`}
            >
              My Report Card
            </button>
            <button 
              onClick={() => setActiveSubTab('merit')}
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase whitespace-nowrap transition-all ${activeSubTab === 'merit' ? 'bg-white text-blue-900 shadow-md' : 'text-gray-500 hover:text-blue-700'}`}
            >
              My Merit Status
            </button>
            <button 
              onClick={() => setActiveSubTab('bece')}
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase whitespace-nowrap transition-all ${activeSubTab === 'bece' ? 'bg-white text-blue-900 shadow-md' : 'text-gray-500 hover:text-blue-700'}`}
            >
              BECE Ledger
            </button>
            <button 
              onClick={() => setActiveSubTab('progress')}
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase whitespace-nowrap transition-all ${activeSubTab === 'progress' ? 'bg-white text-blue-900 shadow-md' : 'text-gray-500 hover:text-blue-700'}`}
            >
              Progress Trend
            </button>
            <button 
              onClick={() => setActiveSubTab('detailed')}
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase whitespace-nowrap transition-all ${activeSubTab === 'detailed' ? 'bg-white text-blue-900 shadow-md' : 'text-gray-500 hover:text-blue-700'}`}
            >
              Detailed Breakdown
            </button>
            <button 
              onClick={() => setActiveSubTab('global')}
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase whitespace-nowrap transition-all ${activeSubTab === 'global' ? 'bg-blue-900 text-white shadow-md' : 'text-gray-500 hover:text-blue-700'}`}
            >
              Global Matrix
            </button>
         </div>
      </div>

      <div className="animate-in slide-in-from-bottom-4 duration-500">
         {activeSubTab === 'report' && (
           <ReportCard 
             student={student} 
             stats={stats} 
             settings={settings} 
             onSettingChange={onSettingChange} 
             classAverageAggregate={classAverageAggregate} 
             totalEnrolled={totalEnrolled} 
           />
         )}
         {activeSubTab === 'merit' && (
           <PupilMeritView student={student} settings={settings} />
         )}
         {activeSubTab === 'bece' && (
           <PupilBeceLedger student={student} />
         )}
         {activeSubTab === 'progress' && (
           <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 space-y-12">
              <div className="text-center space-y-2">
                 <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Academic Journey Tracking</h3>
                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.4em]">Multi-Series Aggregate Progression</p>
              </div>
              <PupilPerformanceSummary student={student} mockSeriesNames={settings.committedMocks || []} type="aggregate" />
           </div>
         )}
         {activeSubTab === 'detailed' && (
           <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 space-y-12">
              <div className="text-center space-y-2">
                 <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Sectional Competency Matrix</h3>
                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.4em]">Objective vs Theory Partitioning</p>
              </div>
              <PupilPerformanceSummary student={student} mockSeriesNames={settings.committedMocks || []} type="technical" />
           </div>
         )}
         {activeSubTab === 'global' && (
           <PupilGlobalMatrix registry={globalRegistry} student={student} />
         )}
      </div>

      {/* Candidate Footer Information */}
      <footer className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full -mr-24 -mt-24"></div>
         <div className="relative space-y-6">
            <h4 className="text-[11px] font-black text-blue-400 uppercase tracking-[0.3em]">Candidate Support Protocol</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <p className="text-xs text-slate-400 leading-relaxed font-medium italic">
                 "This portal provides verified academic telemetry. Use these insights to identify your developmental priorities and optimize your study schedule for the final external assessment."
               </p>
               <div className="bg-white/5 p-6 rounded-3xl border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Institutional Resumption</span>
                    <p className="text-sm font-black text-blue-400 uppercase">{new Date(settings.nextTermBegin).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center font-black">RES</div>
               </div>
            </div>
         </div>
      </footer>
    </div>
  );
};

export default PupilDashboard;