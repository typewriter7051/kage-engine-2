import csv
import json
import pickle
import re
import time

#===============================================================================
# Settings.
#===============================================================================

"""
Path to your config file.
"""
CONFIG_FILE_PATH = './dbconfig1.json'
with open(CONFIG_FILE_PATH, 'r') as file:
    config = json.load(file)

if 'input' not in config:
    raise KeyError('input must be defined!')
if 'output' not in config:
    raise KeyError('output must be defined!')

INPUT_FILE_PATH = config['input']
OUTPUT_FILE_PATH = config['output']

"""
Gets rid of character versions in character references. If this is enabled it is
assumed you are using the 'newest-only' dump file.
"""
NEWEST_ONLY = True

#===============================================================================
# Globals.
#===============================================================================

"""
Associates a glyph IDS with the related character and stroke data.
"""
entries = {}

"""
Filtered entries to keep. Holds a list of char names from entries.
"""
keep = []

"""
Dependencies of entries to keep. Holds boolean value for entries to keep.
"""
keep_with_deps = {}

"""
Holds the names of entries that have been sorted already. This is used when
generating a topological sort.
"""
already_sorted = {}

"""
Holds a topologically sorted list of entries.
"""
sorted_entries = []

"""
For profiling.
"""
cur_time = 0

#===============================================================================
# Helper functions.
#===============================================================================

def get_dependencies(stroke_data):
    """
    Assuming the stroke data is valid, return a list of dependency glyphs.
    """
    dependencies = []
    strokes = stroke_data.split('$')

    for stroke in strokes:
        if stroke[0:2] == '99':
            dependencies.append(stroke.split(':')[7])

    return dependencies

def add_dependencies(entry, entries, dct):
    """
    Given an entry add all dependencies to dct.
    """
    # Test if glyph is valid.
    try:
        strokes = entries[entry][1].split('$')
    except:
        return

    # NOTE: only add to dct once we have verified it is a valid glyph.
    dct[entry] = True

    for dependency in get_dependencies(entries[entry][1]):
        # Some broken characters have circular dependencies.
        if dependency not in dct:
            add_dependencies(dependency, entries, dct)

#===============================================================================
# Main.
#===============================================================================

#-------------------------------------------------------------------------------
# Read file.

print('Reading entries...')
cur_time = time.time()

if INPUT_FILE_PATH[-4:] == '.pkl':
    with open(INPUT_FILE_PATH, 'rb') as infile:
        entries = pickle.load(infile)
else:
    # Assuming dump_newest_only.txt doesn't change their format...
    with open(INPUT_FILE_PATH, 'r') as infile:
        for i, line in enumerate(infile):
            if i == 0 or i == 1:
                continue

            """
            Assuming the file format has not changed, tokens should be
            ['name', '|', 'related char', '|', 'data']
            """
            tokens = line.split()
            if len(tokens) != 5:
                continue

            if NEWEST_ONLY:
                tokens[4] = re.sub('@\\d+', '', tokens[4])

            entries[tokens[0]] = [tokens[2], tokens[4]]

#-------------------------------------------------------------------------------
# Filter entries.

print('Done! (' + str(round(time.time() - cur_time, 3)) + ') seconds')
cur_time = time.time()
print('Filtering entries...')

if 'filters' not in config:
    keep = list(entries.keys())
else:
    for entry in entries:
        if 'none' in config['filters']:
            break

        if 'fundamental' in config['filters']:
            strokes = entries[entry][1].split('$')
            found_reference = False

            for stroke in strokes:
                if stroke[0:2] == '99':
                    found_reference = True
                    break

            if (found_reference):
                continue

        if 'cjk' in config['filters']:
                    # CJK Unified Ideographs.
            if not ((entry > 'u4e00' and entry < 'u9fff') or
                    # Extension A.
                    (entry > 'u3400' and entry < 'u4dbf') or
                    # Extension B.
                    (entry > 'u20000' and entry < 'u2a6df') or
                    # Extension C.
                    (entry > 'u2a700' and entry < 'u2b73f') or
                    # Extension D.
                    (entry > 'u2b740' and entry < 'u2b81f') or
                    # Extension E.
                    (entry > 'u2b820' and entry < 'u2ceaf') or
                    # Extension F.
                    (entry > 'u2ceb0' and entry < 'u2ebef') or
                    # Extension G.
                    (entry > 'u30000' and entry < 'u3134f') or
                    # Extension H.
                    (entry > 'u31350' and entry < 'u323af') or
                    # Compatibility Ideographs.
                    (entry > 'uf900' and entry < 'ufaff') or
                    # Compatibility Ideographs Supplement.
                    (entry > 'u2f800' and entry < 'u2fa1f')):
                continue

            # No compound characters (u2ff0-u4eba-u961d), itaijis (-itaiji-001),
            # or variants (-var-001), but keep regional variants (u6790-j).
            if entry.count('-') > 1:
                continue

        if 'region' in config:
            """
            Remove all regional variant characters (ending in -j, -g, ...), the
            target regional variant will be included back later.
            """
            if re.search('-[a-z]{1,2}$', entry):
                continue

        if 'keep-stylized-variants' in config:
            if config['keep-stylized-variants'] == False:
                if re.search('(italic|sans|width)', entry):
                    continue

        keep.append(entry)

if 'keep-chars' in config:
    for entry in config['keep-chars']:
        if entry in entries:
            keep.append(entry)
        else:
            print("WARNING: entry " + entry + " not found. Skipping...")

#-------------------------------------------------------------------------------
# Build dependencies.

print('Done! (' + str(round(time.time() - cur_time, 3)) + ' seconds)')
cur_time = time.time()
print('Building dependencies...')

for entry in keep:
    add_dependencies(entry, entries, keep_with_deps)

# Use keep_with_deps instead.
del keep

#-------------------------------------------------------------------------------
# Topological sort.

print('Done! (' + str(round(time.time() - cur_time, 3)) + ' seconds)')
cur_time = time.time()
print('Creating topological sort...')

# already_sorted = {}
# sorted_entries = []

added = True

while added:
    """
    Iteratively add glyphs whose dependencies are satisfied until no more glyphs
    are added.
    """
    added = False

    for entry in keep_with_deps:
        if keep_with_deps[entry] == False:
            continue

        dependencies = get_dependencies(entries[entry][1])
        satisfied = True

        for dependency in dependencies:
            if dependency not in already_sorted:
                satisfied = False
                break

        if satisfied:
            already_sorted[entry] = True
            sorted_entries.append(entry)
            keep_with_deps[entry] = False
            added = True

# Use sorted_entries instead now.
del keep_with_deps
del already_sorted

#-------------------------------------------------------------------------------
# Write to file.

print('Done! (' + str(round(time.time() - cur_time, 3)) + ' seconds)')
cur_time = time.time()
print('Writing to file...')

with open(OUTPUT_FILE_PATH, 'w') as outfile:
    if OUTPUT_FILE_PATH[-4:] == '.pkl':
        with open(OUTPUT_FILE_PATH, 'wb') as outfile:
            pickle.dump(entries, outfile)
    else:
        writer = csv.writer(outfile)

        for entry in sorted_entries:
            data = entries[entry]
            if 'related-char' in config:
                if config['related-char'] == False:
                    writer.writerow([entry, data[1]])
                else:
                    writer.writerow([entry, data[0], data[1]])
            else:
                writer.writerow([entry, data[0], data[1]])

print('Done! (' + str(round(time.time() - cur_time, 3)) + ' seconds)')

