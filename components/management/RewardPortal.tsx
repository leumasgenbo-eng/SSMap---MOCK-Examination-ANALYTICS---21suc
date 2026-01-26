import React, { useState, useMemo } from 'react';
import { StudentData, GlobalSettings, ExamSubScore, StaffAssignment } from '../../types';
import ReportBrandingHeader from '../shared/ReportBrandingHeader';
import EditableField from '../shared/EditableField';

interface RewardPortalProps {
  students: StudentData[];
  setStudents: React.Dispatch<React.SetStateAction<StudentData[]>>;
  settings: GlobalSettings;
  subjects: string[];
  facilitators: Record<string, StaffAssignment>;
  onSave: () => void;
  onSettingChange: (key: keyof GlobalSettings, value: any) => void;
  isFacilitator?: boolean;
}

const RewardPortal: React.FC<RewardPortalProps> = ({ students, setStudents, settings, subjects, facilitators, onSave, onSettingChange, isFacilitator }) => {
  const [view, setView] = useState<'mock-postmortem' | 'facilitator-merit' | 'bece-entry' | 'bece-analysis' | 'annual-report'>('mock-postmortem');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [rewardPool, setRewardPool] = useState('10000'); 
  const [mockStandardMean] = useState(5.5);

  const mockNames = settings.committedMocks || [];

  const facilitatorRewards = useMemo(() => {
    const activeMock = settings.activeMock;
    const prevMockName = mockNames[mockNames.indexOf(activeMock) - 1];

    const results = subjects.map(subject => {
      const staff = facilitators[subject];
      if (!staff || !staff.name) return null;

      const pupilsWithData = students.filter(s => s.mockData?.[activeMock]?.scores[subject] !== undefined);
      if (pupilsWithData.length === 0) return null;

      const currentMeanScore = pupilsWithData.reduce((acc, s) => acc + (s.mockData?.[activeMock]?.scores[subject] || 0), 0) / pupilsWithData.length;
      const avgGradeFactor = Math.max(1, 10 - (currentMeanScore / 10)); 

      const prevPupils = prevMockName ? students.filter(s => s.mockData?.[prevMockName]?.scores[subject] !== undefined) : [];
      const prevMeanScore = prevPupils.length > 0 
        ? prevPupils.reduce((acc, s) => acc + (s.mockData?.[prevMockName]?.scores[subject] || 0), 0) / prevPupils.length 
        : currentMeanScore;
      const subGrowthRate = prevMeanScore > 0 ? currentMeanScore / prevMeanScore : 1.0;

      const currObjMean = pupilsWithData.reduce((acc, s) => acc + (s.mockData?.[activeMock]?.examSubScores[subject]?.sectionA || 0), 0) / pupilsWithData.length;
      const prevObjMean = prevPupils.length > 0 ? prevPupils.reduce((acc, s) => acc + (s.mockData?.[prevMockName]?.examSubScores[subject]?.sectionA || 0), 0) / prevPupils.length : currObjMean;
      const objGrowthRate = prevObjMean > 0 ? currObjMean / prevObjMean : 1.0;

      const currThyMean = pupilsWithData.reduce((acc, s) => acc + (s.mockData?.[activeMock]?.examSubScores[subject]?.sectionB || 0), 0) / pupilsWithData.length;
      const prevThyMean = prevPupils.length > 0 ? prevPupils.reduce((acc, s) => acc + (s.mockData?.[prevMockName]?.examSubScores[subject]?.sectionB || 0), 0) / prevPupils.length : currThyMean;
      const thyGrowthRate = prevThyMean > 0 ? currThyMean / prevThyMean : 1.0;

      const teiValue = avgGradeFactor * subGrowthRate * objGrowthRate * thyGrowthRate;

      const beceStudents = students.filter(s => s.beceResults?.[selectedYear]?.grades[subject]);
      let beceMeanGrade = 9;
      let sigDiff = 0;

      if (beceStudents.length > 0) {
        beceMeanGrade = beceStudents.reduce((acc, s) => acc + (s.beceResults?.[selectedYear]?.grades[subject] || 9), 0) / beceStudents.length;
        sigDiff = mockStandardMean - beceMeanGrade; 
      }

      return { subject, name: staff.name, staffId: staff.enrolledId, teiValue, subGrowthRate, objGrowthRate, thyGrowthRate, beceMeanGrade, sigDiff };
    }).filter(x => x !== null);

    return results as any[];
  }, [students, settings.activeMock, subjects, facilitators, mockNames, selectedYear, mockStandardMean]);

  const teiRanked = useMemo(() => {
    const sorted = [...facilitatorRewards].sort((a, b) => b.teiValue - a.teiValue);
    const totalTei = sorted.reduce((acc, f) => acc + f.teiValue, 0);
    const poolValue = parseFloat(rewardPool) || 0;
    return sorted.map((f, i) => ({ ...f, rank: i + 1, share: totalTei > 0 ? (f.teiValue / totalTei) * poolValue : 0 }));
  }, [facilitatorRewards, rewardPool]);

  const sigDiffRanked = useMemo(() => {
    return [...facilitatorRewards].sort((a, b) => b.sigDiff - a.sigDiff).map((f, i) => ({ ...f, rank: i + 1 }));
  }, [facilitatorRewards]);

  const navTabs = [
    { id: 'mock-postmortem', label: 'Pupil Rewards', icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' },
    { id: 'facilitator-merit', label: 'Facilitator Rewards', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm10-2v6m3-3h-6' },
    { id: 'bece-entry', label: 'BECE Ledger', icon: 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7', adminOnly: true },
    { id: 'bece-analysis', label: 'Sig-Diff Ranking', icon: 'M18 20V10M12 20V4M6 20v-6' },
    { id: 'annual-report', label: 'Annual Audit', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' }
  ].filter(t => !isFacilitator || !t.adminOnly);

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex bg-slate-900 p-2 rounded-[2.5rem] max-w-5xl mx-auto shadow-2xl border border-white/5 no-print overflow-x-auto no-scrollbar">
        {navTabs.map((t) => (
          <button key={t.id} onClick={() => setView(t.id as any)} className={`flex-1 min-w-[140px] py-4 rounded-[2rem] flex flex-col items-center gap-2 transition-all ${view === t.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mb-1"><path d={t.icon}/></svg>
            <span className="text-[10px] font-black uppercase tracking-widest">{t.label}</span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[4rem] border border-gray-100 shadow-2xl overflow-hidden min-h-[600px]">
        {view === 'annual-report' && (
          <div className="p-12 space-y-12 animate-in slide-in-from-bottom-8 duration-700" id="reward-audit-report">
             <ReportBrandingHeader settings={settings} onSettingChange={onSettingChange} reportTitle="ANNUAL PERFORMANCE AUDIT" subtitle={`ACADEMIC CYCLE: ${selectedYear}`} isLandscape={false} />
             
             <section className="space-y-10">
                <div className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-xl border-b-8 border-blue-600">
                   <h3 className="text-xl font-black uppercase tracking-widest text-blue-400 mb-4">I. Executive Summary & Discussion</h3>
                   <div className="space-y-4 text-sm leading-relaxed text-slate-300 font-medium italic">
                      <p>This appraisal document integrates multi-factor heuristic multipliers to quantify instructional velocity and final academic attainment for the {selectedYear} cohort.</p>
                      <p>The <span className="text-white font-black">Teaching Efficiency Index (TEI)</span> finding indicates a current network growth ratio of <span className="text-blue-400 font-black">x{(teiRanked.reduce((a, b) => a + b.subGrowthRate, 0) / (teiRanked.length || 1)).toFixed(2)}</span> across primary disciplines.</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="bg-white border-2 border-gray-100 rounded-[3rem] p-10 space-y-6 shadow-sm">
                      <h4 className="text-lg font-black text-blue-900 uppercase tracking-[0.2em] flex items-center gap-3"><div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>Elite Facilitators</h4>
                      <div className="space-y-4">
                         {teiRanked.slice(0, 3).map((f) => (
                           <div key={f.subject} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                              <div><p className="text-xs font-black uppercase text-slate-900">{f.name}</p><p className="text-[9px] font-bold text-blue-600 uppercase">{f.subject}</p></div>
                              <div className="text-right"><p className="text-xs font-black text-blue-950 font-mono">TEI: {f.teiValue.toFixed(2)}</p></div>
                           </div>
                         ))}
                      </div>
                   </div>
                   <div className="bg-white border-2 border-gray-100 rounded-[3rem] p-10 space-y-6 shadow-sm">
                      <h4 className="text-lg font-black text-emerald-900 uppercase tracking-[0.2em] flex items-center gap-3"><div className="w-1.5 h-6 bg-emerald-600 rounded-full"></div>Sig-Diff Leaders</h4>
                      <div className="space-y-4">
                         {sigDiffRanked.slice(0, 3).map((f) => (
                           <div key={f.subject} className="flex justify-between items-center p-4 bg-emerald-50/30 rounded-2xl border border-emerald-100/50">
                              <div><p className="text-xs font-black uppercase text-slate-900">{f.name}</p><p className="text-[9px] font-bold text-emerald-700 uppercase">{f.subject}</p></div>
                              <div className="text-right"><p className="text-xs font-black text-emerald-950 font-mono">Σ Δ: +{f.sigDiff.toFixed(2)}</p></div>
                           </div>
                         ))}
                      </div>
                   </div>
                </div>
             </section>

             <div className="bg-gray-50 p-12 rounded-[4rem] border-2 border-dashed border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-20">
                   <div className="text-center space-y-2">
                      <div className="border-t-2 border-black pt-2 font-black uppercase text-[10px]">
                        <EditableField value="Head Teacher" onChange={() => {}} className="text-center w-full" />
                      </div>
                      <p className="text-[8px] text-gray-400 italic">Integrity Verified</p>
                   </div>
                   <div className="text-center space-y-2">
                      <div className="border-t-2 border-black pt-2 font-black uppercase text-[10px]">
                        <EditableField value="Registry Controller" onChange={() => {}} className="text-center w-full" />
                      </div>
                      <p className="text-[8px] text-gray-400 italic">Data Validated</p>
                   </div>
                   <div className="text-center space-y-2">
                      <div className="border-t-2 border-black pt-2 font-black uppercase text-[10px]">
                         <EditableField value={settings.headTeacherName} onChange={(v) => onSettingChange('headTeacherName', v)} className="text-center w-full" />
                      </div>
                      <p className="text-[8px] text-gray-400 italic">Academy Seal</p>
                   </div>
                </div>
             </div>
          </div>
        )}

        {view !== 'annual-report' && (
          <div className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest">
            Detailed Reward View for {settings.activeMock} active.
          </div>
        )}
      </div>
    </div>
  );
};

export default RewardPortal;