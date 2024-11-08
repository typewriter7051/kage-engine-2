import { Point } from "./types.ts";

/**
 * Some helper functions for point operations.
 */
export class PointOp {
  static equal(p1: Point, p2: Point): boolean {
    return (p1[0] == p2[0]) && (p1[1] == p2[1]);
  }

  static add(out: Point, p1: Point, p2: Point): void {
    out[0] = p1[0] + p2[0];
    out[1] = p1[1] + p2[1];
  }

  static sub(out: Point, p1: Point, p2: Point): void {
    out[0] = p1[0] - p2[0];
    out[1] = p1[1] - p2[1];
  }

  static scale(out: Point, p: Point, s: number): void {
    out[0] = p[0] * s;
    out[1] = p[1] * s;
  }

  /**
   * Moves towards destination from start over a distance of dist.
   */
  static moveTowards(out: Point, dest: Point, start: Point, dist: number): void {
    let dir: Point = [0, 0];
    PointOp.sub(dir, dest, start);

    if (dir[0] == 0 && dir[1] == 0) {
      out = start;
    }
    else {
      PointOp.normalize(dir, dir);
      PointOp.scale(dir, dir, dist);
      PointOp.add(out, start, dir);
    }
  }

  /**
   * Normalizes the point. If the magnitude is 0 this function throws an error.
   */
  static normalize(out: Point, p: Point): void {
    let mag: number = Math.sqrt(p[0] * p[0] + p[1] * p[1]);

    if (!mag)
      throw new Error("Magnitude is 0.");

    out[0] = p[0] / mag;
    out[1] = p[1] / mag;
  }
}

