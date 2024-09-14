# kage-engine-2

A refactor of the classic KAGE engine used for rendering kanji glyphs given skeletal stroke data.

# What's new?

In the included fonts, strokes with hooks and other serifs were drawn separately creating rendering artifacts and more paths than necessary. This version adds a new ``Stroke`` class that stores each part of the stroke separately, then merges into a single path when needed. This allows each part of the stroke to be further edited multiple times before being drawn to the screen.

Once all the strokes have generated paths, the font engine takes another pass to properly connect separate strokes.

# TODO

Since the school semester has started I haven't got as much time as I would like to work on this. I hope to continue this project in the near future.

- Fix widened bezier curves in ``gothic2``.
- Clean up implementation in ``gothic2`` for drooping bottom corner strokes.
- Implement a serif font that uses ``Stroke``.
- Redo code structure to make it easier to create new fonts.

