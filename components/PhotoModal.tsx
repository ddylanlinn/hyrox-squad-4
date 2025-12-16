import React from 'react';
import { User, WorkoutRecord } from '../types';
import { X, Clock, Quote } from 'lucide-react';

interface PhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: WorkoutRecord | null;
  user: User | undefined;
}

const PhotoModal: React.FC<PhotoModalProps> = ({ isOpen, onClose, record, user }) => {
  if (!isOpen || !record || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      
      {/* Close Button */}
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 z-10 p-2 bg-zinc-800/50 rounded-full text-white backdrop-blur-sm"
      >
        <X size={24} />
      </button>

      <div className="w-full h-full flex flex-col relative">
        
        {/* Image Container */}
        <div className="flex-1 flex items-center justify-center p-4">
          <img 
            src={record.imageUrl} 
            alt="Workout Proof" 
            className="max-h-full max-w-full rounded-lg shadow-2xl object-contain"
          />
        </div>

        {/* Info Overlay */}
        <div className="bg-gradient-to-t from-black via-black/80 to-transparent pt-12 pb-10 px-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-lime-400 flex items-center justify-center text-black font-bold">
              {user.initials}
            </div>
            <div>
              <h3 className="text-white font-bold text-xl">{user.name}</h3>
              <div className="flex items-center text-zinc-400 text-xs gap-1">
                <Clock size={12} />
                <span>{new Date(record.completedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
            </div>
          </div>
          
          {record.note && (
            <div className="mt-4 p-3 bg-zinc-800/50 rounded-lg border-l-4 border-lime-400 backdrop-blur-sm">
                <div className="flex gap-2">
                    <Quote size={16} className="text-lime-400 shrink-0" />
                    <p className="text-zinc-200 text-sm italic">
                        "{record.note}"
                    </p>
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PhotoModal;