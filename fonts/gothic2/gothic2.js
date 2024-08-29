import { FontCanvas } from "../../fontcanvas.js";
import { Font } from "../../font.js";
import { STROKETYPE, STARTTYPE, ENDTYPE } from "../../stroketype.js";
import { get_dir, get_rad, rad_to_dir } from "../../util.js";
import { Stroke } from "../../stroke.js";
import { PointMaker } from "../../pointmaker.js";

export class Gothic2 extends Font {
  constructor(size) {
    super();

    /**
     * kRate is unknown.
     * kWidth determines the stroke (line/curve) width.
     * kKakato is unknown.
     * kMage determines the turn size, used for hooks and bends.
     */
    this.kRate = 50;
    this.kWidth = size;
    this.kKakato = size * 0.6;
    this.kMage = 10 + size * 0.5;
  }

  /**
   * Takes an array of stroke data and returns an array of polygons.
   */
  getPolygons(strokes) {
    var cv = new FontCanvas();
    for (let stroke of strokes) {
      this.processStroke(cv, stroke);
    }
    return cv.getPolygons();
  }

  /**
   * Processes the stroke data s into a polygon and adds it to canvas cv.
   */
  processStroke(cv, s) {
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

    var stroke = new Stroke();

    switch(a1 % 100) {
      case 0: { // Transforms.
        if (a2 == 98) {
          cv.flip_left_right(x1, y1, x2, y2);
        } else if (a2 == 97) {
          cv.flip_up_down(x1, y1, x2, y2);
        } else if (a2 == 99 && a3 == 1) {
          cv.rotate90(x1, y1, x2, y2);
        } else if (a2 == 99 && a3 == 2) {
          cv.rotate180(x1, y1, x2, y2);
        } else if (a2 == 99 && a3 == 3) {
          cv.rotate270(x1, y1, x2, y2);
        }
        break;
      }
      case STROKETYPE.STRAIGHT: {
        this.setBodyStraight(stroke, x1, y1, x2, y2);
        if(a3 == ENDTYPE.TURN_LEFT) {
          let dir12 = get_dir(x2 - x1, y2 - y1);
          this.setTailHookLeft(stroke, x2, y2, dir12);
        }
        break;
      }
      case STROKETYPE.CURVE:
      case 12: { // XXX What is stroke type of 12?
        this.setBodyCurve(stroke, x1, y1, x2, y2, x3, y3);
        let dir23 = get_dir(x3 - x2, y3 - y2);
        if(a3 == ENDTYPE.TURN_LEFT) {
          this.setTailTurnLeft(stroke, x3, y3, dir23);
        }
        else if(a3 == ENDTYPE.TURN_UPWARDS){
          this.setTailTurnUpwards(stroke, x3, y3, dir23);
        }
        break;
      }
      case STROKETYPE.BENDING: {
        this.setBodyBending(stroke, x1, y1, x2, y2, x3, y3);
        let dir23 = get_dir(x3 - x2, y3 - y2);
        if(a3 == ENDTYPE.TURN_UPWARDS) {
          this.setTailTurnUpwards(stroke, x3, y3, dir23);
        }
        break;
      }
      case STROKETYPE.BEZIER:
        this.setBodyBezier(stroke, x1, y1, x2, y2, x3, y3, x4, y4);
        if(a3 == ENDTYPE.TURN_UPWARDS){
          let dir34 = get_dir(x4 - x3, y4 - y3);
          this.setTailTurnUpwards(stroke, x4, y4, dir34);
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

    cv.addPolygon(stroke.toPolygon());
  }

  //============================================================================
  // Stroke drawing functions.
  //
  // The stroke (line) width is determined from this.kWidth.
  // The contents of body1 and body2 are wiped beforehand.
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
  setBodyBending(stroke, x1, y1, x2, y2, x3, y3) {
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
    let [tx1, ty1] = get_extended_dest(x2, y2, x1, y1, -this.kMage);
    let [tx2, ty2] = get_extended_dest(x2, y2, x3, y3, -this.kMage);

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
    body1.push({p: p.vec(-mag, 0), off: 2});
    body2.unshift({p: p.vec(mag, 0), off: 2});

    // Second middle segment.
    [middle_dir, middle_mag] = lineBendExpandParams(x2, y2, x3, y3, x4, y4);

    p.setpos(x3, y3);
    p.setdir(middle_dir);
    body1.push({p: p.vec(-mag, 0), off: 2});
    body2.unshift({p: p.vec(mag, 0), off: 2});

    // Ending segment.
    p.setpos(x4, y4);
    p.setdir(dir34);
    body1.push({p: p.vec(0, -half_width), off: 0});
    body2.unshift({p: p.vec(0, half_width), off: 0});
  }

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
  
  setTailHookLeft(stroke, x, y, dir) {

  }

  setTailHookUpwards(stroke, x, y, dir) {

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

    // Make sure interp_rad is pointing to the right of rad12 by flipping
    // 180 degrees if necessary.
    if (rad12 < rad23) {
      middle_rad += Math.PI;
      middle_rad %= 2 * Math.PI;
    }

    let middle_dir = rad_to_dir(middle_rad);
    let half_angle = Math.abs(rad23 - rad12) * 0.5;
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
    body1.push({p: p.vec(-middle_mag, 0), off: 1});
    body2.unshift({p: p.vec(middle_mag, 0), off: 1});

    // Ending segment.
    p.setpos(x3, y3);
    p.setdir(dir23);
    body1.push({p: p.vec(0, -half_width), off: 0});
    body2.unshift({p: p.vec(0, half_width), off: 0});
  }
  
  //----------------------------------------------------------------------------
  // Misc (to delete).

  gothicDrawCurve(x1, y1, x2, y2, x3, y3, ta1, ta2, cv) {
    // XXX ta1 and ta2 are unused here, was this intentional?
    var a1, a2;
    if (a1 % 10 == 2) {
      let [x1ext, y1ext] = get_extended_dest_wrong(x1, y1, x2, y2, this.kWidth);
      x1 = x1ext; y1 = y1ext;
    } else if (a1 % 10 == 3) {
      let [x1ext, y1ext] = get_extended_dest_wrong(x1, y1, x2, y2, this.kWidth * this.kKakato);
      x1 = x1ext; y1 = y1ext;
    }
    if (a2 % 10 == 2) {
      let [x2ext, y2ext] = get_extended_dest_wrong(x3, y3, x2, y2, this.kWidth);
      x3 = x2ext; y3 = y2ext;
    } else if (a2 % 10 == 3) {
      let [x2ext, y2ext] = get_extended_dest_wrong(x3, y3, x2, y2, this.kWidth * this.kKakato);
      x3 = x2ext; y3 = y2ext;
    }
    cv.drawQBezier(x1, y1, x2, y2, x3, y3, (t) => { return this.kWidth; }, t => 0, 1000 / this.kRate);
  }

  gothicDrawLine(tx1, ty1, tx2, ty2, ta2, ta3, cv) {
    var x1 = tx1;
    var y1 = ty1;
    var x2 = tx2;
    var y2 = ty2;
    // STARTTYPE: CONNECTING_H, UPPER_LEFT_CORNER, UPPER_RIGHT_CORNER, CONNECTING_V.
    if (ta2 % 10 == 2) {
      let [x1ext, y1ext] = get_extended_dest(tx1, ty1, tx2, ty2, this.kWidth);
      x1 = x1ext; y1 = y1ext;
    // XXX Which start types end with 3?
    } else if (ta2 % 10 == 3) {
      let [x1ext, y1ext] = get_extended_dest(tx1, ty1, tx2, ty2, this.kWidth * this.kKakato);
      x1 = x1ext; y1 = y1ext;
    }
    // ENDTYPE: CONNECTING_H, CONNECTING_V.
    if (ta3 % 10 == 2) {
      let [x2ext, y2ext] = get_extended_dest(tx2, ty2, tx1, ty1, this.kWidth);
      x2 = x2ext; y2 = y2ext;
    // ENDTYPE: LOWER_LEFT_CORNER, LOWER_RIGHT_CORNER, LOWER_LEFT_ZH_OLD, LOWER_LEFT_ZH_NEW.
    } else if (ta3 % 10 == 3) {
      let [x2ext, y2ext] = get_extended_dest(tx2, ty2, tx1, ty1, this.kWidth * this.kKakato);
      x2 = x2ext; y2 = y2ext;
    }
    cv.drawLine(x1, y1, x2, y2, this.kWidth);
  }
}
