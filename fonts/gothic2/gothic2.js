import { FontCanvas } from "../../fontcanvas.js";
import { Polygons } from "../../polygons.js";
import { Font } from "../../font.js";
import { STROKETYPE, STARTTYPE, ENDTYPE } from "../../stroketype.js";
import { get_dir, get_rad, rad_to_dir, moved_point, get_extended_dest } from "../../util.js";
import { Stroke } from "../../stroke.js";
import { PointMaker } from "../../pointmaker.js";

export class Gothic2 extends Font {
  constructor(size) {
    super();

    /**
     * kWidth determines the stroke (line/curve) width.
     * kMage determines the turn size, used for hooks and bends.
     */
    this.kWidth = size;
    this.kMage = 10 + size * 0.5;

    this.precision = 2;
  }

  /**
   * Takes an array of stroke data and returns an array of polygons.
   */
  getPolygons(strokes) {
    let stroke_objs = new Array();

    for (let stroke of strokes)
      stroke_objs.push(this.processStroke(stroke));

    this.connectStrokes(stroke_objs);

    let polygons = new Polygons();
    for (let stroke of stroke_objs)
      polygons.push(stroke.toPolygon(this.precision));

    return polygons;
  }

  /**
   * Handles connecting strokes together if needed.
   */
  connectStrokes(strokes) {
    //--------------------------------------------------------------------------
    // Helper functions.
    
    function pointsEqual(point1, point2) {
      if (point1[0] === point2[0] && point1[1] === point2[1])
        return true;
      else
        return false;
    }

    /**
     * Returns true if any of the points in the first line segment connect with
     * any points in the second line segment.
     */
    function anyPointsEqual(line1, line2) {
      if (pointsEqual(line1[0], line2[0]) ||
          pointsEqual(line1[0], line2[1]) ||
          pointsEqual(line1[1], line2[0]) ||
          pointsEqual(line1[1], line2[1]))
        return true;
      else
        return false;
    }

    function haveConnection(stroke1, stroke2) {
      let line1 = [stroke1.start_point, stroke1.end_point];
      let line2 = [stroke2.start_point, stroke2.end_point];

      return anyPointsEqual(line1, line2);
    }

    //--------------------------------------------------------------------------

    for (let i = 0; i < strokes.length; i++) {
      if (strokes[i].s[1] % 10 != 2 &&
          strokes[i].s[2] % 10 != 3 &&
          strokes[i].s[2] != ENDTYPE.CONNECTING_H &&
          strokes[i].s[2] != ENDTYPE.CONNECTING_V) {
        continue;
      }
      for (let j = 0; j < strokes.length; j++) {
        if (j == i) continue;
        if (haveConnection(strokes[i], strokes[j])) {
          let connected_polygon = this.__connectStrokes(strokes[i], strokes[j]);
          strokes[i] = connected_polygon;
          strokes.splice(j, 1);
          j--;
          if (i > j) i--;
        }
      }
    }
  }

  /**
   * Processes the stroke string data s into a polygon and returns a Stroke object.
   */
  processStroke(s) {
    // Move the endpoint down if the stroke end is a bottom corner.
    if (s[0] % 100 == STROKETYPE.STRAIGHT && s[2] % 10 == 3) {
      s[6] += this.kWidth * 0.5 + 10;
    }

    const a1 = s[0];
    const a2 = s[1];
    const a3 = s[2];
    const x1 = s[3];
    const y1 = s[4];
    const x2 = s[5];
    const y2 = s[6];
    const x3 = s[7];
    const y3 = s[8];
    const x4 = s[9];
    const y4 = s[10];
    const curve_step = 1000 / this.kRate;

    var stroke = new Stroke(s);

    switch(a1 % 100) {
      // This font doesn't support trasnformations, so we just leave this here.
      case 0: {
        break;
      }
      case STROKETYPE.STRAIGHT: {
        this.setBodyStraight(stroke, x1, y1, x2, y2);
        if(a3 == ENDTYPE.TURN_LEFT) {
          let dir12 = get_dir(x2 - x1, y2 - y1);
          this.setTailHookLeft(stroke, dir12);
        }
        break;
      }
      case STROKETYPE.CURVE:
      case 12: { // XXX What is stroke type of 12?
        this.setBodyCurve(stroke, x1, y1, x2, y2, x3, y3);
        let dir23 = get_dir(x3 - x2, y3 - y2);
        if(a3 == ENDTYPE.TURN_LEFT) {
          this.setTailHookLeft(stroke, dir23);
        }
        else if(a3 == ENDTYPE.TURN_UPWARDS){
          this.setTailTurnUpwards(stroke, dir23);
        }
        break;
      }
      case STROKETYPE.BENDING_ROUND:
      case STROKETYPE.BENDING: {
        let amt = 1;
        if (a1 == STROKETYPE.BENDING_ROUND)
          amt = 5;

        this.setBodyBending(stroke, x1, y1, x2, y2, x3, y3, amt);
        let dir23 = get_dir(x3 - x2, y3 - y2);
        if(a3 == ENDTYPE.TURN_UPWARDS) {
          this.setTailHookUpwards(stroke, dir23);
        }
        break;
      }
      case STROKETYPE.BEZIER:
        this.setBodyBezier(stroke, x1, y1, x2, y2, x3, y3, x4, y4);
        if(a3 == ENDTYPE.TURN_UPWARDS){
          let dir34 = get_dir(x4 - x3, y4 - y3);
          this.setTailTurnUpwards(stroke, dir34);
        }
        break;
      case STROKETYPE.VCURVE:
        this.setBodyVCurve(stroke, x1, y1, x2, y2, x3, y3, x4, y4);
        break;
      case 9: // may not be exist
        //kageCanvas[y1][x1] = 0;
        //kageCanvas[y2][x2] = 0;
        break;
      default:
        break;
    }

    return stroke;
  }

