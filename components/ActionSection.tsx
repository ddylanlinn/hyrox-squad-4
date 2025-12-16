import React, { useRef, useState } from 'react';
import { Mission } from '../types';
import { Camera, Copy, Dumbbell, Loader2, Check, Pencil, Save } from 'lucide-react';

interface ActionSectionProps {
  mission: Mission;
  isCompleted: boolean;
  onCheckIn: (file: File) => void;
  completedCount: number;
  onUpdateMission: (newMission: Mission) => void;
}

const ActionSection: React.FC<ActionSectionProps> = ({ 
  mission, 
  isCompleted, 
  onCheckIn, 
  completedCount, 
  onUpdateMission 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(mission.title);
  const [editDesc, setEditDesc] = useState(mission.description);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLoading(true);
      setTimeout(() => {
        onCheckIn(e.target.files![0]);
        setLoading(false);
      }, 1500);
    }
  };

  const handleNudge = () => {
    const messages = [
      "Wake up squad! Only I have trained today? 😤",
      "Let's go team! Don't break the streak! 🔥",
      "Training done. Who's next? ⚡️",
      "Hyrox waits for no one. Get it done! 🏋️",
    ];
    const msg = completedCount === 4 
      ? "Squad goal achieved! 💪" 
      : messages[Math.floor(Math.random() * messages.length)];

    navigator.clipboard.writeText(`${mission.title}\n${mission.description}\n\n${msg}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    onUpdateMission({
      title: editTitle,
      description: editDesc
    });
    setIsEditing(false);
  };

  return (
    <div className="w-full px-5 pb-8 pt-4 bg-gradient-to-t from-white via-white to-transparent">
      
      {/* WOD Card */}
      <div className="bg-white border border-zinc-100 shadow-[0_4px_20px_rgba(0,0,0,0.05)] rounded-2xl p-5 mb-6 relative group">
        {!isEditing ? (
          <>
            <div className="absolute top-4 right-4 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => setIsEditing(true)}
                className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 rounded-full transition-colors"
              >
                <Pencil size={16} />
              </button>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-lime-50 rounded-xl text-lime-600 mt-1 shrink-0">
                <Dumbbell size={24} />
              </div>
              <div>
                <h3 className="text-zinc-900 font-bold text-lg leading-tight pr-8">{mission.title}</h3>
                <p className="text-zinc-500 text-sm mt-2 leading-relaxed">
                  {mission.description}
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center mb-1">
               <span className="text-xs font-bold text-zinc-400 uppercase">Edit Workout</span>
               <button 
                onClick={handleSave}
                className="flex items-center gap-1 text-xs font-bold bg-zinc-900 text-white px-3 py-1.5 rounded-full"
               >
                 <Save size={12} /> Save
               </button>
            </div>
            <input 
              type="text" 
              value={editTitle} 
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full font-bold text-lg border-b border-zinc-200 focus:border-lime-500 outline-none py-1 bg-transparent text-zinc-900 placeholder:text-zinc-300"
              placeholder="Workout Title"
            />
            <textarea 
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              className="w-full text-sm text-zinc-600 border border-zinc-200 rounded-lg p-3 focus:border-lime-500 outline-none bg-zinc-50 min-h-[80px]"
              placeholder="Description (e.g., 5k Run + 100 Burpees)"
            />
          </div>
        )}
      </div>

      {/* Main Action Button */}
      {!isCompleted ? (
        <div className="sticky bottom-6">
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="w-full bg-zinc-900 text-white font-bold text-lg py-4 rounded-xl flex items-center justify-center gap-3 shadow-[0_8px_20px_rgba(24,24,27,0.3)] active:scale-95 transition-transform"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" /> Uploading...
              </>
            ) : (
              <>
                <Camera size={24} /> 
                CHECK-IN
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="sticky bottom-6">
          <button
            onClick={handleNudge}
            className={`
              w-full font-bold text-lg py-4 rounded-xl flex items-center justify-center gap-3 transition-all active:scale-95 border
              ${copied 
                ? 'bg-lime-400 text-black border-lime-400 shadow-[0_0_20px_rgba(163,230,53,0.4)]' 
                : 'bg-white text-zinc-900 border-zinc-200 shadow-lg'
              }
            `}
          >
            {copied ? (
              <>
                <Check size={24} /> 
                COPIED!
              </>
            ) : (
              <>
                <Copy size={24} /> 
                NUDGE SQUAD
              </>
            )}
          </button>
          <p className="text-center text-zinc-400 text-xs mt-3 font-medium">
            Great work! Now motivate the others.
          </p>
        </div>
      )}
    </div>
  );
};

export default ActionSection;