export type PayStatusType = 'due' | 'paid' | 'overdue' | 'pending';
export type ButtonType = 'pay' | 'refresh' | 'paid';

export interface CardData {
  id: string;
  bankName: string;
  cardNo: string; // e.g., '1590' or '.. 1590'
  name: string; // e.g., 'Anushka Shah'
  amount: string; // e.g., '₹42,000'
  amountText: string; // e.g., 'You can save ₹30 with POPcoins'
  payStatus: string; // e.g., 'Due in 7 days' or 'Paid'
  payStatusType: PayStatusType; // for styling badges/colors
  buttonType: ButtonType; // 'pay' | 'refresh' | 'paid'
  buttonLabel?: string; // Optional custom text, defaults to 'Pay' or 'Refresh'
  bgImage: string; // template image URL
  accentColor: string; // hex color for card glow / lighting
  cardNumberMask?: string; // optional full mask or prefix
}

export interface TuningConfig {
  radius: number; // 3D cylinder / arc radius in px (150 - 900)
  spreadAngle: number; // Angular separation in degrees (15 - 50)
  perspective: number; // 3D camera perspective (400 - 1800)
  tiltX: number; // Pitch tilt angle in degrees (-30 to +30)
  tiltYOffset: number; // Center yaw offset (-20 to +20)
  cardScaleActive: number; // Scale for front active card (0.95 - 1.35)
  cardScaleBack: number; // Minimum scale for distant cards (0.6 - 0.95)
  opacityFalloff: number; // Opacity dropoff factor (0.2 - 1.0)
  blurFalloff: number; // Max blur in px for background cards (0 - 8)
  autoRotate: boolean; // Auto-play continuous rotation
  autoRotateSpeed: number; // Rotation speed in deg/s (-60 to +60)
  glowIntensity: number; // Underglow ambient spotlight (0 to 1.5)
  glowColorMode: 'card-brand' | 'neon-green' | 'amber' | 'cyan'; // glow style
  dragSensitivity: number; // Drag friction / speed multiplier (0.5 - 2.5)
  showCardShadows: boolean; // 3D drop shadow underneath cards
  cardWidth: number; // Card width in mobile frame
  cardOrientation?: 'vertical' | 'horizontal'; // Vertical (portrait) or Horizontal (landscape)
  fanTiltStep?: number; // Radial fan roll angle step per card in degrees (1 - 15)
  fanSpacing?: number; // Horizontal step distance between adjacent cards in px (30 - 160)
  yawAngle?: number; // Inward facing yaw angle in degrees (10 - 70)
  curveDepth?: number; // Z-depth curvature step in px (0 - 80)
  baseYOffset?: number; // Vertical baseline offset in px (-50 to 150)
  
  // 1. Center Hero Card Journey & Perspective tuning
  centerPerspective?: number; // Independent 3D perspective applied to center card (300 - 1600px)
  heroLiftY?: number; // How much the middle card elevates upwards in px (0 - 240px)
  heroRotY?: number; // Middle card yaw angle in degrees (-60 to +20)
  heroRotZ?: number; // Middle card roll tilt in degrees (-15 to +15)
  heroTiltX?: number; // Middle card pitch/tilt angle in degrees (-30 to +30)
  heroPopZ?: number; // Middle card pop-forward Z depth (0 - 140px)
  heroTravelCurve?: number; // Sharpness / transition factor of hero elevation curve (1.2 - 5.0)

  // 2. Light Source & Dynamic Card Shadows
  lightSourceX?: number; // Light source horizontal position in % (10% to 60%, default 32% between top-left & top-middle)
  lightSourceY?: number; // Light source vertical position in % (-30% to 50%, default 10%)
  shadowIntensity?: number; // Dynamic shadow darkness / opacity (0.0 to 1.0, default 0.75)
  shadowSoftness?: number; // Shadow blur / softness radius in px (2 to 40px, default 18px)
  shadowDistance?: number; // Dynamic shadow offset distance (2 to 45px, default 16px)
  castShadowOnNeighbors?: boolean; // Cast shadows onto adjacent / overlapping cards (true/false)
  castShadowOpacity?: number; // Card-on-card cast shadow darkness (0.0 to 1.0, default 0.65)
  specularSheen?: number; // Top-left specular light reflection intensity (0.0 to 1.0, default 0.5)

  // 3. Fanning Out Curve Radius / Circle Diameter
  fanRadius?: number; // Circle/cylinder arc radius to shrink/expand diameter in px (150 - 800px, default 380px)

  // 4. Ultra-Smooth Snap & 100% Symmetry Engine
  flankingCardsCount?: number; // Number of symmetric cards on left and right (1 to 4, default 2)
  snapStiffness?: number; // Ultra-smooth snap spring stiffness (80 - 350, default 180)
  snapDamping?: number; // Ultra-smooth snap damping (15 - 45, default 26.5 for critical damping)
  swipeSensitivity?: number; // Sensitivity of swipe gesture (0.5 - 2.5, default 1.2)
  swipeThreshold?: number; // Distance in px to trigger card advance on swipe (15 - 80, default 32)
  strictSymmetry?: boolean; // Ensure 100% identical geometry, counts, and spacing on left & right
  symmetricLighting?: boolean; // Symmetric studio lighting for identical left/right shadows
  showSymmetryGuides?: boolean; // Visual alignment guide overlay showing exact center and symmetric markers
}

