import type { GameEvent } from './GameEventBus';

export interface CircleReport {
  circleNumber: number;
  startTime: number;
  endTime: number;
  deaths: number;
  kills: number;
  eventsCount: number;
}

export interface RunReport {
  seed: string;
  difficulty: string;
  startTime: number;
  endTime: number;
  totalDeaths: number;
  totalKills: number;
  circleReports: CircleReport[];
  events: GameEvent[];
}

export function createRunReport(seed: string, difficulty: string): RunReport {
  return {
    seed,
    difficulty,
    startTime: Date.now(),
    endTime: 0,
    totalDeaths: 0,
    totalKills: 0,
    circleReports: [],
    events: [],
  };
}
