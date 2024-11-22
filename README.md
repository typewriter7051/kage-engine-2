# kage-engine-2

An experimental refactor of the classic KAGE engine used for rendering kanji glyphs given character data.

# Structure

Here is a list of classes and their roles:

- Bezier
    - Holds useful helper functions when dealing with curves.
- Buhin
    - Loads dump file or any other kind of data file.
    - Breaks down stroke.
- Font
    - Implements converting stroke data into vector paths and eventually SVG.
- Kage
    - Middle man between font and buhin.
    - Converts characters to IDS.
- Path
    - Fundamental unit for holding strokes.
    - Holds array of Bezier curves and a lot of helper functions.

Here is the process:

- Database is preprocessed depending on font and use case.
- Kage is given an input character/composition and converts to IDS.
- Kage uses Buhin to decompose and convert the IDS into stroke data, or generates the data if missing.
- The font takes in the converted stroke data and creates paths.
- Either the font or Kage converts the paths into an SVG.

## Database Preprocessing

When using the KAGE engine to generate glyphs on demand, it's unlikely that every single glyph needs to be loaded into memory. Depending on the regional variants and use cases we can reduce the database to include only what is necessary. Additionally there are some overrides that need to be made for each font, for example "氵" should have different stroke data for serif vs sans-serif fonts.

There are two stages of database preprocessing. The first stage is to create a reduced database file, the second stage is to apply font-specific overrides at runtime.

## Converting to IDS

Just convert the character to Unicode, simple enough.

## IDS to Stroke Data

Uses Buhin to look up the IDS, if the stroke data already exists use that. Otherwise the character will need to have the data generated.

### Generating Character Data

The character will first be recursively decomposed (e.g. 好 -> ⿰女子) until all components have existing data, then the components will be merged together from the bottom up.

When merging characters, first the right version of each component must be used depending on where it appears in the merged character. Then the proportions must be adjusted appropriately. Each component has a maximum width/height, most of the time that will be the entire space but for radicals (艹, 阝, etc) that may be less. Components also have a compressibility ratio depending on the strokes that compose it. Start each component at their maximum width/height, then use a binary search to adjust their proportions until the closest strokes in each component are a certain distance from each other.

#### Compressibility Ratio in Depth

Calculating a component's compressibility is not trivial. There is also the need to distinguish vertical compressibility and horizontal compressiblity, for example 八 is vertically compressible (只), but not so much horizontally (叭). The compressibility of a character also changes after being merged into another character (呮).

One solution to this is to use a spring-like model, where the "force" exerted by a character depends on its stiffness and how much it is already compressed in that direction. Then we can say a merged character is "balanced" when the forces exerted by each component are at equilibrium. The spring force should increase by a constant multiple as the size proportionally shrinks, this way a character can never become inverted if the opposing force is too much. Define the compression ratio of a character as the ratio of its current size to its original size. Compression ratio is also separated into vertical and horizontal components, but for convenience we will not mention those individually. Then the force exerted by a character in a certain direction is calculated as
$$\text{Force exerted} = (\frac{1}{(\text{compression ratio})} - 1) * (\text{stiffness multiplier})$$
such that a character with stiffness 1 exibits a force of 0 when not being compressed, a force of 1 when compressed halfway, 2 when compressed to a quarter of the size, and so on.

When merging a character, the force exerted will be the sum of the force exerted by all of its sub-components. For example the force exerted by 僉 is the sum of the force of 亼吅从.

## Stroke Data to Paths

This part is up to the font to implement.

## Paths to SVG

Depending on the font, if the generated paths are open then the width and bend type are adjusted here.

# TODO

Since the school semester has started I haven't got as much time as I would like to work on this. I hope to continue this project in the near future.

- [x] Make web Gothic.
- [x] Redo code structure to make it easier to create new fonts.
- Convert codebase to typescript.
- Implement a serif font that uses ``Path``.

