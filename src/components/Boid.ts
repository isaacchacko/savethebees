// src/Boid.ts

class Waypoint {
  x: number;
  y: number;
}

class Boid {
  static readonly SPEED: number = 2;
  static readonly TURN_SPEED: number = 0.05;
  static readonly PROXIMITY_THRESHOLD: number = 15;

  x: number;
  y: number;
  angle: number;

  constructor(x: number, y: number, angle: number = 0) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.currentWaypointIndex = 0;
  }
  
  move() {
    this.x += Math.cos(this.angle) * Boid.SPEED;
    this.y += Math.sin(this.angle) * Boid.SPEED;
  }

  moveTowardsWaypoint(waypoint: Waypoint) {
    const dx = waypoint.x - this.x;
    const dy = waypoint.y - this.y;
    const targetAngle = Math.atan2(dy, dx);

    // Adjust angle
    let angleDiff = targetAngle - this.angle;
    if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
    if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

    this.angle += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), Boid.TURN_SPEED);
    this.angle = this.angle % (2 * Math.PI);

    // Move
    this.move();

    // Check if waypoint is reached
    const distanceToWaypoint = Math.sqrt(dx * dx + dy * dy);
    if (distanceToWaypoint < Boid.PROXIMITY_THRESHOLD) {
      return true; // Waypoint reached
    }
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
    ctx.fillStyle = 'blue';
    ctx.fill();
    ctx.restore();
  }
}

export default Boid;
