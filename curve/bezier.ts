import { rad_to_vector, get_rad } from "../util";
import { fitCurve } from "./fit-curve";
import { Curve, Path, Point } from "../types";
import { PointOp } from "../point";

export class Bezier {
  static bezier_steps: number = 200;
  static max_err: number = 0.03;
  /**
   * Takes in 3 functions and outputs two Bezier curves, one for each side.
   * x_fn, y_fn, width_fn should take in an argument 0 <= t <= 1 and output
   * a corresponding value.
   */
  static generalBezier(x_fn: (a: number) => number, y_fn: (a: number) => number,
                       width_fn: (a: number) => number): Path[] {
    var a1 = [];
    var a2 = [];

    let x = x_fn(0);
    let y = y_fn(0);
    let ia = 0;
    let ib = 0;

    for (var tt = 1; tt <= this.bezier_steps; tt++) {
      const t = tt / this.bezier_steps;
      const new_x = x_fn(t);
      const new_y = y_fn(t);
      const vx = new_x - x;
      const vy = new_y - y;

      let norm: Point = [ia, ib];
      PointOp.normalize(norm, [vx, vy]);
      const deltad = width_fn(t);
      PointOp.scale(norm, norm, deltad);
      
      [ia, ib] = norm;
      a1.push([x - ia, y - ib]);
      a2.push([x + ia, y + ib]);

      x = new_x;
      y = new_y;
    }

    // Push the last point.
    a1.push([x - ia, y - ib]);
    a2.push([x + ia, y + ib]);

    const curve1 = fitCurve(a1, this.max_err);
    const curve2 = fitCurve(a2.reverse(), this.max_err);

    return [curve1, curve2];
  }

  static generalBezier2(x_fun, y_fun, dx_fun, dy_fun, width_func, width_func_d, dir_func): Path[] {
    //offset vector (ia, ib) is calculated with dir_func
    var a1 = [];
    var a2 = [];
    var tang1 = [];
    var tang2 = [];

    for (var tt = 0; tt <= this.bezier_steps; tt++) {
      const t = tt / this.bezier_steps;
      const x = x_fun(t);
      const y = y_fun(t);
      const vx = dx_fun(t);
      const vy = dy_fun(t);

      let [ia, ib] = dir_func(t);
      const deltad = width_func(t);
      ia = ia * deltad;
      ib = ib * deltad;
      
      const rad = get_rad(vx, vy);
      const velocity = Math.sqrt(vx*vx+vy*vy);
      const width_rad = Math.atan(width_func_d(t)/velocity);
      a1.push([x - ia, y - ib]);
      a2.push([x + ia, y + ib]);
      tang1.push(rad_to_vector(rad-width_rad));
      tang2.push(rad_to_vector(rad+width_rad-Math.PI));
    }

    const bez1 = fitCurve(a1, this.max_err);
    const bez2 = fitCurve(a2.reverse(), this.max_err);

    return [bez1, bez2];
  }

  /**
   * Takes in a curve and a width function, and outputs 2 arrays of curves.
   * A curve is an array of points, and the polynomial degree is determined by
   * the length of the array. For example [[0, 0], [10, 20]] is a line and
   * [[2, 4], [10, 10], [20, 10]] is a quadratic Bezier.
   */
  static thickenCurve(curve: Curve, width_fn): Path[] {
    var x_fn, y_fn;
    switch (curve.length) {
      case 2: {
        x_fn = t => (1.0 - t) * curve[0][0] + t * curve[1][0];
        y_fn = t => (1.0 - t) * curve[0][1] + t * curve[1][1];
        break;
      }
      case 3: {
        x_fn = t => ((1.0 - t) * (1.0 - t) * curve[0][0] +
                    2.0 * t * (1.0 - t) * curve[1][0] +
                    t * t * curve[2][0]);
        y_fn = t => ((1.0 - t) * (1.0 - t) * curve[0][1] +
                    2.0 * t * (1.0 - t) * curve[1][1] +
                    t * t * curve[2][1]);
        break;
      }
      case 4: {
        x_fn = t => (1.0 - t) * (1.0 - t) * (1.0 - t) * curve[0][0] +
                    3.0 * t * (1.0 - t) * (1.0 - t) * curve[1][0] +
                    3 * t * t * (1.0 - t) * curve[2][0] +
                    t * t * t * curve[3][0];
        y_fn = t => (1.0 - t) * (1.0 - t) * (1.0 - t) * curve[0][1] +
                    3.0 * t * (1.0 - t) * (1.0 - t) * curve[1][1] +
                    3 * t * t * (1.0 - t) * curve[2][1] +
                    t * t * t * curve[3][1];
        break;
      }
      default:
        throw new Error("Curve must have 2-4 points!");
        break;
    }

    return this.generalBezier(x_fn, y_fn, width_fn);
  }
}
