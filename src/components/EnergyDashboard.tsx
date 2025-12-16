import React, { useEffect, useState } from 'react';
import { User, WorkoutRecord } from '../types';
import { Check } from 'lucide-react';

interface EnergyDashboardProps {
  users: User[];
  records: WorkoutRecord[];
  onAvatarClick: (record: WorkoutRecord) => void;
}

const EnergyDashboard: React.FC<EnergyDashboardProps> = ({ users, records, onAvatarClick }) => {
  const [percent, setPercent] = useState(0);

  // Calculate percentage based on 4 members
  const completedCount = records.length;
  const targetPercent = (completedCount / 4) * 100;

  useEffect(() => {
    const timer = setTimeout(() => {
      setPercent(targetPercent);
    }, 100);
    return () => clearTimeout(timer);
  }, [targetPercent]);

  // SVG Config
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center flex-1 py-4 relative">
      
      {/* Power Ring */}
      <div className="relative w-64 h-64 flex items-center justify-center mb-8">
        {/* Background Circle */}
        <svg className="absolute top-0 left-0 w-full h-full transform -rotate-90">
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            fill="transparent"
            stroke="#e4e4e7" // zinc-200 for light mode
            strokeWidth="12"
            strokeLinecap="round"
          />
          {/* Progress Circle */}
          <circle
            className="ring-circle"
            cx="50%"
            cy="50%"
            r={radius}
            fill="transparent"
            stroke={percent === 100 ? '#84cc16' : '#22c55e'} // lime-500 or green-500
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ 
                filter: percent === 100 ? 'drop-shadow(0 0 8px rgba(132,204,22,0.5))' : 'none' 
            }}
          />
        </svg>

        {/* Center Stats */}
        <div className="z-10 text-center">
          <div className="text-6xl font-black text-zinc-900 tabular-nums tracking-tighter">
            {percent}<span className="text-3xl text-zinc-400">%</span>
          </div>
          <div className="text-zinc-400 text-sm uppercase tracking-widest font-bold mt-1">
            Energy
          </div>
        </div>
      </div>

      {/* Satellites (User Avatars) */}
      <div className="flex justify-center gap-4 w-full px-4">
        {users.map((user) => {
          const userRecord = records.find(r => r.userId === user.id);
          const isDone = !!userRecord;

          return (
            <button
              key={user.id}
              onClick={() => isDone && userRecord ? onAvatarClick(userRecord) : null}
              disabled={!isDone}
              className={`
                group relative flex items-center justify-center w-14 h-14 rounded-full border-2 transition-all duration-300
                ${isDone 
                  ? 'border-lime-500 bg-white cursor-pointer hover:scale-105 shadow-[0_4px_12px_rgba(132,204,22,0.3)]' 
                  : 'border-zinc-200 bg-zinc-50 opacity-60'
                }
              `}
            >
              {isDone ? (
                <>
                  <img 
                    src={userRecord?.imageUrl} 
                    alt={user.name} 
                    className="w-full h-full object-cover rounded-full p-[2px]" 
                  />
                  <div className="absolute -bottom-1 -right-1 bg-lime-500 text-white rounded-full p-0.5 border-2 border-white">
                    <Check size={10} strokeWidth={4} />
                  </div>
                </>
              ) : (
                <span className="text-zinc-400 font-bold text-sm">{user.initials}</span>
              )}
              
              {/* Name Label */}
              <span className={`absolute -bottom-6 text-[10px] font-bold tracking-wide ${isDone ? 'text-lime-600' : 'text-zinc-400'}`}>
                {user.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default EnergyDashboard;