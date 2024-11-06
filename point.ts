
export class Point {
  x: number;
  y: number;

  constructor(_x: number, _y: number) {
    this.x = _x;
    this.y = _y;
  }

  add(p: Point): void {
    this.x += p.x;
    this.y += p.y;
  }

  sub(p: Point): void {
    this.x -= p.x;
    this.y -= p.y;
  }

  scale(s: number) {
    this.x *= s;
    this.y *= s;
  }

  /**
   * Moves this point towards p over a distance of dist.
   */
  moveTowards(p: Point, dist: number) {
    p.sub(this);
    try {
      p.normalize();

      p.scale(dist);
      this.add(p);
    }
    catch {
      // If the magnitude of their difference is 0 they are the same.
      return;
    }
  }

  /**
   * Normalizes the point. If the magnitude is 0 this function throws an error.
   */
  normalize(): void {
    let mag: number = Math.sqrt(this.x * this.x + this.y * this.y);

    if (!mag)
      throw new Error("Magnitude is 0.");

    this.x /= mag;
    this.y /= mag;
  }
}
