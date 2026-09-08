# vanilla-t

Librería ligera y modular de traducciones para JavaScript vanilla.
Cero dependencias externas. Las traducciones son archivos JSON simples que se
cargan en tiempo de ejecución en el navegador y se aplican de forma declarativa
al DOM.

## Características

- **Cero dependencias** — módulos ES puros en vanilla, sin frameworks.
- **Traducciones declarativas** — marca elementos con `data-translate` para traducir texto y atributos HTML.
- **Actualización dinámica** — un `MutationObserver` opcional traduce los nodos insertados después de `init`.
- **Detección jerárquica** — `parámetro de URL` -> `localStorage` -> `navigator.language` -> respaldo.
- **Carga inteligente** — `fetch` asíncrono con caché en memoria para evitar llamadas de red repetidas.
- **Claves anidadas e interpolación** — notación de puntos (`header.title`) y variables (`{{name}}`).

## Instalación

### Como paquete (bundlers: Vite, Webpack, Rollup)

```sh
npm install vanilla-t
```

```js
import { VanillaT } from 'vanilla-t';
```

### Como módulos ES nativos en el navegador

Copia la carpeta `src/` en tu proyecto e importa el punto de entrada directamente:

```js
import { VanillaT } from './src/index.js';
```

Los módulos ES requieren un servidor (no funcionan con `file://`). Si sirves tu
proyecto por HTTP, esto funciona tal cual, sin paso de build.

## Inicio rápido

### 1. Archivos de idioma

Crea un archivo JSON por idioma. Las claves admiten anidación y variables de
interpolación envueltas en `{{name}}`.

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

### 2. Marca tu HTML

Una clave simple traduce el **contenido de texto** del elemento:

```html
<h1 data-translate="header.title"></h1>
<p data-translate="messages.greeting"></p>
```

Una instrucción `attr:clave` traduce un **atributo HTML**:

```html
<input data-translate="placeholder:forms.search" placeholder="">
```

Puedes combinar varias instrucciones separadas por espacios:

```html
<input data-translate="placeholder:forms.search title:forms.search">
```

### 3. Inicializa

```js
import { VanillaT } from './src/index.js';

const translator = new VanillaT({
  basePath: './lang', // dónde viven los archivos *.json
  fallbackLang: 'en'
});

await translator.init();
```

Coloca la llamada a `init` justo antes de cerrar `</body>` (o aplaázala) para
que la página se pinte ya traducida — la estrategia zero-flicker.

## API pública

### `new VanillaT([userConfig])`

