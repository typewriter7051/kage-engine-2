import { Bezier } from "./bezier.ts";
import { CurveOp } from "./curve.ts";
import { PointOp } from "../point.ts";
import { Curve, Path, Point } from "../types.ts";

/**
 * Path mainly stores an array of curves with some helper functions.
 * Each curve is an array of 2-4 points where the length denotes the degree
 * of the Bezier curve.
 */
export class PathOp {
  static getLastPoint(p: Path): Point {
    let last_curve: Curve = p[p.length - 1];
    return last_curve[last_curve.length - 1];
  }

  static setLastPoint(p: Path, pt: Point): void {
    let last_curve: Curve = p[p.length - 1];
    p[p.length - 1][last_curve.length - 1] = pt;
  }

  static getKthLastPoint(p: Path, k: number): Point {
    let last_curve: Curve = p[p.length - 1];
    if (k < 1 || k > last_curve.length)
      throw new Error("Invalid value for k!");

    return last_curve[last_curve.length - k];
  }

  static setKthLastPoint(p: Path, k: number, pt: Point): void {
    let last_curve: Curve = p[p.length - 1];
    if (k < 1 || k > last_curve.length)
      throw new Error("Invalid value for k!");

    p[p.length - 1][last_curve.length - k] = pt;
  }

  /**
   * Connects p1 to p2 while maintaining orientation of p2.
   */
  static connect(p1: Path, p2: Path): void {
    if (p2.length == 0) {
      p2 = p1;
      return;
    }

    // sp = start point, ep = end point.
    let p1_sp: Point = p1[0][0];
    let p1_ep: Point = PathOp.getLastPoint(p1);
    let p2_sp: Point = p2[0][0];
    let p2_ep: Point = PathOp.getLastPoint(p2);

    if (PointOp.equal(p1_sp, p2_sp)) {
      p2 = p1.toReversed().concat(p2);
    }
    else if (PointOp.equal(p1_sp, p2_ep)) {
      p2 = p2.concat(p1);
    }
    else if (PointOp.equal(p1_ep, p2_sp)) {
      p2 = p1.concat(p2);
    }
    else if (PointOp.equal(p1_ep, p2_ep)) {
      p2 = p2.concat(p1.toReversed());
    }
  }

  /**
   * Returns true if the start point or end point of this path is connected to
   * the start point or end point of the given path, and false otherwise.
   */
  static connected(p1: Path, p2: Path): boolean {
    // sp = start point, ep = end point.
    let p1_sp: Point = p1[0][0];
    let p1_ep: Point = PathOp.getLastPoint(p1);
    let p2_sp: Point = p2[0][0];
    let p2_ep: Point = PathOp.getLastPoint(p2);

    return PointOp.equal(p1_sp, p2_sp) ||
           PointOp.equal(p1_sp, p2_ep) ||
           PointOp.equal(p1_ep, p2_sp) ||
           PointOp.equal(p1_ep, p2_ep);
  }

  /**
   * Similar to array.toReversed(). Returns a reversed copy of the path.
   */
  static toReversed(p: Path): Path {
    let path: Path = new Array();

    for (let curve of p)
      path.unshift(CurveOp.toReversed(curve));

    return path;
  }

  /**
   * Converts the path into an SVG command sequence (M x y Q x y, x y etc).
   * Includes only the string assigned to "d".
   */
  static toSVGSequence(p: Path, precision: number): string {
    function round(num, precision) {
      return parseFloat(num.toFixed(precision));
    }

    let buffer = "";

    let x = p[0][0][0];
    let y = p[0][0][1];

    buffer += "M";
    buffer += round(x, precision) + "," + round(y, precision) + " ";

    for (let curve of p) {
      switch (curve.length) {
        case 2: { // Line.
          buffer += "L";
          break;
        }
        case 3: { // Quadratic.
          buffer += "Q";
          break;
        }
        case 4: { // Cubic.
          buffer += "C";
          break;
        }
        default: // Unknown curve.
          break;
      }

      for (let point = 1; point < curve.length; point++) {
        x = curve[point][0];
        y = curve[point][1];
        buffer += round(x, precision) + "," + round(y, precision) + " ";
      }
    }

    buffer = buffer.substring(0, buffer.length - 1);
    //buffer += "Z";

    return buffer;
  }

  /**
   * If I ever add support for generating fonts this will be used.
   */
  toFont() {
  }

  /**
   * If the path is open then widen it using the Bezier functions.
   */
  widen(width) {
  }
}