  //============================================================================
  // Stroke drawing functions.
  //============================================================================

  //----------------------------------------------------------------------------
  // Stroke head.

  /* None... */

  //----------------------------------------------------------------------------
  // Stroke body.

  /**
   * Sets the stroke's body to a line given points x1, y1 and x2, y2.
   */
  setBodyStraight(stroke, x1, y1, x2, y2) {
    stroke.body1 = new Array();
    stroke.body2 = new Array();

    this.createOpenLine(stroke.body1, stroke.body2, x1, y1, x2, y2);
  }

  /**
   * Sets the stroke's body to a quadratic Bezier curve given endpoints x1, y1
   * and x3, y3.
   */
  setBodyCurve(stroke, x1, y1, x2, y2, x3, y3) {
    stroke.body1 = new Array();
    stroke.body2 = new Array();

    this.createOpenCurve(stroke.body1, stroke.body2, x1, y1, x2, y2, x3, y3);
  }

  /**
   * AKA OTSU curve. Almost just two line segments but with a slightly rounded
   * bend whose size is determined by kMage.
   */
  setBodyBending(stroke, x1, y1, x2, y2, x3, y3, bend_amt) {
    stroke.body1 = new Array();
    stroke.body2 = new Array();

    // First line segment.
    let line11 = new Array();
    let line12 = new Array();
    // Curved bend.
    let curve1 = new Array();
    let curve2 = new Array();
    // Second line segment.
    let line21 = new Array();
    let line22 = new Array();

    // Create points around x2, y2 for the curve.
    let [tx1, ty1] = get_extended_dest(x2, y2, x1, y1, -this.kMage * bend_amt);
    let [tx2, ty2] = get_extended_dest(x2, y2, x3, y3, -this.kMage * bend_amt);

    this.createOpenLine(line11, line12, x1, y1, tx1, ty1);
    this.createOpenCurve(curve1, curve2, tx1, ty1, x2, y2, tx2, ty2);
    this.createOpenLine(line21, line22, tx2, ty2, x3, y3);

    stroke.body1 = Stroke.mergePaths([line11, curve1, line21]);
    stroke.body2 = Stroke.mergePaths([line22, curve2, line12]);
  }

  /**
   * Sets the stroke body to a cubic Bezier curve with endpoints x1, y1 and
   * x4, y4. The rest are intermediate control points.
   */
  setBodyBezier(stroke, x1, y1, x2, y2, x3, y3, x4, y4) {
    stroke.body1 = new Array();
    stroke.body2 = new Array();

    let dir12 = get_dir(x2 - x1, y2 - y1);
    let dir34 = get_dir(x4 - x3, y4 - y3);
    let p = new PointMaker(x1, y1, dir12);
    let half_width = this.kWidth * 0.5;

    // Beginning segment.
    body1.push({p: p.vec(0, -half_width), off: 0});
    body2.push({p: p.vec(0, half_width), off: 0});

    // First middle segment.
    let [middle_dir, middle_mag] = lineBendExpandParams(x1, y1, x2, y2, x3, y3);

    p.setpos(x2, y2);
    p.setdir(middle_dir);
    body1.push({p: p.vec(-half_width, 0), off: 2});
    body2.unshift({p: p.vec(-half_width, 0), off: 2});

    // Second middle segment.
    [middle_dir, middle_mag] = lineBendExpandParams(x2, y2, x3, y3, x4, y4);

    p.setpos(x3, y3);
    p.setdir(middle_dir);
    body1.push({p: p.vec(-half_width, 0), off: 2});
    body2.unshift({p: p.vec(half_width, 0), off: 2});

    // Ending segment.
    p.setpos(x4, y4);
    p.setdir(dir34);
    body1.push({p: p.vec(0, -half_width), off: 0});
    body2.unshift({p: p.vec(0, half_width), off: 0});
  }

