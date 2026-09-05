'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type ArenaAudio = {
  enabled: boolean;
  theme: AudioTheme;
  themes: AudioTheme[];
  toggle: () => void;
  cycleTheme: () => void;
  strike: (kind?: 'card' | 'reveal' | 'victory') => void;
};

export type AudioTheme = 'neon' | 'deep' | 'rush' | 'focus';
const themes: AudioTheme[] = ['neon', 'deep', 'rush', 'focus'];

export function useArenaAudio(intensity = 0): ArenaAudio {
  const [enabled, setEnabled] = useState(false);
  const [theme, setTheme] = useState<AudioTheme>('neon');
  const contextRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);
  const stepRef = useRef(0);

  const getContext = useCallback(() => {
    const AudioCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return null;
    contextRef.current ??= new AudioCtor();
    if (contextRef.current.state === 'suspended') void contextRef.current.resume();
    return contextRef.current;
  }, []);

  const tone = useCallback((frequency: number, duration: number, volume: number, type: OscillatorType = 'sawtooth') => {
    const context = getContext();
    if (!context) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, context.currentTime);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(volume, context.currentTime + .012);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + duration + .03);
  }, [getContext]);

  const strike = useCallback((kind: 'card' | 'reveal' | 'victory' = 'card') => {
    if (!enabled) return;
    if (kind === 'card') tone(180, .08, .035, 'square');
    if (kind === 'reveal') {
      tone(96, .3, .07, 'sawtooth');
      window.setTimeout(() => tone(330, .18, .05, 'square'), 80);
    }
    if (kind === 'victory') [220, 277, 330, 440].forEach((note, index) => window.setTimeout(() => tone(note, .35, .055, 'sawtooth'), index * 95));
  }, [enabled, tone]);

  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
      return;
    }
    getContext();
    const patterns: Record<AudioTheme, { bass: number[]; interval: number; wave: OscillatorType }> = {
      neon: { bass: [55, 55, 65.41, 49], interval: 390, wave: 'triangle' },
      deep: { bass: [41.2, 49, 46.25, 36.71], interval: 540, wave: 'sine' },
      rush: { bass: [65.41, 73.42, 82.41, 98], interval: 255, wave: 'sawtooth' },
      focus: { bass: [110, 130.81, 146.83, 123.47], interval: 680, wave: 'sine' },
    };
    const pattern = patterns[theme];
    const interval = Math.max(175, pattern.interval - intensity * (theme === 'rush' ? 16 : 24));
    timerRef.current = window.setInterval(() => {
      const step = stepRef.current++;
      tone(pattern.bass[step % pattern.bass.length] * (step % 4 === 3 && theme !== 'deep' ? 2 : 1), theme === 'focus' ? .52 : .18, .012 + intensity * .0025, pattern.wave);
      if (theme !== 'focus' && step % 4 === 2) tone(theme === 'rush' ? 1320 : 880, .025, .01, 'square');
    }, interval);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [enabled, getContext, intensity, theme, tone]);

  const toggle = useCallback(() => setEnabled((value) => !value), []);
  const cycleTheme = useCallback(() => setTheme((current) => themes[(themes.indexOf(current) + 1) % themes.length]), []);
  return { enabled, theme, themes, toggle, cycleTheme, strike };
}
