'use client';

import { useCallback } from 'react';

export function useConfetti() {
  const celebrate = useCallback(async () => {
    try {
      const confetti = (await import('canvas-confetti')).default;
      
      // Create a burst effect
      const count = 200;
      const defaults = {
        origin: { y: 0.7 },
        zIndex: 9999,
      };

      const fire = (particleRatio: number, opts: confetti.Options) => {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio),
        });
      };

      // Fire multiple bursts for a richer effect
      fire(0.25, {
        spread: 26,
        startVelocity: 55,
        colors: ['#ff6b6b', '#4ecdc4', '#ffe66d'],
      });
      
      fire(0.2, {
        spread: 60,
        colors: ['#f72585', '#7209b7', '#3a0ca3'],
      });
      
      fire(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8,
        colors: ['#4361ee', '#4cc9f0', '#90e0ef'],
      });
      
      fire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.2,
        colors: ['#52b788', '#40916c', '#2d6a4f'],
      });
      
      fire(0.1, {
        spread: 120,
        startVelocity: 45,
        colors: ['#ffd60a', '#ffc300', '#ffb703'],
      });
    } catch (error) {
      console.log('Confetti not available');
    }
  }, []);

  const firework = useCallback(async () => {
    try {
      const confetti = (await import('canvas-confetti')).default;
      
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      };

      const interval: ReturnType<typeof setInterval> = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        
        // Fire from two sides
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: ['#ff6b6b', '#4ecdc4', '#ffe66d', '#f72585', '#7209b7'],
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: ['#4361ee', '#4cc9f0', '#52b788', '#ffd60a'],
        });
      }, 250);
    } catch (error) {
      console.log('Confetti not available');
    }
  }, []);

  const rain = useCallback(async () => {
    try {
      const confetti = (await import('canvas-confetti')).default;
      
      const end = Date.now() + 2000;

      const colors = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#f72585'];

      const frame = () => {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: colors,
          zIndex: 9999,
        });
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: colors,
          zIndex: 9999,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    } catch (error) {
      console.log('Confetti not available');
    }
  }, []);

  return { celebrate, firework, rain };
}

