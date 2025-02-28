// src/app/page.tsx
import { useEffect, useRef } from 'react';

export default function Home() {
  const canvasRef = useRef(null);

  const waypoints = [
    { x: 50, y: 50 },
    { x: 200, y: 100 },
    { x: 300, y: 250 },
    { x: 150, y: 300 },
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw waypoints
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas
    ctx.fillStyle = 'red';
    waypoints.forEach(waypoint => {
      ctx.beginPath();
      ctx.arc(waypoint.x, waypoint.y, 5, 0, 2 * Math.PI); // Draw a circle
      ctx.fill();
    });
  }, [waypoints]); // Re-run effect when waypoints change

  return (
    <div>
      <h1>Boids and Waypoints</h1>
      <canvas ref={canvasRef} width={500} height={400} style={{ border: '1px solid black' }} />
    </div>
  );
}
