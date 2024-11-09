import { Bezier } from "../../curve/bezier";
import { Font } from "../../font";
import { STROKETYPE, STARTTYPE, ENDTYPE } from "../../stroketype";
//import { get_dir, moved_point, get_extended_dest } from "../../util";
import { PathOp } from "../../curve/path";
import { PointOp } from "../../point";
import { Curve, KAGEData, KAGEString, Path, Point } from "../../types";

export class GothicWeb implements Font {
  kWidth: number;
  kMage: number;
  lineCap: string;
  lineJoin: string;
  precision: number;

  constructor(size) {
    /**
     * kWidth determines the stroke (line/curve) width.
     * kMage determines the turn size, used for hooks and bends.
     */
    this.kWidth = size;
    this.kMage = 10 + size * 0.5;

    this.lineCap = "square";
    this.lineJoin = "miter";
    this.precision = 2;
  }

  /**
   * Takes an array of stroke data and returns an array of paths.
   */
  getPaths(strokes: KAGEData[]): Path[] {
    let skeletons: Path[] = [];
    for (let stroke of strokes)
      skeletons.push(this.processSkeleton(stroke));

    return this.connectSkeletons(skeletons);
  }

  /**
   * Connects paths together within skeletons.
   */
  connectSkeletons(skeletons: Path[]): Path[] {
    for (let i = 0; i < skeletons.length; i++) {
      for (let j = i + 1; j < skeletons.length; j++) {
        if (PathOp.connected(skeletons[i], skeletons[j])) {
          skeletons[i] = PathOp.connect(skeletons[i], skeletons[j]);
          skeletons.splice(j, 1);
          j--;
        }
      }
    }

    return skeletons;
  }

  /**
   * Convert a KAGE-styled stroke into a Bezier skeleton with some extra
   * font-specific details.
   */
  processSkeleton(stroke: KAGEData): Path {
    // Move the endpoint down if the stroke end is a bottom corner.
    if (stroke[0] % 100 == STROKETYPE.STRAIGHT && stroke[2] % 10 == 3) {
      stroke[6] += this.kWidth * 1;
    }

    let skeleton: Path = this.baseSkeleton(stroke);

    switch (stroke[2]) {
      case ENDTYPE.TURN_LEFT: {

        /* Move end point. */

        let end_point = PathOp.getLastPoint(skeleton);
        let txy: Point = [0, 0];
        PointOp.moveTowards(
          txy,
          end_point,
          PathOp.getKthLastPoint(skeleton, 2), // Second last point.
          this.kMage
        );
        PathOp.setLastPoint(skeleton, txy);

        /* Add new curve. */

        skeleton.push([
          txy,
          end_point,
          [end_point[0] - 1.25 * this.kMage, end_point[1]]
        ]);
        break;
      }
      case ENDTYPE.TURN_UPWARDS: {

        /* Move end point. */

        let end_point = PathOp.getLastPoint(skeleton);
        let txy: Point = [0, 0];
        PointOp.moveTowards(
          txy,
          end_point,
          PathOp.getKthLastPoint(skeleton, 2), // Second last point.
          this.kMage
        );
        PathOp.setLastPoint(skeleton, txy);

        /* Replace last curve. */

        skeleton.push([
          txy,
          end_point,
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
  baseSkeleton(stroke: KAGEData): Path {
    if (typeof stroke === "undefined" || stroke == null) {
      return null;
    }

    let skeleton: Path = [];
    let p1: Point = [stroke[3], stroke[4]];
    let p2: Point = [stroke[5], stroke[6]];
    let p3: Point = [stroke[7], stroke[8]];
    let p4: Point = [stroke[9], stroke[10]];

    switch (stroke[0]) {
      case STROKETYPE.STRAIGHT: {
        skeleton.push([p1, p2]);
        break;
      }
      case STROKETYPE.CURVE: {
        skeleton.push([p1, p2, p3]);
        break;
      }
      case STROKETYPE.BENDING:
      case STROKETYPE.BENDING_ROUND: {
        let bend_amt = 1;
        if (stroke[0] == STROKETYPE.BENDING_ROUND)
          bend_amt = 5;

        // Create points around x2, y2 for the curve.
        let t1: Point = [0, 0];
        let t2: Point = [0, 0];
        PointOp.moveTowards(t1, p1, p2, this.kMage * bend_amt);
        PointOp.moveTowards(t2, p3, p2, this.kMage * bend_amt);

        skeleton.push([p1, t1]);
        skeleton.push([t1, p2, t2]);
        skeleton.push([t2, p3]);
        break;
      }
      case STROKETYPE.BEZIER: {
        skeleton.push([p1, p2, p3, p4]);
        break;
      }
      case STROKETYPE.VCURVE: {
        skeleton.push([p1, p2]);
        skeleton.push([p2, p3, p4]);
        break;
      }
      default:
        let str: string = "Invalid stroke type: " + stroke[0].toString();
        str += "\nstroke: " + JSON.stringify(stroke);
        throw new Error(str);
        return null;
    }

    return skeleton;
  }

  generateSVG(paths: Path[]): string {
    let buffer = "";
    buffer += "<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" version=\"1.1";
    buffer += "\" baseProfile=\"full";
    buffer += "\" viewBox=\"0 0 200 200";
    buffer += "\" width=\"200\" height=\"200";
    buffer += "\" stroke-linecap=\"" + this.lineCap;
    buffer += "\" stroke-linejoin=\"" + this.lineJoin;
    buffer += "\" fill=\"" + "transparent";
    buffer += "\" stroke=\"" + "black";
    buffer += "\" >\n";

    for(let path of paths) {
      buffer += "<path d=\"";
      buffer += PathOp.toSVGSequence(path, this.precision);
      buffer += "\" stroke-width=\"" + this.kWidth;
      buffer += "\" />\n";
    }

    buffer += "</svg>\n";

    return buffer;
  }
}
