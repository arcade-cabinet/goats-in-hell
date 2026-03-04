import { gameEventBus } from './GameEventBus';
import { createRunReport, type RunReport } from './RunReport';

let _currentRun: RunReport | null = null;
let _unsubscribe: (() => void) | null = null;

export function startTelemetryRun(seed: string, difficulty: string): void {
  stopTelemetryRun();
  _currentRun = createRunReport(seed, difficulty);
  _unsubscribe = gameEventBus.on('*', (event) => {
    if (!_currentRun) return;
    _currentRun.events.push(event);
    if (event.type === 'enemy_killed') _currentRun.totalKills++;
    if (event.type === 'player_death') _currentRun.totalDeaths++;
  });
}

export function stopTelemetryRun(): void {
  _unsubscribe?.();
  _unsubscribe = null;
  if (_currentRun) _currentRun.endTime = Date.now();
}

export function getCurrentRun(): RunReport | null {
  return _currentRun;
}

export function exportRunReportJSON(): string {
  return JSON.stringify(_currentRun, null, 2);
}
