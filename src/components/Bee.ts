export class Bee {
  static readonly SPEED: number = 3;
  static readonly TURN_SPEED: number = 0.05;
  static readonly PROXIMITY_THRESHOLD: number = 15;
  static readonly DETECTION_CELL_RADIUS: number = 200;
  static readonly MAX_AVOIDANCE_FORCE: number = 60;
  static readonly MAX_ALIGNMENT_FORCE: number = 10;
  static readonly MAX_COHESION_FORCE: number = 10;

  x: number;
  y: number;
  angle: number;
  currentWaypointIndex: number;
  canvasWidth: number;
  canvasHeight: number;
  waypointWeight: number;

  constructor(x: number, y: number, canvasWidth: number, canvasHeight: number, angle: number = 0) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.currentWaypointIndex = 0;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.waypointWeight = 0;
  }

  move() {
    this.x += Math.cos(this.angle) * Bee.SPEED;
    this.y += Math.sin(this.angle) * Bee.SPEED;

    const buffer = 5;
    if (this.y > this.canvasHeight + buffer) this.y = -buffer;
    if (this.x > this.canvasWidth + buffer) this.x = -buffer;
    if (this.y < -buffer) this.y = this.canvasHeight + buffer;
    if (this.x < -buffer) this.x = this.canvasWidth + buffer;
  }

  update(waypoint: {x: number, y: number} | null, otherBees: Bee[]) {
    let totalX = 0;
    let totalY = 0;
    
    // Waypoint vector
    if (waypoint) {
      const dx = waypoint.x - this.x;
      const dy = waypoint.y - this.y;
      const distance = Math.sqrt(dx*dx + dy*dy);
      if (distance > 0) {
        totalX += (dx/distance) * this.waypointWeight;
        totalY += (dy/distance) * this.waypointWeight;
      }
    }

    // Behavior vectors
    let v = this.calculateAvoidanceVector(otherBees);
    totalX += v.x;
    totalY += v.y;
    v = this.calculateCohesionVector(otherBees);
    totalX += v.x;
    totalY += v.y;
    v = this.calculateAlignmentVector(otherBees);
    totalX += v.x;
    totalY += v.y;

    // Calculate target angle
    const targetAngle = Math.atan2(totalY, totalX);

    // Angle adjustment
    let angleDiff = targetAngle - this.angle;
    angleDiff = ((angleDiff + Math.PI) % (2 * Math.PI)) - Math.PI;
    this.angle += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), Bee.TURN_SPEED);
    this.angle = this.angle % (2 * Math.PI);

    this.move();
  }
  
  checkValidBee(b: Bee): boolean {
    if (b === this) return false;

    // Check if the other bee is in the same detection cell
    const thisCellX = Math.floor(this.x / Bee.DETECTION_CELL_RADIUS);
    const thisCellY = Math.floor(this.y / Bee.DETECTION_CELL_RADIUS);
    const bCellX = Math.floor(b.x / Bee.DETECTION_CELL_RADIUS);
    const bCellY = Math.floor(b.y / Bee.DETECTION_CELL_RADIUS);

    if (thisCellX !== bCellX || thisCellY !== bCellY) {
      return false; // Skip bees not in the same cell
    }

    return true;
  }
  calculateAvoidanceVector(otherBees: Bee[]): {x: number, y: number} {
    let totalX = 0;
    let totalY = 0;
    
    otherBees.forEach(other => {
      if (!this.checkValidBee(other)) {return;}

      const dx = this.x - other.x;
      const dy = this.y - other.y;
      const distance = Math.sqrt(dx*dx + dy*dy);
      
      if (distance < Bee.DETECTION_CELL_RADIUS) {
        const force = (Bee.DETECTION_CELL_RADIUS - distance)/Bee.DETECTION_CELL_RADIUS;
        totalX += (dx/distance) * force;
        totalY += (dy/distance) * force;
      }
    });

    // Clamp magnitude
    const mag = Math.sqrt(totalX*totalX + totalY*totalY);
    if (mag > Bee.MAX_AVOIDANCE_FORCE) {
      totalX = (totalX/mag) * Bee.MAX_AVOIDANCE_FORCE;
      totalY = (totalY/mag) * Bee.MAX_AVOIDANCE_FORCE;
    }
    return {x: totalX, y: totalY};
  }

  calculateAlignmentVector(otherBees: Bee[]): {x: number, y: number} {
    let avgX = 0;
    let avgY = 0;
    let count = 0;

    otherBees.forEach(other => {
      if (!this.checkValidBee(other)) {return;}

      const dx = other.x - this.x;
      const dy = other.y - this.y;
      const distance = Math.sqrt(dx*dx + dy*dy);

      if (distance < Bee.DETECTION_CELL_RADIUS) {
        avgX += Math.cos(other.angle);
        avgY += Math.sin(other.angle);
        count++;
      }
    });

    if (count > 0) {
      avgX /= count;
      avgY /= count;
      const mag = Math.sqrt(avgX*avgX + avgY*avgY);
      if (mag > 0) {
        avgX = (avgX/mag) * Bee.MAX_ALIGNMENT_FORCE;
        avgY = (avgY/mag) * Bee.MAX_ALIGNMENT_FORCE;
      }
    }
    return {x: avgX, y: avgY};
  }

  calculateCohesionVector(otherBees: Bee[]): {x: number, y: number} {

    let avgX = 0;
    let avgY = 0;
    let count = 0;

    otherBees.forEach(other => {
      if (!this.checkValidBee(other)) {return;}

      const dx = other.x - this.x;
      const dy = other.y - this.y;
      const distance = Math.sqrt(dx*dx + dy*dy);
      
      if (distance < Bee.DETECTION_CELL_RADIUS) {
        avgX += other.x;
        avgY += other.y;
        count++;
      }
    });

    if (count > 0) {
      avgX = (avgX/count - this.x);
      avgY = (avgY/count - this.y);
      const mag = Math.sqrt(avgX*avgX + avgY*avgY);
      if (mag > 0) {
        avgX = (avgX/mag) * Bee.MAX_COHESION_FORCE;
        avgY = (avgY/mag) * Bee.MAX_COHESION_FORCE;
      }
    }
    return {x: avgX, y: avgY};
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(-10, 5);
    ctx.lineTo(-10, -5);
    ctx.closePath();
    const boidColor = getComputedStyle(document.documentElement).getPropertyValue('--tertiary-color').trim();
    ctx.fillStyle = boidColor || 'blue';
    ctx.fill();
    ctx.restore();
  }
}

export default Bee;
