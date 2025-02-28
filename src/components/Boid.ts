// src/components/Boid.ts

import Bee from './Bee';

export class Boid {
  bees: Bee[];
  
  constructor(spawnPosition: { x: number, y: number },
    numBees: number,
    spawnRadius: number,
    canvasWidth: number,
    canvasHeight: number) {
    this.bees = [];
    for (let i = 0; i < numBees; i++) {
      const angle = Math.random() * 2 * Math.PI;
      const distance = Math.random() * spawnRadius;
      const x = spawnPosition.x + Math.cos(angle) * distance;
      const y = spawnPosition.y + Math.sin(angle) * distance;
      this.bees.push(new Bee(x, y, canvasWidth, canvasHeight, angle));
    }
  }

  update(waypoints: { x: number, y: number }[]) {
    this.bees.forEach(bee => {
      const currentWaypoint = waypoints.length > 0 ? waypoints[bee.currentWaypointIndex] : null;
      if (bee.update(currentWaypoint, this.bees)) {
        bee.currentWaypointIndex = (bee.currentWaypointIndex + 1) % waypoints.length;
      }
    });
  }

  draw(ctx: CanvasRenderingContext2D) {
    this.bees.forEach(bee => bee.draw(ctx));
  }
}

export default Boid;
