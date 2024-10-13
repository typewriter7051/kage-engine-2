import { Bezier } from "./bezier.js";

/**
 * Path mainly stores an array of curves with some helper functions.
 * Each curve is an array of 2-4 points where the length denotes the degree
 * of the Bezier curve.
 */
export class Path {
  constructor() {
    this.curves = new Array();
  }

  /**
   * Takes another path assumed to connect at the end or start points, and
   * connects the two while fixing orientation to that of the current path.
   */
  connect(path) {
    function pointsEqual(p1, p2) {
      return (p1[0] == p2[0]) && (p1[1] == p2[1]);
    }

    if (this.curves.length == 0) {
      this.curves = path.curves;
      return;
    }

    // lc = last curve.
    let path_lc = path.curves[path.curves.length - 1];
    let this_lc = this.curves[this.curves.length - 1];

    // sp = start point, ep = end point.
    let path_sp = path.curves[0][0];
    let path_ep = path_lc[path_lc.length - 1];
    let this_sp = this.curves[0][0];
    let this_ep = this_lc[this_lc.length - 1];

    if (pointsEqual(this_sp, path_sp)) {
      this.curves = path.toReversed().concat(this.curves);
    }
    else if (pointsEqual(this_sp, path_ep)) {
      this.curves = path.curves.concat(this.curves);
    }
    else if (pointsEqual(this_ep, path_sp)) {
      this.curves = this.curves.concat(path.curves);
    }
    else if (pointsEqual(this_ep, path_ep)) {
      this.curves = this.curves.concat(path.curves.toReversed());
    }
  }

  /**
   * Returns true if the start point or end point of this path is connected to
   * the start point or end point of the given path, and false otherwise.
   */
  connectedTo(path) {
    function pointsEqual(p1, p2) {
      return (p1[0] == p2[0]) && (p1[1] == p2[1]);
    }

    let this_start = this.curves[0][0];
    let path_start = path.curves[0][0];
    let this_curve = this.curves[this.curves.length - 1];
    let path_curve = path.curves[path.curves.length - 1];
    let this_end = this_curve[this_curve.length - 1];
    let path_end = path_curve[path_curve.length - 1];

    return pointsEqual(this_start, path_start) ||
           pointsEqual(this_start, path_end) ||
           pointsEqual(this_end, path_start) ||
           pointsEqual(this_end, path_end);
  }

  /**
   * Similar to array.toReversed(). Returns a reversed copy of the path.
   */
  toReversed() {
    let path = new Array();
    for (let curve of this.curves) {
      path.unshift(curve.toReversed());
    }

    return path;
  }

  /**
   * Converts the path into an SVG command sequence (M x y Q x y, x y etc).
   * Includes only the string assigned to "d".
   */
  toSVGSequence(precision) {
    function round(num, precision) {
      return parseFloat(num.toFixed(precision));
    }

    let buffer = "";

    let x = this.curves[0][0][0];
    let y = this.curves[0][0][1];

    buffer += "M";
    buffer += round(x, precision) + "," + round(y, precision) + " ";

    for (let curve of this.curves) {
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
