import { DailyStats, User, Mission } from '../types';

export const CURRENT_USER_ID = 'u1';

export const USERS: User[] = [
  { id: 'u1', name: 'You', initials: 'ME' },
  { id: 'u2', name: 'Alex', initials: 'AL' },
  { id: 'u3', name: 'Sarah', initials: 'SA' },
  { id: 'u4', name: 'Mike', initials: 'MI' },
];

export const TODAY_MISSION: Mission = {
  title: 'WOD: The Engine Builder',
  description: 'Run 5k (Zone 2) + 100 Wall Balls (20/14lb). For Time.',
};

// Generate last 70 days of history
export const generateHistory = (): DailyStats[] => {
  const history: DailyStats[] = [];
  const today = new Date();
  
  // Create 69 past days (total 70 with today included conceptually in stats)
  for (let i = 69; i > 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    
    // Random completion count weighted towards 2-4 for realism
    const rand = Math.random();
    let count = 0;
    if (rand > 0.8) count = 4;
    else if (rand > 0.5) count = 3;
    else if (rand > 0.3) count = 2;
    else if (rand > 0.1) count = 1;
    
    history.push({
      date: dateStr,
      count: count,
      records: [] // We don't need detailed records for history in this MVP view
    });
  }
  return history;
};

export const getStreakCount = (history: DailyStats[]): number => {
  let streak = 0;
  // Iterate backwards from the last entry
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].count > 0) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
};