Crea una instancia del traductor. `userConfig` se fusiona en profundidad sobre
los [valores por defecto](#configuración).

### `async init()`

Detecta el idioma activo, carga sus traducciones y traduce el DOM. Devuelve la
instancia para poder encadenar.

### `t(clave, [variables]) -> String`

Devuelve la traducción de una clave en notación de puntos, con variables de
interpolación opcionales. Devuelve la propia clave cuando no existe traducción.

```js
translator.t('messages.greeting', { name: 'Ada' }); // "Hola, Ada!"
```

### `async setLanguage(idioma) -> VanillaT`

Cambia el idioma activo: persiste la preferencia en `localStorage`, recarga las
traducciones, vuelve a traducir el DOM y dispara el callback
`onLanguageChange`.

```js
await translator.setLanguage('es');
console.log(translator.currentLang); // "es"
```

### `currentLang -> String`

Getter que devuelve el código de idioma actual, normalizado.

### `destroy()`

Desconecta el `MutationObserver` para que los elementos insertados de forma
dinámica dejen de traducirse automáticamente.

## Configuración

| Opción | Tipo | Valor por defecto | Descripción |
| --- | --- | --- | --- |
| `fallbackLang` | `string` | `'es'` | Idioma usado cuando ninguna fuente aporta resultado. |
| `basePath` | `string` | `'./langs'` | Ruta base donde se ubican los archivos de idioma. |
| `detectionOrder` | `string[]` | `['url','localStorage','navigator']` | Orden de las fuentes de detección. |
| `storageKey` | `string` | `'data-lang'` | Clave de `localStorage` para la preferencia persistida. |
| `urlParam` | `string` | `'lang'` | Parámetro de consulta de la URL con el idioma. |
| `attribute` | `string` | `'data-translate'` | Atributo HTML que marca los elementos traducibles. |
| `useMutationObserver` | `boolean` | `false` | Traduce los nodos añadidos al DOM después de `init`. |
| `cache` | `boolean` | `true` | Guarda en caché los archivos JSON cargados. |
| `onLanguageChange` | `function` | `() => {}` | Se llama con el nuevo idioma tras un cambio. |

## Estructura del proyecto

```
src/
  index.js                    Fachada de la API pública (VanillaT)
  config.js                   Valores por defecto + helper de fusión
  modules/
    languageDetector.js       Detección y normalización de idioma
    loader.js                 Carga de JSON y caché en memoria
    resolver.js               Resolución de claves e interpolación
    domScanner.js             Escaneo del DOM y MutationObserver
lang/
  es.json                     Archivo de idioma de ejemplo
  en.json
```

## Módulos

### `config.js` — valores por defecto y fusión

Contiene `defaultConfig`, la fuente única de verdad de todas las opciones que
acepta la librería, y `mergeConfig(userConfig, base)`, un helper recursivo que
superpone una configuración de usuario sobre los valores por defecto. Los
objetos planos se fusionan recursivamente; los arrays y primitivas del usuario
sustituyen directamente a los valores por defecto. La fachada lo usa para que
los consumidores solo tengan que pasar las opciones que quieren cambiar.

### `languageDetector.js` — ¿quién habla aquí?

`detect()` recorre el array `detectionOrder` y devuelve el primer idioma
encontrado. Cada fuente la lee un método dedicado: `_getFromURL` (parámetro de
consulta de la URL), `_getFromLocalStorage` (preferencia persistida) y
`_getFromNavigator` (locale del navegador). Cada lector devuelve `null` cuando
la fuente no está disponible — incluidos los entornos **SSR/Node** donde no
existen `window`/`navigator`. `normalize()` convierte cualquier código ISO a su
forma corta (`es-ES` -> `es`) para que `es-ES` y `es` compartan el mismo
archivo. Cuando ninguna fuente aporta un valor, se devuelve `fallbackLang`.
`savePreference()` persiste la elección para restaurar el mismo idioma en la
siguiente visita.

### `loader.js` — cómo se traen las traducciones

`load(lang, config)` es la puerta de entrada. Cuando la caché está activada,
primero consulta el `Map` de caché en memoria, evitando llamadas de red
repetidas. Si no hay acierto, llama a `_fetch()`, que construye la URL como
`basePath/lang.json`, ejecuta el `fetch` y parsea el JSON. Cada modo de fallo
se envuelve en un error descriptivo: errores de red, respuestas que no son 2xx
(404, 500) y JSON inválido. Los resultados en caché no se clonan: se comparte la
misma referencia de objeto, manteniendo el uso de memoria mínimo. `clearCache()`
vacía el mapa para casos de uso dinámicos.

### `resolver.js` — encontrar la cadena correcta

`get()` recorre el objeto de traducciones segmento a segmento con notación de
puntos, devolviendo `null` en cuanto falta un segmento — así detectar claves
inexistentes es barato. `interpolate()` reemplaza los marcadores `{name}` o
`{{name}}` con una única expresión regular; las variables desconocidas se dejan
intactas en lugar de descartarse silenciosamente. `translate()` compone ambos:
resuelve el valor, cae en la propia clave si falta y luego interpola. Ese
comportamiento de respaldo mantiene una página a medio traducir legible en
lugar de mostrar valores `undefined` en crudo.

### `domScanner.js` — hablando con el DOM

`translateElement()` parsea el valor de `data-translate` en instrucciones
separadas por espacios en blanco. Una instrucción sin dos puntos asigna
`textContent`; una instrucción `attr:clave` se divide en el primer dos puntos
y asigna ese atributo HTML. `scan()` reúne todos los elementos coincidentes bajo
una raíz (incluida la propia raíz si lleva el atributo) y traduce cada uno.
`observe()` envuelve el escaneo en un `MutationObserver` para que los nodos
añadidos después se traduzcan justo tras su inserción. El callback solo procesa
mutaciones cuyos nodos añadidos son **nodos de elemento** — ignora los cambios
de solo texto, que es lo que evita que el observador se dispare a sí mismo en
un bucle infinito mientras se escriben las traducciones en el DOM.

### `index.js` — la fachada

`VanillaT` engrana todo el pipeline. `init()` ejecuta detección -> carga ->
escaneo del DOM -> configuración del observador. `setLanguage()` repite el
mismo pipeline para el nuevo idioma, persiste la preferencia e invoca
`onLanguageChange`. Si un archivo de idioma no se puede cargar,
`_loadTranslations()` avisa con un warning y cae de forma transparente en
`fallbackLang`. La fachada es el único módulo que importa un consumidor: ningún
módulo interno se filtra a la superficie pública.