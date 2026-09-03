import React, { useEffect, useRef } from 'react';

interface DeepSeaCanvasProps {
  multiplier: number;
  gameState: 'idle' | 'diving' | 'crashed';
  crashMultiplier?: number;
  onCrashAlert?: () => void;
  children?: React.ReactNode;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  opacity: number;
  color?: string;
  type: 'bubble' | 'snow' | 'plankton' | 'debris';
}

interface SeaCreature {
  x: number;
  y: number;
  size: number;
  speed: number;
  depthTier: number;
  type: 'fish' | 'jellyfish' | 'angler' | 'mantaray';
  phase: number;
}

export const DeepSeaCanvas: React.FC<DeepSeaCanvasProps> = ({
  multiplier,
  gameState,
  crashMultiplier,
  children,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const creaturesRef = useRef<SeaCreature[]>([]);
  const crashParticlesRef = useRef<Particle[]>([]);
  const jetPosRef = useRef({ x: 0, y: 0, angle: 0.18 });
  const timeRef = useRef<number>(0);

  // Initialize background ambient particles & deep creatures
  useEffect(() => {
    const p: Particle[] = [];
    for (let i = 0; i < 90; i++) {
      p.push({
        x: Math.random() * 1200,
        y: Math.random() * 800,
        size: Math.random() * 3 + 1,
        speedY: -(Math.random() * 1.5 + 0.5),
        speedX: (Math.random() - 0.5) * 0.4,
        opacity: Math.random() * 0.7 + 0.2,
        type: Math.random() > 0.4 ? 'snow' : 'bubble'
      });
    }
    particlesRef.current = p;

    const c: SeaCreature[] = [
      { x: 300, y: 400, size: 28, speed: 0.8, depthTier: 1, type: 'jellyfish', phase: 0 },
      { x: 750, y: 250, size: 22, speed: 1.2, depthTier: 1, type: 'jellyfish', phase: 2 },
      { x: 900, y: 550, size: 45, speed: 1.5, depthTier: 2, type: 'mantaray', phase: 1 },
      { x: 150, y: 650, size: 32, speed: 0.6, depthTier: 3, type: 'angler', phase: 3 }
    ];
    creaturesRef.current = c;
  }, []);

  // When game crashes, spawn explosion debris
  useEffect(() => {
    if (gameState === 'crashed') {
      const debris: Particle[] = [];
      const originX = jetPosRef.current.x || 300;
      const originY = jetPosRef.current.y || 250;
      for (let i = 0; i < 60; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = Math.random() * 8 + 2;
        debris.push({
          x: originX,
          y: originY,
          size: Math.random() * 6 + 2,
          speedX: Math.cos(ang) * spd,
          speedY: Math.sin(ang) * spd,
          opacity: 1,
          type: 'debris',
          color: Math.random() > 0.4 ? '#f59e0b' : '#06b6d4'
        });
      }
      crashParticlesRef.current = debris;
    } else {
      crashParticlesRef.current = [];
    }
  }, [gameState]);

  // Main 60 FPS Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    const render = () => {
      if (!isRunning) return;
      timeRef.current += 0.016;
      const t = timeRef.current;

      const width = canvas.width;
      const height = canvas.height;

      // 1. Calculate environmental depth zone based on multiplier
      // Multiplier starts at 1.00x and ascends exponentially
      const effectiveMult = gameState === 'crashed' ? (crashMultiplier || multiplier) : multiplier;
      const depthMeters = Math.max(0, Math.floor((effectiveMult - 1) * 750));
      const velocityKnots = (22 + Math.min(180, Math.pow(effectiveMult, 1.25) * 12)).toFixed(1);
      const pressureBar = ((effectiveMult - 1) * 65 + 1).toFixed(1);

      // Gradient background based on depth tier
      let topColor = '#06283d';
      let bottomColor = '#021024';
      let zoneName = 'EPIPELAGIC SUNLIGHT (0-200M)';
      let zoneColor = '#38bdf8';

      if (effectiveMult < 1.6) {
        // Epipelagic
        topColor = '#034f84';
        bottomColor = '#011a38';
        zoneName = 'EPIPELAGIC SURFACE';
        zoneColor = '#38bdf8';
      } else if (effectiveMult < 3.2) {
        // Mesopelagic
        topColor = '#011f4b';
        bottomColor = '#000c1e';
        zoneName = 'MESOPELAGIC TWILIGHT';
        zoneColor = '#818cf8';
      } else if (effectiveMult < 8.0) {
        // Bathypelagic
        topColor = '#03071e';
        bottomColor = '#000000';
        zoneName = 'BATHYPELAGIC MIDNIGHT ABYSS';
        zoneColor = '#a855f7';
      } else {
        // Hadal Trench
        topColor = '#120224';
        bottomColor = '#05000c';
        zoneName = 'HADAL TRENCH VORTEX';
        zoneColor = '#f43f5e';
      }

      const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
      oceanGrad.addColorStop(0, topColor);
      oceanGrad.addColorStop(1, bottomColor);
      ctx.fillStyle = oceanGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Sunlight rays / Bioluminescent light caustics
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      if (effectiveMult < 2.5) {
        const rayAlpha = Math.max(0, 0.25 - (effectiveMult - 1) * 0.15);
        for (let r = 0; r < 5; r++) {
          const rayGrad = ctx.createLinearGradient(r * 240, 0, r * 200 + 100, height);
          rayGrad.addColorStop(0, `rgba(56, 189, 248, ${rayAlpha})`);
          rayGrad.addColorStop(1, 'rgba(3, 105, 161, 0)');
          ctx.fillStyle = rayGrad;
          ctx.beginPath();
          ctx.moveTo(r * 240 + Math.sin(t + r) * 30, 0);
          ctx.lineTo(r * 240 + 160 + Math.sin(t + r) * 40, 0);
          ctx.lineTo(r * 240 + 80 + Math.sin(t + r) * 60, height);
          ctx.lineTo(r * 240 - 40 + Math.sin(t + r) * 60, height);
          ctx.closePath();
          ctx.fill();
        }
      }
      ctx.restore();

      // 3. Ambient underwater particles / cavitation bubbles
      const speedMultiplier = gameState === 'diving' ? Math.min(6, 1 + effectiveMult * 0.4) : 1;
      particlesRef.current.forEach((p) => {
        p.y += p.speedY * speedMultiplier;
        p.x += p.speedX;

        if (p.y < -20) {
          p.y = height + 20;
          p.x = Math.random() * width;
        }

        ctx.save();
        ctx.globalAlpha = p.opacity;
        if (p.type === 'bubble') {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        } else {
          // Marine snow
          ctx.fillStyle = zoneColor;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.7, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      // 4. Sea creatures swimming in background
      creaturesRef.current.forEach((c) => {
        c.phase += 0.02;
        c.x -= c.speed;
        if (c.x < -100) {
          c.x = width + 100;
          c.y = Math.random() * (height - 100) + 50;
        }

        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        if (c.type === 'jellyfish') {
          const bob = Math.sin(c.phase) * 6;
          ctx.fillStyle = 'rgba(129, 140, 248, 0.25)';
          ctx.beginPath();
          ctx.arc(c.x, c.y + bob, c.size, Math.PI, 0, false);
          ctx.closePath();
          ctx.fill();
          // tentacles
          ctx.strokeStyle = 'rgba(129, 140, 248, 0.18)';
          ctx.lineWidth = 1.5;
          for (let i = -2; i <= 2; i++) {
            ctx.beginPath();
            ctx.moveTo(c.x + i * 5, c.y + bob);
            ctx.quadraticCurveTo(
              c.x + i * 5 + Math.sin(t * 2 + i) * 6,
              c.y + bob + 30,
              c.x + i * 5,
              c.y + bob + 45
            );
            ctx.stroke();
          }
        } else if (c.type === 'mantaray') {
          const flap = Math.sin(c.phase * 1.5) * 8;
          ctx.fillStyle = 'rgba(6, 182, 212, 0.18)';
          ctx.beginPath();
          ctx.moveTo(c.x, c.y);
          ctx.lineTo(c.x - c.size, c.y - flap);
          ctx.lineTo(c.x - c.size * 0.7, c.y + flap * 0.5);
          ctx.lineTo(c.x, c.y + 8);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      });

      // 5. Deep Sea Jet Position and Trajectory
      // In flight, the submarine dives downwards diagonally with hydrodynamic lift
      let jetX = width * 0.48;
      let jetY = height * 0.45;
      let jetAngle = 0.22; // slight downward pitch

      if (gameState === 'diving') {
        // dynamic pitch angle & slight hydrodynamic sway
        const speedRatio = Math.min(1, (effectiveMult - 1) / 8);
        jetX = width * 0.42 + Math.cos(t * 2) * 12;
        jetY = height * 0.38 + speedRatio * 80 + Math.sin(t * 3) * 8;
        jetAngle = 0.22 + Math.sin(t * 2.5) * 0.05 + speedRatio * 0.12;
      } else if (gameState === 'crashed') {
        jetX = jetPosRef.current.x;
        jetY = jetPosRef.current.y;
      }

      jetPosRef.current = { x: jetX, y: jetY, angle: jetAngle };

      // 6. Thruster Wake & Cavitation Jet Stream (When active)
      if (gameState === 'diving' || gameState === 'idle') {
        ctx.save();
        ctx.translate(jetX, jetY);
        ctx.rotate(jetAngle);

        // Volumetric Twin Forward Searchlights
        const lightGrad = ctx.createRadialGradient(85, 0, 10, 360, 0, 240);
        lightGrad.addColorStop(0, 'rgba(240, 253, 250, 0.45)');
        lightGrad.addColorStop(0.4, 'rgba(56, 189, 248, 0.2)');
        lightGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');

        ctx.fillStyle = lightGrad;
        ctx.beginPath();
        ctx.moveTo(70, -6);
        ctx.lineTo(380, -90);
        ctx.lineTo(380, 90);
        ctx.lineTo(70, 6);
        ctx.closePath();
        ctx.fill();

        // Twin Thrusters Cavitation Wash behind jet
        const thrusterLength = 90 + Math.min(220, (effectiveMult - 1) * 35);
        const wakeGrad = ctx.createLinearGradient(0, 0, -thrusterLength, 0);
        wakeGrad.addColorStop(0, '#38bdf8');
        wakeGrad.addColorStop(0.3, '#0284c7');
        wakeGrad.addColorStop(1, 'rgba(2, 132, 199, 0)');

        ctx.fillStyle = wakeGrad;
        // Upper engine wash
        ctx.beginPath();
        ctx.moveTo(-55, -12);
        ctx.lineTo(-55 - thrusterLength, -18 + Math.sin(t * 15) * 6);
        ctx.lineTo(-55 - thrusterLength * 0.6, -12);
        ctx.closePath();
        ctx.fill();

        // Lower engine wash
        ctx.beginPath();
        ctx.moveTo(-55, 12);
        ctx.lineTo(-55 - thrusterLength, 18 + Math.cos(t * 15) * 6);
        ctx.lineTo(-55 - thrusterLength * 0.6, 12);
        ctx.closePath();
        ctx.fill();

        // Draw Deep Sea Jet Submersible Body (Futuristic Titanium Hull)
        // Main streamlined hull
        ctx.fillStyle = '#1e293b'; // Titanium gunmetal
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        // Nose cone
        ctx.moveTo(85, 0);
        // Top deck curve
        ctx.bezierCurveTo(45, -24, -25, -22, -65, -14);
        // Engine stern
        ctx.lineTo(-75, -18);
        ctx.lineTo(-78, 18);
        ctx.lineTo(-65, 14);
        // Bottom keel curve
        ctx.bezierCurveTo(-25, 22, 45, 24, 85, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Cockpit Visor Dome (Luminous Cyan/Gold)
        const visorGrad = ctx.createLinearGradient(30, -12, 70, 0);
        visorGrad.addColorStop(0, '#38bdf8');
        visorGrad.addColorStop(0.6, '#0284c7');
        visorGrad.addColorStop(1, '#0f172a');
        ctx.fillStyle = visorGrad;
        ctx.beginPath();
        ctx.moveTo(70, -2);
        ctx.bezierCurveTo(60, -14, 40, -14, 25, -5);
        ctx.lineTo(25, 5);
        ctx.bezierCurveTo(40, 14, 60, 14, 70, 2);
        ctx.closePath();
        ctx.fill();

        // Hydrofoil Stabilizer Wings
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 1.5;
        // Upper wing
        ctx.beginPath();
        ctx.moveTo(-5, -18);
        ctx.lineTo(-28, -42);
        ctx.lineTo(-44, -38);
        ctx.lineTo(-30, -18);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Lower wing
        ctx.beginPath();
        ctx.moveTo(-5, 18);
        ctx.lineTo(-28, 42);
        ctx.lineTo(-44, 38);
        ctx.lineTo(-30, 18);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Hull plating lines & neon accents
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(10, -16);
        ctx.lineTo(-40, -16);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(10, 16);
        ctx.lineTo(-40, 16);
        ctx.stroke();

        // Glowing Beacon Navigation LED
        const beaconPulse = Math.sin(t * 8) > 0 ? 1 : 0.3;
        ctx.fillStyle = `rgba(239, 68, 68, ${beaconPulse})`;
        ctx.beginPath();
        ctx.arc(-26, -42, 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(34, 197, 94, ${beaconPulse})`;
        ctx.beginPath();
        ctx.arc(-26, 42, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Submarine ID badge
        ctx.fillStyle = '#e2e8f0';
        ctx.font = 'bold 8px monospace';
        ctx.fillText('JET-DS7', -20, 3);

        ctx.restore();
      }

      // 7. Crash Explosion & Implosion Shockwaves
      if (gameState === 'crashed') {
        const crashX = jetPosRef.current.x;
        const crashY = jetPosRef.current.y;

        // Expanding shockwave rings
        ctx.save();
        for (let ring = 1; ring <= 3; ring++) {
          const ringRad = ((t * 40 * ring) % 180) + 10;
          const ringAlpha = Math.max(0, 1 - ringRad / 180);
          ctx.strokeStyle = `rgba(244, 63, 94, ${ringAlpha})`;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(crashX, crashY, ringRad, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Hull breach debris
        crashParticlesRef.current.forEach((dp) => {
          dp.x += dp.speedX;
          dp.y += dp.speedY;
          dp.opacity = Math.max(0, dp.opacity - 0.015);

          ctx.fillStyle = dp.color || '#f43f5e';
          ctx.globalAlpha = dp.opacity;
          ctx.beginPath();
          ctx.arc(dp.x, dp.y, dp.size, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.restore();
      }

      // 8. Dynamic Multiplier & Speed Display (Centerpiece)
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (gameState === 'diving') {
        // Glowing multiplier text
        ctx.font = '900 68px "Inter", sans-serif';
        ctx.shadowColor = zoneColor;
        ctx.shadowBlur = 24;
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`${multiplier.toFixed(2)}x`, width / 2, height * 0.28);

        // Depth and Knot Telemetry under multiplier
        ctx.shadowBlur = 0;
        ctx.font = '700 13px monospace';
        ctx.fillStyle = zoneColor;
        ctx.fillText(`DEPTH: ${depthMeters.toLocaleString()}M • VELOCITY: ${velocityKnots} KTS • PRESSURE: ${pressureBar} BAR`, width / 2, height * 0.28 + 48);

        // Zone Pill
        ctx.font = '800 10px sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillText(`ZONE: ${zoneName}`, width / 2, height * 0.28 + 68);

      } else if (gameState === 'crashed') {
        ctx.font = '900 52px "Inter", sans-serif';
        ctx.shadowColor = '#f43f5e';
        ctx.shadowBlur = 25;
        ctx.fillStyle = '#f43f5e';
        ctx.fillText(`IMPLOSION AT ${(crashMultiplier || multiplier).toFixed(2)}x`, width / 2, height * 0.26);

        ctx.shadowBlur = 0;
        ctx.font = '800 14px monospace';
        ctx.fillStyle = '#fca5a5';
        ctx.fillText('CRITICAL HULL PRESSURE BREACH • CRASHED', width / 2, height * 0.26 + 42);

      } else {
        // Idle / Waiting for stake
        ctx.font = '900 38px "Inter", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 15;
        ctx.fillText('DEEP SEA JET', width / 2, height * 0.26);

        ctx.shadowBlur = 0;
        ctx.font = '700 12px monospace';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('SELECT STAKE & INITIATE DIVE TO ENTER ABYSS', width / 2, height * 0.26 + 36);
      }
      ctx.restore();

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      isRunning = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [multiplier, gameState, crashMultiplier]);

  // Handle high-DPI canvas resizing
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="relative w-full h-[420px] md:h-[480px] bg-slate-950 rounded-[2.5rem] overflow-hidden border-2 border-cyan-500/30 shadow-[0_20px_60px_rgba(6,182,212,0.15)]">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ width: '100%', height: '100%' }}
      />
      {children}
    </div>
  );
};
