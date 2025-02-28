// new
export class Bee {
  static readonly SPEED: number = 3;
  static readonly TURN_SPEED: number = 0.3;
  static readonly PROXIMITY_THRESHOLD: number = 15;
  static readonly DETECTION_RADIUS: number = 100;
  static readonly MAX_AVOIDANCE_FORCE: number = 5;
  static readonly MAX_ALIGNMENT_FORCE: number = 20;
  static readonly MAX_COHESION_FORCE: number = 30; // Adjust this to change the strength of cohesion

  x: number;
  y: number;
  angle: number;
  currentWaypointIndex: number; canvasWidth: number;
  canvasHeight: number;

  constructor(x: number, y: number, canvasWidth: number, canvasHeight: number, angle: number = 0) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.currentWaypointIndex = 0;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
  }

  move() {
    this.x += Math.cos(this.angle) * Bee.SPEED;
    this.y += Math.sin(this.angle) * Bee.SPEED;

    // Wrap around screen with buffer
    console.log(this.canvasWidth, this.canvasHeight);

    const buffer = 5;
    if (this.y > this.canvasHeight + buffer) { this.y = -buffer; }
    if (this.x > this.canvasWidth + buffer) { this.x = -buffer; }
    if (this.y < -buffer) { this.y = this.canvasHeight + buffer; }
    if (this.x < -buffer) { this.x = this.canvasWidth + buffer; }
  }

  update(waypoint: {x: number, y: number} | null, otherBees: Bee[]) {
    let targetAngle = this.angle;

    if (waypoint) {
      const dx = waypoint.x - this.x;
      const dy = waypoint.y - this.y;
      targetAngle = Math.atan2(dy, dx);
    }

    const avoidanceForce = this.calculateAvoidanceForce(otherBees);
    const alignmentForce = this.calculateAlignmentForce(otherBees);
    const cohesionForce = this.calculateCohesionForce(otherBees);

    targetAngle += avoidanceForce + alignmentForce + cohesionForce;

    let angleDiff = targetAngle - this.angle;
    if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
    if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

    this.angle += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), Bee.TURN_SPEED);
    this.angle = this.angle % (2 * Math.PI);

    this.move();

    if (waypoint) {
      const dx = waypoint.x - this.x;
      const dy = waypoint.y - this.y;
      const distanceToWaypoint = Math.sqrt(dx * dx + dy * dy);
      return distanceToWaypoint < Bee.PROXIMITY_THRESHOLD;
    }
    return false;
  }

  calculateAvoidanceForce(otherBees: Bee[]): number {
    let avoidanceForce = 0;
    otherBees.forEach(other => {
      if (other === this) return;
      const dx = this.x - other.x;
      const dy = this.y - other.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < Bee.DETECTION_RADIUS) {
        const angle = Math.atan2(dy, dx);
        const force = (Bee.DETECTION_RADIUS - distance) / Bee.DETECTION_RADIUS;
        avoidanceForce += angle * force;
      }
    });
    return Math.min(Math.max(avoidanceForce, -Bee.MAX_AVOIDANCE_FORCE), Bee.MAX_AVOIDANCE_FORCE);
  }

  calculateAlignmentForce(otherBees: Bee[]): number {
    let averageAngle = 0;
    let count = 0;
    otherBees.forEach(other => {
      if (other === this) return;
      const dx = other.x - this.x;
      const dy = other.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < Bee.DETECTION_RADIUS) {
        averageAngle += other.angle;
        count++;
      }
    });
    if (count > 0) {
      averageAngle /= count;
      let alignmentForce = averageAngle - this.angle;
      if (alignmentForce > Math.PI) alignmentForce -= 2 * Math.PI;
      if (alignmentForce < -Math.PI) alignmentForce += 2 * Math.PI;
      return Math.min(Math.max(alignmentForce, -Bee.MAX_ALIGNMENT_FORCE), Bee.MAX_ALIGNMENT_FORCE);
    }
    return 0;
  }

  calculateCohesionForce(otherBees: Bee[]): number {
    let averageX = 0;
    let averageY = 0;
    let count = 0;
    otherBees.forEach(other => {
      if (other === this) return;
      const dx = other.x - this.x;
      const dy = other.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < Bee.DETECTION_RADIUS) {
        averageX += other.x;
        averageY += other.y;
        count++;
      }
    });
    if (count > 0) {
      averageX /= count;
      averageY /= count;
      const cohesionAngle = Math.atan2(averageY - this.y, averageX - this.x);
      let cohesionForce = cohesionAngle - this.angle;
      if (cohesionForce > Math.PI) cohesionForce -= 2 * Math.PI;
      if (cohesionForce < -Math.PI) cohesionForce += 2 * Math.PI;
      return Math.min(Math.max(cohesionForce, -Bee.MAX_COHESION_FORCE), Bee.MAX_COHESION_FORCE);
    }
    return 0;
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

export default Bee;
