# vanilla-t

Lightweight, modular translation library for vanilla JavaScript.
Zero external dependencies. Translations are plain JSON files loaded at runtime
in the browser and applied declaratively to the DOM.

## Features

- **Zero dependencies** — pure vanilla ES modules, no frameworks.
- **Declarative translations** — mark elements with `data-translate` for text and HTML attribute translation.
- **Dynamic updates** — optional `MutationObserver` translates nodes inserted after init.
- **Hierarchical detection** — `URL parameter` -> `localStorage` -> `navigator.language` -> fallback.
- **Smart loading** — async `fetch` with an in-memory cache to avoid repeated network calls.
- **Nested keys & interpolation** — dot notation (`header.title`) and variables (`{{name}}`).

## Installation

The package is not published to npm. Use it locally in one of these ways.

### Install from a local folder

```sh
npm install ../vanilla-t
```

```js
import { VanillaT } from 'vanilla-t';
```

### Install from a Git repository

```sh
npm install https://github.com/your-user/vanilla-t.git
```

### Native ES modules in the browser

Copy the `src/` folder into your project and import the entry point directly:

```js
import { VanillaT } from './src/index.js';
```

ES modules require a server (they don't work over `file://`). If you serve your
project over HTTP this works as-is with no build step.

> Once you publish the package to npm, `npm install vanilla-t` works as usual.

## Quick start

### 1. Language files

Create one JSON file per language. Keys support nesting and interpolation
variables wrapped in `{{name}}`.

`lang/es.json`
```json
{
  "header": { "title": "Bienvenido" },
  "forms": { "search": "Buscar..." },
  "messages": { "greeting": "Hola, {{name}}!" }
}
```

`lang/en.json`
```json
{
  "header": { "title": "Welcome" },
  "forms": { "search": "Search..." },
  "messages": { "greeting": "Hello, {{name}}!" }
}
```

### 2. Mark your HTML

A plain key translates the element's **text content**:

```html
<h1 data-translate="header.title"></h1>
<p data-translate="messages.greeting"></p>
```

An `attr:key` instruction translates an **HTML attribute** instead:

```html
<input data-translate="placeholder:forms.search" placeholder="">
```

You can combine several instructions separated by spaces:

```html
<input data-translate="placeholder:forms.search title:forms.search">
```

### 3. Initialize

```js
import { VanillaT } from './src/index.js';

const translator = new VanillaT({
  basePath: './lang', // where the *.json files live
  fallbackLang: 'en'
});

await translator.init();
```

Place the init call right before the closing `</body>` (or defer it) so the
page paints already translated — the zero-flicker approach.

## Public API

### `new VanillaT([userConfig])`

Creates a translator instance. `userConfig` is deep-merged over the
[defaults](#configuration).

### `async init()`

Detects the active language, loads its translations and translates the DOM.
Returns the instance so it can be chained.

### `t(key, [variables]) -> String`

Returns the translation for a dot-notated key, with optional
interpolation variables. Returns the key itself when no translation exists.

```js
translator.t('messages.greeting', { name: 'Ada' }); // "Hello, Ada!"
```

### `async setLanguage(lang) -> VanillaT`

Switches the active language: persists the preference to `localStorage`,
reloads the translations, re-translates the DOM and fires the
`onLanguageChange` callback.

```js
await translator.setLanguage('es');
console.log(translator.currentLang); // "es"
```

### `currentLang -> String`

Getter returning the currently active, normalized language code.

### `destroy()`

Disconnects the `MutationObserver` so dynamically inserted elements stop being
translated automatically.

## Configuration

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `fallbackLang` | `string` | `'es'` | Language used when no source yields a result. |
| `basePath` | `string` | `'./langs'` | Base path where language files are located. |
| `detectionOrder` | `string[]` | `['url','localStorage','navigator']` | Ordered detection sources. |
| `storageKey` | `string` | `'data-lang'` | `localStorage` key for the persisted preference. |
| `urlParam` | `string` | `'lang'` | URL query parameter holding the language. |
| `attribute` | `string` | `'data-translate'` | HTML attribute that marks translatable elements. |
| `useMutationObserver` | `boolean` | `false` | Translate nodes added to the DOM after init. |
| `cache` | `boolean` | `true` | Cache loaded JSON files in memory. |
| `onLanguageChange` | `function` | `() => {}` | Called with the new language after a change. |

## Project structure

```
src/
  index.js                    Public API facade (VanillaT)
  config.js                   Defaults + deep merge helper
  modules/
    languageDetector.js       Language detection and normalization
    loader.js                 JSON loading and in-memory cache
    resolver.js               Key resolution and interpolation
    domScanner.js             DOM scanning and MutationObserver
lang/
  es.json                     Example language file
  en.json
```

## Modules

### `config.js` — defaults & merging

Holds `defaultConfig`, the single source of truth for every option the library
accepts, and `mergeConfig(userConfig, base)`, a recursive helper that overlays
a user configuration over the defaults. Plain objects are merged recursively;
arrays and primitives from the user config simply replace the defaults. The
facade uses this so consumers only need to pass the options they want to change.

### `languageDetector.js` — who speaks here?

`detect()` walks the `detectionOrder` array and returns the first language
found. Each source is read by a dedicated method: `_getFromURL` (URL query
param), `_getFromLocalStorage` (persisted preference) and `_getFromNavigator`
(browser locale). Every reader returns `null` when the source is unavailable —
including **SSR/Node environments** where `window`/`navigator` do not exist.
`normalize()` converts any ISO code to its short form (`es-ES` -> `es`) so
`es-ES` and `es` share the same file. When no source yields a value, the
`fallbackLang` is returned. `savePreference()` persists the choice so the same
language is restored on the next visit.

### `loader.js` — fetching translations

`load(lang, config)` is the gateway. When caching is enabled it first checks
the in-memory `cache` Map, avoiding repeated network calls. On a miss it calls
`_fetch()`, which builds the URL as `basePath/lang.json`, performs the `fetch`
and parses the JSON. Every failure mode is wrapped in a descriptive error:
network errors, non-2xx responses (404, 500) and invalid JSON. Cached results
are deep-clone-free: the same object reference is shared, keeping memory usage
minimal. `clearCache()` empties the map for dynamic use cases.

### `resolver.js` — finding the right string

`get()` walks the translations object segment by segment using dot notation,
returning `null` as soon as a segment is missing — this makes missing keys
cheap to detect. `interpolate()` replaces `{name}` or `{{name}}` placeholders
using a single regex; unknown variables are left untouched instead of being
silently dropped. `translate()` composes both: resolve the value, fall back to
the key itself when missing, then interpolate. That fallback behavior keeps a
half-translated page readable instead of showing raw undefined values.

### `domScanner.js` — talking to the DOM

`translateElement()` parses the `data-translate` value into whitespace-separated
instructions. An instruction without a colon sets `textContent`; an
`attr:key` instruction splits on the first colon and sets that HTML attribute.
`scan()` collects every matching element under a root (including the root
itself when it carries the attribute) and translates each one. `observe()`
wraps the scan in a `MutationObserver` so nodes appended later are translated
right after insertion. The callback only processes mutations whose added nodes
are **element nodes** — it ignores text-only changes, which is what prevents
the observer from triggering itself in an infinite loop while translations are
written to the DOM.

### `index.js` — the facade

`VanillaT` wires the pipeline together. `init()` runs detection -> loading ->
DOM scan -> observer setup. `setLanguage()` re-runs the same pipeline for the
new language, persists the preference and invokes `onLanguageChange`. If a
language file fails to load, `_loadTranslations()` logs a warning and
transparently falls back to `fallbackLang`. The facade is the only module a
consumer ever imports: no internal modules leak into the public surface.