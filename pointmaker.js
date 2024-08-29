import { DIR_POSX } from "./util.js";

/**
 * A helpful tool to create new points given a starting point and direction.
 * The dir passed to the constructor (e.g. get_dir(x2 - x1, y2 - y1))
 * represents the direction of new first basis vector (x direction), and the
 * second basis vector (y direction) is determined from such.
 */
export class PointMaker {
  constructor(x, y, dir, scale) {
    this.x = x;
    this.y = y;
    this.dir = dir;
    this.scale = scale;
    if(!scale) {
      this.scale = 1;
    }
    if(!dir) {
    this.dir = DIR_POSX;//positive x
    }
  }

  setpos(x, y) {
    this.x = x;
    this.y = y;
  }

  setdir(dir) {
    this.dir = dir;
  }

  setscale(scale) {
    this.scale = scale;
  }

  vec(x, y) { // void
    return [this.x + this.scale*this.dir.cos*x - this.scale*this.dir.sin*y,
            this.y + this.scale*this.dir.sin*x + this.scale*this.dir.cos*y]
  }
}
