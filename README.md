# 晴日脑力花园 · Mind Garden

A bilingual, public entrance to eight games. Buildless HTML, CSS and JavaScript, hosted on GitHub Pages at https://liuyanstone.github.io/mind-garden/.

The collection includes Dream Jigsaw, Bunny Compass, Find the Path, Daily Sudoku, Koi Pond, Coastal Dash Object Garden and Bunny Box Garden. Each card opens the original public game in a full-page iframe with a persistent return button and a standalone link. Games remain in their existing repositories, so future game updates automatically appear here.

Existing game URLs and localStorage keys are preserved. Scores remain local to the same browser/device and the same GitHub Pages origin. The hub stores only language and last-played game. It does not aggregate scores or upload personal information. Returning home retains the current frame; switching games replaces it. Existing game pause/checkpoint hooks are called before leaving a frame. Unsaved in-progress play follows each game's existing behavior.

## Preview and checks

Serve this directory with any static HTTP server. Run `node check.mjs` to check collection configuration, bilingual completeness and safe route behavior. No build step, account, installation or external library is needed.

Original SVG illustrations are in art.mjs. Game content remains in its respective repository. All game links are restricted to the eight known liuyanstone.github.io roots.

Fruit Garden (`fruit-garden`) adds bilingual random match-3 challenges: three difficulties, six goal types, specials and boosters. The hub now contains nine games.

Coastal Treasures (`coastal-treasures`) is the tenth game: two randomized daily beaches, independent non-repeat memory runs, 64 designs per beach and locally saved daily progress.

The `coastal-treasures` URL now hosts Little Treasures / 拾光小天地: Spring Garden replaces Twilight Shore, with 64 garden-only flower, plant and toy designs, fully separate from Sunlit Cove. Existing links and language keys remain valid.

FreeCell / 空当接龙 (`freecell`) is the eleventh game and the first one hosted inside this repository, at `/mind-garden/freecell/`. It uses the classic numbered deals (1–1,000,000), unlimited undo, hints, automatic safe moves home, tap or drag controls, and saves the game in progress and personal stats in this browser. Its language key is `freecell-language`.

Garden Rails / 花园小火车 (`garden-rails`) is the twelfth game, also hosted here at `/mind-garden/garden-rails/`. In 90-second rounds, colourful trains leave a tunnel and the player flips switches to route each one to the house of its colour (each colour also has its own symbol). Twelve levels add colours, trains and speed; a new branching track is generated every round. The next level is the average rating of the last three rounds (level played, nudged by accuracy), and the first round of each day starts at a random level near the player's usual one. History stays in this browser.
