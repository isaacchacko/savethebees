// src/components/Boid.ts

import { Bee } from './Bee';

export class Boid {
  bees: Bee[];
  currentWaypointWeight: number;
  canvasWidth: number;
  canvasHeight: number;

  constructor(spawnPosition: { x: number, y: number },
    numBees: number,
    spawnRadius: number,
    canvasWidth: number,
    canvasHeight: number) {
    this.bees = [];
    this.currentWaypointWeight = 1;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;

    for (let i = 0; i < numBees; i++) {
      const angle = Math.random() * 2 * Math.PI;
      const distance = Math.random() * spawnRadius;
      const x = spawnPosition.x + Math.cos(angle) * distance;
      const y = spawnPosition.y + Math.sin(angle) * distance;
      this.bees.push(new Bee(x, y, canvasWidth, canvasHeight, angle));

      // by default the bees have a waypointweight of 1 so no need to set this
    }
  }


  updateWaypointWeight(newWeight: number) {
    this.currentWaypointWeight = newWeight;
    this.bees.forEach(bee => {
      bee.waypointWeight = newWeight;
    });
  }
  updateCanvasDimensions(newWidth: number, newHeight: number) {
    this.canvasWidth = newWidth;
    this.canvasHeight = newHeight;

    // Update dimensions for all bees
    this.bees.forEach((bee) => {
      bee.canvasWidth = newWidth;
      bee.canvasHeight = newHeight;
    });
  }

  update(waypoints: { x: number, y: number }[]) {
    this.bees.forEach(bee => {
      bee.update(waypoints[bee.currentWaypointIndex], this.bees);
    });
  }

  draw(ctx: CanvasRenderingContext2D) {
    this.bees.forEach(bee => bee.draw(ctx));
  }
}

export default Boid;
