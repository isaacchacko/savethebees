
'use client';
import { useEffect, useRef, useState } from 'react';
import Boid from '../components/Boid';

export default function Home() {
  const canvasRef = useRef(null);
  const [boid, setBoid] = useState(null);

  const waypoints = [
    // { x: 50, y: 50 },
    // { x: 200, y: 100 },
    // { x: 300, y: 250 },
    // { x: 150, y: 300 },
  ];

  const spawnPosition = { x: 100, y: 100 };
  const numBees = 100;
  const spawnRadius = 50;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw waypoints
      if (waypoints.length > 0) {
        ctx.fillStyle = 'red';
        waypoints.forEach((waypoint, index) => {
          ctx.beginPath();
          ctx.arc(waypoint.x, waypoint.y, 5, 0, 2 * Math.PI);
          ctx.fill();
        });
      }

      // Update and draw boid (swarm)
      if (boid) {
        boid.update(waypoints);
        boid.draw(ctx);
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    // Initialize boid (swarm) only once
    if (!boid) {
      setBoid(new Boid(spawnPosition, numBees, spawnRadius, canvas.width, canvas.height));
    } else {
      // Start animation if boid exists
      animate();
    }

    // Cleanup function
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [boid, waypoints]);

  return (
    <div>
      <h1>Bees and Waypoints</h1>
      <canvas ref={canvasRef} width={500} height={400} style={{ border: '1px solid black' }} />
    </div>
  );
}
