import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { CardData, TuningConfig, getCardBgImage, DEFAULT_TUNING } from '../types';
import { haptics } from '../utils/haptics';
import {
  RotateCw,
  Play,
  Pause,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Smartphone,
  CheckCircle2,
  RefreshCw,
  Volume2,
  VolumeX,
  CreditCard,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Check,
} from 'lucide-react';

interface CardCarousel3DProps {
  cards: CardData[];
  tuning: TuningConfig;
  onTuningChange: (tuning: TuningConfig) => void;
  activeCardId?: string;
  onActiveCardChange?: (id: string) => void;
  onCardUpdate?: (card: CardData) => void;
  soundEnabled?: boolean;
  onSoundToggle?: () => void;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  isMobile?: boolean;
}

export const CardCarousel3D: React.FC<CardCarousel3DProps> = ({
  cards,
  tuning,
  onTuningChange,
  activeCardId,
  onActiveCardChange,
  onCardUpdate,
  soundEnabled = true,
  onSoundToggle,
  onToggleSidebar,
  isSidebarOpen = true,
  isMobile: propIsMobile,
}) => {
  // Mobile detection: screen width <= 768px or mobile touch userAgent
  const [internalIsMobile, setInternalIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.innerWidth <= 768 ||
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    );
  });

  useEffect(() => {
    const handleResize = () => {
      setInternalIsMobile(
        window.innerWidth <= 768 ||
          /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      );
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  const isMobile = propIsMobile ?? internalIsMobile;

  // Continuous floating progress: integer values (0, 1, 2, ...) represent exact card centers
  // Floating values represent in-between transition during drag/spring
  const [progress, setProgress] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [mobileFrameMode, setMobileFrameMode] = useState<boolean>(true);
  const [paymentSuccessCardId, setPaymentSuccessCardId] = useState<string | null>(null);

  // References for spring physics and drag calculations
  const progressRef = useRef<number>(0);
  const targetProgressRef = useRef<number>(0);
  const velocityRef = useRef<number>(0);
  const isSpringActiveRef = useRef<boolean>(false);
  const animFrameRef = useRef<number | null>(null);
  const autoRotateRef = useRef<number | null>(null);

  // Drag tracking
  const dragStartRef = useRef<{
    pointerX: number;
    pointerY: number;
    startProgress: number;
    startTime: number;
    lastX: number;
    lastTime: number;
  }>({
    pointerX: 0,
    pointerY: 0,
    startProgress: 0,
    startTime: 0,
    lastX: 0,
    lastTime: 0,
  });

  const lastDetentIndexRef = useRef<number>(0);
  const lastHapticCardRef = useRef<number>(0);
  const carouselContainerRef = useRef<HTMLDivElement>(null);

  // Keep progressRef in sync
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  const cardCount = cards.length || 1;

  // Active middle card index (exact integer modulo)
  const activeIndex = useMemo(() => {
    if (cards.length === 0) return 0;
    const rounded = Math.round(progress);
    return ((rounded % cards.length) + cards.length) % cards.length;
  }, [progress, cards.length]);

  const currentActiveCard = cards[activeIndex] || cards[0];

  // Inform parent when active card changes
  useEffect(() => {
    if (currentActiveCard && onActiveCardChange && currentActiveCard.id !== activeCardId) {
      onActiveCardChange(currentActiveCard.id);
    }
  }, [currentActiveCard, activeCardId, onActiveCardChange]);

  // Synchronize initial active card if needed
  useEffect(() => {
    if (activeCardId && cards.length > 0) {
      const idx = cards.findIndex((c) => c.id === activeCardId);
      if (idx !== -1 && idx !== activeIndex && !isDragging && !isSpringActiveRef.current) {
        targetProgressRef.current = idx;
        startSpringToTarget(idx);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCardId]);

  // -------------------------------------------------------------
  // Ultra-Smooth Spring Physics Engine (Critically Damped)
  // Guarantees zero overshoot jitter and exact integer centering
  // -------------------------------------------------------------
  const startSpringToTarget = useCallback(
    (target: number, initialVelocity?: number) => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }

      targetProgressRef.current = target;
      if (initialVelocity !== undefined) {
        velocityRef.current = initialVelocity;
      }
      isSpringActiveRef.current = true;

      const stiffness = tuning.snapStiffness ?? 180;
      const damping = tuning.snapDamping ?? 27;

      let lastTime = performance.now();

      const springStep = (now: number) => {
        const dt = Math.min((now - lastTime) / 1000, 0.032); // Clamp to avoid huge time-jumps
        lastTime = now;

        const current = progressRef.current;
        const targetVal = targetProgressRef.current;
        const dist = targetVal - current;

        // Critically damped spring acceleration: a = stiffness * dist - damping * v
        const force = stiffness * dist - damping * velocityRef.current;
        velocityRef.current += force * dt;
        const nextProgress = current + velocityRef.current * dt;

        // If gliding past an intermediate card during a multi-card flick:
        const currentDetent = Math.round(nextProgress);
        if (currentDetent !== lastHapticCardRef.current && currentDetent !== targetVal) {
          lastHapticCardRef.current = currentDetent;
          haptics.triggerAlarmTick(1.0, 'detent');
        }

        // Settling threshold check: snap into exact middle with single crisp settling click
        if (Math.abs(dist) < 0.008 && Math.abs(velocityRef.current) < 0.05) {
          progressRef.current = targetVal;
          setProgress(targetVal);
          velocityRef.current = 0;
          isSpringActiveRef.current = false;

          // Single, crisp haptic & sound click upon arrival
          if (lastHapticCardRef.current !== targetVal) {
            lastHapticCardRef.current = targetVal;
            haptics.triggerAlarmTick(1.2, 'snap');
          }
          return;
        }

        progressRef.current = nextProgress;
        setProgress(nextProgress);

        animFrameRef.current = requestAnimationFrame(springStep);
      };

      animFrameRef.current = requestAnimationFrame(springStep);
    },
    [tuning.snapStiffness, tuning.snapDamping]
  );

  // Navigate to target step (-1 for left swipe, +1 for right swipe)
  const navigateStep = useCallback(
    (delta: number) => {
      haptics.unlockAudio();
      const currentInt = Math.round(progressRef.current);
      const target = currentInt + delta;
      startSpringToTarget(target, delta * 1.5);
    },
    [startSpringToTarget]
  );

  // Auto-rotate tick loop
  useEffect(() => {
    if (!tuning.autoRotate || isDragging) return;

    let lastTime = performance.now();
    const tick = (now: number) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;
      // Convert angular speed to progress step per second
      const stepSpeed = (tuning.autoRotateSpeed ?? 25) / (tuning.spreadAngle || 28);
      const nextProgress = progressRef.current + stepSpeed * delta;
      progressRef.current = nextProgress;
      setProgress(nextProgress);
      autoRotateRef.current = requestAnimationFrame(tick);
    };

    autoRotateRef.current = requestAnimationFrame(tick);
    return () => {
      if (autoRotateRef.current) cancelAnimationFrame(autoRotateRef.current);
    };
  }, [tuning.autoRotate, tuning.autoRotateSpeed, tuning.spreadAngle, isDragging]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        navigateStep(1);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        navigateStep(-1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigateStep]);

  // -------------------------------------------------------------
  // Pointer Drag & Swipe Gestures with Continuous Haptic Feedback
  // -------------------------------------------------------------
  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a')) {
      return;
    }

    haptics.unlockAudio();

    // Cancel any active spring animation immediately
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    isSpringActiveRef.current = false;
    velocityRef.current = 0;

    setIsDragging(true);
    const now = performance.now();
    dragStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      startProgress: progressRef.current,
      startTime: now,
      lastX: e.clientX,
      lastTime: now,
    };
    lastHapticCardRef.current = Math.round(progressRef.current);
    lastDetentIndexRef.current = Math.round(progressRef.current);

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;

    const currentX = e.clientX;
    const now = performance.now();
    const deltaX = currentX - dragStartRef.current.pointerX;

    // Swipe sensitivity & distance calibration:
    // Dragging left (deltaX < 0) advances cards to the right (progress increases)
    // Dragging right (deltaX > 0) goes back to previous cards (progress decreases)
    const cardWidth = tuning.cardWidth || 118;
    const dragDistancePerCard = cardWidth * 1.05; // natural feel: 1 card swipe distance
    const sensitivity = tuning.swipeSensitivity ?? 0.35;

    // Negative sign because dragging card leftwards pulls next card into center
    const progressDelta = -(deltaX / dragDistancePerCard) * sensitivity;
    const newProgress = dragStartRef.current.startProgress + progressDelta;

    // Filtered instantaneous velocity calculation (card steps per second)
    const dt = Math.max((now - dragStartRef.current.lastTime) / 1000, 0.001);
    const dx = currentX - dragStartRef.current.lastX;
    const instantVelocity = -(dx / dragDistancePerCard) * sensitivity / dt;
    velocityRef.current = velocityRef.current * 0.4 + instantVelocity * 0.6; // low-pass filter

    dragStartRef.current.lastX = currentX;
    dragStartRef.current.lastTime = now;

    progressRef.current = newProgress;
    setProgress(newProgress);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    const currentP = progressRef.current;
    const currentV = velocityRef.current;
    const totalDeltaX = e.clientX - dragStartRef.current.pointerX;
    const sensitivity = tuning.swipeSensitivity ?? 0.35;
    const baseThreshold = tuning.swipeThreshold ?? 36;
    // Higher sensitivity makes lighter flicks register effortlessly
    const swipeThreshold = baseThreshold / Math.max(0.35, sensitivity);

    let targetInteger: number;

    // If there was a deliberate swipe / flick:
    if (Math.abs(totalDeltaX) >= swipeThreshold || Math.abs(currentV) > (1.2 / Math.max(0.4, sensitivity))) {
      if (totalDeltaX < -swipeThreshold || currentV > 0.8) {
        // Swiped LEFT -> advance to next card (higher integer)
        // With higher momentum, flick can travel 1 or 2 cards smoothly
        const momentumStep = Math.min(2, Math.max(1, Math.round(currentV * 0.35)));
        targetInteger = Math.ceil(dragStartRef.current.startProgress) + (momentumStep - 1);
        if (targetInteger <= currentP) targetInteger = Math.round(currentP + 1);
      } else {
        // Swiped RIGHT -> go to previous card (lower integer)
        const momentumStep = Math.min(2, Math.max(1, Math.round(-currentV * 0.35)));
        targetInteger = Math.floor(dragStartRef.current.startProgress) - (momentumStep - 1);
        if (targetInteger >= currentP) targetInteger = Math.round(currentP - 1);
      }
    } else {
      // Small drag released without flick -> snap to nearest card detent
      targetInteger = Math.round(currentP);
    }

    // Launch ultra-smooth critically damped spring to exact center target
    startSpringToTarget(targetInteger, currentV);
  };

  // Wheel / Trackpad horizontal and vertical scrolling support
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      haptics.unlockAudio();

      const dominantDelta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(dominantDelta) < 2) return;

      const cardWidth = tuning.cardWidth || 159;
      const sensitivity = tuning.swipeSensitivity ?? 0.2;
      const step = (dominantDelta / (cardWidth * 2.5)) * sensitivity;
      const newProgress = progressRef.current + step;
      progressRef.current = newProgress;
      setProgress(newProgress);

      // Debounce snapping after wheel stops
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      const target = Math.round(newProgress);
      startSpringToTarget(target, step * 4);
    },
    [tuning.cardWidth, tuning.swipeSensitivity, startSpringToTarget]
  );

  // Handle card button interaction (Pay or Refresh)
  const handleCardAction = (card: CardData, e: React.MouseEvent) => {
    e.stopPropagation();
    haptics.unlockAudio();
    haptics.triggerTick(1.4);

    if (card.buttonType === 'pay') {
      setPaymentSuccessCardId(card.id);
      setTimeout(() => setPaymentSuccessCardId(null), 3500);

      if (onCardUpdate) {
        onCardUpdate({
          ...card,
          payStatus: 'Paid',
          payStatusType: 'paid',
          buttonType: 'refresh',
          buttonLabel: 'Refresh',
          amountText: `${card.amount || 'Payment'} marked paid today`,
        });
      }
    } else if (card.buttonType === 'refresh') {
      if (onCardUpdate) {
        onCardUpdate({
          ...card,
          payStatus: 'Due in 7 days',
          payStatusType: 'due',
          buttonType: 'pay',
          buttonLabel: 'Pay',
          amountText: 'You can save ₹30 with POPcoins',
        });
      }
    }
  };

  // Compute ambient glow color
  const activeGlowColor = useMemo(() => {
    if (tuning.glowColorMode === 'neon-green') return '#84cc16';
    if (tuning.glowColorMode === 'cyan') return '#06b6d4';
    if (tuning.glowColorMode === 'amber') return '#f59e0b';
    return currentActiveCard?.accentColor || '#84cc16';
  }, [tuning.glowColorMode, currentActiveCard?.accentColor]);

  // -------------------------------------------------------------
  // 100% Symmetrical Slot Math Engine
  // - Except middle card (hero state), left and right are 100%
  //   identical in card count, spacing/padding, and geometry!
  // -------------------------------------------------------------
  const flankingCount = tuning.flankingCardsCount ?? 5; // e.g. 5 on left, 1 center, 5 on right = 11 total
  const isVertical = tuning.cardOrientation !== 'horizontal';
  const cardWidth = tuning.cardWidth || (isVertical ? 118 : 240);
  const cardHeight = isVertical
    ? Math.round(cardWidth * (1107 / 621))
    : Math.round(cardWidth * (621 / 1107));

  // Range of slots to render around the current floating position
  // When at rest (progress is integer m), visible slots are strictly:
  // [m - flankingCount, ..., m, ..., m + flankingCount]
  // That guarantees EXACTLY flankingCount cards on left and flankingCount on right!
  const slotsToRender = useMemo(() => {
    const centerInt = Math.round(progress);
    const slots: number[] = [];
    // We render flankingCount on left, 1 center, and flankingCount on right
    // Plus 1 extra outer slot on each side for butter-smooth fade in/out during transitions
    const buffer = 1;
    for (let offset = -(flankingCount + buffer); offset <= (flankingCount + buffer); offset++) {
      slots.push(centerInt + offset);
    }
    return slots;
  }, [progress, flankingCount]);

  const renderCardSlot = (slotIndex: number) => {
    // Relative distance u from the screen center
    // u = 0 means card is EXACTLY in the middle of the screen
    // u < 0 means card is on the LEFT side of the screen
    // u > 0 means card is on the RIGHT side of the screen
    const u = slotIndex - progress;
    const dist = Math.abs(u);

    // Cull cards that are beyond visible bounds
    if (dist > flankingCount + 1.2) {
      return null;
    }

    // Cyclic card data index
    const cardDataIndex = ((slotIndex % cardCount) + cardCount) % cardCount;
    const cardData = cards[cardDataIndex];
    if (!cardData) return null;

    // Middle Hero Card Factor:
    // Peaks at 1.0 when u = 0 (exact center), smoothly drops to 0 as card moves away
    const heroTravelSharpness = tuning.heroTravelCurve ?? 3.1;
    const heroFactor = Math.exp(-heroTravelSharpness * u * u);

    // Configuration parameters
    const fanSpacing = tuning.fanSpacing ?? (isVertical ? 1 : 50);
    const fanTiltStep = tuning.fanTiltStep ?? (isVertical ? 0.5 : 2.5);
    const yawAngle = tuning.yawAngle ?? (isVertical ? 63 : 35);
    const curveDepth = tuning.curveDepth ?? 51;
    const baseY = tuning.baseYOffset ?? (isVertical ? 74 : 20);
    const heroLift = tuning.heroLiftY ?? 46;
    const heroRotY = tuning.heroRotY ?? -1;
    const heroRotZ = tuning.heroRotZ ?? 0;
    const heroTiltX = tuning.heroTiltX ?? -13;
    const heroPopZ = tuning.heroPopZ ?? 54;

    // Fanning Out Cylinder Radius
    const R = tuning.fanRadius ?? 210;
    const phi = dist * ((fanSpacing * 0.86) / Math.max(R, 80));
    const circleZ = -R * (1 - Math.cos(phi)) * 1.35;

    // 100% Symmetrical Spacing & Gap Geometry
    // wCenterHalf and wSideHalf are strictly identical for left and right
    const heroRotYDeg = tuning.heroRotY ?? -1;
    const wCenterHalf =
      (cardWidth / 2) *
      Math.cos(Math.abs(heroRotYDeg) * (Math.PI / 180)) *
      (tuning.cardScaleActive ?? 1.09);
    const wSideHalf =
      (cardWidth / 2) *
      Math.cos(Math.abs(yawAngle) * (Math.PI / 180)) *
      (tuning.cardScaleBack ?? 0.90);

    const spacingCompaction = 1 - heroFactor * 0.35;
    const minSafeGap = 2;
    const centerClearance =
      wCenterHalf + wSideHalf + Math.max(minSafeGap, (fanSpacing * 0.18) * spacingCompaction);
    const sideStep = 2 * wSideHalf + Math.max(minSafeGap, fanSpacing * 0.22);

    // 1. Horizontal Position X:
    // STRICT MATHEMATICAL SYMMETRY: x(-u) = -x(u)
    // Left card (-dist) has -x, Right card (+dist) has +x.
    // Center card (dist = 0) has x = 0.00px EXACTLY in the middle of the screen!
    const sign = u >= 0 ? 1 : -1;
    const x = sign * (Math.min(dist, 1) * centerClearance + Math.max(0, dist - 1) * sideStep);

    // 2. Vertical Position Y:
    // STRICT MATHEMATICAL SYMMETRY: y(-u) = y(u)
    // Both left and right cards sit at the exact same elevation arc!
    // Middle card elevates up by heroFactor * heroLift
    const arcY = Math.pow(dist, 1.35) * (isVertical ? 16 : 10);
    const y = baseY + arcY - heroFactor * heroLift;

    // 3. Depth Z:
    // STRICT MATHEMATICAL SYMMETRY: z(-u) = z(u)
    const z = heroFactor * heroPopZ + circleZ - Math.pow(dist, 1.15) * (curveDepth * 0.35);

    // 4. Roll (Rotate Z):
    // Left card tilts outward counter-clockwise (-sideRotZ)
    // Right card tilts outward clockwise (+sideRotZ)
    // Middle card adopts heroRotZ
    const sideRotZ = u * fanTiltStep;
    const rotZ = (1 - heroFactor) * sideRotZ + heroFactor * heroRotZ;

    // 5. Yaw (Rotate Y):
    // Left card turns inward towards center (+yawAngle)
    // Right card turns inward towards center (-yawAngle)
    // Middle card adopts heroRotY
    const sideBaseYaw = yawAngle + Math.min(Math.max(0, dist - 1), 2) * 5;
    const sideRotY = u >= 0 ? -sideBaseYaw : sideBaseYaw;
    const centerYawTarget = heroFactor * heroRotYDeg;
    const rotY = (1 - heroFactor) * sideRotY + centerYawTarget + (tuning.tiltYOffset || 0);

    // 6. Pitch (Rotate X):
    // STRICT SYMMETRY: rotX(-u) = rotX(u)
    const rotX = (1 - heroFactor) * ((tuning.tiltX ?? 35) + 1.5) + heroFactor * heroTiltX;

    // 7. Dedicated Perspective for Middle Card
    const currentPerspective = Math.round(
      (1 - heroFactor) * (tuning.perspective ?? 1900) + heroFactor * (tuning.centerPerspective ?? 1800)
    );

    // 8. Scale:
    // STRICT SYMMETRY: scale(-u) = scale(u)
    const currentScale =
      tuning.cardScaleBack + ((tuning.cardScaleActive ?? 1.09) - tuning.cardScaleBack) * heroFactor;

    // 9. Opacity: 100% SOLID OPACITY FOR ALL CARDS
    // Strictly 1.0 for all visible cards in the stack; no transparency or see-through cards behind
    const opacity = dist <= flankingCount ? 1.0 : Math.max(0, 1 - (dist - flankingCount));

    // 10. Z-Index:
    // Middle card is always topmost, descending symmetrically as dist increases
    const zIndex = Math.round(1000 + heroFactor * 300 - dist * 60);

    const isCenterCard = dist < 0.25;
    const bgUrl = getCardBgImage(cardData.bgImage, isVertical ? 'vertical' : 'horizontal');

    // 11. 100% Symmetrical Studio Lighting & 4-Sided Equal Middle Card Shadow:
    // Flanking cards have symmetrical stack-side offsets; the middle card has an equal 360° shadow on all four sides!
    const shadowIntensity = tuning.shadowIntensity ?? 0.56;
    const shadowSoftness = tuning.shadowSoftness ?? 31;
    const shadowDistance = tuning.shadowDistance ?? 16;
    const specularSheen = tuning.specularSheen ?? 1.0;

    // For flanking cards: directional offset based on stack position
    const sideShadowSignX = tuning.symmetricLighting ? (u >= 0 ? 1 : -1) : 1;
    const sideShadowX = sideShadowSignX * (shadowDistance * 0.45);
    const sideShadowY = shadowDistance;

    // For the middle card:
    // "The shadow of the middle card should be equally on all four sides of the card not only right or left side"
    // As heroFactor reaches 1, directional offsets vanish to (0, 0), and an equal 360° omnidirectional
    // multi-layer shadow radiates evenly on the top, right, bottom, and left sides!
    const currentShadowX = (1 - heroFactor) * sideShadowX;
    const currentShadowY = (1 - heroFactor) * sideShadowY;

    const omniBlur = shadowSoftness * (1 + 0.3 * heroFactor);
    const omniSpread = heroFactor * (shadowSoftness * 0.22);
    const omniDeepBlur = shadowSoftness * 2.5;
    const omniDeepSpread = heroFactor * (shadowSoftness * 0.45);
    const tightBlur = Math.max(4, shadowSoftness * 0.4);

    const cardBoxShadow = `
      0px 0px ${tightBlur.toFixed(1)}px 0px rgba(0, 0, 0, ${(shadowIntensity * 0.95).toFixed(2)}),
      0px 0px ${omniBlur.toFixed(1)}px ${omniSpread.toFixed(1)}px rgba(0, 0, 0, ${(shadowIntensity * (0.7 + 0.3 * heroFactor)).toFixed(2)}),
      0px 0px ${omniDeepBlur.toFixed(1)}px ${omniDeepSpread.toFixed(1)}px rgba(0, 0, 0, ${(shadowIntensity * 0.6 * heroFactor).toFixed(2)}),
      ${currentShadowX.toFixed(1)}px ${currentShadowY.toFixed(1)}px ${shadowSoftness.toFixed(1)}px rgba(0, 0, 0, ${((1 - heroFactor) * shadowIntensity).toFixed(2)}),
      inset 0 1px 1.5px rgba(255, 255, 255, ${(specularSheen * 0.4).toFixed(2)})
    `;

    // Card-on-card cast shadow:
    // The middle card is elevated in the foreground; it casts shadows on neighbors,
    // but no other card ever casts shadow on the middle card itself!
    let neighborCastOpacity = 0;
    let shadowAngle = 90;
    if (tuning.castShadowOnNeighbors && dist >= 0.25) {
      const userCast = tuning.castShadowOpacity ?? 1.0;
      const heroEmergence = Math.min(1.5, Math.max(0.6, heroLift / 75));
      const proximity = Math.exp(-Math.pow((dist - 1.0) / 1.2, 2));
      neighborCastOpacity = Math.min(1, proximity * userCast * heroEmergence);
      // Right cards (u > 0) have center card to their left -> shadow from left edge (90deg)
      // Left cards (u < 0) have center card to their right -> shadow from right edge (270deg)
      shadowAngle = u > 0 ? 90 : 270;
    }

    return (
      <div
        key={`slot-${slotIndex}`}
        onClick={() => {
          if (!isCenterCard && !isDragging) {
            // Clicking any flanking card smoothly animates it right into the middle!
            startSpringToTarget(slotIndex, (slotIndex - progress) * 2);
          }
        }}
        className={`absolute top-1/2 left-1/2 select-none cursor-pointer transition-opacity ${
          opacity <= 0.01 ? 'pointer-events-none' : ''
        }`}
        style={{
          width: `${cardWidth}px`,
          height: `${cardHeight}px`,
          transformOrigin: isVertical ? '50% 95%' : '50% 50%',
          transform: `perspective(${currentPerspective}px) translate(-50%, -50%) translate3d(${x.toFixed(
            2
          )}px, ${y.toFixed(2)}px, ${z.toFixed(2)}px) rotateX(${rotX.toFixed(
            2
          )}deg) rotateY(${rotY.toFixed(2)}deg) rotateZ(${rotZ.toFixed(2)}deg) scale(${currentScale.toFixed(
            3
          )})`,
          transformStyle: 'preserve-3d',
          zIndex,
          opacity: Math.max(0, Math.min(1, opacity)),
          willChange: 'transform, opacity',
        }}
      >
        {/* Card Face Graphic - 100% Solid Opaque Backing so card behind is NEVER visible */}
        <div
          className="relative w-full h-full rounded-2xl overflow-hidden border border-white/20 transition-[border-color,box-shadow] duration-200"
          style={{
            backgroundColor: '#0d0d12', // 100% solid impenetrable background color
            backgroundImage: `url(${bgUrl})`,
            backgroundSize: '100% 100%',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backfaceVisibility: 'hidden',
            aspectRatio: isVertical ? '621 / 1107' : '1107 / 621',
            boxShadow: cardBoxShadow,
          }}
        >
          {/* Card-on-Card Cast Shadow (Pure alpha gradient, without mix-blend-mode) */}
          {tuning.castShadowOnNeighbors && (
            <div
              className="absolute inset-0 pointer-events-none rounded-2xl"
              style={{
                opacity: Math.max(0, Math.min(1, neighborCastOpacity)),
                background: `linear-gradient(${shadowAngle}deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 28%, rgba(0,0,0,0.08) 55%, transparent 75%)`,
              }}
            />
          )}

          {/* Top-Left Specular Surface Sheen from studio light */}
          {specularSheen > 0.02 && (
            <div
              className="absolute inset-0 pointer-events-none rounded-2xl"
              style={{
                background: `linear-gradient(135deg, rgba(255,255,255,${(
                  specularSheen * 0.22
                ).toFixed(2)}) 0%, transparent 42%, rgba(0,0,0,0.12) 100%)`,
              }}
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full min-h-0 md:min-h-[640px] text-neutral-100 select-none overflow-hidden">
      {/* Top Controls Toolbar: Hidden when opened on mobile phones! */}
      {!isMobile && (
        <div className="hidden md:flex absolute top-4 z-40 items-center gap-2 bg-neutral-900/85 backdrop-blur-md px-3 py-1.5 rounded-full border border-neutral-800 shadow-xl">
          <button
            type="button"
            onClick={() => setMobileFrameMode(!mobileFrameMode)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
              mobileFrameMode
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-neutral-400 hover:text-white'
            }`}
            title="Toggle Mobile Screen Frame"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile Frame</span>
          </button>

          <button
            type="button"
            onClick={() => onTuningChange({ ...tuning, autoRotate: !tuning.autoRotate })}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
              tuning.autoRotate
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-neutral-400 hover:text-white'
            }`}
            title="Toggle Infinite Auto-Rotation"
          >
            {tuning.autoRotate ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{tuning.autoRotate ? 'Auto: ON' : 'Auto: OFF'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (onSoundToggle) {
                onSoundToggle();
              } else {
                const next = !soundEnabled;
                haptics.setSoundEnabled(next);
                if (next) {
                  haptics.unlockAudio();
                  haptics.triggerTick(1.2);
                }
              }
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
              soundEnabled
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-neutral-400 hover:text-white'
            }`}
            title="Toggle Wheel Click Audio & Haptics"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>{soundEnabled ? 'Haptic Sound: ON' : 'Sound: OFF'}</span>
          </button>

          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                isSidebarOpen
                  ? 'bg-emerald-500 text-neutral-950 font-bold shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="Toggle 3D Tuning Sidebar"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Tuning Sidebar</span>
            </button>
          )}
        </div>
      )}

      {/* Main Presentation Screen:
          On mobile phone: Pure full-screen edge-to-edge mobile carousel with no desktop frame borders.
          On desktop: Configurable mobile frame preview or full stage. */}
      <div
        className={`relative transition-all duration-300 flex flex-col items-center justify-between ${
          isMobile
            ? 'w-full h-full bg-black overflow-hidden'
            : mobileFrameMode
            ? 'w-[360px] h-[720px] max-h-[92vh] bg-black rounded-[48px] border-[10px] border-neutral-800 shadow-[0_25px_70px_rgba(0,0,0,0.95)] overflow-hidden ring-1 ring-neutral-700/50'
            : 'w-full h-full min-h-[580px] bg-neutral-950/90 rounded-2xl border border-neutral-800'
        }`}
      >
        {/* Mobile Device Status Bar & Notch: Preview mode on desktop only (hidden on real mobile phone) */}
        {!isMobile && mobileFrameMode && (
          <div className="w-full pt-3 px-6 flex items-center justify-between z-30 text-[11px] font-semibold text-neutral-400 select-none">
            <span>9:41</span>
            {/* Dynamic Island */}
            <div className="w-24 h-5 bg-neutral-900 rounded-full flex items-center justify-center border border-neutral-800/80">
              <div className="w-2.5 h-2.5 rounded-full bg-neutral-950 border border-neutral-700" />
            </div>
            <div className="flex items-center gap-1.5 text-neutral-400">
              <span className="text-[10px]">5G</span>
              <div className="w-4 h-2 border border-neutral-400 rounded-xs p-0.5">
                <div className="w-full h-full bg-neutral-300 rounded-2xs" />
              </div>
            </div>
          </div>
        )}

        {/* Symmetry Guide Overlay (Optional visual verification showing exact center and symmetric margins) */}
        {tuning.showSymmetryGuides && (
          <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center">
            {/* Exact Center Crosshair */}
            <div className="absolute top-0 bottom-0 w-px bg-emerald-500/40 shadow-[0_0_8px_#10b981]" />
            <div className="absolute top-12 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono border border-emerald-500/30">
              100% Center (x = 0)
            </div>
            {/* Left Symmetry Marker */}
            <div
              className="absolute top-0 bottom-0 w-px border-l border-dashed border-cyan-500/30"
              style={{ left: 'calc(50% - 100px)' }}
            />
            {/* Right Symmetry Marker */}
            <div
              className="absolute top-0 bottom-0 w-px border-r border-dashed border-cyan-500/30"
              style={{ right: 'calc(50% - 100px)' }}
            />
          </div>
        )}

        {/* Interactive 3D Stage / Viewport */}
        <div
          ref={carouselContainerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onWheel={handleWheel}
          className="relative w-full flex-1 flex items-center justify-center cursor-grab active:cursor-grabbing overflow-hidden touch-none"
          style={{
            perspective: `${tuning.perspective}px`,
            perspectiveOrigin: '50% 50%',
          }}
        >
          {/* Ambient Video Neon Spotlight at bottom center */}
          <div
            className="absolute bottom-12 left-1/2 -translate-x-1/2 w-80 h-64 rounded-full pointer-events-none transition-all duration-300 blur-3xl opacity-85"
            style={{
              background: `radial-gradient(ellipse at center, ${activeGlowColor} 0%, ${activeGlowColor}33 45%, transparent 70%)`,
              transform: `translateX(-50%) scale(${tuning.glowIntensity})`,
            }}
          />

          {/* 3D Cards World (Exact 50% Horizontal Centering) */}
          <div
            className="relative w-full h-full flex items-center justify-center pointer-events-auto"
            style={{
              transformStyle: 'preserve-3d',
            }}
          >
            {/* Render 100% Symmetrical slots */}
            {slotsToRender.map((slotIdx) => renderCardSlot(slotIdx))}
          </div>
        </div>

        {/* Mobile Home Indicator bar */}
        <div className="w-full pb-3 flex justify-center z-20 pointer-events-none">
          <div className="w-32 h-1 bg-neutral-600/60 rounded-full" />
        </div>

        {/* Payment Success Toast */}
        {paymentSuccessCardId && (
          <div className="absolute top-14 inset-x-6 z-50 bg-emerald-500 text-neutral-950 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-200">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <div>
              <div>Payment Completed!</div>
              <div className="text-[10px] font-normal text-emerald-950">
                Card marked as Paid successfully
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Manual Left / Right Navigation Buttons (Floaters - Desktop only, never on mobile screen) */}
      {!isMobile && (
        <div className="absolute bottom-6 left-6 z-30 flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigateStep(-1)}
            className="p-2.5 rounded-full bg-neutral-900/80 hover:bg-neutral-800 text-neutral-200 border border-neutral-700/80 backdrop-blur-md shadow-lg transition-transform active:scale-95"
            title="Previous Card (Swipe Right)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => navigateStep(1)}
            className="p-2.5 rounded-full bg-neutral-900/80 hover:bg-neutral-800 text-neutral-200 border border-neutral-700/80 backdrop-blur-md shadow-lg transition-transform active:scale-95"
            title="Next Card (Swipe Left)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