  /**
   * Draws a (assumed to be vertical) line and then a curve.
   */
  setBodyVCurve(stroke, x1, y1, x2, y2, x3, y3, x4, y4) {
    stroke.body1 = new Array();
    stroke.body2 = new Array();

    let line1  = new Array();
    let line2  = new Array();
    let curve1 = new Array();
    let curve2 = new Array();

    this.createOpenLine(line1, line2, x1, y1, x2, y2);
    this.createOpenCurve(curve1, curve2, x2, y2, x3, y3, x4, y4);

    stroke.body1 = Stroke.mergePaths([line1, curve1]);
    stroke.body2 = Stroke.mergePaths([curve2, line2]);
  }

  //----------------------------------------------------------------------------
  // Stroke tail.
  
  setTailHookLeft(stroke, dir) {
    stroke.tail = new Array();

    let curve1 = new Array();
    let curve2 = new Array();
    let line = new Array();

    let [tx, ty] = moved_point(stroke.end_point[0], stroke.end_point[1], dir,
                               -this.kMage);

    // Retract end of stroke body.
    let body1_p = stroke.body1[stroke.body1.length - 1];
    let body2_p = stroke.body2[0];
    body1_p.p = moved_point(body1_p.p[0], body1_p.p[1], dir, -this.kMage);
    body2_p.p = moved_point(body2_p.p[0], body2_p.p[1], dir, -this.kMage);
    stroke.body1[stroke.body1.length - 1] = body1_p;
    stroke.body2[0] = body2_p;

    this.createOpenCurve(
      curve1, curve2,
      tx, ty,
      stroke.end_point[0], stroke.end_point[1],
      stroke.end_point[0] - 1.25 * this.kMage, stroke.end_point[1]
    );

    line.push(curve1[curve1.length - 1]);
    line.push(curve2[0]);

    stroke.tail = Stroke.mergePaths([curve1, line, curve2]);
  }

  setTailHookUpwards(stroke, dir) {
    stroke.tail = new Array();

    let curve1 = new Array();
    let curve2 = new Array();
    let line = new Array();

    let [tx, ty] = moved_point(stroke.end_point[0], stroke.end_point[1], dir,
                               -this.kMage);

    // Retract end of stroke body.
    let body1_p = stroke.body1[stroke.body1.length - 1];
    let body2_p = stroke.body2[0];
    body1_p.p = moved_point(body1_p.p[0], body1_p.p[1], dir, -this.kMage);
    body2_p.p = moved_point(body2_p.p[0], body2_p.p[1], dir, -this.kMage);
    stroke.body1[stroke.body1.length - 1] = body1_p;
    stroke.body2[0] = body2_p;

    this.createOpenCurve(
      curve1, curve2,
      tx, ty,
      stroke.end_point[0], stroke.end_point[1],
      stroke.end_point[0], stroke.end_point[1] - 1.25 * this.kMage
    );

    line.push(curve1[curve1.length - 1]);
    line.push(curve2[0]);

    stroke.tail = Stroke.mergePaths([curve1, line, curve2]);
  }

  //============================================================================
  // Misc helper functions.
  //============================================================================

  /**
   * When thickening a line with a bend (two line segments), special attention
   * must be paid to their meetup point since the angle in the bend changes the
   * amount of expansion needed to reach the same width.
   *
   * This function returns the direction and magnitude needed for expanding the
   * middle point. interp_rad is always to the right of the first line segment.
   */
  lineBendExpandParams(x1, y1, x2, y2, x3, y3) {
    let rad12 = get_rad(x2 - x1, y2 - y1);
    let rad23 = get_rad(x3 - x2, y3 - y2);
    let middle_rad = (rad12 + rad23) * 0.5;

    let middle_dir = rad_to_dir(middle_rad);
    let half_angle = Math.abs(rad23 + Math.PI - rad12) * 0.5;
    let middle_mag = 1 / Math.sin(half_angle);

    return [middle_dir, middle_mag];
  }

