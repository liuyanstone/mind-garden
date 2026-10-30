# 晴日脑力花园 · Mind Garden

A bilingual, public entrance to eight games. Buildless HTML, CSS and JavaScript, hosted on GitHub Pages at https://liuyanstone.github.io/mind-garden/.

The collection includes Dream Jigsaw, Bunny Compass, Find the Path, Daily Sudoku, Koi Pond, Coastal Dash Object Garden and Bunny Box Garden. Each card opens the original public game in a full-page iframe with a persistent return button and a standalone link. Games remain in their existing repositories, so future game updates automatically appear here.

Existing game URLs and localStorage keys are preserved. Scores remain local to the same browser/device and the same GitHub Pages origin. The hub stores only language and last-played game. It does not aggregate scores or upload personal information. Returning home retains the current frame; switching games replaces it. Existing game pause/checkpoint hooks are called before leaving a frame. Unsaved in-progress play follows each game's existing behavior.

## Preview and checks

Serve this directory with any static HTTP server. Run `node check.mjs` to check collection configuration, bilingual completeness and safe route behavior. No build step, account, installation or external library is needed.

Original SVG illustrations are in art.mjs. Game content remains in its respective repository. All game links are restricted to the eight known liuyanstone.github.io roots.
