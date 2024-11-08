import { Curve } from "../types.ts";

export class CurveOp {
  static toReversed(c: Curve): Curve {
    switch (c.length) {
      case 2: {
        return [c[1], c[0]];
      }
      case 3: {
        return [c[2], c[1], c[0]];
      }
      case 4: {
        return [c[3], c[2], c[1], c[0]];
      }
      default:
        throw new Error("Invalid curve!");
    }
  }
}
