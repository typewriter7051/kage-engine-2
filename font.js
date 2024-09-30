/**
 * Abstract font base class.
 *
 * @class Font
 */
export class Font {
  constructor() {
    if (this.constructor == Font) {
      throw new Error("Abstract class Font can't be instantiated.");
    }
  }

  /**
   * Takes in an array of string stroke data and returns an array of polygons.
   */
  getPolygons(strokesArray) {
    throw new Error("Function getPolygons() must be implemented.");
  }
}
