import { GameOutcome } from '../types';

export const GAME_OUTCOMES: GameOutcome[] = [
  { multiplier: 0, label: '0x', color: '#ef4444', weight: 50 },
  { multiplier: 0.5, label: '0.5x', color: '#f97316', weight: 20 },
  { multiplier: 1, label: '1x', color: '#eab308', weight: 15 },
  { multiplier: 2, label: '2x', color: '#22c55e', weight: 10 },
  { multiplier: 5, label: '5x', color: '#3b82f6', weight: 4 },
  { multiplier: 10, label: '10x', color: '#a855f7', weight: 1 },
];

/**
 * Selects a random outcome based on weights.
 * This is "unpredictable" but ensures a long-term house edge.
 */
export function getSpinOutcome(): GameOutcome {
  const totalWeight = GAME_OUTCOMES.reduce((sum, outcome) => sum + outcome.weight, 0);
  let random = Math.random() * totalWeight;

  for (const outcome of GAME_OUTCOMES) {
    if (random < outcome.weight) {
      return outcome;
    }
    random -= outcome.weight;
  }

  return GAME_OUTCOMES[0]; // Fallback
}

/**
 * Calculates the expected RTP (Return to Player) based on current weights.
 */
export function calculateRTP(): number {
  const totalWeight = GAME_OUTCOMES.reduce((sum, outcome) => sum + outcome.weight, 0);
  const totalPayout = GAME_OUTCOMES.reduce((sum, outcome) => sum + (outcome.multiplier * outcome.weight), 0);
  return (totalPayout / totalWeight) * 100;
}
