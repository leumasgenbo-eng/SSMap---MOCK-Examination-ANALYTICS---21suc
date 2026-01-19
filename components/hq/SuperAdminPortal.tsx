import React, { useState, useEffect, useMemo, useRef } from 'react';
import { SchoolRegistryEntry, RemarkMetric } from '../../types';

// Sub-portals
import RegistryView from './RegistryView';
import ReratingView from './ReratingView';
import AuditLogView from './AuditLogView';
import RemarkAnalyticsView from './RemarkAnalyticsView';
import PupilNetworkRankingView from './PupilNetworkRankingView';
import NetworkRewardsView from './NetworkRewardsView';
import NetworkSigDiffView from './NetworkSigDiffView';
import NetworkAnnualAuditReport from './NetworkAnnualAuditReport';

// Fix: Exported SubjectDemandMetric interface required by RemarkAnalyticsView
export interface SubjectDemandMetric {
  subject: string;
  demandScore: number;
  difficultyRating: number;
  networkMeanPerformance: number;
  maleRemarkShare: number;
  femaleRemarkShare: number;
  topRemark: string;
  remarkCount: number;
}

export interface SystemAuditEntry {
  timestamp: string;
  action: string;
  target: string;
  actor: string;
  details: string;
  year: string;
}

const SuperAdminPortal: React.FC<{ onExit: () => void; onRemoteView: (schoolId: string) => void; }> = ({ onExit, onRemoteView }) => {
  const [registry, setRegistry] = useState<SchoolRegistryEntry[]>([]);
  const [auditTrail, setAuditTrail] = useState<SystemAuditEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState<'registry' | 'rankings' | 'remarks' | 'audit' | 'pupils' | 'rewards' | 'sig-diff' | 'annual-report'>('registry');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedReg = localStorage.getItem('uba_global_registry');
    if (savedReg) setRegistry(JSON.parse(savedReg));
    
    const savedAudit = localStorage.getItem('uba_master_audit_trail');
    if (savedAudit) setAuditTrail(JSON.parse(savedAudit));
  }, []);

  const logAction = (action: string, target: string, details: string) => {
    const newEntry: SystemAuditEntry = {
      timestamp: new Date().toISOString(),
      action,
      target,
      actor: "SYSTEM_SUPERADMIN",
      details,
      year: new Date().getFullYear().toString()
    };
    const nextAudit = [newEntry, ...auditTrail];
    setAuditTrail(nextAudit);
    localStorage.setItem('uba_master_audit_trail', JSON.stringify(nextAudit));
  };

  const handleUpdateRegistry = (next: SchoolRegistryEntry[]) => {
    setRegistry(next);
    localStorage.setItem('uba_global_registry', JSON.stringify(next));
  };

  const handleMasterBackup = () => {
    const backupData = {
      type: "SSMAP_MASTER_SNAPSHOT",
      timestamp: new Date().toISOString(),
      registry,
      auditTrail
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SSMAP_MASTER_BACKUP_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    logAction("MASTER_BACKUP", "GLOBAL_SYSTEM", "Full network state exported to JSON.");
  };

  const handleMasterRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (json.type !== "SSMAP_MASTER_SNAPSHOT") throw new Error("Invalid format.");
        if (window.confirm(`RESTORE PROTOCOL: Overwrite current network with ${json.registry.length} nodes? This cannot be undone.`)) {
          setRegistry(json.registry);
          setAuditTrail(json.auditTrail || []);
          localStorage.setItem('uba_global_registry', JSON.stringify(json.registry));
          localStorage.setItem('uba_master_audit_trail', JSON.stringify(json.auditTrail || []));
          logAction("MASTER_RESTORE", "GLOBAL_SYSTEM", `System restored from backup dated ${json.timestamp}`);
          alert("Network State Restored.");
        }
      } catch (err) { alert("Restore Error: File corrupted or invalid."); }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Fix: Added calculation for school rankings used by ReratingView
  const schoolRankings = useMemo(() => {
    const processed = registry.map(school => {
      const history = school.performanceHistory || [];
      const latest = history[history.length - 1];
      return {
        id: school.id,
        name: school.name,
        compositeAvg: latest?.avgComposite || 0,
        aggregateAvg: latest?.avgAggregate || 0,
        objectiveAvg: latest?.avgObjective || 0,
        theoryAvg: latest?.avgTheory || 0,
      };
    });

    const calculateStats = (vals: number[]) => {
      if (vals.length === 0) return { mean: 0, std: 1 };
      const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
      const std = Math.sqrt(vals.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / vals.length) || 1;
      return { mean, std };
    };

    const cStats = calculateStats(processed.map(p => p.compositeAvg));
    const aStats = calculateStats(processed.map(p => p.aggregateAvg));

    return processed.map(p => {
      const zC = (p.compositeAvg - cStats.mean) / cStats.std;
      const zA = -(p.aggregateAvg - aStats.mean) / aStats.std;
      const strengthIndex = (zC + zA) / 2 + 5;
      return { ...p, strengthIndex };
    }).sort((a, b) => b.strengthIndex - a.strengthIndex);
  }, [registry]);

  // Fix: Added calculation for subject demands used by RemarkAnalyticsView
  const subjectDemands = useMemo(() => {
    const map: Record<string, SubjectDemandMetric> = {};
    
    registry.forEach(school => {
      const tel = school.remarkTelemetry;
      if (!tel || !tel.subjectRemarks) return;
      
      // Fix: Explicitly cast Object.entries result to resolve unknown type inference for metrics which caused Property 'forEach' does not exist on type 'unknown' error
      (Object.entries(tel.subjectRemarks) as [string, RemarkMetric[]][]).forEach(([subject, metrics]) => {
        if (!map[subject]) {
          map[subject] = {
            subject,
            demandScore: 0,
            difficultyRating: 0,
            networkMeanPerformance: 68.5,
            maleRemarkShare: 0,
            femaleRemarkShare: 0,
            topRemark: metrics[0]?.text || "No specific observations recorded.",
            remarkCount: 0
          };
        }
        
        let subMales = 0;
        let subFemales = 0;
        metrics.forEach(m => {
          map[subject].remarkCount += m.count;
          subMales += m.maleCount;
          subFemales += m.femaleCount;
        });

        const total = subMales + subFemales || 1;
        map[subject].maleRemarkShare = (subMales / total) * 100;
        map[subject].femaleRemarkShare = (subFemales / total) * 100;
        map[subject].demandScore = Math.min(100, map[subject].remarkCount * 1.5);
        map[subject].difficultyRating = Math.min(10, Math.ceil(map[subject].remarkCount / 10));
      });
    });

    return Object.values(map);
  }, [registry]);

  const stats = useMemo(() => ({
    total: registry.length,
    active: registry.filter(r => r.status === 'active').length,
    totalStudents: registry.reduce((sum, r) => sum + r.studentCount, 0)
  }), [registry]);

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
              <p className="text-[9px] font-black text-blue-400 uppercase tracking-[0.4em] mt-1">Institutional Network Management System (SS-MAP)</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <div className="flex bg-slate-900/50 p-1 rounded-2xl border border-slate-800 backdrop-blur-md overflow-x-auto no-scrollbar max-w-full">
              {/* Fix: Restored full navigation tabs to access all portal views */}
              {[
                { id: 'registry', label: 'Network Ledger' },
                { id: 'rankings', label: 'Rerating' },
                { id: 'pupils', label: 'Talent Matrix' },
                { id: 'rewards', label: 'Global Rewards' },
                { id: 'sig-diff', label: 'Sig-Diff Matrix' },
                { id: 'remarks', label: 'Demand Matrix' },
                { id: 'annual-report', label: 'Network Audit' },
                { id: 'audit', label: 'Audit Trail' },
              ].map(tab => (
                <button key={tab.id} onClick={() => setView(tab.id as any)} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${view === tab.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>{tab.label}</button>
              ))}
            </div>
            <div className="flex gap-2">
               <button onClick={handleMasterBackup} className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-2xl font-black text-[10px] uppercase shadow-lg transition-all flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Master Backup
               </button>
               <button onClick={() => fileInputRef.current?.click()} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-5 py-3 rounded-2xl font-black text-[10px] uppercase border border-slate-700 transition-all">
                  Restore
               </button>
               <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleMasterRestore} />
               <button onClick={onExit} className="bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase border border-red-500/20 transition-all">Exit HQ</button>
            </div>
          </div>
        </header>

        <div className="bg-slate-900 border border-slate-800 rounded-[3rem] shadow-2xl min-h-[600px] overflow-hidden relative">
          {/* Fix: Restored conditional rendering for all portal views */}
          {view === 'registry' && (
            <RegistryView 
              registry={registry} 
              searchTerm={searchTerm} 
              setSearchTerm={setSearchTerm} 
              onRemoteView={onRemoteView} 
              onUpdateRegistry={handleUpdateRegistry}
              onLogAction={logAction}
            />
          )}
          {view === 'rankings' && <ReratingView schoolRankings={schoolRankings} />}
          {view === 'remarks' && <RemarkAnalyticsView subjectDemands={subjectDemands} />}
          {view === 'pupils' && <PupilNetworkRankingView registry={registry} onRemoteView={onRemoteView} />}
          {view === 'rewards' && <NetworkRewardsView registry={registry} />}
          {view === 'sig-diff' && <NetworkSigDiffView registry={registry} />}
          {view === 'annual-report' && <NetworkAnnualAuditReport registry={registry} />}
          {view === 'audit' && <AuditLogView auditTrail={auditTrail} />}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminPortal;