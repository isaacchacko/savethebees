'use client';
import { useEffect, useRef } from 'react';
import Boid from './Boid';

export default function CanvasBackground({
  numBees,
  spawnRadius,
}: {
  numBees: number;
  spawnRadius: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const boidRef = useRef<Boid | null>(null);
  const mouseWaypointRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isMouseDownRef = useRef(false);
  const isMouseToggledRef = useRef(false);
  const isBoidSpawned = useRef(false); // Track if the boid has been spawned

  // FPS tracking variables
  const lastFrameTimeRef = useRef(performance.now());
  const frameCountRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const spawnPosition = { x: canvas.width, y: canvas.height }; // Spawn at mouse position
    boidRef.current = new Boid(
      spawnPosition,
      numBees,
      spawnRadius,
      canvas.width,
      canvas.height
    );

    const handleMouseDown = (e: MouseEvent) => {
      if (isMouseDownRef.current === false) {
        isMouseDownRef.current = true;
        boidRef.current?.updateWaypointWeight(100);
        mouseWaypointRef.current = { x: e.clientX, y: e.clientY };
      } 
    };

    const handleMouseUp = () => {
      if (isMouseDownRef.current === true) {
        isMouseDownRef.current = false;
        boidRef.current?.updateWaypointWeight(0);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isMouseDownRef.current === false) {return;}
      mouseWaypointRef.current = { x: e.clientX, y: e.clientY };

    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mousemove', handleMouseMove);

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (boidRef.current) {
        boidRef.current.updateCanvasDimensions(canvas.width, canvas.height);
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let animationFrameId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw waypoint (mouse position)
      // ctx.fillStyle = isMouseDownRef.current ? '#3B82F6' : '#EF4444';
      // ctx.beginPath();
      // ctx.arc(mouseWaypointRef.current.x, mouseWaypointRef.current.y, 5, 0, Math.PI * 2);
      // ctx.fill();

      if (boidRef.current) {
        boidRef.current.update([mouseWaypointRef.current]); // Pass mouse position as the waypoint
        boidRef.current.draw(ctx);
      }

      // FPS calculation
      frameCountRef.current++;
      const now = performance.now();
      if (now - lastFrameTimeRef.current >= 1000) {
        console.log(`FPS: ${frameCountRef.current}`);
        frameCountRef.current = 0;
        lastFrameTimeRef.current = now;
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [numBees, spawnRadius]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full"
      style={{ pointerEvents: 'auto' }}
    />
  );
}
