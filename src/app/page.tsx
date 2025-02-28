
'use client';
import { useEffect, useRef, useState } from 'react';
import Boid from '../components/Boid';

export default function Home() {
  const canvasRef = useRef(null);
  const [boid, setBoid] = useState(null);

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

  let animationFrameId: number; // Store the animation frame ID

  // Animation loop
  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw waypoints
    ctx.fillStyle = 'red';
    waypoints.forEach((waypoint, index) => {
      ctx.beginPath();
      ctx.arc(waypoint.x, waypoint.y, 5, 0, 2 * Math.PI);
      ctx.fill();
        ctx.fillStyle = (index === (boid?.currentWaypointIndex % waypoints.length)) ? 'green' : 'red';
    });

    // Move and draw boid
    if (boid) {
      if (boid.moveTowardsWaypoint(waypoints[boid.currentWaypointIndex])) {
          boid.currentWaypointIndex = (boid.currentWaypointIndex + 1) % waypoints.length;
          console.log(boid.currentWaypointIndex);
        }
      boid.draw(ctx);
    }

    animationFrameId = requestAnimationFrame(animate);
  };

  // Initialize boid (only once)
  if (!boid) {
    setBoid(new Boid(waypoints[0].x, waypoints[0].y));
  } else {
    // Start animation if boid exists
    animate();
  }

  // Cleanup function
  return () => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId); // Correctly cancel the animation frame
    }
  };
}, [boid, waypoints]); // Re-run when boid or waypoints change

  return (
    <div>
      <h1>Boids and Waypoints</h1>
      <canvas ref={canvasRef} width={500} height={400} style={{ border: '1px solid black' }} />
    </div>
  );
}