  /**
   * Creates an open-ended thickened line and stores each side in body1 and
   * body2 respectively. The stroke path is assumed to traverse counter-
   * clockwise so body1 represents the first (left) side and body2 the second
   * (right).
   */
  createOpenLine(body1, body2, x1, y1, x2, y2) {
    let dir12 = get_dir(x2 - x1, y2 - y1);
    let p = new PointMaker(x1, y1, dir12);
    let half_width = this.kWidth * 0.5;

    // Left side (assuming horizontal stroke).
    body1.push({p: p.vec(0, -half_width), off: 0});
    body2.push({p: p.vec(0, half_width), off: 0});

    // Right side.
    p.setpos(x2, y2);
    body1.push({p: p.vec(0, -half_width), off: 0});
    body2.unshift({p: p.vec(0, half_width), off: 0});
  }

  /**
   * Creates an open-ended thickened quadratic Bezier curve and stores each side
   * in body1 and body2 respectively.
   */
  createOpenCurve(body1, body2, x1, y1, x2, y2, x3, y3) {
    let dir12 = get_dir(x2 - x1, y2 - y1);
    let dir23 = get_dir(x3 - x2, y3 - y2);
    let p = new PointMaker(x1, y1, dir12);
    let half_width = this.kWidth * 0.5;

    // Beginning segment.
    body1.push({p: p.vec(0, -half_width), off: 0});
    body2.push({p: p.vec(0, half_width), off: 0});

    // Middle segment.
    let [middle_dir, middle_mag] = this.lineBendExpandParams(x1, y1, x2, y2, x3, y3);

    p.setpos(x2, y2);
    p.setdir(middle_dir);
    body1.push({p: p.vec(0, -half_width * middle_mag), off: 1});
    body2.unshift({p: p.vec(0, half_width * middle_mag), off: 1});

    // Ending segment.
    p.setpos(x3, y3);
    p.setdir(dir23);
    body1.push({p: p.vec(0, -half_width), off: 0});
    body2.unshift({p: p.vec(0, half_width), off: 0});
  }

