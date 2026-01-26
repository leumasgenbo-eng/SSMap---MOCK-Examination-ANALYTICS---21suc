import React, { useState, useMemo } from 'react';
import { ProcessedStudent, ClassStatistics, GlobalSettings, SchoolRegistryEntry } from '../../types';
import ReportCard from '../reports/ReportCard';
import PupilPerformanceSummary from './PupilPerformanceSummary';
import PupilGlobalMatrix from './PupilGlobalMatrix';
import PupilMeritView from './PupilMeritView';
import PupilBeceLedger from './PupilBeceLedger';
import ReportBrandingHeader from '../shared/ReportBrandingHeader';

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
    allPupils.sort((a, b) => a.agg - b.agg);
    const myIndex = allPupils.findIndex(p => p.id === student.id && p.schoolId === settings.schoolNumber);
    return { rank: myIndex > -1 ? myIndex + 1 : '—', total: allPupils.length };
  }, [globalRegistry, student.id, settings.schoolNumber]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
      
      {/* Branding Header with Editables */}
      <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-100">
         <ReportBrandingHeader settings={settings} onSettingChange={onSettingChange} reportTitle="CANDIDATE PERFORMANCE HUB" subtitle={`AUTHORIZED ACCESS NODE: ${student.name}`} isLandscape={true} />
         
         <div className="flex flex-col xl:flex-row justify-between items-center gap-8 mt-8">
            <div className="flex items-center gap-6 relative">
                <div className="w-20 h-20 bg-emerald-600 text-white rounded-3xl flex items-center justify-center font-black text-3xl shadow-xl border-4 border-emerald-100">
                  {student.name.charAt(0)}
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none">{student.name}</h2>
                  <div className="flex flex-wrap gap-3 items-center">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-full border border-gray-100">Index: {student.id}</span>
                      <div className="flex items-center gap-1.5 bg-blue-900 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                        Global Rank: #{globalRankInfo.rank} / {globalRankInfo.total}
                      </div>
                  </div>
                </div>
            </div>
            <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-200 relative overflow-x-auto no-scrollbar max-w-full">
                {[
                  { id: 'report', label: 'My Report Card' },
                  { id: 'merit', label: 'My Merit Status' },
                  { id: 'bece', label: 'BECE Ledger' },
                  { id: 'progress', label: 'Progress Trend' },
                  { id: 'detailed', label: 'Detailed Breakdown' },
                  { id: 'global', label: 'Global Matrix' }
                ].map(t => (
                  <button key={t.id} onClick={() => setActiveSubTab(t.id as any)} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase whitespace-nowrap transition-all ${activeSubTab === t.id ? 'bg-white text-blue-900 shadow-md' : 'text-gray-500 hover:text-blue-700'}`}>
                    {t.label}
                  </button>
                ))}
            </div>
         </div>
      </div>

      <div className="animate-in slide-in-from-bottom-4 duration-500">
         {activeSubTab === 'report' && <ReportCard student={student} stats={stats} settings={settings} onSettingChange={onSettingChange} classAverageAggregate={classAverageAggregate} totalEnrolled={totalEnrolled} />}
         {activeSubTab === 'merit' && <PupilMeritView student={student} settings={settings} />}
         {activeSubTab === 'bece' && <PupilBeceLedger student={student} />}
         {activeSubTab === 'progress' && (
           <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 space-y-12">
              <div className="text-center space-y-2"><h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Academic Journey Tracking</h3><p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.4em]">Multi-Series Aggregate Progression</p></div>
              <PupilPerformanceSummary student={student} mockSeriesNames={settings.committedMocks || []} type="aggregate" />
           </div>
         )}
         {activeSubTab === 'detailed' && (
           <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 space-y-12">
              <div className="text-center space-y-2"><h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Sectional Competency Matrix</h3><p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.4em]">Objective vs Theory Partitioning</p></div>
              <PupilPerformanceSummary student={student} mockSeriesNames={settings.committedMocks || []} type="technical" />
           </div>
         )}
         {activeSubTab === 'global' && <PupilGlobalMatrix registry={globalRegistry} student={student} />}
      </div>
    </div>
  );
};

export default PupilDashboard;