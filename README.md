# Geo Image Classifier

A static MVP for geological image classification. It accepts uploaded images, generates first-pass geology, geomorphology, and image-classification results, shows supporting observations, and keeps the taxonomy structure open for more categories later.

## Run

Fastest option: double-click `open-index.cmd`.

No package install is required.

If your browser blocks local files, double-click `launch-site.cmd`. That starts a local server and opens the app at `http://127.0.0.1:5173/index.html` or the next available port.

If the server window is closed, the localhost page will stop working. Double-click `launch-site.cmd` again, or use `open-index.cmd` to open the static page directly.

## What It Does

- Upload, drag, or paste a geology image, terrain raster, or false-color composite into the workspace.
- Block unsuitable uploads or pasted images that look blank, tiny, flat, or unrelated to rock, terrain, outcrop, core, thin-section, false-color terrain, or geological raster interpretation.
- Review Image Metadata for source format, encoded dimensions, source bands, browser display decode, and analysis bands.
- Try generated demo samples for granite, sandstone, gneiss, and basalt.
- Switch the analysis pack dropdown between Geology, Geomorphology, and Classification.
- In Classification, choose whether pixel-class labels should come from Geology, Geomorphology, or both.
- Review the top class, confidence, alternatives, and image observations.
- Use Geology Pixel Ranges to turn unique geology matches into grayscale class seeds.
- Read geomorphological interpretation notes for surface form, lineament, bedding, roughness, weathering, and landform cues.
- Classify observed grayscale pixel values into user-selected low-to-high classes, then use the checkbox beside each result class to show or hide it on the colored overlay.
- Add a new class to the active pack during the session.

## Current Classifier

The current classifier is a browser-side heuristic engine. It reads image brightness, saturation, warmth, texture, edge contrast, and banding, then compares those observations against the selected catalog in `app.js`.

The upload and paste path now includes a suitability check before replacing the current preview. It keeps valid geology images, terrain images, false-color composites, and single-band geological rasters, while blocking images with too little size, tonal range, texture, banding, or geological signal. It also detects document and app-screenshot patterns, barcode or QR-like stripe patterns, number/text-heavy regions, and likely human face or person images using browser detectors when available plus strict local tile fallback heuristics. TIFF and GeoTIFF files are not browser-decodable here yet, so those need a raster loader or conversion to PNG or JPEG for display. This is a prototype safety gate rather than a trained content model, so thresholds can be tuned as more examples are collected.

The Geology catalog now leans toward India-oriented lithology terms such as Deccan Basalt, Peninsular Gneiss, Dharwar Schist, Gondwana Sandstone, Charnockite, Khondalite, Aravalli Quartzite, Laterite, and Banded Iron Formation. Classification labels still show the rock family for Geology matches, so the result can distinguish a general Geology label from a Metasedimentary, Granulite, or Iron Formation interpretation.

That gives a working prototype without keys, network calls, or model hosting. For production, replace `classifyWithHeuristics` with a trained image model or a Vision API adapter.

The pixel value classifier separately divides the observed low-to-high grayscale range into the requested number of classes. It rejects class counts greater than the analyzed pixel count, and it rejects any classification where a class contains less than 1% of the analyzed pixels. Accepted pixel classes are rendered as a colored overlay on the image, with labels for the largest regions and a legend that maps each pixel class to the closest visible Geology or Geomorphology match.

Repeated Geology or Geomorphology interpretations are merged into one professional-looking interpreted class. For example, two raw pixel bins that both match Deccan Basalt are shown as one Deccan Basalt class with combined pixel counts and one overlay color.

Classification mode includes a checkbox beside each generated pixel class. Unchecking a class removes that class color from the overlay while keeping the result visible in the list for review. Classes below 1% start unchecked instead of disabling the list, so they can still be reviewed.

Classification labels use viewport callouts with leader lines back to the image. The callouts are spread through the visible preview and stay in the viewport while the image is zoomed or scrolled.

Classification mode shows only the pixel classifier workflow so it is not confused with the geology or geomorphology top-match lists.

Geology mode also estimates pixel ranges for the unique geology matches. Those ranges can be used as starting classes before running the colored classification overlay.

The floating zoom toolbar scales the image preview from 50% to 300% without changing the underlying analysis.

## Multiband Readiness

The browser upload path reads lightweight file header metadata for JPEG, PNG, GIF, WebP, and BMP before analysis. The Image Metadata panel separates encoded source bands from browser display decode bands. If a JPEG or PNG header reports one grayscale band, or if the decoded RGB channels are effectively identical, the app analyzes the image as one Gray band instead of incorrectly reporting it as three analysis bands.

The analysis code runs through a shared band layer instead of reading RGB pixels directly, so pixel ranges, geology range estimates, and classification overlays use the same path for single-band, RGB, and multiband sources.

A future GeoTIFF or raster loader can pass display-sized bands into:

```js
window.loadMultibandBandSet({
  bands: [band1, band2, band3, band4],
  labels: ["Blue", "Green", "Red", "NIR"],
  sourceType: "GeoTIFF multiband image",
});
```

Each band can be a byte array or numeric array with one value per canvas pixel. Numeric bands are normalized to 0-255 before analysis.

## Expansion Path

Add new category packs by following the `categoryPacks` shape in `app.js`:

```js
categoryPacks.infrastructure = {
  label: "Infrastructure",
  categories: [
    {
      id: "cracked-concrete",
      label: "Cracked Concrete",
      family: "Damage",
      cues: ["linear fracture", "sharp edge contrast"],
      weights: {
        brightness: 0.55,
        saturation: 0.12,
        warm: 0.42,
        texture: 0.5,
        edge: 0.86,
        banding: 0.18,
        darkness: 0.18,
      },
    },
  ],
};
```

Next useful upgrades:

- Persist custom classes in local storage or a database.
- Add labeled training images per class.
- Move inference behind an API endpoint.
- Store reviewer corrections for model improvement.
- Add location, scale, and sample metadata.