export const DEFAULT_TUNING: TuningConfig = {
  radius: 380,
  spreadAngle: 28,
  perspective: 1900,
  tiltX: 35,
  tiltYOffset: 0,
  cardScaleActive: 1.09,
  cardScaleBack: 0.90,
  opacityFalloff: 0.7,
  blurFalloff: 0,
  autoRotate: false,
  autoRotateSpeed: 25,
  glowIntensity: 0.80,
  glowColorMode: 'amber',
  dragSensitivity: 0.2,
  showCardShadows: true,
  cardWidth: 118,
  cardOrientation: 'vertical',
  fanTiltStep: 0.5,
  fanSpacing: 1,
  yawAngle: 63,
  curveDepth: 51,
  baseYOffset: 74,

  // Center Hero Card Journey & Perspective
  centerPerspective: 1800,
  heroLiftY: 46,
  heroRotY: -1,
  heroRotZ: 0,
  heroTiltX: -13,
  heroPopZ: 54,
  heroTravelCurve: 3.1,

  // Light Source & Dynamic Card Shadows
  lightSourceX: 32,
  lightSourceY: 1,
  shadowIntensity: 0.56,
  shadowSoftness: 31,
  shadowDistance: 16,
  castShadowOnNeighbors: true,
  castShadowOpacity: 1.0,
  specularSheen: 1.0,

  // Fanning Out Circle Radius
  fanRadius: 210,

  // Ultra-Smooth Snap & 100% Symmetry Engine
  flankingCardsCount: 5,
  snapStiffness: 180,
  snapDamping: 27,
  swipeSensitivity: 0.35,
  swipeThreshold: 36,
  strictSymmetry: true,
  symmetricLighting: true,
  showSymmetryGuides: false,
};

export function getCardBgImage(bgImage: string, _orientation?: 'vertical' | 'horizontal'): string {
  if (!bgImage) return '/cards/POPcard_vertical.png?v=3';
  if (bgImage.includes('pop') || bgImage.includes('POP')) return '/cards/POPcard_vertical.png?v=3';
  if (bgImage.includes('axis')) return '/cards/axis_vertical.png?v=3';
  if (bgImage.includes('icici')) return '/cards/icici_vertical.png?v=3';
  if (bgImage.includes('kotak')) return '/cards/kotak_vertical.png?v=3';
  if (bgImage.includes('hdfc')) return '/cards/hdfc_vertical.png?v=3';
  if (bgImage.includes('sbi')) return '/cards/sbi_vertical.png?v=3';
  return bgImage;
}

export const INITIAL_CARDS: CardData[] = [
  {
    id: 'card-pop-1',
    bankName: 'POP Club',
    cardNo: '.. 4019',
    name: 'Anushka Shah',
    amount: '',
    amountText: 'Exclusive POP Rewards Card',
    payStatus: 'Active',
    payStatusType: 'paid',
    buttonType: 'refresh',
    buttonLabel: 'Explore',
    bgImage: '/cards/POPcard_vertical.png?v=3',
    accentColor: '#10b981',
  },
  {
    id: 'card-icici-2',
    bankName: 'ICICI Bank',
    cardNo: '.. 1590',
    name: 'Anushka Shah',
    amount: '₹42,000',
    amountText: 'You can save ₹30 with POPcoins',
    payStatus: 'Due in 7 days',
    payStatusType: 'due',
    buttonType: 'pay',
    buttonLabel: 'Pay',
    bgImage: '/cards/icici_vertical.png?v=3',
    accentColor: '#c2410c',
  },
  {
    id: 'card-kotak-3',
    bankName: 'Kotak Mahindra',
    cardNo: '.. 1590',
    name: 'Anushka Shah',
    amount: '₹42,000',
    amountText: 'You can save ₹30 with POPcoins',
    payStatus: 'Due on 15 days',
    payStatusType: 'due',
    buttonType: 'pay',
    buttonLabel: 'Pay',
    bgImage: '/cards/kotak_vertical.png?v=3',
    accentColor: '#b91c1c',
  },
  {
    id: 'card-hdfc-4',
    bankName: 'HDFC Bank',
    cardNo: '.. 1590',
    name: 'Anushka Shah',
    amount: '',
    amountText: '₹20,000 marked paid today',
    payStatus: 'Paid',
    payStatusType: 'paid',
    buttonType: 'refresh',
    buttonLabel: 'Refresh',
    bgImage: '/cards/hdfc_vertical.png?v=3',
    accentColor: '#1d4ed8',
  },
  {
    id: 'card-sbi-5',
    bankName: 'SBI',
    cardNo: '.. 1590',
    name: 'Anushka Shah',
    amount: '',
    amountText: '₹20,000 marked paid today',
    payStatus: 'Paid',
    payStatusType: 'paid',
    buttonType: 'refresh',
    buttonLabel: 'Refresh',
    bgImage: '/cards/sbi_vertical.png?v=3',
    accentColor: '#1e3a8a',
  },
  {
    id: 'card-axis-6',
    bankName: 'Axis Bank',
    cardNo: '.. 8821',
    name: 'Anushka Shah',
    amount: '₹18,500',
    amountText: 'You can save ₹25 with POPcoins',
    payStatus: 'Due in 12 days',
    payStatusType: 'due',
    buttonType: 'pay',
    buttonLabel: 'Pay',
    bgImage: '/cards/axis_vertical.png?v=3',
    accentColor: '#9f1239',
  },
];
