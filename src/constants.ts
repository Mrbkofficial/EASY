import { UserTier } from './types';

export const TIER_LIMITS: Record<UserTier, number> = {
  [UserTier.Free]: 5,
  [UserTier.Pro]: 50,
  [UserTier.Premium]: Infinity,
};

export const PRICING_PLANS = [
  {
    tier: UserTier.Free,
    price: '$0',
    period: 'month',
    requests: '5 requests / month',
    features: [
      '5 RFPs per month',
      'PDF Export',
      'Basic Templates',
      'Mission Control (view only)',
    ],
    recommended: false,
  },
  {
    tier: UserTier.Pro,
    price: '$29',
    period: 'month',
    requests: '50 requests / month',
    features: [
      '50 RFPs per month',
      'PDF & Word Export',
      'Edit Projects',
      'Mission Control + 10 missions/mo',
      'Custom Templates',
    ],
    recommended: true,
  },
  {
    tier: UserTier.Premium,
    price: '$99',
    period: 'month',
    requests: 'Unlimited requests',
    features: [
      'Unlimited RFPs',
      'All Export Formats',
      'Edit Projects',
      'Unlimited Missions',
      'The Boss machine access',
      'Priority Support',
    ],
    recommended: false,
  },
];

export const AGENT_CONFIG = {
  T: {
    fullName: 'Agent T',
    title: 'Idea Creator & Product Designer',
    color: 'blue',
    description: 'Transforms concepts into refined product ideas and design strategies.',
  },
  A: {
    fullName: 'Agent A',
    title: 'Adventurous Researcher',
    color: 'orange',
    description: 'Hunts trends, monitors social media, and surfaces market opportunities.',
  },
  Boss: {
    fullName: 'The Boss',
    title: 'Creative Director & Manager',
    color: 'purple',
    description: 'Orchestrates T & A, builds decks, runs AutoCAD/Blender, controls your Mac.',
  },
} as const;

export const WS_URL = 'ws://localhost:8000/ws';
export const API_URL = 'http://localhost:8000';
