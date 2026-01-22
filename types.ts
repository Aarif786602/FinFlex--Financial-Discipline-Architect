
export enum RiskAppetite {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High'
}

export interface UserProfile {
  name: string;
  monthlyIncome: number;
  fixedCosts: number; 
  yearlySavingsGoal: number; 
  targetMonthlyContribution: number; // User defined monthly target
  riskAppetite: RiskAppetite;
  savingsRatio: number; // Decimal (e.g. 0.25 for 25%)
  hasOnboarded: boolean;
}

export interface Transaction {
  id: string;
  amount: number;
  category: string;
  isFixed: boolean;
  timestamp: number;
  note?: string;
}

export interface MonthlySummary {
  month: string;
  monthIndex: number;
  year: number;
  totalSpent: number;
  savingsAchieved: number;
}

export interface DashboardStats {
  dailySafeSpend: number;
  daysOfFreedom: number;
  disciplineScore: number;
  totalSpentThisMonth: number;
  remainingVariableBudget: number;
  yearlyGoalProgress: number; 
  totalYearlySavings: number;
  remainingToYearlyGoal: number;
  monthlyHistory: MonthlySummary[];
  monthlyContributionProgress: number; // Progress toward targetMonthlyContribution
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}
