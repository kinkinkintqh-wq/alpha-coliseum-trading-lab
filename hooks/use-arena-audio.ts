'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type ArenaAudio = {
  enabled: boolean;
  toggle: () => void;
  strike: (kind?: 'card' | 'reveal' | 'victory') => void;
};

export function useArenaAudio(intensity = 0): ArenaAudio {
  const [enabled, setEnabled] = useState(false);
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
    const bass = [55, 55, 65.41, 49];
    const interval = Math.max(210, 390 - intensity * 28);
    timerRef.current = window.setInterval(() => {
      const step = stepRef.current++;
      tone(bass[step % bass.length] * (step % 4 === 3 ? 2 : 1), .18, .018 + intensity * .003, 'triangle');
      if (step % 4 === 2) tone(880, .025, .012, 'square');
    }, interval);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [enabled, getContext, intensity, tone]);

  const toggle = useCallback(() => setEnabled((value) => !value), []);
  return { enabled, toggle, strike };
}
