import React, { useState } from 'react';
import { StudentData, GlobalSettings, ProcessedStudent, StaffAssignment } from '../../types';

// Sub-portals
import ScoreEntryPortal from './ScoreEntryPortal';
import AcademyIdentityPortal from './AcademyIdentityPortal';
import PupilSBAPortal from './PupilSBAPortal';
import FacilitatorPortal from './FacilitatorPortal';
import GradingConfigPortal from './GradingConfigPortal';
import SeriesHistoryPortal from './SeriesHistoryPortal';
import MockResourcesPortal from './MockResourcesPortal';
import FacilitatorDesk from './FacilitatorDesk';
import SchoolRegistrationPortal from '../auth/SchoolRegistrationPortal';
import LocalSyncPortal from './LocalSyncPortal';
import RewardPortal from './RewardPortal';

// Extracted UI Layout components
import ManagementHeader from './ManagementHeader';
import ManagementTabs, { ManagementTabType } from './ManagementTabs';

interface ManagementDeskProps {
  students: StudentData[];
  setStudents: React.Dispatch<React.SetStateAction<StudentData[]>>;
  facilitators: Record<string, StaffAssignment>;
  setFacilitators: React.Dispatch<React.SetStateAction<Record<string, StaffAssignment>>>;
  subjects: string[];
  settings: GlobalSettings;
  onSettingChange: (key: keyof GlobalSettings, value: any) => void;
  onBulkUpdate: (updates: Partial<GlobalSettings>) => void;
  onSave: () => void;
  processedSnapshot: ProcessedStudent[];
  onLoadDummyData: () => void;
  onClearData: () => void;
  onRegistrationStart?: () => void;
  onRegistrationComplete?: () => void;
  onRegistrationExit?: () => void;
  onResetStudents?: () => void;
  isFacilitator?: boolean;
  activeFacilitator?: { name: string; subject: string } | null;
}

const ManagementDesk: React.FC<ManagementDeskProps> = ({ 
  students, setStudents, facilitators, setFacilitators, subjects, settings, onSettingChange, onBulkUpdate, onSave, processedSnapshot, onLoadDummyData, onClearData,
  onRegistrationStart, onRegistrationComplete, onRegistrationExit, onResetStudents, isFacilitator, activeFacilitator
}) => {
  const [activeTab, setActiveTab] = useState<ManagementTabType>(settings.accessCode ? 'scoreEntry' : 'credentials');

  const handleDownloadFullBackup = () => {
    const backupData = {
      timestamp: new Date().toISOString(),
      institution: settings.schoolName,
      id: settings.schoolNumber,
      payload: { settings, students, facilitators }
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `UBA_Backup_${settings.schoolNumber || 'HUB'}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetSchoolParticulars = () => {
    if (window.confirm("REVERSE DEMO / PURGE: This will permanently delete all student scores, mock history, and staff assignments. Proceed?")) {
      setStudents(prev => prev.map(student => ({
        ...student, scores: {}, sbaScores: {}, examSubScores: {}, mockData: {}, seriesHistory: {}, attendance: 0, conductRemark: ""
      })));
      const resetFacilitators = { ...facilitators };
      Object.keys(resetFacilitators).forEach(key => {
        resetFacilitators[key].invigilations = Array.from({ length: 9 }, () => ({ dutyDate: '', timeSlot: '', subject: '' }));
        resetFacilitators[key].marking = { dateTaken: '', dateReturned: '', inProgress: false };
      });
      setFacilitators(resetFacilitators);
      onSettingChange('resourcePortal', {});
      onSettingChange('mockSnapshots', {});
      setTimeout(() => onSave(), 500);
      alert("Institutional records have been purged.");
    }
  };

  return (
    <div className="p-0 sm:p-4 md:p-8 max-w-7xl mx-auto pb-24 sm:pb-8">
      <div className="bg-white rounded-none sm:rounded-2xl shadow-xl overflow-hidden border-b sm:border border-gray-200">
        <ManagementHeader 
            schoolName={settings.schoolName} 
            isHubActive={!!settings.schoolNumber} 
            onLoadDummyData={onLoadDummyData} 
            onClearData={onClearData}
            hasData={students.length > 0}
        />
        <ManagementTabs activeTab={activeTab} setActiveTab={setActiveTab} onRegistrationStart={onRegistrationStart} isFacilitator={isFacilitator} />
        <div className="p-3 sm:p-6 md:p-8 min-h-[500px]">
          {activeTab === 'scoreEntry' && <ScoreEntryPortal students={students} setStudents={setStudents} settings={settings} onSettingChange={onSettingChange} subjects={subjects} processedSnapshot={processedSnapshot} onSave={onSave} />}
          {activeTab === 'facilitatorDesk' && <FacilitatorDesk students={students} setStudents={setStudents} settings={settings} onSettingChange={onSettingChange} onSave={onSave} />}
          {activeTab === 'localSync' && <LocalSyncPortal students={students} settings={settings} onSyncComplete={(data) => { setStudents(data.students); onBulkUpdate(data.settings); onSave(); }} />}
          {activeTab === 'rewards' && <RewardPortal students={students} setStudents={setStudents} settings={settings} subjects={subjects} facilitators={facilitators} onSave={onSave} onSettingChange={onSettingChange} isFacilitator={isFacilitator} />}
          {activeTab === 'credentials' && (
            <SchoolRegistrationPortal 
              settings={settings} 
              onBulkUpdate={onBulkUpdate} 
              onSave={onSave} 
              onComplete={onRegistrationComplete} 
              onExit={onRegistrationExit} 
              onResetStudents={onResetStudents} 
              onSwitchToLogin={() => setActiveTab('scoreEntry')} 
            />
          )}
          {activeTab === 'school' && (
            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row justify-end gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <button onClick={handleDownloadFullBackup} className="bg-indigo-900 text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase shadow-lg hover:bg-black transition-all flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="14 15 14 20 20 20"></polyline><line x1="21" y1="15" x2="21" y2="3"></line></svg>
                  Export Full Hub Backup
                </button>
                <button onClick={resetSchoolParticulars} className="bg-red-50 text-red-600 px-6 py-2.5 rounded-xl font-black text-[10px] uppercase border border-red-100 shadow-sm hover:bg-red-600 hover:text-white transition-all flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  System Reset
                </button>
              </div>
              <AcademyIdentityPortal settings={settings} onSettingChange={onSettingChange} onSave={onSave} />
            </div>
          )}
          {activeTab === 'pupils' && <PupilSBAPortal students={students} setStudents={setStudents} settings={settings} subjects={subjects} />}
          {activeTab === 'facilitators' && <FacilitatorPortal subjects={subjects} facilitators={facilitators} setFacilitators={setFacilitators} settings={settings} isFacilitator={isFacilitator} activeFacilitator={activeFacilitator} />}
          {activeTab === 'grading' && <GradingConfigPortal settings={settings} onSettingChange={onSettingChange} />}
          {activeTab === 'history' && <SeriesHistoryPortal students={students} settings={settings} />}
          {activeTab === 'resources' && <MockResourcesPortal settings={settings} onSettingChange={onSettingChange} subjects={subjects} />}
        </div>
      </div>
    </div>
  );
};

export default ManagementDesk;