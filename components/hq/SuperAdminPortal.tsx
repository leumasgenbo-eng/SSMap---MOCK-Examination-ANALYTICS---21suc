import React, { useState, useEffect, useMemo, useRef } from 'react';
import { SchoolRegistryEntry, RemarkMetric } from '../../types';

// Sub-portals
import RegistryView from './RegistryView';
import ReratingView from './ReratingView';
import AuditLogView from './AuditLogView';
import RemarkAnalyticsView from './RemarkAnalyticsView';
import PupilNetworkRankingView from './PupilNetworkRankingView';
import NetworkRewardsView from './NetworkRewardsView';
import UnifiedAuditMasterView from './UnifiedAuditMasterView';

export interface SubjectDemandMetric {
  subject: string;
  demandScore: number; // 0-100
  remarkCount: number;
  difficultyRating: number; // 1-10
  topRemark: string;
  maleRemarkShare: number;
  femaleRemarkShare: number;
  networkMeanPerformance: number;
}

interface SuperAdminPortalProps {
  onExit: () => void;
  onRemoteView: (schoolId: string) => void;
}

const SuperAdminPortal: React.FC<SuperAdminPortalProps> = ({ onExit, onRemoteView }) => {
  const [registry, setRegistry] = useState<SchoolRegistryEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState<'registry' | 'rankings' | 'remarks' | 'audit' | 'pupils' | 'rewards' | 'unified-audit'>('registry');
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('uba_global_registry');
    if (saved) setRegistry(JSON.parse(saved));
  }, []);

  const stats = useMemo(() => ({
    total: registry.length,
    active: registry.filter(r => r.status === 'active').length,
    totalStudents: registry.reduce((sum, r) => sum + r.studentCount, 0)
  }), [registry]);

  const handleExportNetwork = () => {
    const backupData = {
      type: "SSMAP_GLOBAL_REGISTRY_BACKUP",
      version: "4.0",
      timestamp: new Date().toISOString(),
      registry
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SSMAP_Superadmin_Network_Master_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportNetwork = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (json.type !== "SSMAP_GLOBAL_REGISTRY_BACKUP" || !Array.isArray(json.registry)) {
          throw new Error("Invalid superadmin backup file structure.");
        }
        if (window.confirm(`SUPERADMIN OVERRIDE: Overwrite network registry with ${json.registry.length} institutions?`)) {
          setRegistry(json.registry);
          localStorage.setItem('uba_global_registry', JSON.stringify(json.registry));
          alert("Network database restored.");
        }
      } catch (err) {
        alert("Restore Failed: " + (err as Error).message);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const subjectDemands = useMemo(() => {
    const demands: Record<string, { count: number; maleCount: number; femaleCount: number; totalWeight: number; remarks: string[]; schoolMeans: number[] }> = {};
    
    registry.forEach(school => {
      const tel = school.remarkTelemetry;
      const history = school.performanceHistory || [];
      const latestHistory = history[history.length - 1];

      if (!tel || !tel.subjectRemarks) return;

      Object.entries(tel.subjectRemarks).forEach(([subject, metrics]) => {
        if (!demands[subject]) demands[subject] = { count: 0, maleCount: 0, femaleCount: 0, totalWeight: 0, remarks: [], schoolMeans: [] };
        
        (metrics as RemarkMetric[]).forEach(m => {
          demands[subject].count += m.count;
          demands[subject].maleCount += m.maleCount;
          demands[subject].femaleCount += m.femaleCount;
          demands[subject].remarks.push(m.text);
          demands[subject].totalWeight += m.count * (m.text.length > 40 ? 1.5 : 1.0);
        });

        if (latestHistory) {
          demands[subject].schoolMeans.push(latestHistory.avgComposite);
        }
      });
    });

    return Object.entries(demands).map(([subject, data]) => {
      const totalRemarks = data.maleCount + data.femaleCount || 1;
      const demandScore = Math.min(100, (data.totalWeight / (stats.totalStudents || 1)) * 50);
      const avgPerformance = data.schoolMeans.length > 0 
        ? data.schoolMeans.reduce((a, b) => a + b, 0) / data.schoolMeans.length 
        : 65;

      return {
        subject,
        demandScore,
        remarkCount: data.count,
        difficultyRating: Math.ceil(demandScore / 10),
        topRemark: data.remarks.sort((a, b) => b.length - a.length)[0] || "Standard performance observed.",
        maleRemarkShare: (data.maleCount / totalRemarks) * 100,
        femaleRemarkShare: (data.femaleCount / totalRemarks) * 100,
        networkMeanPerformance: avgPerformance
      };
    }).sort((a, b) => b.demandScore - a.demandScore);
  }, [registry, stats.totalStudents]);

  const schoolRankings = useMemo(() => {
    if (registry.length === 0) return [];
    return registry.map(school => {
      const history = school.performanceHistory || [];
      const mockCount = history.length;
      const compositeAvg = mockCount > 0 ? history.reduce((sum, h) => sum + h.avgComposite, 0) / mockCount : 0;
      const aggregateAvg = mockCount > 0 ? history.reduce((sum, h) => sum + h.avgAggregate, 0) / mockCount : 0;
      return {
        id: school.id,
        name: school.name,
        compositeAvg,
        aggregateAvg,
        objectiveAvg: 0,
        theoryAvg: 0,
        strengthIndex: (compositeAvg / (aggregateAvg || 1)) * 10 
      };
    }).sort((a, b) => b.strengthIndex - a.strengthIndex);
  }, [registry]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-4 md:p-8 animate-in fade-in duration-700">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <header className="flex flex-col lg:flex-row justify-between lg:items-center gap-6 border-b border-slate-800 pb-8">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-900 rounded-2xl flex items-center justify-center text-white shadow-[0_0_30px_rgba(37,99,235,0.4)] border border-white/10">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            </div>
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tighter text-white">Superadmin Master Hub</h1>
              <div className="flex items-center gap-2 mt-1">
                 <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                 <p className="text-[9px] font-black text-blue-400 uppercase tracking-[0.4em]">SS-Map Verified Overseer Session</p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <div className="flex bg-slate-900/50 p-1 rounded-2xl border border-slate-800 backdrop-blur-md overflow-x-auto no-scrollbar max-w-full">
              {[
                { id: 'registry', label: 'Network Ledger' },
                { id: 'rewards', label: 'Network Rewards' },
                { id: 'unified-audit', label: 'Audit Master' },
                { id: 'rankings', label: 'Global Rankings' },
                { id: 'pupils', label: 'Pupil Ranking' },
                { id: 'audit', label: 'Audit Trail' },
                { id: 'remarks', label: 'Intelligence' }
              ].map(tab => (
                <button 
                  key={tab.id} 
                  onClick={() => setView(tab.id as any)} 
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${view === tab.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
               <button onClick={handleExportNetwork} className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-3 rounded-2xl font-black text-[10px] uppercase border border-slate-700 transition-all flex items-center gap-2">
                 Backup Master
               </button>
               <button onClick={() => fileInputRef.current?.click()} className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-3 rounded-2xl font-black text-[10px] uppercase border border-slate-700 transition-all flex items-center gap-2">
                 Restore Master
               </button>
               <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleImportNetwork} />
               <button onClick={onExit} className="bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase border border-red-500/20 transition-all shadow-xl">Exit Hub</button>
            </div>
          </div>
        </header>

        <div className="bg-slate-900 border border-slate-800 rounded-[3rem] overflow-hidden shadow-2xl min-h-[600px] backdrop-blur-3xl">
          {view === 'registry' && (
            <RegistryView registry={registry} searchTerm={searchTerm} setSearchTerm={setSearchTerm} onRemoteView={onRemoteView} />
          )}
          {view === 'rewards' && (
            <NetworkRewardsView registry={registry} />
          )}
          {view === 'unified-audit' && (
            <UnifiedAuditMasterView registry={registry} />
          )}
          {view === 'rankings' && (
            <ReratingView schoolRankings={schoolRankings} />
          )}
          {view === 'pupils' && (
            <PupilNetworkRankingView registry={registry} onRemoteView={onRemoteView} />
          )}
          {view === 'audit' && (
            <AuditLogView registry={registry} selectedAuditId={selectedAuditId} setSelectedAuditId={setSelectedAuditId} onRemoteView={onRemoteView} />
          )}
          {view === 'remarks' && (
            <RemarkAnalyticsView subjectDemands={subjectDemands} />
          )}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminPortal;