# kage-engine-2

A refactor of the classic KAGE engine used for rendering kanji glyphs given skeletal stroke data.

# What's new?

In the included fonts, strokes with hooks and other serifs were drawn separately creating rendering artifacts and more paths than necessary. This version adds a new ``Stroke`` class that stores each part of the stroke separately, then merges into a single path when needed. This allows each part of the stroke to be further edited multiple times before being drawn to the screen.

Once all the strokes have generated paths, the font engine takes another pass to properly connect separate strokes.

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
- Stroke
    - Fundamental unit when making glyph
    - Holds a core and external path

Here is the process:

- Kage is given an input character/composition and converts to IDS.
- Kage uses Buhin to decompose and convert the IDS into stroke data.
- The font takes in the converted stroke data and creates paths.
- Either the font or Kage converts the paths into an SVG.

# TODO

Since the school semester has started I haven't got as much time as I would like to work on this. I hope to continue this project in the near future.

- Clean up implementation in ``gothic2`` for drooping bottom corner strokes.
- Make a ``WebGothic`` font.
- Implement a serif font that uses ``Stroke``.
- Redo code structure to make it easier to create new fonts.

