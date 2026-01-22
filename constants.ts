
import { RiskAppetite } from './types';

export const DEFAULT_SAVINGS_RATIO = 0.20;

export const RISK_MULTIPLIERS = {
  [RiskAppetite.LOW]: 0.15,
  [RiskAppetite.MEDIUM]: 0.25,
  [RiskAppetite.HIGH]: 0.40
};

export const OPPORTUNITY_COST_RATE = 0.12; // 12% Annual return
export const OPPORTUNITY_COST_YEARS = 10;
