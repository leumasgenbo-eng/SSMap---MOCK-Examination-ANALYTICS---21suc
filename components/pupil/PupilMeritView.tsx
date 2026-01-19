
import React, { useMemo } from 'react';
import { ProcessedStudent, GlobalSettings, ExamSubScore } from '../../types';

interface PupilMeritViewProps {
  student: ProcessedStudent;
  settings: GlobalSettings;
}

const PupilMeritView: React.FC<PupilMeritViewProps> = ({ student, settings }) => {
  const meritStats = useMemo(() => {
    const history = student.seriesHistory || {};
    const currentMock = history[settings.activeMock];
    const mockNames = settings.committedMocks || [];
    const prevMockName = mockNames[mockNames.indexOf(settings.activeMock) - 1];
    const prevMock = prevMockName ? history[prevMockName] : null;

    let growthRate = 1.0;
    const avgGrade = currentMock ? currentMock.aggregate / 10 : 9;

    if (currentMock && prevMock && currentMock.subScores && prevMock.subScores) {
      const currSubScores = Object.values(currentMock.subScores) as ExamSubScore[];
      const prevSubScores = Object.values(prevMock.subScores) as ExamSubScore[];
      const currTotal = currSubScores.reduce((a, b) => a + (b.sectionA + b.sectionB), 0);
      const prevTotal = prevSubScores.reduce((a, b) => a + (b.sectionA + b.sectionB), 0);
      growthRate = prevTotal > 0 ? currTotal / prevTotal : 1.0;
    }

    const rewardIndex = (avgGrade > 0 ? (10 / avgGrade) : 1) * growthRate;

    return { 
      rewardIndex, 
      growthRate, 
      rank: currentMock?.rank || '—',
      aggregate: currentMock?.aggregate || '—'
    };
  }, [student, settings]);

  return (
    <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 space-y-10 animate-in fade-in duration-500">
      <div className="text-center space-y-2">
         <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Personal Merit Dashboard</h3>
         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.4em]">Heuristic Multiplier Analysis — {settings.activeMock}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-blue-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col justify-between group">
           <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-xl"></div>
           <span className="text-[9px] font-black uppercase tracking-widest text-blue-300">Merit Reward Index</span>
           <p className="text-5xl font-black mt-4 font-mono">{meritStats.rewardIndex.toFixed(3)}</p>
           <div className="mt-8 pt-4 border-t border-white/10 text-[8px] font-black uppercase tracking-widest text-blue-200 italic">
              "Consistency × Aggregate Proficiency"
           </div>
        </div>

        <div className="bg-gray-50 border border-gray-100 p-8 rounded-[2.5rem] space-y-6">
           <div className="space-y-1">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Temporal Growth</span>
              <p className={`text-3xl font-black ${meritStats.growthRate >= 1 ? 'text-emerald-600' : 'text-red-500'}`}>
                 x{meritStats.growthRate.toFixed(2)}
              </p>
           </div>
           <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${Math.min(100, meritStats.growthRate * 50)}%` }}></div>
           </div>
           <p className="text-[9px] text-gray-500 leading-relaxed font-bold">
              Ratio of current total performance against previous series baseline.
           </p>
        </div>

        <div className="bg-gray-50 border border-gray-100 p-8 rounded-[2.5rem] flex flex-col justify-center items-center text-center space-y-2">
           <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Institutional Rank</span>
           <p className="text-5xl font-black text-slate-900">#{meritStats.rank}</p>
           <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full">Official Series Rank</span>
        </div>
      </div>

      <div className="bg-slate-950 p-10 rounded-[3rem] text-white relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full -mr-32 -mt-32"></div>
         <h4 className="text-[11px] font-black text-blue-400 uppercase tracking-[0.3em] mb-4">Merit Interpretation</h4>
         <p className="text-sm font-medium leading-relaxed italic text-slate-400">
           The Reward Index quantifies your "Academic Gravity" within the cohort. A rising index indicates you are effectively converting effort into results while maintaining a high growth velocity relative to established standards.
         </p>
      </div>
    </div>
  );
};

export default PupilMeritView;
