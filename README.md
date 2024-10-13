# kage-engine-2

A refactor of the classic KAGE engine used for rendering kanji glyphs given skeletal stroke data.

# Structure

Here is a list of classes and their roles:

- Bezier
    - Holds useful helper functions when dealing with curves
- Buhin
    - Breaks down stroke
- Export
    - Helper functions to convert paths to SVG or font data.
- Font
    - Implements converting buhin stroke data into vector paths and eventually SVG.
- Kage
    - Middle man between font and buhin.
    - Converts characters to IDS.
- Path
    - Fundamental unit for holding strokes.
    - Holds array of Bezier curves and a lot of helper functions.

Here is the process:

- Kage is given an input character/composition and converts to IDS.
- Kage uses Buhin to decompose and convert the IDS into stroke data.
- The font takes in the converted stroke data and creates paths.
- Either the font or Kage converts the paths into an SVG.

# TODO

Since the school semester has started I haven't got as much time as I would like to work on this. I hope to continue this project in the near future.

- [x] Make web Gothic.
- [x] Redo code structure to make it easier to create new fonts.
- Implement a serif font that uses ``Path``.