  /**
   * Takes two strokes that are assumed to be connected and merges their paths,
   * returning a new connected stroke.
   */
  __connectStrokes(stroke1, stroke2) {
    //--------------------------------------------------------------------------
    // Helper functions.
    
    function pointsEqual(point1, point2) {
      if (point1[0] === point2[0] && point1[1] === point2[1])
        return true;
      else
        return false;
    }

    function getDirFromPoints(point1, point2) {
      return get_dir(point2.p[0] - point1.p[0], point2.p[1] - point1.p[1]);
    }

    function getEndpointLeft(stroke, head_connected) {
      if (head_connected)
        return stroke.body1[0];
      else
        return stroke.body2[0];
    }

    function setEndpointLeft(stroke, head_connected, point) {
      if (head_connected)
        stroke.body1[0] = point;
      else
        stroke.body2[0] = point;
    }

    function getEndpointRight(stroke, head_connected) {
      if (head_connected)
        return stroke.body2[stroke.body2.length - 1];
      else
        return stroke.body1[stroke.body1.length - 1];
    }

    function setEndpointRight(stroke, head_connected, point) {
      if (head_connected)
        stroke.body2[stroke.body2.length - 1] = point;
      else
        stroke.body1[stroke.body1.length - 1] = point;
    }

    function getDirLeft(stroke, head_connected) {
      if (head_connected)
        return getDirFromPoints(stroke.body1[0], stroke.body1[1]);
      else
        return getDirFromPoints(stroke.body2[0], stroke.body2[1]);
    }

    function getDirRight(stroke, head_connected) {
      if (head_connected)
        return getDirFromPoints(stroke.body2[stroke.body2.length - 1],
                                stroke.body2[stroke.body2.length - 2]);
      else
        return getDirFromPoints(stroke.body1[stroke.body1.length - 1],
                                stroke.body1[stroke.body1.length - 2]);
    }

    function getBody(stroke, head_connected, first_stroke, left) {
      let new_left = left;

      if (head_connected)
        new_left = !new_left;

      if (!first_stroke)
        new_left = !new_left;

      if (new_left)
        return stroke.body1;
      else
        return stroke.body2;
    }

    function getEnd(stroke, head_connected) {
      if (head_connected)
        return stroke.tail;
      else
        return stroke.head;
    }

    /**
     * Calculates the intersection of two rays and returns a point.
     * Each ray is an array [point, dir].
     */
    function calculateIntersection(ray1, ray2) {
      // Solved the equation p1 + a*d1 = p2 + b*d2 where p and d are points.
      // https://www.desmos.com/calculator/cf9mbyzy8z
      let p1 = new Object();
      let p2 = new Object();
      let d1 = new Object();
      let d2 = new Object();
      p1.x = ray1[0].p[0];
      p1.y = ray1[0].p[1];
      p2.x = ray2[0].p[0];
      p2.y = ray2[0].p[1];
      d1.x = ray1[1].cos;
      d1.y = ray1[1].sin;
      d2.x = ray2[1].cos;
      d2.y = ray2[1].sin;

      let point = new Object();
      point.off = 0;
      point.p = new Array();
      let parallel = false;

      if (d2.x != 0) {
        const d = d2.y / d2.x;
        const numerator = (p2.x - p1.x) * d + p1.y - p2.y;
        const denominator = d1.x * d - d1.y;
        if (denominator == 0) {
          parallel = true;
        }
        const alpha = numerator / denominator;
        point.p[0] = p1.x + alpha * d1.x;
        point.p[1] = p1.y + alpha * d1.y;
      }
      else if (d1.x != 0) {
        const d = d1.y / d1.x;
        const numerator = (p1.x - p2.x) * d + p2.y - p1.y;
        const denominator = d2.x * d - d2.y;
        if (denominator == 0) {
          parallel = true;
        }
        const beta = numerator / denominator;
        point.p[0] = p2.x + beta * d2.x;
        point.p[1] = p2.y + beta * d2.y;
      }
      else {
        parallel = true;
      }
      if (parallel) {
        point.p[0] = (p1.x + p2.x) * 0.5;
        point.p[1] = (p1.y + p2.y) * 0.5;
      }

      return point;
    }

    //--------------------------------------------------------------------------

    let head_connected1, head_connected2 = false;

    // Find which ends are connected.
    if (pointsEqual(stroke1.start_point, stroke2.start_point)) {
      head_connected1 = true;
      head_connected2 = true;
    }
    else if (pointsEqual(stroke1.start_point, stroke2.end_point)) {
      head_connected1 = true;
      head_connected2 = false;
    }
    else if (pointsEqual(stroke1.end_point, stroke2.start_point)) {
      head_connected1 = false;
      head_connected2 = true;
    }
    else if (pointsEqual(stroke1.end_point, stroke2.end_point)) {
      head_connected1 = false;
      head_connected2 = false;
    }

    // Calculate intersection points.
    let ray1l = [getEndpointLeft(stroke1, head_connected1),
                 getDirLeft(stroke1, head_connected1)];
    let ray1r = [getEndpointRight(stroke1, head_connected1),
                 getDirRight(stroke1, head_connected1)];
    let ray2l = [getEndpointLeft(stroke2, head_connected2),
                 getDirLeft(stroke2, head_connected2)];
    let ray2r = [getEndpointRight(stroke2, head_connected2),
                 getDirRight(stroke2, head_connected2)];

    let intersection1 = calculateIntersection(ray1l, ray2r);
    let intersection2 = calculateIntersection(ray2l, ray1r);

    // Move end points and merge.
    setEndpointLeft(stroke1, head_connected1, intersection1);
    setEndpointRight(stroke2, head_connected2, intersection1);
    setEndpointLeft(stroke2, head_connected2, intersection2);
    setEndpointRight(stroke1, head_connected1, intersection2);

    let connected_stroke = new Stroke(null);
    if (head_connected1)
      connected_stroke.start_point = stroke1.end_point;
    else 
      connected_stroke.start_point = stroke1.start_point;
    if (head_connected2)
      connected_stroke.end_point = stroke2.end_point;
    else
      connected_stroke.end_point = stroke2.start_point;

    connected_stroke.head = getEnd(stroke1, head_connected1);
    connected_stroke.body1 = Stroke.mergePaths([
      getBody(stroke1, head_connected1, true, true),
      getBody(stroke2, head_connected2, false, true)
    ]);
    connected_stroke.tail = getEnd(stroke2, head_connected2);
    connected_stroke.body2 = Stroke.mergePaths([
      getBody(stroke2, head_connected2, false, false),
      getBody(stroke1, head_connected1, true, false)
    ]);

    return connected_stroke;
  }
}
