import React from 'react';
import { DailyStats } from '../types';
import { Flame } from 'lucide-react';

interface HistoryHeatmapProps {
  history: DailyStats[];
  todayCount: number;
  streak: number;
}

const HistoryHeatmap: React.FC<HistoryHeatmapProps> = ({ history, streak }) => {
  
  const getColorClass = (count: number) => {
    switch (count) {
      case 0: return 'bg-gray-200';
      case 1: return 'bg-green-200';
      case 2: return 'bg-green-400';
      case 3: return 'bg-green-600';
      case 4: return 'bg-lime-500 shadow-[0_0_8px_rgba(132,204,22,0.6)]'; // Neon glow
      default: return 'bg-gray-200';
    }
  };

  return (
    <div className="w-full px-5 pt-8 pb-4">
      {/* Top Section: Streak */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Current Streak</h2>
          <div className="flex items-baseline gap-2">
             <span className="text-6xl font-black text-zinc-900 tracking-tighter leading-none">{streak}</span>
             <span className="text-zinc-500 font-medium text-lg">Days</span>
          </div>
        </div>
        <div className={`p-4 rounded-full ${streak > 0 ? 'bg-orange-100 text-orange-500' : 'bg-gray-100 text-gray-400'}`}>
          <Flame size={32} className={streak > 0 ? "fill-orange-500" : ""} />
        </div>
      </div>

      {/* Grid: Last 70 days. Using grid-cols-10 for a denser look. */}
      <div className="w-full">
        <div className="grid grid-cols-10 gap-1.5 w-full">
          {history.slice(-70).map((day) => (
            <div
              key={day.date}
              className={`aspect-square rounded-sm ${getColorClass(day.count)} transition-all duration-300 hover:scale-125 hover:z-10 hover:shadow-md`}
              title={`${day.date}: ${day.count} squad members`}
            />
          ))}
        </div>
        
        <div className="flex justify-between mt-2 px-1">
          <span className="text-[10px] text-zinc-400 font-medium">10 weeks ago</span>
          <span className="text-[10px] text-zinc-400 font-medium">Today</span>
        </div>
      </div>
    </div>
  );
};

export default HistoryHeatmap;