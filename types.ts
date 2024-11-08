
// KAGE data for a single stroke represented as a string e.g. "1:20:50:..."
export type KAGEString = string;
// KAGE data for a single stroke represented as an array e.g. [1, 20, 50, ...]
export type KAGEData = number[];

export type Point = [number, number];
// Only linear through cubic Bezier curves are supported.
export type Curve = 
  | [Point, Point]
  | [Point, Point, Point]
  | [Point, Point, Point, Point];
export type Path = Curve[];

