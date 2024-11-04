import csv
import re
import time

#===============================================================================
# Settings.
#===============================================================================

"""
Path to your dump files.
"""
INPUT_FILE_PATH = './dump_newest_only.txt'
OUTPUT_FILE_PATH = './dump_reduced.csv'

"""
Only keep the standard CJK Unified Ideographs.

Enabling this significantly reduces the number of entries saved.
"""
CJK_ONLY = True

"""
Only the stylized variants such as italic, full/half width, sans, etc...
"""
KEEP_STYLIZED_VARIANTS = False

"""
Regional variants such as Japan, Korea, Vietnam, etc...
"""
KEEP_REGIONAL_VARIANTS = False

"""
Removes entries that are just aliases for another character, and substitutes
other characters that reference this accordingly.

Enabling this significantly reduces the number of entries saved.
"""
REMOVE_ALIASES = True

"""
Keep "-var-###" and "-itaiji-###" entries.
"""
KEEP_CHARACTER_VARIANTS = False

"""
Keep the 'related character' entry, this is not needed if you are just
generating characters.
"""
KEEP_RELATED_CHAR = False

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

"""
First pass: simple entries that can be immediately removed without any
sort of reworking required.
"""
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

for entry in entries.keys():
    if CJK_ONLY:
                # CJK Unified Ideographs.
        if not ((entry > 'u4e00' and entry < 'u9fff') or
                # Extention A.
                #(entry > 'u3400' and entry < 'u4dbf') or
                # Extention B and so on.
                #(entry > 'u20000' and entry < 'u2a6df') or
                #(entry > 'u2a700' and entry < 'u2b73f') or
                #(entry > 'u2b740' and entry < 'u2b81f') or
                #(entry > 'u2b820' and entry < 'u2ceaf') or
                #(entry > 'u2ceb0' and entry < 'u2ebef') or
                #(entry > 'u30000' and entry < 'u3134f') or
                # Extention H.
                #(entry > 'u31350' and entry < 'u323af') or
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

    if not KEEP_REGIONAL_VARIANTS:
        if re.search('-[a-z]{1,2}$', entry):
            continue

    if not KEEP_STYLIZED_VARIANTS:
        if re.search('(italic|sans|width)', entry):
            continue

    keep.append(entry)

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

    for entry in keep_deps.keys():
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
    writer = csv.writer(outfile)

    for entry in keep_deps.keys():
        if keep_deps[entry] == False:
            continue

        data = entries[entry]
        if (KEEP_RELATED_CHAR):
            writer.writerow([entry, data[0], data[1]])
        else:
            writer.writerow([entry, data[1]])

print('Done! (' + str(round(time.time() - cur_time, 3)) + ' seconds)')

