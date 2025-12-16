import React, { useState, useEffect } from 'react';
import HistoryHeatmap from './components/HistoryHeatmap';
import EnergyDashboard from './components/EnergyDashboard';
import ActionSection from './components/ActionSection';
import PhotoModal from './components/PhotoModal';
import { 
  generateHistory, 
  getStreakCount, 
  TODAY_MISSION, 
  USERS, 
  CURRENT_USER_ID 
} from './services/mockData';
import { WorkoutRecord, DailyStats, Mission } from './types';

const App: React.FC = () => {
  // State
  const [history, setHistory] = useState<DailyStats[]>([]);
  const [todaysRecords, setTodaysRecords] = useState<WorkoutRecord[]>([]);
  const [streak, setStreak] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<WorkoutRecord | null>(null);
  
  // Mission state allowing user edits
  const [mission, setMission] = useState<Mission>(TODAY_MISSION);

  // Initialize Data
  useEffect(() => {
    const hist = generateHistory();
    setHistory(hist);
    setStreak(getStreakCount(hist));
    
    // Check local storage for today's temporary state or initialize empty
    // For MVP demo, we start empty or with some dummy data if we wanted
    const dummyToday: WorkoutRecord[] = [
      {
        userId: 'u2', // Alex
        completedAt: new Date().toISOString(),
        imageUrl: 'https://picsum.photos/400/600?random=1',
        note: 'Dying after those wall balls 🥵'
      }
    ];
    setTodaysRecords(dummyToday);
  }, []);

  // Derived State
  const currentUserRecord = todaysRecords.find(r => r.userId === CURRENT_USER_ID);
  const isCompleted = !!currentUserRecord;

  // Handlers
  const handleCheckIn = (file: File) => {
    const objectUrl = URL.createObjectURL(file);
    
    const newRecord: WorkoutRecord = {
      userId: CURRENT_USER_ID,
      completedAt: new Date().toISOString(),
      imageUrl: objectUrl,
      note: 'Done! Let’s go squad!'
    };

    setTodaysRecords(prev => [...prev, newRecord]);
    
    // In a real app, we would update history optimistically here too
    // But history is strictly "past days" in this MVP structure
  };

  const handleAvatarClick = (record: WorkoutRecord) => {
    setSelectedRecord(record);
    setModalOpen(true);
  };

  const getSelectedUser = () => {
    return USERS.find(u => u.id === selectedRecord?.userId);
  };

  const handleUpdateMission = (newMission: Mission) => {
    setMission(newMission);
  };

  return (
    <div className="flex flex-col min-h-[100dvh] max-w-md mx-auto bg-white shadow-2xl overflow-hidden relative">
      
      {/* Section A: History */}
      <HistoryHeatmap 
        history={history} 
        todayCount={todaysRecords.length}
        streak={streak}
      />

      {/* Section B: Energy */}
      <EnergyDashboard 
        users={USERS}
        records={todaysRecords}
        onAvatarClick={handleAvatarClick}
      />

      {/* Section C: Action */}
      <ActionSection 
        mission={mission}
        isCompleted={isCompleted}
        onCheckIn={handleCheckIn}
        completedCount={todaysRecords.length}
        onUpdateMission={handleUpdateMission}
      />

      {/* Section D: Modal */}
      <PhotoModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        record={selectedRecord}
        user={getSelectedUser()}
      />

    </div>
  );
};

export default App;