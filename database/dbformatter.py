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
Only the stylized variants such as italic, full/half width, sans, etc...
"""
KEEP_STYLIZED_VARIANTS = False

"""
Removes entries that are just aliases for another character, and substitutes
other characters that reference this accordingly.

Enabling this significantly reduces the number of entries saved.
"""
REMOVE_ALIASES = False

"""
Keep "-var-###" and "-itaiji-###" entries.
"""
KEEP_CHARACTER_VARIANTS = False

"""
Gets rid of character versions in character references. If this is enabled it is
assumed you are using the 'newest-only' dump file.
"""
NEWEST_ONLY = True

#===============================================================================
# Globals.
#===============================================================================

"""
Associates a character IDS with the related character and stroke data.
"""
entries = {}

"""
Filtered entries to keep.
"""
keep = []

"""
Dependencies of entries to keep.
"""
keep_deps = {}

"""
Holds characters that are aliases for other characters.
"""
aliases = {}

"""
For profiling.
"""
cur_time = 0

#===============================================================================
# Helper functions.
#===============================================================================

"""
Given an entry add all dependencies to dct.
"""
def add_dependencies(entry, entries, dct):
    try:
        strokes = entries[entry][1].split('$')
    except:
        return

    # NOTE: only add to dct once we have verified it is a valid glyph.
    dct[entry] = True

    for stroke in strokes:
        if stroke[0:2] == '99':
            dependency = stroke.split(':')[7]
            # Some broken characters have circular dependencies.
            if dependency not in dct:
                add_dependencies(dependency, entries, dct)

"""
Given an entry and a dict of aliases, find the root entry that is not an alias.
"""
def get_root(entry, aliases):
    visited = [entry]
    while entry in aliases:
        entry = aliases[entry]

        # Handle circular references.
        if entry in visited:
            break
        visited.append(entry)

    return entry

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
            if re.search('99', entries[entry][1]):
                continue

        if 'cjk' in config['filters']:
                    # CJK Unified Ideographs.
            if not ((entry > 'u4e00' and entry < 'u9fff') or
                    # Extention A.
                    (entry > 'u3400' and entry < 'u4dbf') or
                    # Extention B and so on.
                    (entry > 'u20000' and entry < 'u2a6df') or
                    (entry > 'u2a700' and entry < 'u2b73f') or
                    (entry > 'u2b740' and entry < 'u2b81f') or
                    (entry > 'u2b820' and entry < 'u2ceaf') or
                    (entry > 'u2ceb0' and entry < 'u2ebef') or
                    (entry > 'u30000' and entry < 'u3134f') or
                    # Extention H.
                    (entry > 'u31350' and entry < 'u323af') or
                    # Compatibility Ideographs.
                    (entry > 'uf900' and entry < 'ufaff') or
                    # Compatibility Ideographs Supplement.
                    (entry > 'u2f800' and entry < 'u2fa1f')):
                continue

            if re.search('-u', entry):
                continue

        if not KEEP_CHARACTER_VARIANTS:
            if re.search('(-var|-itaiji)', entry):
                continue

        if 'region' in config:
            """
            Remove all regional variant characters (ending in -j, -g, ...), the
            target regional variant will be included back later.
            """
            if re.search('-[a-z]{1,2}$', entry):
                continue

        if not KEEP_STYLIZED_VARIANTS:
            if re.search('(italic|sans|width)', entry):
                continue

        keep.append(entry)

if 'keep-chars' in config:
    for entry in config['keep-chars']:
        if entry in entries:
            keep.append(entry)

#-------------------------------------------------------------------------------
# Set regional variants in glyph inclusions.

if 'region' in config:
    print('Done! (' + str(round(time.time() - cur_time, 3)) + ') seconds')
    cur_time = time.time()
    print('Setting region...')

    for entry in entries:
        strokes = entries[entry][1].split('$')

        for s in range(len(strokes)):
            tokens = strokes[s].split(':')

            if tokens[0] == '99':
                glyph = tokens[7]

                if re.search('-[a-z]{1,2}$', glyph):
                    """
                    Regional variant found. Check if the target variant exists
                    and change it to that.
                    """
                    new_glyph = glyph.split('-')[0] + '-' + config['region']

                    if new_glyph in entries:
                        tokens[7] = new_glyph

            strokes[s] = ':'.join(tokens)
        entries[entry][1] = '$'.join(strokes)

#-------------------------------------------------------------------------------
# Remove aliases if needed (pt 1).

if REMOVE_ALIASES:
    print('Done! (' + str(round(time.time() - cur_time, 3)) + ' seconds)')
    cur_time = time.time()
    print('Removing aliases (pt 1)...')

    # TODO: Apparently it removes u8c79??
    for entry in keep:
        stroke = entries[entry][1]
        if stroke.count('$') != 0:
            continue

        split = stroke.split(':')

        if split[0] != '99':
            continue

        aliases[entry] = get_root(split[7], aliases)

new_keep = []
for entry in keep:
    if entry not in aliases:
        new_keep.append(entry)
keep = new_keep

#-------------------------------------------------------------------------------
# Build dependencies.

print('Done! (' + str(round(time.time() - cur_time, 3)) + ' seconds)')
cur_time = time.time()
print('Building dependencies...')

for entry in keep:
    add_dependencies(entry, entries, keep_deps)

#-------------------------------------------------------------------------------
# Remove aliases if needed (pt 2).

"""
if REMOVE_ALIASES:
    print('Done! (' + str(round(time.time() - cur_time, 3)) + ' seconds)')
    cur_time = time.time()
    print('Removing aliases (pt 2)...')

    for entry in keep_deps:
        if entry in aliases:
            keep_deps[entry] = False
        else:
            strokes = entries[entry][1].split('$')

            # Remove alias from stroke data.
            for stroke in strokes:
                split = stroke.split(':')

                if split[0] == '99':
                    if split[7] in aliases:
                        re.sub(split[7], get_root(split[7], aliases), entries[entry][1])
"""

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

        for entry in keep_deps:
            if keep_deps[entry] == False:
                continue

            data = entries[entry]
            if 'related-char' in config:
                if config['related-char'] == False:
                    writer.writerow([entry, data[1]])
                else:
                    writer.writerow([entry, data[0], data[1]])
            else:
                writer.writerow([entry, data[0], data[1]])

print('Done! (' + str(round(time.time() - cur_time, 3)) + ' seconds)')

