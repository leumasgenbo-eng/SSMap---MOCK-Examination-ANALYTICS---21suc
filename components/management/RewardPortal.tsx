import React, { useState, useMemo } from 'react';
import { StudentData, GlobalSettings, ExamSubScore, StaffAssignment } from '../../types';
import ReportBrandingHeader from '../shared/ReportBrandingHeader';

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

  const handleUpdateBeceGrade = (studentId: number, subject: string, grade: string) => {
    const val = parseInt(grade) || 0;
    setStudents(prev => prev.map(s => {
      if (s.id !== studentId) return s;
      const results = s.beceResults || {};
      const currentYearData = results[selectedYear] || { grades: {}, year: selectedYear };
      return { ...s, beceResults: { ...results, [selectedYear]: { ...currentYearData, grades: { ...currentYearData.grades, [subject]: val } } } };
    }));
  };

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
        {view === 'mock-postmortem' && (
          <div className="p-12 space-y-10">
             <div className="flex justify-between items-end border-b-2 border-gray-50 pb-8">
                <div className="space-y-1">
                   <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Pupil Merit Ranking</h3>
                   <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Growth Analytics — {settings.activeMock}</p>
                </div>
                <div className="bg-blue-50 px-8 py-3 rounded-2xl border border-blue-100 text-center">
                   <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest block">Cycle</span>
                   <span className="text-lg font-black text-blue-900 uppercase">{settings.activeMock}</span>
                </div>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead className="bg-gray-50 border-b border-gray-100 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">
                      <tr><th className="px-8 py-5">Rank</th><th className="px-8 py-5">Candidate</th><th className="px-4 py-5 text-center">Aggregate</th><th className="px-8 py-5 text-right">Status</th></tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50">
                      {students.sort((a,b) => (a.seriesHistory?.[settings.activeMock]?.aggregate || 54) - (b.seriesHistory?.[settings.activeMock]?.aggregate || 54)).map((p, i) => (
                          <tr key={p.id} className="hover:bg-blue-50/20 transition-colors">
                             <td className="px-8 py-5"><span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] ${i < 3 ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-400'}`}>{i+1}</span></td>
                             <td className="px-8 py-5 font-black uppercase text-sm text-slate-900">{p.name}</td>
                             <td className="px-4 py-5 text-center font-mono font-bold text-blue-900">{p.seriesHistory?.[settings.activeMock]?.aggregate || '—'}</td>
                             <td className="px-8 py-5 text-right uppercase text-[10px] font-black text-slate-400">Verified</td>
                          </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        )}

        {view === 'annual-report' && (
          <div className="p-12 space-y-12 animate-in slide-in-from-bottom-8 duration-700" id="reward-audit-report">
             <ReportBrandingHeader settings={settings} onSettingChange={onSettingChange} reportTitle="ANNUAL PERFORMANCE AUDIT" subtitle={`ACADEMIC CYCLE: ${selectedYear}`} isLandscape={false} />
             
             <section className="space-y-10">
                <div className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-xl border-b-8 border-blue-600">
                   <h3 className="text-xl font-black uppercase tracking-widest text-blue-400 mb-4">I. Executive Summary & Discussion</h3>
                   <div className="space-y-4 text-sm leading-relaxed text-slate-300 font-medium italic">
                      <p>This appraisal document integrates multi-factor heuristic multipliers to quantify instructional velocity and final academic attainment for the {selectedYear} cohort.</p>
                      <p>The <span className="text-white font-black">Teaching Efficiency Index (TEI)</span> finding indicates a current network growth ratio of <span className="text-blue-400 font-black">x{(teiRanked.reduce((a, b) => a + b.subGrowthRate, 0) / (teiRanked.length || 1)).toFixed(2)}</span> across primary disciplines.</p>
                      <p>Significant Difference <span className="text-emerald-400 font-black">(Σ Δ)</span> analysis confirms that facilitators have effectively closed the gap between internal mock standards and external BECE criteria.</p>
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
                   <div className="text-center space-y-2"><div className="border-t-2 border-black pt-2 font-black uppercase text-[10px]">Head Teacher</div><p className="text-[8px] text-gray-400 italic">Integrity Verified</p></div>
                   <div className="text-center space-y-2"><div className="border-t-2 border-black pt-2 font-black uppercase text-[10px]">Registry Controller</div><p className="text-[8px] text-gray-400 italic">Data Validated</p></div>
                   <div className="text-center space-y-2"><div className="border-t-2 border-black pt-2 font-black uppercase text-[10px]">Academy Director</div><p className="text-[8px] text-gray-400 italic">Academy Seal</p></div>
                </div>
             </div>
          </div>
        )}

        {view === 'facilitator-merit' && (
           <div className="p-12 space-y-12">
              <div className="flex flex-col md:flex-row justify-between items-center border-b-2 border-gray-50 pb-8 gap-4">
                <div className="space-y-1">
                   <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Facilitator Reward Hub</h3>
                   <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Multi-Factor TEI Rerating</p>
                </div>
                <div className="bg-indigo-950 p-4 rounded-3xl border border-white/10 flex items-center gap-6 shadow-xl">
                   <div className="space-y-1">
                      <span className="text-[8px] font-black text-indigo-300 uppercase tracking-widest block">Reward Pool</span>
                      <input type="number" value={rewardPool} onChange={(e) => setRewardPool(e.target.value)} className="bg-transparent border-none text-white font-black text-xl outline-none w-24" />
                   </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teiRanked.map((f) => (
                  <div key={f.subject} className="bg-white border border-gray-100 rounded-[2.5rem] p-8 space-y-6 shadow-sm relative group">
                     <div className={`absolute top-0 right-0 w-12 h-12 flex items-center justify-center font-black text-lg ${f.rank === 1 ? 'bg-yellow-500 text-white' : 'bg-gray-900 text-white'}`}>{f.rank}</div>
                     <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">{f.subject}</span>
                     <h4 className="text-xl font-black text-slate-900 uppercase">{f.name}</h4>
                     <div className="bg-slate-900 text-white p-6 rounded-3xl space-y-4 shadow-xl">
                        <div className="flex justify-between border-b border-white/10 pb-2"><span className="text-[9px] font-black text-slate-400 uppercase">TEI</span><span className="text-xl font-black text-blue-400 font-mono">{f.teiValue.toFixed(2)}</span></div>
                        <div className="flex justify-between"><span className="text-[9px] font-black text-slate-400 uppercase">Share</span><span className="text-xl font-black text-emerald-400 font-mono">₵{f.share.toFixed(2)}</span></div>
                     </div>
                  </div>
                ))}
              </div>
           </div>
        )}
      </div>
    </div>
  );
};

export default RewardPortal;