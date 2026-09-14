import React, { useEffect, useRef } from 'react';

export const SpaceBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize, { passive: true });

    // Generate optimized stars count
    const starCount = Math.min(80, Math.floor((width * height) / 16000));
    const stars = Array.from({ length: starCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 1.8 + 0.6,
      opacity: Math.random() * 0.7 + 0.3,
      speed: Math.random() * 0.15 + 0.04,
      twinkleSpeed: Math.random() * 0.02 + 0.005,
      hue: Math.random() > 0.6 ? 210 : Math.random() > 0.4 ? 45 : 0,
    }));

    // Floating particles (cosmic dust) - minimal count for zero lag
    const particleCount = 12;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      size: Math.random() * 2.5 + 1,
      color: Math.random() > 0.5 ? 'rgba(59, 130, 246, ' : 'rgba(250, 204, 21, ',
      alpha: Math.random() * 0.3 + 0.1,
    }));

    let time = 0;
    let isPaused = false;

    const handleVisibilityChange = () => {
      isPaused = document.hidden;
      if (!isPaused) {
        animationFrameId = requestAnimationFrame(render);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const render = () => {
      if (isPaused) return;
      time += 0.01;

      // Deep space base gradient
      const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
      bgGradient.addColorStop(0, '#030712');
      bgGradient.addColorStop(0.5, '#090D1E');
      bgGradient.addColorStop(1, '#02040A');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // Render stars
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        star.y -= star.speed;
        if (star.y < 0) {
          star.y = height;
          star.x = Math.random() * width;
        }

        const currentOpacity =
          star.opacity * (0.65 + 0.35 * Math.sin(time * 40 * star.twinkleSpeed));

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        if (star.hue === 210) {
          ctx.fillStyle = `rgba(147, 197, 253, ${currentOpacity})`;
        } else if (star.hue === 45) {
          ctx.fillStyle = `rgba(254, 240, 138, ${currentOpacity})`;
        } else {
          ctx.fillStyle = `rgba(255, 255, 255, ${currentOpacity})`;
        }
        ctx.fill();
      }

      // Render cosmic particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${p.alpha})`;
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none">
      {/* Canvas for stars & particles */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Subtle Glowing Nebulae */}
      <div 
        className="absolute -top-[15%] -left-[10%] w-[55vw] h-[55vw] rounded-full blur-[100px] opacity-20 mix-blend-screen pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(59,130,246,0.6) 0%, rgba(37,99,235,0.2) 60%, transparent 100%)',
        }}
      />
      <div 
        className="absolute top-[35%] -right-[15%] w-[50vw] h-[50vw] rounded-full blur-[110px] opacity-15 mix-blend-screen pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(168,85,247,0.5) 0%, rgba(234,88,12,0.2) 60%, transparent 100%)',
        }}
      />
      <div 
        className="absolute -bottom-[20%] left-[20%] w-[60vw] h-[60vw] rounded-full blur-[100px] opacity-15 mix-blend-screen pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(16,185,129,0.4) 0%, rgba(14,165,233,0.2) 60%, transparent 100%)',
        }}
      />

      {/* Distant Planet 1 - Scout Gold Planet */}
      <div 
        className="absolute top-12 right-6 md:right-24 w-16 h-16 md:w-20 md:h-20 rounded-full opacity-60 border-2 border-yellow-400/30 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 35% 35%, #FDE047 0%, #CA8A04 60%, #451A03 100%)',
          boxShadow: '0 0 20px rgba(234, 179, 8, 0.3)',
        }}
      >
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[35%] rounded-full border-t-2 border-b-2 border-amber-300/40 rotate-[-25deg] pointer-events-none"
        />
      </div>

      {/* Distant Moon / Tiny Planet 2 */}
      <div 
        className="absolute bottom-20 left-6 md:left-16 w-10 h-10 md:w-12 md:h-12 rounded-full opacity-50 border border-blue-400/30 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 30% 30%, #93C5FD 0%, #2563EB 60%, #0F172A 100%)',
          boxShadow: '0 0 16px rgba(59, 130, 246, 0.25)',
        }}
      />

      {/* Subtle Game Grid Texture Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none"
      />
    </div>
  );
};

