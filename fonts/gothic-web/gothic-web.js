import { Bezier } from "../../bezier.js";
import { Font } from "../../font.js";
import { STROKETYPE, STARTTYPE, ENDTYPE } from "../../stroketype.js";
import { get_dir, moved_point, get_extended_dest } from "../../util.js";
import { Path } from "../../path.js";

export class GothicWeb extends Font {
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
   * Takes an array of stroke data and returns an SVG.
   */
  getPaths(strokes) {
    let skeletons = new Array();
    for (let stroke of strokes)
      skeletons.push(this.processSkeleton(stroke));

    //return this.connectSkeletons(skeletons);
    return skeletons;
  }

  connectSkeletons(skeletons) {
    for (let i = 0; i < skeletons.length; i++) {
      for (let j = 0; j < skeletons.length; j++) {
        if (i == j) continue;
        let start_point = skeletons[i].curves[0][0];
        let curve = skeletons.curves[j];
        let end_point = curve[curve.length - 1];

        if (start_point[0] == end_point[0] &&
            start_point[1] == end_point[1]) {
          skeletons[i].curves = skeletons[i].curves.concat(skeletons[j].curves);
          skeletons.splice(j, 1);
          j--;
          if (i > j) i--;
        }
      }
    }
  }

  /**
   * Convert a KAGE-styled stroke into a Bezier skeleton with some extra
   * font-specific details.
   */
  processSkeleton(stroke) {
    // Move the endpoint down if the stroke end is a bottom corner.
    if (stroke[0] % 100 == STROKETYPE.STRAIGHT && stroke[2] % 10 == 3) {
      stroke[6] += this.kWidth * 0.5 + 10;
    }

    let skeleton = this.baseSkeleton(stroke);

    switch (stroke[2]) {
      case ENDTYPE.TURN_LEFT: {

        /* Move end point. */

        let last_curve = skeleton.curves[skeleton.curves.length - 1];
        let end_point = last_curve[last_curve.length - 1];
        let [tx, ty] = moved_point(end_point[0], end_point[1], dir,
                                   -this.kMage);
        skeleton.curves[skeleton.curves.length - 1][last_curve.length - 1] = end_point;

        /* Add new curve. */

        skeleton.curves.push([
          [tx, ty],
          [end_point[0], end_point[1]],
          [end_point[0] - 1.25 * this.kMage, end_point[1]]
        ]);
        break;
      }
      case ENDTYPE.TURN_UPWARDS: {

        /* Move end point. */

        let last_curve = skeleton.curves[skeleton.curves.length - 1];
        let end_point = last_curve[last_curve.length - 1];
        let second_end_point = last_curve[last_curve.length - 2];
        let dir = get_dir(end_point[0] - second_end_point[0],
                          end_point[1] - second_end_point[1]);
        let [tx, ty] = moved_point(end_point[0], end_point[1], dir,
                                   -this.kMage);
        // Set the endpoint of the curve.
        skeleton.curves[skeleton.curves.length - 1][last_curve.length - 1] = end_point;

        /* Add new curve. */

        skeleton.curves.push([
          [tx, ty],
          [end_point[0], end_point[1]],
          [end_point[0], end_point[1] - 1.25 * this.kMage]
        ]);
        break;
      }
      default:
        // Do nothing.
        break;
    }

    return skeleton;
  }

  /**
   * Convert a KAGE-styled stroke into a basic Path skeleton.
   */
  baseSkeleton(stroke) {
    if (typeof stroke === "undefined" || stroke == null) {
      return null;
    }

    let skeleton = new Path();

    switch (stroke[0]) {
      case STROKETYPE.STRAIGHT: {
        skeleton.curves.push([
          [stroke[3], stroke[4]],
          [stroke[5], stroke[6]]
        ]);
        break;
      }
      case STROKETYPE.CURVE: {
        skeleton.curves.push([
          [stroke[3], stroke[4]],
          [stroke[5], stroke[6]],
          [stroke[7], stroke[8]]
        ]);
        break;
      }
      case STROKETYPE.BENDING:
      case STROKETYPE.BENDING_ROUND: {
        let bend_amt = 1;
        if (stroke[0] == STROKETYPE.BENDING_ROUND)
          bend_amt = 5;

        let x1 = stroke[3];
        let y1 = stroke[4];
        let x2 = stroke[5];
        let y2 = stroke[6];
        let x3 = stroke[7];
        let y3 = stroke[8];

        // Create points around x2, y2 for the curve.
        let [tx1, ty1] = get_extended_dest(x2, y2, x1, y1, -this.kMage * bend_amt);
        let [tx2, ty2] = get_extended_dest(x2, y2, x3, y3, -this.kMage * bend_amt);

        skeleton.curves.push([
          [x1, y1],
          [tx1, ty1]
        ]);
        skeleton.curves.push([
          [tx1, ty1],
          [x2, y2],
          [tx2, ty2]
        ]);
        skeleton.curves.push([
          [tx2, ty2],
          [x2, y2]
        ]);
        break;
      }
      case STROKETYPE.BEZIER: {
        skeleton.curves.push([
          [stroke[3], stroke[4]],
          [stroke[5], stroke[6]],
          [stroke[7], stroke[8]],
          [stroke[9], stroke[10]]
        ]);
        break;
      }
      case STROKETYPE.BEZIER: {
        skeleton.curves.push([
          [stroke[3], stroke[4]],
          [stroke[5], stroke[6]]
        ]);
        skeleton.curves.push([
          [stroke[5], stroke[6]],
          [stroke[7], stroke[8]],
          [stroke[9], stroke[10]]
        ]);
        break;
      }
      default:
        break;
        return null;
    }

    return skeleton;
  }

  generateSVG(paths) {
    let buffer = "";
    buffer += "<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" version=\"1.1\" baseProfile=\"full\" viewBox=\"0 0 200 200\" width=\"200\" height=\"200\">\n";

    for(let path of paths) {
      buffer += "<path d=\"";
      buffer += path.toSVGSequence();
      buffer += "\" stroke-width=\"" + this.kWidth;
      buffer += "\" line-cap=\"" + "round";
      buffer += "\" stroke-linejoin=\"" + "round";
      buffer += "\" fill=\"" + "transparent";
      buffer += "\" stroke=\"" + "black";
      buffer += "\" />\n";
    }

    buffer += "</svg>\n";

    return buffer;
  }
}
