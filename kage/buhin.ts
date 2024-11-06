/**
 * This class stores stroke data from a dump file (usually dump.txt) and
 * provides helper functions to break down a component into fundamental
 * strokes.
 */
export class Buhin {
  hash;

  constructor() {
    this.hash = {};
  }

  set(name: string, data: string): void {
    this.hash[name] = data;
  }

  push(name: string, data: string): void {
    this.set(name, data);
  }

  search(name: string): string {
    if(this.hash[name])
      return this.hash[name];

    return ""; // no data
  }
}
