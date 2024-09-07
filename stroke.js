import { Polygon } from "./polygon.js";
import { PointMaker } from "./pointmaker.js";
import { STROKETYPE } from "./stroketype.js";

/**
 * Instead of drawing the stroke head, body, and tail separately this class
 * treats them as different parts of a single SVG path.
 *
 * Going counter-clockwise, the path starts with head, then covers the left
 * half of the body (body1), then includes the tail, and ends with the right
 * half of the body (body2).
 *
 * Each sub-path (head, body1, etc...) should be stored as its own independent
 * path including start and end points. Then toPolygon() will merge them
 * together.
 */
export class Stroke {
  constructor(stroke) {
    this.s = stroke;

    // Store the start and endpoints for connection purposes.
    if (typeof stroke != "undefined" && stroke != null) {
      this.start_point = [stroke[3], stroke[4]];
      if (stroke[0] == STROKETYPE.STRAIGHT)
        this.end_point = [stroke[5], stroke[6]];
      else if (stroke[0] == STROKETYPE.CURVE ||
               stroke[0] == STROKETYPE.BENDING ||
               stroke[0] == STROKETYPE.BENDING_ROUND)
        this.end_point = [stroke[7], stroke[8]];
      else
        this.end_point = [stroke[9], stroke[10]];
    }
    else {
      this.start_point = [0, 0];
      this.end_point   = [0, 0];
    }

    this.head  = new Array();
    // Since the stroke body path is open on both ends we have to store
    // each side separately.
    this.body1 = new Array();
    this.body2 = new Array();
    this.tail  = new Array();
  }

  /**
   * Takes the stored paths and returns the entire stroke as a single path.
   *
   * @param precision is the number of decimal places to round to.
   * @return Polygon object containing the stroke.
   */
  toPolygon(precision) {
    let polygon = new Polygon();

    if (this.head.length == 0) {
      this.head.push(this.body2[this.body2.length - 1]);
      this.head.push(this.body1[0]);
    }
    if (this.tail.length == 0) {
      this.tail.push(this.body1[this.body1.length - 1]);
      this.tail.push(this.body2[0]);
    }

    let merged_path = Stroke.mergePaths(
      [this.head, this.body1, this.tail, this.body2]
    );

    for (let i = 0; i < merged_path.length; i++) {
      let point = merged_path[i];
      polygon.push(point.p[0], point.p[1], point.off);
    }

    for (let point of polygon.array) {
      point.x = parseFloat(point.x.toFixed(precision));
      point.y = parseFloat(point.y.toFixed(precision));
    }

    return polygon;
  }

  /**
   * Takes an array of paths (array of point arrays) and combines them into a
   * single path. Each path's start and endpoints are assumed to connect to
   * each other, but if there is a difference their midpoint will be used.
   *
   * This function assumes none of the paths are empty.
   */
  static mergePaths(path_arr) {
    function pathNotClosedError(path) {
      throw new Error("In mergePaths(): one of the paths was not properly" +
                      " closed. Path is:\n" + JSON.stringify(path));
    }
    var combined_path = new Array();

    if (path_arr[0][0].off != 0) {
      pathNotClosedError(path_arr[0]);
    }

    // (most of the) first path.
    for (let i = 0; i < path_arr[0].length - 1; i++) {
      combined_path.push(path_arr[0][i]);
    }

    // From second path to last path.
    for (let path = 1; path < path_arr.length; path++) {
      if (path_arr[path].length == 0) {
        continue;
      }

      let cur_path    = path_arr[path];
      let prev_path   = path_arr[path - 1];
      let prev_point  = prev_path[prev_path.length - 1];

      // Midpoint between current path's first point and the previous path's
      // last point.
      let midpoint  = new Object();
      midpoint.p    = new Array(2);
      midpoint.p[0] = (cur_path[0].p[0] + prev_point.p[0]) * 0.5;
      midpoint.p[1] = (cur_path[0].p[1] + prev_point.p[1]) * 0.5;

      if (prev_point.off != 0) {
        pathNotClosedError(prev_path);
      }
      if (cur_path[0].off != 0) {
        pathNotClosedError(cur_path);
      }

      combined_path.push(midpoint);

      // Push (most of) the rest of the path.
      for (let i = 1; i < cur_path.length - 1; i++) {
        combined_path.push(cur_path[i]);
      }
    }

    // Last point.
    let last_path = path_arr[path_arr.length - 1];
    let last_point = last_path[last_path.length - 1];
    if (last_point.off != 0) {
      pathNotClosedError();
    }
    combined_path.push(last_point);

    return combined_path;
  }
}
