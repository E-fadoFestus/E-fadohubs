import React, { useEffect, useRef } from 'react';

interface DeepSeaCanvasProps {
  multiplier: number;
  gameState: 'betting' | 'flying' | 'diving' | 'crashed' | 'idle';
  crashMultiplier?: number;
  bettingCountdown?: number;
  children?: React.ReactNode;
}

interface Particle {
  x: number;
  y: number;
  r: number;
  speedY: number;
  speedX: number;
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
  const trajectoryPointsRef = useRef<{ x: number; y: number }[]>([]);

  // Particle systems
  const ambientBubblesRef = useRef<Particle[]>([]);
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
      trajectoryPointsRef.current = [];
      if (jetDomRef.current) {
        jetDomRef.current.style.opacity = '1';
        jetDomRef.current.classList.remove('animate-ping');
      }
    } else if (gameState === 'crashed') {
      crashTimeRef.current = performance.now();
    } else if (gameState === 'betting') {
      crashTimeRef.current = null;
      trajectoryPointsRef.current = [];
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

    // Initialize ambient bubbles
    ambientBubblesRef.current = Array.from({ length: 40 }, () => ({
      x: Math.random() * (container.clientWidth || 800),
      y: Math.random() * (container.clientHeight || 480),
      r: Math.random() * 2.5 + 1.0,
      speedY: Math.random() * 1.5 + 0.8,
      speedX: (Math.random() - 0.5) * 0.4,
      opacity: Math.random() * 0.4 + 0.2,
    }));

    // Initialize hydrodynamic speed streaks
    speedStreaksRef.current = Array.from({ length: 25 }, () => ({
      x: Math.random() * (container.clientWidth || 800),
      y: Math.random() * (container.clientHeight || 480),
      length: Math.random() * 60 + 30,
      speed: Math.random() * 400 + 300,
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

    // Ocean Gradient with Depth Transitions
    const drawOcean = (elapsed: number, width: number, height: number, mult: number) => {
      const safeH = Math.max(10, height);
      const safeW = Math.max(10, width);

      // Depth progression shifts color from tropical turquoise to abyssal midnight
      const depthFactor = Math.min(1, (mult - 1) * 0.08 + elapsed * 0.015);

      try {
        const gradient = ctx.createLinearGradient(0, 0, 0, safeH);
        if (depthFactor < 0.3) {
          gradient.addColorStop(0, '#00BFFF');
          gradient.addColorStop(0.4, '#0077b6');
          gradient.addColorStop(0.8, '#023e8a');
          gradient.addColorStop(1, '#001845');
        } else if (depthFactor < 0.7) {
          gradient.addColorStop(0, '#0077b6');
          gradient.addColorStop(0.35, '#023e8a');
          gradient.addColorStop(0.7, '#001845');
          gradient.addColorStop(1, '#000814');
        } else {
          gradient.addColorStop(0, '#023e8a');
          gradient.addColorStop(0.4, '#001845');
          gradient.addColorStop(0.8, '#000814');
          gradient.addColorStop(1, '#000208');
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, safeW, safeH);
      } catch {
        ctx.fillStyle = '#001F3F';
        ctx.fillRect(0, 0, safeW, safeH);
      }

      // Sunlit surface water caustics / wave ripple when near surface
      if (depthFactor < 0.5) {
        ctx.save();
        ctx.strokeStyle = `rgba(56, 189, 248, ${(0.35 * (1 - depthFactor * 2)).toFixed(2)})`;
        ctx.lineWidth = 1.5;
        const waveTime = elapsed * 1.8;
        ctx.beginPath();
        for (let x = 0; x <= safeW; x += 30) {
          const y = 35 + Math.sin(x * 0.03 + waveTime) * 6 + Math.cos(x * 0.015 - waveTime * 0.7) * 4;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();
      }
    };

    // Continuous Sonar Depth Grid & Axis Markers (Uniform Velocity + Proportional Acceleration)
    const drawSonarGrid = (width: number, height: number, velocity: number, dt: number) => {
      ctx.save();

      // Accumulate continuous scrolling proportional to dive velocity
      depthScrollRef.current += velocity * dt;
      const scrollY = depthScrollRef.current % 70;
      const scrollX = (depthScrollRef.current * 0.6) % 70;

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.07)';
      ctx.lineWidth = 1;

      // Horizontal depth lines scrolling upward (giving real continuous descending feeling)
      for (let y = -70 + scrollY; y < height + 70; y += 70) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Vertical sonar grid lines scrolling leftward
      for (let x = -70 - scrollX; x < width + 70; x += 70) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Dynamic Depth Scale Markers along the left axis (Aviator Altitude Counter Style)
      ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
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

    // Underwater Hydrodynamic Speed Streaks (Cavitation Streamlines)
    const drawSpeedStreaks = (width: number, height: number, mult: number, dt: number, isDiving: boolean) => {
      if (!isDiving || mult < 1.1) return;

      ctx.save();
      const intensity = Math.min(1.0, (mult - 1.0) * 0.25);
      const angle = 22 * (Math.PI / 180); // Diagonal dive angle
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      speedStreaksRef.current.forEach((streak) => {
        // Move opposite to dive direction (up and left)
        const currentSpeed = streak.speed * (1 + (mult - 1) * 0.35);
        streak.x -= cosA * currentSpeed * dt;
        streak.y -= sinA * currentSpeed * dt;

        // Reset if moved out of bounds
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

    // Rising Cavitation & Ambient Ocean Bubbles
    const drawAmbientBubbles = (width: number, height: number, velocity: number, dt: number) => {
      ctx.save();

      ambientBubblesRef.current.forEach((p) => {
        // Upward motion combined with relative dive velocity
        p.y -= (p.speedY * 30 + velocity * 0.2) * dt;
        p.x += p.speedX;

        if (p.y < -20) {
          p.y = height + Math.random() * 30;
          p.x = Math.random() * width;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity.toFixed(2)})`;
        ctx.fill();

        // Bubble highlight reflection
        ctx.beginPath();
        ctx.arc(p.x - p.r * 0.3, p.y - p.r * 0.3, p.r * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fill();
      });

      ctx.restore();
    };

    // Submarine Twin Thruster Cavitation Plume
    const drawThrusterPlume = (jetX: number, jetY: number, pitchDeg: number, mult: number, dt: number, isDiving: boolean) => {
      ctx.save();

      // Nozzle location relative to jet center
      const rad = (pitchDeg * Math.PI) / 180;
      const nozzleOffsetX = -36 * Math.cos(rad);
      const nozzleOffsetY = -36 * Math.sin(rad);
      const nozzleX = jetX + nozzleOffsetX;
      const nozzleY = jetY + nozzleOffsetY;

      // Spawn thruster bubbles continuously during dive
      if (isDiving) {
        const spawnCount = Math.min(6, Math.floor(1 + (mult - 1) * 0.6));
        for (let i = 0; i < spawnCount; i++) {
          const spread = (Math.random() - 0.5) * 0.4;
          const bubbleAngle = rad + Math.PI + spread;
          const speed = (Math.random() * 80 + 120) * (1 + (mult - 1) * 0.2);
          thrusterBubblesRef.current.push({
            x: nozzleX + (Math.random() - 0.5) * 6,
            y: nozzleY + (Math.random() - 0.5) * 6,
            r: Math.random() * 2.5 + 1.2,
            vx: Math.cos(bubbleAngle) * speed,
            vy: Math.sin(bubbleAngle) * speed - (Math.random() * 20 + 20), // buoyant rise
            life: 1.0,
            maxLife: Math.random() * 0.5 + 0.4,
          });
        }

        // Draw luminous cyan cavitation exhaust flare
        const flareSize = 14 + Math.min(22, (mult - 1) * 2.5);
        const flareGrad = ctx.createRadialGradient(nozzleX, nozzleY, 2, nozzleX, nozzleY, flareSize);
        flareGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
        flareGrad.addColorStop(0.3, 'rgba(6, 182, 212, 0.85)');
        flareGrad.addColorStop(0.7, 'rgba(2, 132, 199, 0.4)');
        flareGrad.addColorStop(1, 'rgba(2, 132, 199, 0)');
        ctx.fillStyle = flareGrad;
        ctx.beginPath();
        ctx.arc(nozzleX, nozzleY, flareSize, 0, Math.PI * 2);
        ctx.fill();
      }

      // Update & render thruster bubbles
      thrusterBubblesRef.current.forEach((b) => {
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.life -= dt / b.maxLife;

        if (b.life > 0) {
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.r * (1.8 - b.life * 0.8), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(165, 243, 252, ${(b.life * 0.75).toFixed(2)})`;
          ctx.fill();
        }
      });

      thrusterBubblesRef.current = thrusterBubblesRef.current.filter((b) => b.life > 0);
      ctx.restore();
    };

    // Aviator Glowing Hydrodynamic Wake Trail & Gradient Fill
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

      // Translucent Oceanic Area Fill under the dive curve (Aviator Signature)
      try {
        const areaGrad = ctx.createLinearGradient(startX, startY, targetX, targetY);
        areaGrad.addColorStop(0, 'rgba(6, 182, 212, 0.30)');
        areaGrad.addColorStop(0.5, 'rgba(2, 132, 199, 0.15)');
        areaGrad.addColorStop(1, 'rgba(14, 165, 233, 0.02)');

        ctx.fillStyle = areaGrad;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(ctrlX, ctrlY, targetX, targetY);
        ctx.lineTo(startX, targetY);
        ctx.closePath();
        ctx.fill();
      } catch {
        // Safe gradient fallback
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

      // Traveling pulse rings along the wake path
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

    // Implosion Cavitation Shockwave upon Crash
    const drawCrashShockwave = (x: number, y: number, timeSinceCrash: number) => {
      ctx.save();
      const radius = timeSinceCrash * 380;
      const alpha = Math.max(0, 1 - timeSinceCrash * 1.2);

      if (alpha > 0) {
        // Outer shockwave ring
        ctx.strokeStyle = `rgba(244, 63, 94, ${alpha.toFixed(2)})`;
        ctx.lineWidth = 4;
        ctx.shadowColor = '#f43f5e';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Inner cavitation ring
        ctx.strokeStyle = `rgba(6, 182, 212, ${(alpha * 0.8).toFixed(2)})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(x, y, radius * 0.65, 0, Math.PI * 2);
        ctx.stroke();

        // Expanding bubble burst
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

    // Update Jet Submersible Kinematics & DOM Position
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

      const startX = width * 0.14;
      const startY = height * 0.20;

      if (currentState === 'diving' || currentState === 'flying') {
        // CONTINUOUS UNIFORM VELOCITY + LOGICAL ACCELERATION:
        // The jet traverses down and to the right toward its active diving sector,
        // and keeps dynamically oscillating and diving through the water without freezing!
        const approachProgress = 1 - Math.exp(-elapsed * 0.32);
        const sectorX = width * (0.14 + 0.48 * approachProgress);
        const sectorY = height * (0.20 + 0.40 * approachProgress);

        // Hydrodynamic swimming & buoyancy weave (reacting directly to multiplier velocity)
        const buoyancyWeave = Math.sin(elapsed * 3.8) * (5 + Math.min(8, (currentMult - 1) * 1.5));
        const horizontalDrift = Math.cos(elapsed * 2.1) * (4 + Math.min(6, (currentMult - 1) * 1.2));

        const jetX = sectorX + horizontalDrift;
        const jetY = sectorY + buoyancyWeave;

        // Dynamic pitch angle (tilts with dive angle and micro-hydrodynamic banking)
        const pitchAngle = 18 + Math.min(14, (currentMult - 1) * 2.8) + Math.cos(elapsed * 3.8) * 3;

        lastJetCoordRef.current = { x: jetX, y: jetY, pitch: pitchAngle };

        // Position DOM element
        jetEl.style.left = `${jetX}px`;
        jetEl.style.top = `${jetY}px`;
        jetEl.style.transform = `translate(-50%, -50%) rotate(${pitchAngle}deg)`;
        jetEl.style.opacity = '1';

        // Draw wake trajectory from launch to nozzle
        drawWakeTrajectory(startX, startY, jetX, jetY, elapsed);
        drawThrusterPlume(jetX, jetY, pitchAngle, currentMult, 0.016, true);
      } else if (currentState === 'crashed') {
        // MOMENT: FLEW AWAY / ABYSS ESCAPE
        // In Aviator, the jet bursts forward at hyper-velocity and dives away into the distance!
        const crashTime = crashTimeRef.current || now;
        const timeSinceCrash = Math.max(0, (now - crashTime) / 1000);
        const last = lastJetCoordRef.current;

        // Hyper-acceleration into the abyss off bottom-right
        const escapeSpeed = 750 + timeSinceCrash * 900;
        const exitX = last.x + Math.cos((last.pitch * Math.PI) / 180) * escapeSpeed * timeSinceCrash;
        const exitY = last.y + Math.sin((last.pitch * Math.PI) / 180) * escapeSpeed * timeSinceCrash;
        const exitPitch = last.pitch + timeSinceCrash * 40;
        const fadeOut = Math.max(0, 1 - timeSinceCrash * 1.5);

        jetEl.style.left = `${exitX}px`;
        jetEl.style.top = `${exitY}px`;
        jetEl.style.transform = `translate(-50%, -50%) rotate(${exitPitch}deg)`;
        jetEl.style.opacity = `${fadeOut}`;

        // Freeze frozen trajectory and draw expanding crash implosion
        drawWakeTrajectory(startX, startY, last.x, last.y, 0);
        drawCrashShockwave(last.x, last.y, timeSinceCrash);
      } else {
        // MOMENT: SURFACE MOORING / BETTING COUNTDOWN
        // Gentle buoyant bobbing at the water surface
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

        // Gentle idle bubbles from mooring
        drawThrusterPlume(surfaceX, surfaceY, pitchRest, 1.0, 0.016, false);
      }
    };

    // Update Multiplier HUD, Subtitles and Depth Telemetry
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

      // Current velocity (uniform base velocity + acceleration proportional to game logic multiplier)
      const currentVelocity = isDiving
        ? 120 + Math.pow(Math.max(1, currentMult), 1.25) * 85
        : 35;

      try {
        ctx.clearRect(0, 0, width, height);

        // 1. Ocean Depth Gradient
        drawOcean(elapsed, width, height, currentMult);

        // 2. Continuous Sonar Grid & Depth Altitude Scale
        drawSonarGrid(width, height, currentVelocity, dt);

        // 3. Ambient Rising Marine Snow & Bubbles
        drawAmbientBubbles(width, height, currentVelocity, dt);

        // 4. High-Speed Hydrodynamic Cavitation Streaks
        drawSpeedStreaks(width, height, currentMult, dt, isDiving);

        // 5. Update Jet Motion, Trajectory Arc & Thruster Plume
        updateJetPosition(elapsed, width, height, currentState, currentMult, now);

        // 6. Update HUD Displays
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
      className="relative w-full h-[65vh] sm:h-[70vh] min-h-[420px] max-h-[580px] overflow-hidden bg-[#001F3F] rounded-[2.5rem] border-2 border-cyan-500/30 shadow-[0_20px_60px_rgba(6,182,212,0.2)] select-none"
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

      {/* Deep Sea Submersible Jet DOM Element */}
      <div
        id="jet"
        ref={jetDomRef}
        className="absolute left-0 top-0 w-24 h-24 sm:w-28 sm:h-28 z-20 pointer-events-none"
        style={{
          transform: 'translate(-50%, -50%)',
          willChange: 'transform, left, top',
        }}
      >
        <img
          src="/assets/deepsea-jet.png"
          alt="Deep Sea Jet Submersible"
          className="w-full h-full object-contain filter drop-shadow-[0_0_20px_rgba(56,189,248,0.9)] select-none pointer-events-none"
          draggable={false}
        />
      </div>

      {/* Direct In-Game Cashout & Interactive Overlays */}
      {children}
    </div>
  );
};
