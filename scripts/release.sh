#!/bin/sh -e
# Stamp a release version everywhere it lives, then sanity-check the tree.
#
#   scripts/release.sh 2.40.0
#
# GitHub Pages caches every file independently for ten minutes, so a release
# must move all its version stamps together or a visitor can pair fresh JS
# with a stale add-on or mask — the half-deploy class that main.js documents
# as having "cost hours". This script is the reason that bump can't be missed:
# it rewrites every ?v= import in main.js, every ?v= asset suffix and V const
# in the add-ons, and the exported VERSION, then fails loudly on anything that
# would ride outside the scheme.

V="$1"
case "$V" in
  [0-9]*.[0-9]*.[0-9]*) ;;
  *) echo "usage: scripts/release.sh <x.y.z>" >&2; exit 1 ;;
esac

cd "$(dirname "$0")/.."

# Every addon import in main.js must carry a version, or it rides the cache.
if grep -E "^import +'\./addons/[^?']+';" main.js >/dev/null; then
  echo "release: main.js has an addon import with no ?v= — add one first:" >&2
  grep -nE "^import +'\./addons/[^?']+';" main.js >&2
  exit 1
fi

sed -i '' -E "s/\?v=[0-9]+\.[0-9]+\.[0-9]+/?v=$V/g" main.js addons/*.js
sed -i '' -E "s/VERSION = '[0-9.]+'/VERSION = '$V'/" main.js
sed -i '' -E "s/^const V = '[0-9.]+';/const V = '$V';/" addons/*.js

# util.js's exports are frozen — per-file cache skew breaks the module graph
# if its surface changes (see README). Catch it before it ships.
if ! git diff --quiet -- lib/util.js; then
  echo "release: lib/util.js changed — its export surface is frozen (README)." >&2
  exit 1
fi

echo "release: stamped $V"
grep -c "?v=$V" main.js | sed 's/^/  main.js imports: /'
grep -l "const V = '$V'" addons/*.js | sed 's/^/  asset-versioned: /'
