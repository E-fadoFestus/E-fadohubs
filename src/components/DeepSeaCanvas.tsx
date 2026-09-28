import React, { useEffect, useRef } from 'react';

interface DeepSeaCanvasProps {
  multiplier: number;
  gameState: 'betting' | 'flying' | 'diving' | 'crashed' | 'idle';
  crashMultiplier?: number;
  bettingCountdown?: number;
  children?: React.ReactNode;
}

interface OceanBubble {
  x: number;
  y: number;
  r: number;
  speed: number;
  wobbleSpeed: number;
  wobbleAmp: number;
  opacity: number;
}

interface MarineSnow {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  phase: number;
  opacity: number;
}

interface ThrusterBubble {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

interface SpeedStreak {
  x: number;
  y: number;
  length: number;
  speed: number;
  opacity: number;
}

export const DeepSeaCanvas: React.FC<DeepSeaCanvasProps> = ({
  multiplier,
  gameState,
  crashMultiplier = 1.0,
  bettingCountdown = 5.0,
  children,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const multiplierDomRef = useRef<HTMLDivElement | null>(null);
  const subtitleDomRef = useRef<HTMLDivElement | null>(null);
  const depthDomRef = useRef<HTMLDivElement | null>(null);
  const jetDomRef = useRef<HTMLDivElement | null>(null);

  // Synchronized refs for 60fps loop to read latest state without tearing down animation
  const multiplierRef = useRef(multiplier);
  multiplierRef.current = multiplier;

  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  const crashMultiplierRef = useRef(crashMultiplier);
  crashMultiplierRef.current = crashMultiplier;

  const bettingCountdownRef = useRef(bettingCountdown);
  bettingCountdownRef.current = bettingCountdown;

  // Kinetic state tracking across frames
  const startTimeRef = useRef<number>(performance.now());
  const crashTimeRef = useRef<number | null>(null);
  const lastJetCoordRef = useRef<{ x: number; y: number; pitch: number }>({ x: 100, y: 100, pitch: 0 });

  // Dynamic Ocean Particle Systems
  const risingBubblesRef = useRef<OceanBubble[]>([]);
  const marineSnowRef = useRef<MarineSnow[]>([]);
  const thrusterBubblesRef = useRef<ThrusterBubble[]>([]);
  const speedStreaksRef = useRef<SpeedStreak[]>([]);
  const depthScrollRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);

  // State change transitions
  useEffect(() => {
    if (gameState === 'diving' || gameState === 'flying') {
      startTimeRef.current = performance.now();
      crashTimeRef.current = null;
      thrusterBubblesRef.current = [];
      if (jetDomRef.current) {
        jetDomRef.current.style.opacity = '1';
        jetDomRef.current.classList.remove('animate-ping');
      }
    } else if (gameState === 'crashed') {
      crashTimeRef.current = performance.now();
    } else if (gameState === 'betting') {
      crashTimeRef.current = null;
      if (jetDomRef.current) {
        jetDomRef.current.style.opacity = '1';
        jetDomRef.current.classList.remove('animate-ping');
      }
    }
  }, [gameState]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Initialize rising ocean bubbles with natural buoyancy variation
    risingBubblesRef.current = Array.from({ length: 45 }, () => ({
      x: Math.random() * (container.clientWidth || 800),
      y: Math.random() * (container.clientHeight || 480),
      r: Math.random() * 3.5 + 1.2,
      speed: Math.random() * 45 + 35,
      wobbleSpeed: Math.random() * 2.5 + 1.5,
      wobbleAmp: Math.random() * 30 + 15,
      opacity: Math.random() * 0.45 + 0.3,
    }));

    // Initialize floating marine snow / organic ocean particles
    marineSnowRef.current = Array.from({ length: 60 }, () => ({
      x: Math.random() * (container.clientWidth || 800),
      y: Math.random() * (container.clientHeight || 480),
      r: Math.random() * 1.8 + 0.6,
      vx: (Math.random() - 0.5) * 15,
      vy: Math.random() * 12 + 6,
      phase: Math.random() * Math.PI * 2,
      opacity: Math.random() * 0.4 + 0.2,
    }));

    // Initialize cavitation speed streaks
    speedStreaksRef.current = Array.from({ length: 28 }, () => ({
      x: Math.random() * (container.clientWidth || 800),
      y: Math.random() * (container.clientHeight || 480),
      length: Math.random() * 70 + 35,
      speed: Math.random() * 450 + 320,
      opacity: Math.random() * 0.25 + 0.1,
    }));

    const resizeCanvas = () => {
      if (!canvas || !container) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = container.getBoundingClientRect();
      const w = Math.max(300, rect.width || 800);
      const h = Math.max(300, rect.height || 480);

      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    const observer = new ResizeObserver(resizeCanvas);
    observer.observe(container);

    let isRunning = true;
    let lastTime = performance.now();

    // 1. REAL DEEP SEA: Animated Dark Blue Gradient with Dynamic Ocean Depth
    const drawRealDeepSea = (elapsed: number, width: number, height: number, mult: number, now: number) => {
      const time = now * 0.001;
      const depthFactor = Math.min(1, (mult - 1) * 0.05 + elapsed * 0.012);
      const waveShift = Math.sin(time * 0.8) * 0.05;

      const grad = ctx.createLinearGradient(0, 0, 0, height);

      if (depthFactor < 0.35) {
        // Surface and upper epipelagic ocean: vivid dark blue with shimmering turquoise surface
        grad.addColorStop(0, '#044378');
        grad.addColorStop(Math.max(0.05, 0.22 + waveShift), '#022e57');
        grad.addColorStop(0.6, '#021c3d');
        grad.addColorStop(1, '#010c1c');
      } else if (depthFactor < 0.75) {
        // Mesopelagic twilight bathyal depths: deep oceanic indigo
        grad.addColorStop(0, '#022d57');
        grad.addColorStop(Math.max(0.1, 0.32 + waveShift), '#011e3d');
        grad.addColorStop(0.68, '#011024');
        grad.addColorStop(1, '#000814');
      } else {
        // Hadal abyssal trench: pitch oceanic midnight
        grad.addColorStop(0, '#011c3d');
        grad.addColorStop(0.38, '#011126');
        grad.addColorStop(0.75, '#000917');
        grad.addColorStop(1, '#00030a');
      }

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    };

    // 2. REAL DEEP SEA: Moving Light Rays (God Rays / Caustics) Piercing from Surface
    const drawMovingLightRays = (width: number, height: number, time: number) => {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';

      const rays = [
        { xRatio: 0.10, widthRatio: 0.16, angle: 0.38, speed: 0.45, phase: 0 },
        { xRatio: 0.28, widthRatio: 0.22, angle: 0.42, speed: 0.35, phase: 1.8 },
        { xRatio: 0.48, widthRatio: 0.18, angle: 0.40, speed: 0.50, phase: 3.2 },
        { xRatio: 0.68, widthRatio: 0.24, angle: 0.44, speed: 0.30, phase: 4.5 },
        { xRatio: 0.88, widthRatio: 0.20, angle: 0.46, speed: 0.40, phase: 2.3 },
      ];

      rays.forEach((ray) => {
        const sway = Math.sin(time * ray.speed + ray.phase) * 35;
        const pulse = 0.08 + Math.sin(time * ray.speed * 1.5 + ray.phase) * 0.035;
        const topX = width * ray.xRatio + sway;
        const topW = width * ray.widthRatio * 0.4;
        const rayLength = height * 1.15;
        const botX = topX + rayLength * ray.angle + Math.cos(time * ray.speed * 0.7) * 25;
        const botW = width * ray.widthRatio * 1.35;

        const rayGrad = ctx.createLinearGradient(topX, 0, botX, rayLength);
        rayGrad.addColorStop(0, `rgba(186, 240, 255, ${(pulse * 1.8).toFixed(3)})`);
        rayGrad.addColorStop(0.25, `rgba(56, 189, 248, ${(pulse * 1.2).toFixed(3)})`);
        rayGrad.addColorStop(0.65, `rgba(6, 182, 212, ${(pulse * 0.45).toFixed(3)})`);
        rayGrad.addColorStop(1, 'rgba(2, 132, 199, 0)');

        ctx.fillStyle = rayGrad;
        ctx.beginPath();
        ctx.moveTo(topX - topW, 0);
        ctx.lineTo(topX + topW, 0);
        ctx.lineTo(botX + botW, rayLength);
        ctx.lineTo(botX - botW, rayLength);
        ctx.closePath();
        ctx.fill();
      });

      ctx.restore();
    };

    // 3. REAL DEEP SEA: Surface Ripple Caustics Along Top
    const drawSurfaceCaustics = (width: number, time: number) => {
      ctx.save();
      ctx.strokeStyle = 'rgba(125, 211, 252, 0.28)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = 0; x <= width; x += 15) {
        const y = 22 + Math.sin(x * 0.02 + time * 1.5) * 5 + Math.cos(x * 0.01 - time * 0.8) * 3;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.16)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let x = 0; x <= width; x += 20) {
        const y = 30 + Math.cos(x * 0.025 + time * 1.2) * 4 + Math.sin(x * 0.015 - time) * 3;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    };

    // 4. REAL DEEP SEA: Floating Marine Snow / Oceanic Particles
    const drawFloatingParticles = (width: number, height: number, time: number, dt: number) => {
      ctx.save();
      marineSnowRef.current.forEach((p) => {
        // Floating motion: subtle sinusoidal horizontal swell and gentle descent
        p.x += Math.sin(time * 0.7 + p.phase) * 12 * dt + p.vx * dt;
        p.y += Math.cos(time * 0.5 + p.phase) * 8 * dt + p.vy * dt;

        if (p.y > height + 10) {
          p.y = -10;
          p.x = Math.random() * width;
        } else if (p.y < -10) {
          p.y = height + 10;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(186, 240, 255, ${p.opacity.toFixed(2)})`;
        ctx.fill();
      });
      ctx.restore();
    };

    // 5. REAL DEEP SEA: Rising Ocean Bubbles with Specular Highlights
    const drawRisingBubbles = (width: number, height: number, time: number, velocity: number, dt: number) => {
      ctx.save();
      risingBubblesRef.current.forEach((b) => {
        // Continuous upward rise combining natural buoyancy with relative dive speed
        b.y -= (b.speed + velocity * 0.15) * dt;
        b.x += Math.sin(b.y * 0.035 + time * b.wobbleSpeed) * b.wobbleAmp * dt;

        if (b.y < -20) {
          b.y = height + Math.random() * 30;
          b.x = Math.random() * width;
        }

        // Translucent glassy bubble sphere
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(224, 247, 255, ${(b.opacity * 0.4).toFixed(2)})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(255, 255, 255, ${b.opacity.toFixed(2)})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Glossy specular highlight dot (top-left reflection)
        ctx.beginPath();
        ctx.arc(b.x - b.r * 0.32, b.y - b.r * 0.32, b.r * 0.32, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.fill();
      });
      ctx.restore();
    };

    // 6. Continuous Sonar Depth Grid & Dynamic Aviator Altitude Scale
    const drawSonarGrid = (width: number, height: number, velocity: number, dt: number) => {
      ctx.save();
      depthScrollRef.current += velocity * dt;
      const scrollY = depthScrollRef.current % 70;
      const scrollX = (depthScrollRef.current * 0.6) % 70;

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
      ctx.lineWidth = 1;

      // Horizontal depth lines scrolling upward
      for (let y = -70 + scrollY; y < height + 70; y += 70) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Vertical grid lines
      for (let x = -70 - scrollX; x < width + 70; x += 70) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Dynamic Depth Scale Markers along left axis (Aviator Style)
      ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.font = '10px monospace';
      const baseDepthMeters = Math.floor(depthScrollRef.current * 1.8);
      for (let i = 0; i < 6; i++) {
        const markerY = 80 + i * 70 - (scrollY % 70);
        if (markerY > 30 && markerY < height - 20) {
          const depthLabel = `-${baseDepthMeters + i * 150}m`;
          ctx.fillText(depthLabel, 12, markerY);
          ctx.fillRect(48, markerY - 3, 6, 1);
        }
      }
      ctx.restore();
    };

    // 7. Cavitation Speed Streaks (During Active Dive)
    const drawSpeedStreaks = (width: number, height: number, mult: number, dt: number, isDiving: boolean) => {
      if (!isDiving || mult < 1.05) return;

      ctx.save();
      const intensity = Math.min(1.0, (mult - 1.0) * 0.35);
      const angle = 22 * (Math.PI / 180);
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      speedStreaksRef.current.forEach((streak) => {
        const currentSpeed = streak.speed * (1 + (mult - 1) * 0.35);
        streak.x -= cosA * currentSpeed * dt;
        streak.y -= sinA * currentSpeed * dt;

        if (streak.x < -100 || streak.y < -100) {
          streak.x = width + Math.random() * 150;
          streak.y = Math.random() * (height + 150);
        }

        ctx.strokeStyle = `rgba(255, 255, 255, ${(streak.opacity * intensity).toFixed(2)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(streak.x, streak.y);
        ctx.lineTo(streak.x + cosA * streak.length, streak.y + sinA * streak.length);
        ctx.stroke();
      });

      ctx.restore();
    };

    // 8. Aviator Glowing Hydrodynamic Wake Trajectory Curve & Area Fill
    const drawWakeTrajectory = (
      startX: number,
      startY: number,
      targetX: number,
      targetY: number,
      elapsed: number
    ) => {
      if (!Number.isFinite(startX) || !Number.isFinite(startY) || !Number.isFinite(targetX) || !Number.isFinite(targetY)) {
        return;
      }

      ctx.save();
      const ctrlX = startX + (targetX - startX) * 0.35;
      const ctrlY = startY + (targetY - startY) * 0.12;

      // Translucent Oceanic Area Fill under the dive curve
      try {
        const areaGrad = ctx.createLinearGradient(startX, startY, targetX, targetY);
        areaGrad.addColorStop(0, 'rgba(6, 182, 212, 0.32)');
        areaGrad.addColorStop(0.5, 'rgba(2, 132, 199, 0.16)');
        areaGrad.addColorStop(1, 'rgba(14, 165, 233, 0.02)');

        ctx.fillStyle = areaGrad;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(ctrlX, ctrlY, targetX, targetY);
        ctx.lineTo(startX, targetY);
        ctx.closePath();
        ctx.fill();
      } catch {
        // Safe fallback
      }

      // Luminous Trajectory Wake Line
      ctx.strokeStyle = '#38bdf8';
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 15;
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo(ctrlX, ctrlY, targetX, targetY);
      ctx.stroke();

      // Core white laser beam inside the wake
      ctx.strokeStyle = '#ffffff';
      ctx.shadowBlur = 0;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo(ctrlX, ctrlY, targetX, targetY);
      ctx.stroke();

      // Traveling pulse rings along wake path
      const pulseT = (elapsed * 1.5) % 1;
      const pulseX = (1 - pulseT) * (1 - pulseT) * startX + 2 * (1 - pulseT) * pulseT * ctrlX + pulseT * pulseT * targetX;
      const pulseY = (1 - pulseT) * (1 - pulseT) * startY + 2 * (1 - pulseT) * pulseT * ctrlY + pulseT * pulseT * targetY;

      ctx.beginPath();
      ctx.arc(pulseX, pulseY, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = '#67e8f9';
      ctx.shadowColor = '#22d3ee';
      ctx.shadowBlur = 10;
      ctx.fill();

      ctx.restore();
    };

    // 9. STRONG WHITE HYDRO TRAIL / LIGHT IN FRONT OF THE JET (Like Aviator Headlight)
    const drawJetFrontHydroLight = (jetX: number, jetY: number, pitchDeg: number, mult: number) => {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';

      const rad = (pitchDeg * Math.PI) / 180;
      // Nose tip coordinates of the jet
      const noseDist = 44;
      const noseX = jetX + Math.cos(rad) * noseDist;
      const noseY = jetY + Math.sin(rad) * noseDist;

      // Project strong white hydro beam ahead into dark water
      const beamLength = 240 + Math.min(120, (mult - 1) * 14);
      const beamSpread = 0.32; // Cone angle half-width

      const endX = noseX + Math.cos(rad) * beamLength;
      const endY = noseY + Math.sin(rad) * beamLength;

      const p1X = noseX + Math.cos(rad - beamSpread) * beamLength;
      const p1Y = noseY + Math.sin(rad - beamSpread) * beamLength;
      const p2X = noseX + Math.cos(rad + beamSpread) * beamLength;
      const p2Y = noseY + Math.sin(rad + beamSpread) * beamLength;

      // Conical light beam gradient
      const coneGrad = ctx.createLinearGradient(noseX, noseY, endX, endY);
      coneGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      coneGrad.addColorStop(0.12, 'rgba(224, 247, 255, 0.78)');
      coneGrad.addColorStop(0.4, 'rgba(56, 189, 248, 0.45)');
      coneGrad.addColorStop(0.75, 'rgba(6, 182, 212, 0.15)');
      coneGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');

      ctx.fillStyle = coneGrad;
      ctx.beginPath();
      ctx.moveTo(noseX, noseY);
      ctx.lineTo(p1X, p1Y);
      ctx.lineTo(p2X, p2Y);
      ctx.closePath();
      ctx.fill();

      // Strong razor-white core hydro light ray cutting forward
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 16;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(noseX, noseY);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      // Bright spotlight flare right on the nose tip
      const flareGrad = ctx.createRadialGradient(noseX, noseY, 2, noseX, noseY, 22);
      flareGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      flareGrad.addColorStop(0.35, 'rgba(165, 243, 252, 0.85)');
      flareGrad.addColorStop(0.8, 'rgba(6, 182, 212, 0.3)');
      flareGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');

      ctx.fillStyle = flareGrad;
      ctx.beginPath();
      ctx.arc(noseX, noseY, 22, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    // 10. WHITE BUBBLE TRAIL BEHIND THE JET
    const drawWhiteBubbleTrail = (
      jetX: number,
      jetY: number,
      pitchDeg: number,
      mult: number,
      dt: number,
      isDiving: boolean
    ) => {
      ctx.save();
      const rad = (pitchDeg * Math.PI) / 180;
      const nozzleOffsetX = -42 * Math.cos(rad);
      const nozzleOffsetY = -42 * Math.sin(rad);
      const nozzleX = jetX + nozzleOffsetX;
      const nozzleY = jetY + nozzleOffsetY;

      // Spawn dense white thruster bubbles continuously during dive
      if (isDiving) {
        const spawnCount = Math.min(8, Math.floor(2 + (mult - 1) * 0.8));
        for (let i = 0; i < spawnCount; i++) {
          const spread = (Math.random() - 0.5) * 0.5;
          const bubbleAngle = rad + Math.PI + spread;
          const speed = (Math.random() * 90 + 130) * (1 + (mult - 1) * 0.22);
          thrusterBubblesRef.current.push({
            x: nozzleX + (Math.random() - 0.5) * 8,
            y: nozzleY + (Math.random() - 0.5) * 8,
            r: Math.random() * 3.2 + 1.5,
            vx: Math.cos(bubbleAngle) * speed,
            vy: Math.sin(bubbleAngle) * speed - (Math.random() * 25 + 25), // buoyant upward rise
            life: 1.0,
            maxLife: Math.random() * 0.6 + 0.4,
          });
        }

        // Luminous cavitation thruster exhaust flare
        const flareSize = 16 + Math.min(24, (mult - 1) * 2.8);
        const flareGrad = ctx.createRadialGradient(nozzleX, nozzleY, 2, nozzleX, nozzleY, flareSize);
        flareGrad.addColorStop(0, 'rgba(255, 255, 255, 0.98)');
        flareGrad.addColorStop(0.3, 'rgba(6, 182, 212, 0.85)');
        flareGrad.addColorStop(0.7, 'rgba(2, 132, 199, 0.4)');
        flareGrad.addColorStop(1, 'rgba(2, 132, 199, 0)');
        ctx.fillStyle = flareGrad;
        ctx.beginPath();
        ctx.arc(nozzleX, nozzleY, flareSize, 0, Math.PI * 2);
        ctx.fill();
      }

      // Update & render white bubble trail
      thrusterBubblesRef.current.forEach((b) => {
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.life -= dt / b.maxLife;

        if (b.life > 0) {
          // White cavitation bubble core
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.r * (1.7 - b.life * 0.7), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${(b.life * 0.88).toFixed(2)})`;
          ctx.fill();

          // Outer luminous cyan glow ring
          ctx.strokeStyle = `rgba(165, 243, 252, ${(b.life * 0.7).toFixed(2)})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      });

      thrusterBubblesRef.current = thrusterBubblesRef.current.filter((b) => b.life > 0);
      ctx.restore();
    };

    // 11. Implosion Shockwave Upon Crash
    const drawCrashShockwave = (x: number, y: number, timeSinceCrash: number) => {
      ctx.save();
      const radius = timeSinceCrash * 380;
      const alpha = Math.max(0, 1 - timeSinceCrash * 1.2);

      if (alpha > 0) {
        ctx.strokeStyle = `rgba(244, 63, 94, ${alpha.toFixed(2)})`;
        ctx.lineWidth = 4;
        ctx.shadowColor = '#f43f5e';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = `rgba(6, 182, 212, ${(alpha * 0.8).toFixed(2)})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(x, y, radius * 0.65, 0, Math.PI * 2);
        ctx.stroke();

        for (let i = 0; i < 16; i++) {
          const angle = (i / 16) * Math.PI * 2;
          const dist = radius * 0.85;
          ctx.beginPath();
          ctx.arc(x + Math.cos(angle) * dist, y + Math.sin(angle) * dist, 3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(2)})`;
          ctx.fill();
        }
      }
      ctx.restore();
    };

    // 12. JET MOVEMENT ANIMATION: Diving from top downwards + Wave Shake + Multiplier Shaking Effect
    const updateJetPosition = (
      elapsed: number,
      width: number,
      height: number,
      currentState: string,
      currentMult: number,
      now: number
    ) => {
      const jetEl = jetDomRef.current;
      if (!jetEl) return;

      // Surface Origin (top-left)
      const startX = width * 0.14;
      const startY = height * 0.18;

      if (currentState === 'diving' || currentState === 'flying') {
        // Diving animation from top downwards into deep water sector
        const diveProgress = 1 - Math.exp(-elapsed * 0.28);
        const targetSectorX = width * (0.14 + 0.50 * diveProgress);
        const targetSectorY = height * (0.18 + 0.44 * diveProgress);

        // Slight natural wave shake (sinusoidal underwater hydrodynamics)
        const waveShakeX = Math.cos(elapsed * 2.8) * 3.5;
        const waveShakeY = Math.sin(elapsed * 4.2) * 5.0;

        // SHAKING EFFECT AS MULTIPLIER GOES HIGHER
        const shakeIntensity = Math.min(14, Math.max(0, (currentMult - 1.0) * 1.6));
        const shakeX = (Math.random() - 0.5) * shakeIntensity;
        const shakeY = (Math.random() - 0.5) * shakeIntensity;
        const shakeRot = (Math.random() - 0.5) * (shakeIntensity * 0.65);

        const jetX = targetSectorX + waveShakeX + shakeX;
        const jetY = targetSectorY + waveShakeY + shakeY;

        // Dynamic dive pitch angle (tilts down-right with diving angle and wave motion)
        const basePitch = 22 + Math.min(12, (currentMult - 1.0) * 1.5) + Math.cos(elapsed * 4.2) * 2.5;
        const pitchAngle = basePitch + shakeRot;

        lastJetCoordRef.current = { x: jetX, y: jetY, pitch: pitchAngle };

        // Position DOM element
        jetEl.style.left = `${jetX}px`;
        jetEl.style.top = `${jetY}px`;
        jetEl.style.transform = `translate(-50%, -50%) rotate(${pitchAngle}deg)`;
        jetEl.style.opacity = '1';

        // Draw trajectory wake curve
        drawWakeTrajectory(startX, startY, jetX, jetY, elapsed);

        // Add strong white hydro trail / light in front of the jet like Aviator
        drawJetFrontHydroLight(jetX, jetY, pitchAngle, currentMult);

        // Add white bubble trail behind the jet
        drawWhiteBubbleTrail(jetX, jetY, pitchAngle, currentMult, 0.016, true);
      } else if (currentState === 'crashed') {
        // Flew away into the deep abyss with hyper-acceleration
        const crashTime = crashTimeRef.current || now;
        const timeSinceCrash = Math.max(0, (now - crashTime) / 1000);
        const last = lastJetCoordRef.current;

        const escapeSpeed = 750 + timeSinceCrash * 900;
        const exitX = last.x + Math.cos((last.pitch * Math.PI) / 180) * escapeSpeed * timeSinceCrash;
        const exitY = last.y + Math.sin((last.pitch * Math.PI) / 180) * escapeSpeed * timeSinceCrash;
        const exitPitch = last.pitch + timeSinceCrash * 40;
        const fadeOut = Math.max(0, 1 - timeSinceCrash * 1.5);

        jetEl.style.left = `${exitX}px`;
        jetEl.style.top = `${exitY}px`;
        jetEl.style.transform = `translate(-50%, -50%) rotate(${exitPitch}deg)`;
        jetEl.style.opacity = `${fadeOut}`;

        drawWakeTrajectory(startX, startY, last.x, last.y, 0);
        drawCrashShockwave(last.x, last.y, timeSinceCrash);
      } else {
        // Surface Mooring / Betting Countdown: gentle surface floating bob
        const bobY = Math.sin(now / 480) * 5;
        const swayX = Math.cos(now / 700) * 3;
        const pitchRest = Math.sin(now / 600) * 3.5;

        const surfaceX = startX + swayX;
        const surfaceY = startY + bobY;

        lastJetCoordRef.current = { x: surfaceX, y: surfaceY, pitch: pitchRest };

        jetEl.style.left = `${surfaceX}px`;
        jetEl.style.top = `${surfaceY}px`;
        jetEl.style.transform = `translate(-50%, -50%) rotate(${pitchRest}deg)`;
        jetEl.style.opacity = '1';

        // Gentle surface idle trail
        drawWhiteBubbleTrail(surfaceX, surfaceY, pitchRest, 1.0, 0.016, false);
      }
    };

    // 13. Update HUD Displays
    const updateHUD = (
      currentState: string,
      currentMult: number,
      crashMult: number,
      countdown: number
    ) => {
      const multEl = multiplierDomRef.current;
      const subEl = subtitleDomRef.current;
      const depthEl = depthDomRef.current;

      if (!multEl) return;

      if (currentState === 'diving' || currentState === 'flying') {
        multEl.innerText = `${currentMult.toFixed(2)}x`;
        multEl.className =
          'text-white text-6xl sm:text-7xl md:text-8xl font-black drop-shadow-[0_0_40px_rgba(56,189,248,0.95)] tracking-tight text-center select-none font-mono';

        if (subEl) {
          subEl.innerText = 'HYDRODYNAMIC DIVE IN PROGRESS';
          subEl.className =
            'text-xs sm:text-sm font-black text-cyan-300 tracking-[0.25em] uppercase drop-shadow-[0_0_15px_rgba(6,182,212,0.8)] animate-pulse';
        }

        if (depthEl) {
          const depthMeters = Math.floor(currentMult * 145);
          const knots = Math.floor(currentMult * 42);
          depthEl.innerText = `DEPTH: -${depthMeters}M • VELOCITY: ${knots} KTS`;
        }
      } else if (currentState === 'crashed') {
        multEl.innerText = `FLEW AWAY AT ${crashMult.toFixed(2)}x`;
        multEl.className =
          'text-rose-500 text-3xl sm:text-5xl md:text-6xl font-black drop-shadow-[0_0_45px_rgba(244,63,94,0.95)] tracking-tight text-center select-none font-mono animate-pulse';

        if (subEl) {
          subEl.innerText = 'DEEP SEA JET FLEW INTO THE ABYSS';
          subEl.className =
            'text-xs sm:text-sm font-black text-rose-400 tracking-[0.25em] uppercase drop-shadow-[0_0_15px_rgba(244,63,94,0.8)]';
        }

        if (depthEl) {
          depthEl.innerText = `IMPLOSION DEPTH: -${Math.floor(crashMult * 145)}M`;
        }
      } else if (currentState === 'betting') {
        multEl.innerText = `${Math.max(0, countdown).toFixed(1)}s`;
        multEl.className =
          'text-cyan-300 text-5xl sm:text-6xl md:text-7xl font-black drop-shadow-[0_0_35px_rgba(6,182,212,0.9)] tracking-tight text-center select-none font-mono';

        if (subEl) {
          subEl.innerText = 'WAITING FOR NEXT DIVE • PLACE YOUR BETS';
          subEl.className =
            'text-xs sm:text-sm font-black text-slate-300 tracking-[0.25em] uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]';
        }

        if (depthEl) {
          depthEl.innerText = 'SURFACE MOORING • DUAL HELMS READY';
        }
      } else {
        multEl.innerText = '1.00x';
        multEl.className =
          'text-white/80 text-5xl sm:text-6xl font-black tracking-tight text-center select-none font-mono';
        if (subEl) subEl.innerText = 'SUBMERSIBLE IDLE';
        if (depthEl) depthEl.innerText = 'SURFACE LEVEL 0M';
      }
    };

    // Main 60 FPS Animation Loop
    const gameLoop = (now: number) => {
      if (!isRunning) return;

      const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;

      const rect = container.getBoundingClientRect();
      const width = rect.width || 800;
      const height = rect.height || 480;

      const currentState = gameStateRef.current;
      const currentMult = multiplierRef.current || 1.0;
      const finalCrash = crashMultiplierRef.current || 1.0;
      const countdown = bettingCountdownRef.current || 5.0;

      const isDiving = currentState === 'diving' || currentState === 'flying';
      const elapsed = isDiving ? Math.max(0, (now - startTimeRef.current) / 1000) : 0;
      const time = now * 0.001;

      // Current velocity
      const currentVelocity = isDiving
        ? 120 + Math.pow(Math.max(1, currentMult), 1.25) * 85
        : 35;

      try {
        ctx.clearRect(0, 0, width, height);

        // 1. Real Deep Sea: Animated Dark Blue Gradient
        drawRealDeepSea(elapsed, width, height, currentMult, now);

        // 2. Real Deep Sea: Moving Light Rays Piercing from Surface
        drawMovingLightRays(width, height, time);

        // 3. Real Deep Sea: Surface Ripple Caustics
        drawSurfaceCaustics(width, time);

        // 4. Sonar Depth Grid
        drawSonarGrid(width, height, currentVelocity, dt);

        // 5. Real Deep Sea: Floating Marine Snow Particles
        drawFloatingParticles(width, height, time, dt);

        // 6. Real Deep Sea: Rising Bubbles with Specular Highlights
        drawRisingBubbles(width, height, time, currentVelocity, dt);

        // 7. High-Speed Cavitation Streaks
        drawSpeedStreaks(width, height, currentMult, dt, isDiving);

        // 8. Update Jet Kinematics, Front Hydro Light & Bubble Trail
        updateJetPosition(elapsed, width, height, currentState, currentMult, now);

        // 9. Update HUD Displays
        updateHUD(currentState, currentMult, finalCrash, countdown);
      } catch (err) {
        console.error('[DeepSeaCanvas Loop Error]:', err);
      }

      animFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      isRunning = false;
      window.removeEventListener('resize', resizeCanvas);
      observer.disconnect();
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  return (
    <div
      id="game-container"
      ref={containerRef}
      className="relative w-full h-[65vh] sm:h-[70vh] min-h-[420px] max-h-[580px] overflow-hidden rounded-[2.5rem] border border-cyan-500/40 select-none bg-[#020b1e]"
    >
      {/* 60 FPS Hydrodynamic Simulation Canvas */}
      <canvas
        id="game-canvas"
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full z-10 block pointer-events-none"
        style={{ display: 'block', visibility: 'visible', opacity: 1 }}
      />

      {/* Aviator Provably Fair Live Stamp */}
      <div className="absolute top-4 right-5 z-20 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/60 border border-cyan-500/30 backdrop-blur-md text-[10px] font-black text-cyan-300 font-mono">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        PROVABLY FAIR • SHA-256
      </div>

      {/* Surface Mooring Buoy Indicator (Visible during betting phase) */}
      {gameState === 'betting' && (
        <div className="absolute top-6 left-6 z-20 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-950/80 border border-cyan-400/40 backdrop-blur-md text-xs font-black text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.4)] animate-bounce">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,1)]" />
          SURFACE DOCK 01
        </div>
      )}

      {/* Center Dynamic HUD: Multiplier + Status + Depth Telemetry */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none flex flex-col items-center justify-center gap-2 w-full px-4 text-center">
        <div
          id="multiplier"
          ref={multiplierDomRef}
          className="text-white text-6xl sm:text-7xl md:text-8xl font-black drop-shadow-[0_0_35px_rgba(56,189,248,0.9)] tracking-tight font-mono select-none"
        >
          1.00x
        </div>

        <div
          id="multiplier-subtitle"
          ref={subtitleDomRef}
          className="text-xs sm:text-sm font-black text-cyan-300 tracking-[0.25em] uppercase drop-shadow-[0_0_12px_rgba(6,182,212,0.8)] select-none"
        >
          WAITING FOR NEXT DIVE
        </div>

        <div
          id="depth-telemetry"
          ref={depthDomRef}
          className="px-3.5 py-1 rounded-full bg-slate-950/70 border border-cyan-500/40 text-[11px] font-mono font-bold text-cyan-400 tracking-wider backdrop-blur-md shadow-inner select-none"
        >
          SURFACE LEVEL 0M
        </div>
      </div>

      {/* Deep Sea Submersible Jet DOM Element with Blue Neon, Blue Flame & Hydrodynamic Hull */}
      <div
        id="jet"
        ref={jetDomRef}
        className="absolute left-0 top-0 w-28 h-28 sm:w-32 sm:h-32 z-20 pointer-events-none"
        style={{
          transform: 'translate(-50%, -50%)',
          willChange: 'transform, left, top',
        }}
      >
        <img
          src="/assets/deepsea-jet.png"
          alt="Futuristic Hydrodynamic Deep Sea Jet"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            const fallback = document.getElementById('jet-fallback-svg');
            if (fallback) fallback.style.display = 'block';
          }}
          className="w-full h-full object-contain filter drop-shadow-[0_0_20px_rgba(6,182,212,0.95)] select-none pointer-events-none"
          draggable={false}
        />
        {/* Sleek Silver Hydrodynamic Jet with Blue Neon & Blue Flame (Zero Background) */}
        <svg
          id="jet-fallback-svg"
          viewBox="0 0 140 80"
          className="w-full h-full filter drop-shadow-[0_0_25px_rgba(56,189,248,0.95)] hidden"
        >
          <defs>
            {/* Metallic Silver Aero Hull */}
            <linearGradient id="silverHull" x1="0%" y1="0%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#94a3b8" />
              <stop offset="35%" stopColor="#e2e8f0" />
              <stop offset="65%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#f8fafc" />
            </linearGradient>
            {/* Electric Blue Neon Glow */}
            <linearGradient id="neonCyan" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="50%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#a5f3fc" />
            </linearGradient>
            {/* Blue Plasma Flame */}
            <linearGradient id="blueFlame" x1="100%" y1="50%" x2="0%" y2="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="30%" stopColor="#38bdf8" />
              <stop offset="70%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>

          {/* Blue Plasma Flame Thruster Exhaust */}
          <path d="M22,34 Q2,38 0,40 Q2,42 22,46 Q12,40 22,34 Z" fill="url(#blueFlame)" />
          <path d="M22,37 Q8,39 6,40 Q8,41 22,43 Z" fill="#ffffff" />

          {/* Upper & Lower Hydrodynamic Stabilizer Wings */}
          <path d="M42,28 L30,12 L56,22 Z" fill="#64748b" stroke="#38bdf8" strokeWidth="1.5" />
          <path d="M42,52 L30,68 L56,58 Z" fill="#64748b" stroke="#38bdf8" strokeWidth="1.5" />

          {/* Main Silver Futuristic Hydrodynamic Jet Fuselage */}
          <path d="M22,40 C28,24 64,18 106,30 C124,35 136,38 138,40 C136,42 124,45 106,50 C64,62 28,56 22,40 Z" fill="url(#silverHull)" stroke="#38bdf8" strokeWidth="2" />

          {/* Blue Neon Trim Accents */}
          <path d="M36,36 Q72,28 114,37" fill="none" stroke="url(#neonCyan)" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M36,44 Q72,52 114,43" fill="none" stroke="url(#neonCyan)" strokeWidth="2.5" strokeLinecap="round" />

          {/* Cockpit Canopy */}
          <ellipse cx="94" cy="40" rx="18" ry="6.5" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5" />
          <ellipse cx="96" cy="38.5" rx="13" ry="3.5" fill="#e0f2fe" opacity="0.85" />

          {/* Forward Hydrodynamic Sensor Array */}
          <circle cx="136" cy="40" r="3.5" fill="#ffffff" stroke="#06b6d4" strokeWidth="1.5" />
        </svg>
      </div>

      {/* Direct In-Game Cashout & Interactive Overlays */}
      {children}
    </div>
  );
};
