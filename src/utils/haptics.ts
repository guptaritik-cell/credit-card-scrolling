// High-Fidelity iPhone Alarm Wheel (UIDatePicker) Acoustic Click & Mobile Haptic Engine
// Produces the exact crisp, non-jittery ratchet click heard when setting alarms in iOS
// Triggers authentic physical haptic feedback on iPhone (via Taptic switch mechanism) and Android (via Vibration API)

export type HapticTickType = 'detent' | 'snap' | 'button';

class HapticFeedbackManager {
  private audioCtx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private hapticsEnabled: boolean = true;
  private lastTickTime: number = 0;
  private isAudioUnlocked: boolean = false;
  private iosHapticInput: HTMLInputElement | null = null;

  constructor() {
    this.setupGlobalUnlock();
    this.setupIosHapticElement();
  }

  // Prepares the hidden switch element for iOS Taptic Engine feedback
  private setupIosHapticElement() {
    if (typeof document === 'undefined') return;
    try {
      const el = document.createElement('input');
      el.type = 'checkbox';
      el.setAttribute('switch', '');
      el.style.position = 'fixed';
      el.style.top = '-9999px';
      el.style.left = '-9999px';
      el.style.opacity = '0';
      el.style.width = '1px';
      el.style.height = '1px';
      el.style.pointerEvents = 'none';
      el.setAttribute('aria-hidden', 'true');
      el.tabIndex = -1;
      document.body ? document.body.appendChild(el) : document.addEventListener('DOMContentLoaded', () => document.body.appendChild(el));
      this.iosHapticInput = el;
    } catch {
      // Ignore
    }
  }

  // Global listener to unlock Web Audio on the very first touch gesture
  private setupGlobalUnlock() {
    if (typeof window === 'undefined') return;

    const unlock = () => {
      this.unlockAudio();
      if (this.isAudioUnlocked) {
        window.removeEventListener('touchstart', unlock, true);
        window.removeEventListener('touchend', unlock, true);
        window.removeEventListener('pointerdown', unlock, true);
        window.removeEventListener('click', unlock, true);
      }
    };

    window.addEventListener('touchstart', unlock, { capture: true, passive: true });
    window.addEventListener('touchend', unlock, { capture: true, passive: true });
    window.addEventListener('pointerdown', unlock, { capture: true, passive: true });
    window.addEventListener('click', unlock, { capture: true, passive: true });
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.audioCtx = new AudioCtx();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  public unlockAudio() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      // Play 1-sample silent buffer to unlock iOS Safari Web Audio engine
      const buf = ctx.createBuffer(1, 1, 22050);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      src.start(0);
      this.isAudioUnlocked = true;
    } catch {
      // Ignore
    }
  }

  /**
   * Triggers the exact iPhone Alarm Wheel (UIDatePicker) tick:
   * 1. Physical Haptics:
   *    - iOS Safari: Taptic Engine tick via synthetic switch interaction
   *    - Android: 28ms crisp vibration pulse via navigator.vibrate
   * 2. Crisp, clean acoustic ratchet click (1950Hz resonant detent, 6ms decay, zero jitter)
   */
  public triggerAlarmTick(intensity: number = 1.0, type: HapticTickType = 'detent') {
    const now = performance.now();
    // Debounce to prevent rapid double-clicks (e.g. drag tick + settle tick in quick succession)
    if (now - this.lastTickTime < 45) {
      return;
    }
    this.lastTickTime = now;

    // --- 1. MOBILE PHYSICAL HAPTICS ---
    if (this.hapticsEnabled) {
      // iOS Taptic Engine Trigger (Single physical selection tick)
      if (typeof document !== 'undefined') {
        try {
          if (!this.iosHapticInput || !document.body.contains(this.iosHapticInput)) {
            this.setupIosHapticElement();
          }
          if (this.iosHapticInput) {
            this.iosHapticInput.click();
          }
        } catch {
          // Fallback
        }
      }

      // Android Physical Vibration (Single crisp 28ms pulse - no double-vibrate)
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          if (type === 'button') {
            navigator.vibrate(32);
          } else {
            // Clean, single 26ms physical pulse
            navigator.vibrate(26);
          }
        } catch {
          // Fallback
        }
      }
    }

    // --- 2. IPHONE ALARM WHEEL SOUND SYNTHESIS ---
    if (!this.soundEnabled) return;

    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const t = ctx.currentTime;
      const isSnap = type === 'snap';

      // Master output gain
      const masterGain = ctx.createGain();
      const vol = Math.min(0.9, (isSnap ? 0.75 : 0.62) * intensity);
      masterGain.gain.setValueAtTime(vol, t);
      masterGain.connect(ctx.destination);

      // --- Component 1: Resonant Metallic/Woody Detent Click (Exact iPhone Alarm click) ---
      const clickOsc = ctx.createOscillator();
      const clickFilter = ctx.createBiquadFilter();
      const clickGain = ctx.createGain();

      clickOsc.type = 'triangle';
      const startFreq = isSnap ? 2100 : 1950;
      const endFreq = isSnap ? 420 : 380;
      clickOsc.frequency.setValueAtTime(startFreq, t);
      clickOsc.frequency.exponentialRampToValueAtTime(endFreq, t + 0.005);

      clickFilter.type = 'bandpass';
      clickFilter.frequency.setValueAtTime(1850, t);
      clickFilter.Q.setValueAtTime(5.2, t);

      clickGain.gain.setValueAtTime(0.001, t);
      clickGain.gain.linearRampToValueAtTime(0.85, t + 0.0003);
      clickGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.006);

      clickOsc.connect(clickFilter);
      clickFilter.connect(clickGain);
      clickGain.connect(masterGain);

      clickOsc.start(t);
      clickOsc.stop(t + 0.007);

      // --- Component 2: Low-End Body Pop (Subtle acoustic physical thump) ---
      const bodyOsc = ctx.createOscillator();
      const bodyGain = ctx.createGain();

      bodyOsc.type = 'sine';
      const bodyStart = isSnap ? 150 : 125;
      const bodyEnd = isSnap ? 45 : 40;
      bodyOsc.frequency.setValueAtTime(bodyStart, t);
      bodyOsc.frequency.exponentialRampToValueAtTime(bodyEnd, t + 0.006);

      bodyGain.gain.setValueAtTime(0.001, t);
      bodyGain.gain.linearRampToValueAtTime(isSnap ? 0.6 : 0.45, t + 0.0004);
      bodyGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.007);

      bodyOsc.connect(bodyGain);
      bodyGain.connect(masterGain);

      bodyOsc.start(t);
      bodyOsc.stop(t + 0.008);
    } catch {
      // AudioContext fallback
    }
  }

  // Backward-compatible triggerTick method
  public triggerTick(intensity: number = 1.0, type: HapticTickType = 'detent') {
    this.triggerAlarmTick(intensity, type);
  }

  public triggerSnapTick(intensity: number = 1.3) {
    this.triggerAlarmTick(intensity, 'snap');
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  public isSoundEnabled() {
    return this.soundEnabled;
  }

  public setHapticsEnabled(enabled: boolean) {
    this.hapticsEnabled = enabled;
  }

  public isHapticsEnabled() {
    return this.hapticsEnabled;
  }
}

export const haptics = new HapticFeedbackManager();
