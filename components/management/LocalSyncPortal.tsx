
import React, { useState, useEffect } from 'react';
import { StudentData, GlobalSettings } from '../../types';

interface LocalSyncPortalProps {
  students: StudentData[];
  settings: GlobalSettings;
  onSyncComplete: (data: { students: StudentData[]; settings: GlobalSettings }) => void;
}

const LocalSyncPortal: React.FC<LocalSyncPortalProps> = ({ students, settings, onSyncComplete }) => {
  const [protocol, setProtocol] = useState<'bluetooth' | 'wifi'>('bluetooth');
  const [isSearching, setIsSearching] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [discoveredDevices, setDiscoveredDevices] = useState<{ name: string; id: string; signal: number }[]>([]);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 4)]);

  const startDiscovery = () => {
    setIsSearching(true);
    setDiscoveredDevices([]);
    addLog(`Initiating ${protocol.toUpperCase()} discovery protocol...`);
    
    setTimeout(() => {
      setDiscoveredDevices([
        { name: 'UBA-DIRECT-NODE-01', id: 'D4:A1:75:32', signal: 85 },
        { name: 'ACADEMY-TABLET-SECURE', id: 'FF:21:00:19', signal: 42 }
      ]);
      addLog('Discovery complete. Local nodes identified.');
      setIsSearching(false);
    }, 2500);
  };

  const handleSync = (deviceName: string) => {
    setIsSyncing(true);
    setSyncProgress(0);
    addLog(`Establishing handshake with ${deviceName}...`);

    const interval = setInterval(() => {
      setSyncProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsSyncing(false);
          addLog(`Synchronization successful. Institutional database mirrored.`);
          alert(`Sync successful with ${deviceName}. 100% of academy records mirrored.`);
          return 100;
        }
        if (prev === 20) addLog('Verifying checksums...');
        if (prev === 50) addLog('Migrating pupil score delta...');
        if (prev === 80) addLog('Finalizing institutional particulars...');
        return prev + 10;
      });
    }, 400);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header Panel */}
      <div className="bg-indigo-950 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>
        <div className="relative flex flex-col md:flex-row justify-between items-center gap-8">
           <div className="space-y-2 text-center md:text-left">
              <h3 className="text-2xl font-black uppercase tracking-tight">Local Sync Desk</h3>
              <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-[0.3em]">Institutional Data Redundancy Protocol</p>
           </div>
           <div className="flex bg-white/10 p-1 rounded-2xl border border-white/10 backdrop-blur-md">
              <button 
                onClick={() => setProtocol('bluetooth')}
                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${protocol === 'bluetooth' ? 'bg-blue-600 text-white' : 'text-indigo-200 hover:text-white'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6.5 6.5 17.5 17.5 12 23 12 1 17.5 6.5 6.5 17.5"></polyline></svg>
                Bluetooth
              </button>
              <button 
                onClick={() => setProtocol('wifi')}
                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${protocol === 'wifi' ? 'bg-blue-600 text-white' : 'text-indigo-200 hover:text-white'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg>
                WiFi Direct
              </button>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Device Discovery */}
        <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-xl overflow-hidden flex flex-col min-h-[400px]">
           <div className="bg-gray-50 px-8 py-6 border-b border-gray-100 flex justify-between items-center">
              <h4 className="text-[10px] font-black text-blue-900 uppercase tracking-widest">Nearby Academy Hubs</h4>
              <button 
                disabled={isSearching || isSyncing}
                onClick={startDiscovery}
                className={`px-5 py-2 rounded-xl font-black text-[9px] uppercase transition-all border ${isSearching ? 'bg-gray-100 text-gray-400' : 'bg-white text-blue-900 border-blue-100 hover:bg-blue-50'}`}
              >
                {isSearching ? 'Scanning...' : 'Search for Hubs'}
              </button>
           </div>
           
           <div className="flex-1 p-8">
              {isSearching ? (
                 <div className="h-full flex flex-col items-center justify-center space-y-6">
                    <div className="relative">
                       <div className="w-16 h-16 border-4 border-blue-900/10 rounded-full"></div>
                       <div className="absolute inset-0 border-4 border-blue-900 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse">Broadcasting identity beacon...</p>
                 </div>
              ) : discoveredDevices.length > 0 ? (
                 <div className="space-y-4">
                    {discoveredDevices.map(device => (
                       <div key={device.id} className="bg-gray-50 p-6 rounded-3xl border border-gray-100 flex justify-between items-center group/dev hover:border-blue-200 transition-all">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-100">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-900"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
                             </div>
                             <div className="space-y-1">
                                <p className="text-sm font-black text-gray-900 uppercase leading-none">{device.name}</p>
                                <div className="flex items-center gap-2">
                                   <span className="text-[8px] font-mono font-bold text-gray-400 uppercase">{device.id}</span>
                                   <div className="flex gap-0.5">
                                      {Array.from({ length: 4 }).map((_, i) => (
                                         <div key={i} className={`w-0.5 h-2 rounded-full ${i < (device.signal / 25) ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                                      ))}
                                   </div>
                                </div>
                             </div>
                          </div>
                          <button 
                            disabled={isSyncing}
                            onClick={() => handleSync(device.name)}
                            className="bg-blue-900 text-white px-5 py-2.5 rounded-xl font-black text-[9px] uppercase shadow-lg active:scale-95 transition-all"
                          >
                            Synchronize
                          </button>
                       </div>
                    ))}
                 </div>
              ) : (
                 <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-30">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    <p className="text-[10px] font-black uppercase tracking-widest">No local hubs detected in range</p>
                 </div>
              )}
           </div>
        </div>

        {/* Sync Status & Logs */}
        <div className="space-y-8">
           <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-xl space-y-6">
              <h4 className="text-[10px] font-black text-blue-900 uppercase tracking-widest border-b border-gray-50 pb-4">Sync Integrity Console</h4>
              
              <div className="space-y-4">
                 <div className="flex justify-between items-end">
                    <span className="text-[9px] font-black text-gray-400 uppercase">Synchronization Load</span>
                    <span className="text-xl font-black text-blue-900 font-mono">{syncProgress}%</span>
                 </div>
                 <div className="h-4 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                    <div 
                      className="h-full bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all duration-300"
                      style={{ width: `${syncProgress}%` }}
                    ></div>
                 </div>
              </div>

              <div className="bg-gray-900 rounded-3xl p-6 space-y-3 shadow-inner">
                 <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-2">Live Communication Log:</p>
                 <div className="space-y-2">
                    {logs.length > 0 ? logs.map((log, i) => (
                       <p key={i} className={`text-[10px] font-mono leading-none ${i === 0 ? 'text-white' : 'text-gray-500'}`}>{log}</p>
                    )) : <p className="text-[10px] font-mono text-gray-600">Awaiting protocol initiation...</p>}
                 </div>
              </div>
           </div>

           <div className="bg-blue-50 border border-blue-100 rounded-[2.5rem] p-8 flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
              </div>
              <div className="space-y-2">
                 <h5 className="text-[11px] font-black text-blue-900 uppercase">Operational Notice</h5>
                 <p className="text-[10px] text-blue-700 leading-relaxed italic">
                   Local Sync enables rapid device mirroring without an internet connection. Ensure both devices remain within 5 meters for optimal signal integrity.
                 </p>
              </div>
           </div>
        </div>
      </div>

    </div>
  );
};

export default LocalSyncPortal;
