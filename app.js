const canvas = document.querySelector("#previewCanvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });
const sourceCanvas = document.createElement("canvas");
sourceCanvas.width = canvas.width;
sourceCanvas.height = canvas.height;
const sourceCtx = sourceCanvas.getContext("2d", { willReadFrequently: true });
const canvasViewport = document.querySelector("#canvasViewport");
const calloutLayer = document.querySelector("#calloutLayer");
const dropZone = document.querySelector("#dropZone");
const imageInput = document.querySelector("#imageInput");
const chooseImage = document.querySelector("#chooseImage");
const previewCaption = document.querySelector("#previewCaption");
const metadataGrid = document.querySelector("#metadataGrid");
const metadataNote = document.querySelector("#metadataNote");
const resultSummary = document.querySelector("#resultSummary");
const metricsGrid = document.querySelector("#metricsGrid");
const evidenceList = document.querySelector("#evidenceList");
const geologyRangeResults = document.querySelector("#geologyRangeResults");
const geomorphologySummary = document.querySelector("#geomorphologySummary");
const geomorphologyList = document.querySelector("#geomorphologyList");
const pixelClassForm = document.querySelector("#pixelClassForm");
const classificationSourceSelect = document.querySelector("#classificationSourceSelect");
const pixelClassCount = document.querySelector("#pixelClassCount");
const pixelClassMessage = document.querySelector("#pixelClassMessage");
const pixelClassResults = document.querySelector("#pixelClassResults");
const imageStatus = document.querySelector("#imageStatus");
const modelMode = document.querySelector("#modelMode");
const catalogStatus = document.querySelector("#catalogStatus");
const categoryForm = document.querySelector("#categoryForm");
const categoryMessage = document.querySelector("#categoryMessage");
const packSelect = document.querySelector("#packSelect");
const modeSections = document.querySelectorAll(".mode-section");
const zoomOut = document.querySelector("#zoomOut");
const zoomIn = document.querySelector("#zoomIn");
const zoomReset = document.querySelector("#zoomReset");
const zoomLevel = document.querySelector("#zoomLevel");

let sourceBandSet = {
  width: canvas.width,
  height: canvas.height,
  labels: [],
  bands: [],
  sourceType: "empty",
};

const state = {
  activePack: "geology",
  imageName: "",
  imageLoaded: false,
  imageMetadata: null,
  analysisBounds: { x: 0, y: 0, width: canvas.width, height: canvas.height },
  lastPixelClassification: null,
  lastCallouts: [],
  classificationOptions: [],
  classificationLabelSource: "both",
  zoom: 1,
};

const pixelPalette = [
  [0, 95, 115],
  [10, 147, 150],
  [148, 210, 189],
  [233, 216, 166],
  [238, 155, 0],
  [202, 103, 2],
  [187, 62, 3],
  [174, 32, 18],
  [155, 34, 38],
  [90, 68, 151],
  [47, 72, 88],
  [67, 170, 139],
];

const categoryPacks = {
  geology: {
    label: "Geology",
    categories: [
      {
        id: "granite",
        label: "Granite",
        family: "Igneous",
        cues: ["coarse speckled texture", "mixed light and dark minerals", "visible crystalline grains"],
        weights: { brightness: 0.58, saturation: 0.24, warm: 0.54, texture: 0.78, edge: 0.46, banding: 0.2, darkness: 0.18 },
      },
      {
        id: "basalt",
        label: "Basalt",
        family: "Igneous",
        cues: ["dark groundmass", "fine texture", "low color variation"],
        weights: { brightness: 0.18, saturation: 0.18, warm: 0.26, texture: 0.3, edge: 0.28, banding: 0.1, darkness: 0.86 },
      },
      {
        id: "obsidian",
        label: "Obsidian",
        family: "Igneous",
        cues: ["very dark tone", "smooth glassy surface", "limited grain pattern"],
        weights: { brightness: 0.1, saturation: 0.12, warm: 0.16, texture: 0.16, edge: 0.18, banding: 0.06, darkness: 0.95 },
      },
      {
        id: "sandstone",
        label: "Sandstone",
        family: "Sedimentary",
        cues: ["warm mineral color", "granular texture", "moderate bedding signal"],
        weights: { brightness: 0.66, saturation: 0.46, warm: 0.82, texture: 0.62, edge: 0.36, banding: 0.32, darkness: 0.12 },
      },
      {
        id: "limestone",
        label: "Limestone",
        family: "Sedimentary",
        cues: ["pale gray tone", "low saturation", "soft mottled texture"],
        weights: { brightness: 0.68, saturation: 0.14, warm: 0.42, texture: 0.34, edge: 0.22, banding: 0.18, darkness: 0.1 },
      },
      {
        id: "shale",
        label: "Shale",
        family: "Sedimentary",
        cues: ["fine-grained dark layers", "bedding or fissility", "muted color"],
        weights: { brightness: 0.28, saturation: 0.16, warm: 0.32, texture: 0.36, edge: 0.5, banding: 0.72, darkness: 0.64 },
      },
      {
        id: "conglomerate",
        label: "Conglomerate",
        family: "Sedimentary",
        cues: ["mixed clast sizes", "strong texture contrast", "rounded fragment pattern"],
        weights: { brightness: 0.52, saturation: 0.34, warm: 0.5, texture: 0.9, edge: 0.74, banding: 0.2, darkness: 0.28 },
      },
      {
        id: "gneiss",
        label: "Gneiss",
        family: "Metamorphic",
        cues: ["alternating light and dark bands", "strong foliation", "crystalline texture"],
        weights: { brightness: 0.5, saturation: 0.2, warm: 0.38, texture: 0.72, edge: 0.66, banding: 0.88, darkness: 0.36 },
      },
      {
        id: "schist",
        label: "Schist",
        family: "Metamorphic",
        cues: ["foliated fabric", "sparkly mineral texture", "directional grain"],
        weights: { brightness: 0.46, saturation: 0.22, warm: 0.38, texture: 0.82, edge: 0.62, banding: 0.68, darkness: 0.34 },
      },
      {
        id: "phyllite",
        label: "Phyllite",
        family: "Metasedimentary",
        cues: ["silky foliated sheen", "fine-grained metamorphosed shale", "low-grade cleavage or wavy lamination"],
        weights: { brightness: 0.36, saturation: 0.16, warm: 0.3, texture: 0.48, edge: 0.52, banding: 0.78, darkness: 0.56 },
      },
      {
        id: "marble",
        label: "Marble",
        family: "Metamorphic",
        cues: ["light crystalline texture", "soft veining", "low saturation"],
        weights: { brightness: 0.78, saturation: 0.14, warm: 0.44, texture: 0.42, edge: 0.32, banding: 0.28, darkness: 0.06 },
      },
      {
        id: "quartzite",
        label: "Quartzite",
        family: "Metasedimentary",
        cues: ["hard quartz-rich fabric", "bright massive to weakly banded texture", "metamorphosed sandstone signal"],
        weights: { brightness: 0.72, saturation: 0.12, warm: 0.38, texture: 0.44, edge: 0.38, banding: 0.36, darkness: 0.08 },
      },
      {
        id: "slate-rock",
        label: "Slate",
        family: "Metasedimentary",
        cues: ["dark platy fabric", "fine foliation", "metamorphosed shale or mudstone"],
        weights: { brightness: 0.24, saturation: 0.12, warm: 0.26, texture: 0.32, edge: 0.42, banding: 0.74, darkness: 0.72 },
      },
      {
        id: "meta-sandstone",
        label: "Meta-Sandstone",
        family: "Metasedimentary",
        cues: ["sandstone protolith", "recrystallized granular texture", "subtle bedding or metamorphic overprint"],
        weights: { brightness: 0.58, saturation: 0.3, warm: 0.58, texture: 0.62, edge: 0.44, banding: 0.56, darkness: 0.22 },
      },
      {
        id: "amphibolite",
        label: "Amphibolite",
        family: "Metamorphic",
        cues: ["dark green-black metamorphic fabric", "medium crystalline texture", "moderate foliation"],
        weights: { brightness: 0.22, saturation: 0.22, warm: 0.24, texture: 0.58, edge: 0.5, banding: 0.52, darkness: 0.78 },
      },
      {
        id: "quartz",
        label: "Quartz",
        family: "Mineral",
        cues: ["bright translucent appearance", "low saturation", "clean fracture surfaces"],
        weights: { brightness: 0.86, saturation: 0.08, warm: 0.36, texture: 0.24, edge: 0.28, banding: 0.1, darkness: 0.02 },
      },
      {
        id: "calcite",
        label: "Calcite",
        family: "Mineral",
        cues: ["light tone", "subtle warm cast", "blocky crystalline texture"],
        weights: { brightness: 0.78, saturation: 0.2, warm: 0.56, texture: 0.34, edge: 0.3, banding: 0.12, darkness: 0.04 },
      },
      {
        id: "hematite",
        label: "Hematite",
        family: "Mineral",
        cues: ["red-brown iron staining", "high warm color score", "dense dark patches"],
        weights: { brightness: 0.34, saturation: 0.58, warm: 0.9, texture: 0.52, edge: 0.42, banding: 0.16, darkness: 0.56 },
      },
      {
        id: "fold",
        label: "Fold Structure",
        family: "Structure",
        cues: ["curved or repeated bands", "strong directional fabric", "layered deformation signal"],
        weights: { brightness: 0.48, saturation: 0.26, warm: 0.42, texture: 0.66, edge: 0.78, banding: 0.92, darkness: 0.34 },
      },
      {
        id: "fault",
        label: "Fault Zone",
        family: "Structure",
        cues: ["sharp edge contrast", "broken fabric", "linear discontinuity"],
        weights: { brightness: 0.42, saturation: 0.24, warm: 0.36, texture: 0.74, edge: 0.9, banding: 0.46, darkness: 0.42 },
      },
      {
        id: "stratified-outcrop",
        label: "Stratified Outcrop",
        family: "Outcrop",
        cues: ["layered bedding", "repeated horizontal contrast", "weathered surface"],
        weights: { brightness: 0.55, saturation: 0.34, warm: 0.56, texture: 0.66, edge: 0.58, banding: 0.9, darkness: 0.24 },
      },
      {
        id: "volcanic-terrain",
        label: "Volcanic Terrain",
        family: "Landform",
        cues: ["dark rough surface", "high texture", "lava or pyroclastic color pattern"],
        weights: { brightness: 0.26, saturation: 0.28, warm: 0.38, texture: 0.78, edge: 0.72, banding: 0.22, darkness: 0.78 },
      },
    ],
  },
  geomorphology: {
    label: "Geomorphology",
    categories: [
      {
        id: "structural-lineament",
        label: "Structural Lineament",
        family: "Geomorphology",
        cues: ["linear tonal boundary", "fracture or fault trace expression", "sharp terrain discontinuity"],
        weights: { brightness: 0.42, saturation: 0.22, warm: 0.36, texture: 0.62, edge: 0.9, banding: 0.58, darkness: 0.42 },
      },
      {
        id: "fault-scarp",
        label: "Fault Scarp",
        family: "Geomorphology",
        cues: ["steep break in surface tone", "linear slope edge", "possible offset landform boundary"],
        weights: { brightness: 0.38, saturation: 0.2, warm: 0.34, texture: 0.68, edge: 0.94, banding: 0.42, darkness: 0.5 },
      },
      {
        id: "stratified-slope",
        label: "Stratified Slope",
        family: "Geomorphology",
        cues: ["repeated bedding expression", "terrace-like benches", "layer-controlled erosion"],
        weights: { brightness: 0.54, saturation: 0.28, warm: 0.48, texture: 0.58, edge: 0.56, banding: 0.9, darkness: 0.28 },
      },
      {
        id: "dissected-terrain",
        label: "Dissected Terrain",
        family: "Geomorphology",
        cues: ["rough surface texture", "dense small-scale contrast", "gully or drainage dissection signal"],
        weights: { brightness: 0.46, saturation: 0.3, warm: 0.44, texture: 0.88, edge: 0.78, banding: 0.36, darkness: 0.42 },
      },
      {
        id: "alluvial-fan",
        label: "Alluvial Fan",
        family: "Geomorphology",
        cues: ["light to warm sediment tone", "moderate texture", "fan or apron-like depositional surface"],
        weights: { brightness: 0.64, saturation: 0.42, warm: 0.74, texture: 0.44, edge: 0.34, banding: 0.24, darkness: 0.14 },
      },
      {
        id: "drainage-trace",
        label: "Drainage Trace",
        family: "Geomorphology",
        cues: ["elongated darker or sharper boundary", "channel-like contrast", "possible runoff path"],
        weights: { brightness: 0.36, saturation: 0.24, warm: 0.38, texture: 0.5, edge: 0.68, banding: 0.5, darkness: 0.58 },
      },
      {
        id: "dune-sand-sheet",
        label: "Dune Or Sand Sheet",
        family: "Geomorphology",
        cues: ["warm light tone", "smooth to moderately textured surface", "subtle repeated bands or ridges"],
        weights: { brightness: 0.72, saturation: 0.48, warm: 0.86, texture: 0.34, edge: 0.22, banding: 0.34, darkness: 0.08 },
      },
      {
        id: "weathered-regolith",
        label: "Weathered Regolith",
        family: "Geomorphology",
        cues: ["oxidized surface color", "soil or regolith cover", "weathered mantle expression"],
        weights: { brightness: 0.56, saturation: 0.5, warm: 0.84, texture: 0.54, edge: 0.36, banding: 0.16, darkness: 0.24 },
      },
      {
        id: "volcanic-flow-surface",
        label: "Volcanic Flow Surface",
        family: "Geomorphology",
        cues: ["dark rough terrain", "blocky or flow-like surface", "mafic or lava-field appearance"],
        weights: { brightness: 0.24, saturation: 0.26, warm: 0.36, texture: 0.82, edge: 0.66, banding: 0.22, darkness: 0.82 },
      },
      {
        id: "smooth-plain",
        label: "Smooth Plain",
        family: "Geomorphology",
        cues: ["low relief surface", "weak edge contrast", "plain, pediment, or flat depositional area"],
        weights: { brightness: 0.6, saturation: 0.18, warm: 0.46, texture: 0.18, edge: 0.14, banding: 0.1, darkness: 0.16 },
      },
    ],
  },
  classification: {
    label: "Classification",
    categories: [
      {
        id: "low-pixel-value",
        label: "Low Pixel Value",
        family: "Pixel Class",
        cues: ["dark grayscale response", "low reflectance or shadowed pixels", "possible dense material or shaded relief"],
        weights: { brightness: 0.12, saturation: 0.18, warm: 0.32, texture: 0.32, edge: 0.28, banding: 0.12, darkness: 0.9 },
      },
      {
        id: "middle-pixel-value",
        label: "Middle Pixel Value",
        family: "Pixel Class",
        cues: ["midtone grayscale response", "balanced brightness", "mixed or transitional surface class"],
        weights: { brightness: 0.5, saturation: 0.24, warm: 0.48, texture: 0.42, edge: 0.34, banding: 0.22, darkness: 0.5 },
      },
      {
        id: "high-pixel-value",
        label: "High Pixel Value",
        family: "Pixel Class",
        cues: ["bright grayscale response", "high reflectance pixels", "possible pale rock, sediment, or exposed surface"],
        weights: { brightness: 0.86, saturation: 0.16, warm: 0.5, texture: 0.28, edge: 0.22, banding: 0.12, darkness: 0.04 },
      },
      {
        id: "warm-tone-class",
        label: "Warm Tone Class",
        family: "Image Class",
        cues: ["red, buff, or iron-rich color response", "warm sediment or weathering signal", "oxidized surface tendency"],
        weights: { brightness: 0.58, saturation: 0.58, warm: 0.9, texture: 0.48, edge: 0.34, banding: 0.18, darkness: 0.24 },
      },
      {
        id: "smooth-texture-class",
        label: "Smooth Texture Class",
        family: "Image Class",
        cues: ["low local contrast", "smooth or uniform image texture", "weak grain or landform expression"],
        weights: { brightness: 0.58, saturation: 0.18, warm: 0.46, texture: 0.1, edge: 0.12, banding: 0.1, darkness: 0.18 },
      },
      {
        id: "rough-texture-class",
        label: "Rough Texture Class",
        family: "Image Class",
        cues: ["high local contrast", "rough surface or grain response", "blocky, clastic, or dissected texture"],
        weights: { brightness: 0.44, saturation: 0.3, warm: 0.42, texture: 0.9, edge: 0.66, banding: 0.28, darkness: 0.42 },
      },
      {
        id: "banded-pattern-class",
        label: "Banded Pattern Class",
        family: "Image Class",
        cues: ["repeated tonal layers", "striped or foliated pattern", "ordered low-to-high value transitions"],
        weights: { brightness: 0.52, saturation: 0.22, warm: 0.42, texture: 0.62, edge: 0.56, banding: 0.92, darkness: 0.34 },
      },
      {
        id: "edge-rich-class",
        label: "Edge-Rich Class",
        family: "Image Class",
        cues: ["sharp boundaries", "fragmented image regions", "possible contacts, cracks, lineaments, or segmentation edges"],
        weights: { brightness: 0.42, saturation: 0.24, warm: 0.4, texture: 0.68, edge: 0.92, banding: 0.42, darkness: 0.42 },
      },
    ],
  },
};

const sampleDefinitions = {
  granite: {
    caption: "Demo sample: granite-like speckled crystalline texture",
    base: [190, 181, 168],
    accent: [46, 49, 48],
    warm: [196, 117, 102],
    mode: "speckle",
  },
  sandstone: {
    caption: "Demo sample: sandstone-like grains with warm bedding",
    base: [182, 143, 88],
    accent: [121, 91, 52],
    warm: [212, 166, 92],
    mode: "layered-grain",
  },
  gneiss: {
    caption: "Demo sample: gneiss-like alternating bands",
    base: [176, 176, 166],
    accent: [42, 45, 45],
    warm: [132, 118, 98],
    mode: "banded",
  },
  basalt: {
    caption: "Demo sample: basalt-like dark fine-grained rock",
    base: [39, 45, 43],
    accent: [20, 23, 22],
    warm: [70, 62, 51],
    mode: "dark-fine",
  },
};

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function percent(value) {
  return `${Math.round(clamp(value) * 100)}%`;
}

function distanceScore(actual, target, tolerance = 0.32) {
  return clamp(1 - Math.abs(actual - target) / tolerance);
}

function setup() {
  populatePackSelect();
  updateCatalogStatus();
  updateVisibleSections();
  createSampleImages();
  bindEvents();
  renderEmptyMetrics();
  renderEmptyMetadata();
  renderEmptyGeologyRanges();
  renderEmptyGeomorphology();
}

function bindEvents() {
  packSelect.addEventListener("change", () => {
    state.activePack = packSelect.value;
    updateCatalogStatus();
    updateVisibleSections();
    if (state.imageLoaded) {
      analyzeCurrentCanvas();
      if (state.activePack === "classification") {
        runPixelClassification();
      } else {
        renderSourceImage({ restoreCaption: true });
      }
    }
  });

  chooseImage.addEventListener("click", () => imageInput.click());
  imageInput.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (file) {
      loadFile(file);
    }
  });

  dropZone.addEventListener("dragover", (event) => {
    event.preventDefault();
    dropZone.classList.add("is-dragging");
  });

  dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("is-dragging");
  });

  dropZone.addEventListener("drop", (event) => {
    event.preventDefault();
    dropZone.classList.remove("is-dragging");
    const file = event.dataTransfer.files?.[0];
    if (file) {
      loadFile(file);
    }
  });

  document.addEventListener("paste", handlePaste);

  dropZone.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      imageInput.click();
    }
  });

  document.querySelectorAll(".sample-tile").forEach((button) => {
    button.addEventListener("click", () => loadSample(button.dataset.sample));
  });

  pixelClassForm.addEventListener("submit", (event) => {
    event.preventDefault();
    runPixelClassification();
  });

  classificationSourceSelect.addEventListener("change", () => {
    state.classificationLabelSource = classificationSourceSelect.value;
    state.lastPixelClassification = null;
    if (state.imageLoaded) {
      analyzeCurrentCanvas();
      if (state.activePack === "classification") {
        runPixelClassification();
      }
    } else {
      updateCatalogStatus();
    }
  });

  pixelClassCount.addEventListener("change", () => {
    if (state.imageLoaded) {
      runPixelClassification();
    }
  });

  pixelClassCount.addEventListener("input", () => {
    if (state.imageLoaded && state.activePack === "classification") {
      runPixelClassification();
    }
  });

  pixelClassResults.addEventListener("change", handlePixelClassResultToggle);
  canvasViewport.addEventListener("scroll", updateCalloutPositions);
  window.addEventListener("resize", updateCalloutPositions);
  window.addEventListener("scroll", updateCalloutPositions);

  zoomOut.addEventListener("click", () => setZoom(state.zoom - 0.25));
  zoomIn.addEventListener("click", () => setZoom(state.zoom + 0.25));
  zoomReset.addEventListener("click", () => setZoom(1));

  categoryForm.addEventListener("submit", addCategory);
}

function createSampleImages() {
  Object.entries(sampleDefinitions).forEach(([id, sample]) => {
    const sampleCanvas = document.createElement("canvas");
    sampleCanvas.width = 420;
    sampleCanvas.height = 300;
    drawSampleTexture(sampleCanvas.getContext("2d"), sampleCanvas.width, sampleCanvas.height, sample);
    document.querySelector(`#sample-${id}`).src = sampleCanvas.toDataURL("image/png");
  });
}

function loadSample(id) {
  const sample = sampleDefinitions[id];
  if (!sample) {
    return;
  }

  drawSampleTexture(sourceCtx, sourceCanvas.width, sourceCanvas.height, sample);
  rebuildBandSetFromSourceCanvas("Generated RGB sample");
  state.imageMetadata = createGeneratedImageMetadata(sample.caption, sourceCanvas.width, sourceCanvas.height);
  syncMetadataWithWorkingBands(state.imageMetadata, {
    decodedWidth: sourceCanvas.width,
    decodedHeight: sourceCanvas.height,
    displayBandCount: 3,
    displayBandLabels: ["Red", "Green", "Blue"],
    displayNote: "Generated RGB canvas sample",
    inferredSingleBand: false,
  });
  state.imageLoaded = true;
  state.imageName = sample.caption;
  state.analysisBounds = { x: 0, y: 0, width: canvas.width, height: canvas.height };
  state.lastPixelClassification = null;
  renderSourceImage();
  renderImageMetadata(state.imageMetadata);
  previewCaption.textContent = sample.caption;
  imageStatus.textContent = `Demo image loaded (${bandDescription()})`;
  analyzeCurrentCanvas();
  if (state.activePack === "classification") {
    runPixelClassification();
  }
}

async function loadFile(file) {
  if (!isImageFile(file)) {
    imageStatus.textContent = "Please choose an image file";
    return;
  }

  const previousState = captureImageState();
  imageStatus.textContent = "Reading image metadata...";
  previewCaption.textContent = "Reading image metadata...";

  let metadata = createBasicImageMetadata(file);
  try {
    const buffer = await file.arrayBuffer();
    metadata = readImageMetadata(file, buffer);
  } catch (error) {
    metadata.notes.push("File header metadata could not be read; using browser decode only.");
  }

  state.imageMetadata = metadata;
  renderImageMetadata(metadata);
  loadDecodedImage(file, metadata, previousState);
}

function handlePaste(event) {
  const file = imageFileFromClipboard(event.clipboardData);
  if (!file) {
    return;
  }

  event.preventDefault();
  dropZone.classList.add("is-dragging");
  window.setTimeout(() => dropZone.classList.remove("is-dragging"), 220);
  imageStatus.textContent = "Pasted image received";
  loadFile(file);
}

function imageFileFromClipboard(clipboardData) {
  if (!clipboardData) {
    return null;
  }

  const directFile = Array.from(clipboardData.files || []).find(isImageFile);
  if (directFile) {
    return ensureNamedImageFile(directFile, "clipboard-image");
  }

  const imageItem = Array.from(clipboardData.items || [])
    .find((item) => item.kind === "file" && item.type.startsWith("image/"));

  if (!imageItem) {
    return null;
  }

  const file = imageItem.getAsFile();
  return file ? ensureNamedImageFile(file, "clipboard-image") : null;
}

function ensureNamedImageFile(file, fallbackBaseName) {
  if (file.name) {
    return file;
  }

  const type = file.type || "image/png";
  const extension = extensionForMimeType(type);
  const name = `${fallbackBaseName}-${new Date().toISOString().replace(/[:.]/g, "-")}.${extension}`;

  try {
    return new File([file], name, { type, lastModified: Date.now() });
  } catch (error) {
    file.name = name;
    return file;
  }
}

function loadDecodedImage(file, metadata, previousState = null) {
  const image = new Image();
  const objectUrl = URL.createObjectURL(file);

  image.addEventListener("load", async () => {
    URL.revokeObjectURL(objectUrl);
    const canvasInfo = drawImageToCanvas(image, metadata);
    syncMetadataWithWorkingBands(metadata, canvasInfo);
    const suitability = await evaluateImageSuitability(image, metadata);
    if (!suitability.accepted) {
      restoreImageState(previousState);
      imageStatus.textContent = `Blocked: ${file.name} is not suitable for this geology classifier`;
      previewCaption.textContent = `Upload blocked. ${suitability.reason}`;
      renderPixelClassMessage("Image blocked. Use a rock, core, thin-section, outcrop, terrain, or geological raster image.", "error");
      return;
    }

    state.imageLoaded = true;
    state.imageName = file.name;
    state.lastPixelClassification = null;
    renderImageMetadata(metadata);
    renderSourceImage();
    previewCaption.textContent = file.name;
    imageStatus.textContent = `${file.name} loaded (${bandDescription()} for analysis)`;
    analyzeCurrentCanvas();
    if (state.activePack === "classification") {
      runPixelClassification();
    }
  });

  image.addEventListener("error", () => {
    URL.revokeObjectURL(objectUrl);
    imageStatus.textContent = "The image could not be decoded by this browser";
    metadata.notes.push("The file header was readable, but the browser could not decode the image for display.");
    renderImageMetadata(metadata);
  });

  image.src = objectUrl;
}

function drawImageToCanvas(image, metadata = null) {
  const width = canvas.width;
  const height = canvas.height;
  sourceCtx.clearRect(0, 0, width, height);
  sourceCtx.fillStyle = "#121715";
  sourceCtx.fillRect(0, 0, width, height);

  const scale = Math.min(width / image.width, height / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  const offsetX = (width - drawWidth) / 2;
  const offsetY = (height - drawHeight) / 2;

  sourceCtx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
  state.analysisBounds = { x: offsetX, y: offsetY, width: drawWidth, height: drawHeight };
  const inspection = inspectDecodedCanvasBands(state.analysisBounds);
  const useSingleBand = shouldUseSingleGrayBand(metadata, inspection);
  const sourceType = useSingleBand
    ? metadataUsesSingleGrayBand(metadata) ? "Encoded single-band grayscale image" : "Inferred single-band grayscale image"
    : "Browser-decoded RGB image";
  rebuildBandSetFromSourceCanvas(sourceType, { singleGrayBand: useSingleBand });

  return {
    decodedWidth: image.naturalWidth || image.width,
    decodedHeight: image.naturalHeight || image.height,
    displayBandCount: 3,
    displayBandLabels: ["Red", "Green", "Blue"],
    displayNote: "Browser decoded pixels for screen display",
    canvasInspection: inspection,
    inferredSingleBand: useSingleBand && !metadataUsesSingleGrayBand(metadata),
  };
}

function captureImageState() {
  return {
    sourceImage: sourceCtx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height),
    displayImage: ctx.getImageData(0, 0, canvas.width, canvas.height),
    sourceBandSet: {
      width: sourceBandSet.width,
      height: sourceBandSet.height,
      labels: [...sourceBandSet.labels],
      bands: [...sourceBandSet.bands],
      sourceType: sourceBandSet.sourceType,
    },
    state: {
      imageLoaded: state.imageLoaded,
      imageName: state.imageName,
      imageMetadata: state.imageMetadata,
      analysisBounds: { ...state.analysisBounds },
      lastPixelClassification: state.lastPixelClassification,
      lastCallouts: [...state.lastCallouts],
      classificationOptions: [...state.classificationOptions],
    },
    calloutHtml: calloutLayer.innerHTML,
    calloutDisplay: calloutLayer.style.display,
    calloutLeft: calloutLayer.style.left,
    calloutTop: calloutLayer.style.top,
    calloutWidth: calloutLayer.style.width,
    calloutHeight: calloutLayer.style.height,
  };
}

function restoreImageState(snapshot) {
  if (!snapshot) {
    return;
  }

  sourceCtx.putImageData(snapshot.sourceImage, 0, 0);
  ctx.putImageData(snapshot.displayImage, 0, 0);
  sourceBandSet = snapshot.sourceBandSet;

  state.imageLoaded = snapshot.state.imageLoaded;
  state.imageName = snapshot.state.imageName;
  state.imageMetadata = snapshot.state.imageMetadata;
  state.analysisBounds = snapshot.state.analysisBounds;
  state.lastPixelClassification = snapshot.state.lastPixelClassification;
  state.lastCallouts = snapshot.state.lastCallouts;
  state.classificationOptions = snapshot.state.classificationOptions;

  calloutLayer.innerHTML = snapshot.calloutHtml;
  calloutLayer.style.display = snapshot.calloutDisplay;
  calloutLayer.style.left = snapshot.calloutLeft;
  calloutLayer.style.top = snapshot.calloutTop;
  calloutLayer.style.width = snapshot.calloutWidth;
  calloutLayer.style.height = snapshot.calloutHeight;

  renderImageMetadata(state.imageMetadata);
  updateCatalogStatus();
}

async function evaluateImageSuitability(image, metadata) {
  const decodedWidth = image.naturalWidth || image.width || 0;
  const decodedHeight = image.naturalHeight || image.height || 0;

  if (decodedWidth < 64 || decodedHeight < 64) {
    return {
      accepted: false,
      reason: "The image is too small for reliable geological interpretation.",
    };
  }

  const stats = extractPixelValueStats();
  const tonalRange = stats.high - stats.low;
  if (stats.totalPixels < 4096 || tonalRange < 8) {
    return {
      accepted: false,
      reason: "The image is nearly blank or has too little tonal variation.",
    };
  }

  const features = extractFeatures();
  const pattern = inspectSuitabilityPixelPattern();
  const faceDetection = await detectHumanFacesInSource();
  const barcodeDetection = await detectBarcodesInSource();
  const humanPattern = inspectHumanPortraitPattern();
  const artifactPattern = inspectBarcodeTextPattern();
  const localArtifacts = inspectLocalNonGeologyArtifacts();
  const isLikelyHumanImage = humanPattern.skinShare > 0.14
    && humanPattern.centerSkinShare > 0.18
    && humanPattern.upperCenterSkinShare > 0.16
    && humanPattern.skinSmoothShare > 0.38
    && (
      humanPattern.darkFeatureShare > 0.008
      || humanPattern.skinShare > 0.28
      || humanPattern.centralSkinDominance > 1.35
    )
    && features.banding < 0.58;
  const hasLocalHumanPatch = localArtifacts.maxSkinTileShare > 0.24
    && localArtifacts.maxSmoothSkinTileShare > 0.16
    && (
      localArtifacts.maxDarkFeatureTileShare > 0.015
      || humanPattern.darkFeatureShare > 0.006
      || pattern.paperShare > 0.1
    );
  const isLikelyPersonDocument = (
    humanPattern.skinShare > 0.02
    || localArtifacts.maxSkinTileShare > 0.18
    || localArtifacts.skinTileShare > 0.045
  )
    && (
      humanPattern.skinSmoothShare > 0.16
      || localArtifacts.smoothSkinTileShare > 0.035
      || localArtifacts.maxSmoothSkinTileShare > 0.12
    )
    && (
      pattern.paperShare > 0.12
      || pattern.lowSaturationShare > 0.38
      || localArtifacts.documentTileShare > 0.04
    );

  if (faceDetection.faces.length || isLikelyHumanImage || isLikelyPersonDocument || hasLocalHumanPatch) {
    return {
      accepted: false,
      reason: "The image appears to contain a human face or person, not a geological target.",
    };
  }

  if (barcodeDetection.codes.length || artifactPattern.isLikelyBarcodeOrTextDocument || localArtifacts.isLikelyArtifactImage) {
    return {
      accepted: false,
      reason: "The image appears to contain barcodes, QR codes, numbers, or document-style text rather than geological content.",
    };
  }

  const geologyTop = classifyWithHeuristics(features, categoryPacks.geology)[0];
  const geomorphologyTop = classifyWithHeuristics(features, categoryPacks.geomorphology)[0];
  const bestConfidence = Math.max(geologyTop?.confidence || 0, geomorphologyTop?.confidence || 0);
  const textureSignal = Math.max(features.texture, features.edge, features.banding);
  const tonalSignal = clamp(tonalRange / 96);
  const isLikelyBlankDocument = features.brightness > 0.88
    && features.saturation < 0.1
    && features.texture < 0.18
    && features.banding < 0.16
    && features.edge < 0.24;
  const isLikelySimpleGraphic = tonalRange < 28
    && features.texture < 0.08
    && features.edge < 0.08
    && features.banding < 0.08;
  const isLikelyUiOrDocument = pattern.paperShare > 0.34
    && pattern.inkShare > 0.006
    && pattern.lowSaturationShare > 0.62
    && (
      pattern.paperInkEdgeShare > 0.012
      || pattern.colorBinCount < 44
      || pattern.accentShare < 0.08
    );

  if (isLikelyBlankDocument || isLikelySimpleGraphic || isLikelyUiOrDocument) {
    return {
      accepted: false,
      reason: "The image looks more like a document, app screenshot, or simple graphic than a geological image.",
    };
  }

  const suitabilityScore =
    bestConfidence * 0.52 +
    textureSignal * 0.18 +
    tonalSignal * 0.16 +
    Math.max(features.warm, features.darkness, features.brightness) * 0.08 +
    (metadataUsesSingleGrayBand(metadata) || metadata?.inferredSingleBand ? 0.06 : 0);

  if (suitabilityScore < 0.42) {
    return {
      accepted: false,
      reason: "The image does not show enough rock, terrain, texture, banding, or geological tonal structure.",
    };
  }

  return {
    accepted: true,
    score: suitabilityScore,
  };
}

function inspectSuitabilityPixelPattern() {
  const bounds = state.analysisBounds || { x: 0, y: 0, width: sourceCanvas.width, height: sourceCanvas.height };
  const startX = Math.max(0, Math.floor(bounds.x));
  const startY = Math.max(0, Math.floor(bounds.y));
  const endX = Math.min(sourceCanvas.width, Math.ceil(bounds.x + bounds.width));
  const endY = Math.min(sourceCanvas.height, Math.ceil(bounds.y + bounds.height));
  const sampleEvery = 3;
  const colorBins = new Set();

  let total = 0;
  let paper = 0;
  let ink = 0;
  let accent = 0;
  let lowSaturation = 0;
  let paperInkEdges = 0;
  let edgeChecks = 0;

  for (let y = startY; y < endY; y += sampleEvery) {
    for (let x = startX; x < endX; x += sampleEvery) {
      const pixel = suitabilityPixelAt(x, y);
      if (pixel.paper) paper += 1;
      if (pixel.ink) ink += 1;
      if (pixel.accent) accent += 1;
      if (pixel.saturation < 0.16) lowSaturation += 1;

      colorBins.add(`${pixel.r >> 5}-${pixel.g >> 5}-${pixel.b >> 5}`);

      const rightX = Math.min(endX - 1, x + sampleEvery);
      const downY = Math.min(endY - 1, y + sampleEvery);
      const right = suitabilityPixelAt(rightX, y);
      const down = suitabilityPixelAt(x, downY);

      if (isPaperInkTransition(pixel, right)) paperInkEdges += 1;
      if (isPaperInkTransition(pixel, down)) paperInkEdges += 1;
      edgeChecks += 2;
      total += 1;
    }
  }

  return {
    paperShare: total ? paper / total : 0,
    inkShare: total ? ink / total : 0,
    accentShare: total ? accent / total : 0,
    lowSaturationShare: total ? lowSaturation / total : 0,
    paperInkEdgeShare: edgeChecks ? paperInkEdges / edgeChecks : 0,
    colorBinCount: colorBins.size,
  };
}

async function detectHumanFacesInSource() {
  if (typeof window === "undefined" || !("FaceDetector" in window)) {
    return { faces: [], source: "unavailable" };
  }

  try {
    const detector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 6 });
    const faces = await detector.detect(sourceCanvas);
    const canvasArea = sourceCanvas.width * sourceCanvas.height;
    const meaningfulFaces = faces.filter((face) => {
      const box = face.boundingBox || {};
      const width = box.width || 0;
      const height = box.height || 0;
      return width * height > canvasArea * 0.004 && width > 24 && height > 24;
    });

    return { faces: meaningfulFaces, source: "FaceDetector" };
  } catch (error) {
    return { faces: [], source: "failed" };
  }
}

async function detectBarcodesInSource() {
  if (typeof window === "undefined" || !("BarcodeDetector" in window)) {
    return { codes: [], source: "unavailable" };
  }

  try {
    const detector = new window.BarcodeDetector({
      formats: [
        "aztec",
        "code_128",
        "code_39",
        "code_93",
        "codabar",
        "data_matrix",
        "ean_13",
        "ean_8",
        "itf",
        "pdf417",
        "qr_code",
        "upc_a",
        "upc_e",
      ],
    });
    const codes = await detector.detect(sourceCanvas);
    return { codes, source: "BarcodeDetector" };
  } catch (error) {
    return { codes: [], source: "failed" };
  }
}

function inspectBarcodeTextPattern() {
  const bounds = state.analysisBounds || { x: 0, y: 0, width: sourceCanvas.width, height: sourceCanvas.height };
  const startX = Math.max(0, Math.floor(bounds.x));
  const startY = Math.max(0, Math.floor(bounds.y));
  const endX = Math.min(sourceCanvas.width, Math.ceil(bounds.x + bounds.width));
  const endY = Math.min(sourceCanvas.height, Math.ceil(bounds.y + bounds.height));
  const step = 2;

  let sampledRows = 0;
  let barcodeRows = 0;
  let sampledCols = 0;
  let barcodeCols = 0;
  let textLikeCells = 0;
  let totalCells = 0;

  for (let y = startY; y < endY; y += step * 3) {
    let transitions = 0;
    let previous = null;
    let darkBrightPixels = 0;
    let rowPixels = 0;

    for (let x = startX; x < endX; x += step) {
      const pixel = suitabilityPixelAt(x, y);
      const stateValue = barcodePixelState(pixel);
      if (stateValue !== 0) darkBrightPixels += 1;
      if (previous !== null && stateValue !== 0 && previous !== 0 && stateValue !== previous) {
        transitions += 1;
      }
      if (stateValue !== 0) {
        previous = stateValue;
      }
      rowPixels += 1;
    }

    if (rowPixels && transitions >= 14 && darkBrightPixels / rowPixels > 0.45) {
      barcodeRows += 1;
    }
    sampledRows += 1;
  }

  for (let x = startX; x < endX; x += step * 3) {
    let transitions = 0;
    let previous = null;
    let darkBrightPixels = 0;
    let colPixels = 0;

    for (let y = startY; y < endY; y += step) {
      const pixel = suitabilityPixelAt(x, y);
      const stateValue = barcodePixelState(pixel);
      if (stateValue !== 0) darkBrightPixels += 1;
      if (previous !== null && stateValue !== 0 && previous !== 0 && stateValue !== previous) {
        transitions += 1;
      }
      if (stateValue !== 0) {
        previous = stateValue;
      }
      colPixels += 1;
    }

    if (colPixels && transitions >= 14 && darkBrightPixels / colPixels > 0.45) {
      barcodeCols += 1;
    }
    sampledCols += 1;
  }

  const block = 18;
  for (let y = startY; y < endY; y += block) {
    for (let x = startX; x < endX; x += block) {
      let paper = 0;
      let ink = 0;
      let lowSat = 0;
      let count = 0;

      for (let yy = y; yy < Math.min(endY, y + block); yy += 4) {
        for (let xx = x; xx < Math.min(endX, x + block); xx += 4) {
          const pixel = suitabilityPixelAt(xx, yy);
          if (pixel.paper) paper += 1;
          if (pixel.ink) ink += 1;
          if (pixel.saturation < 0.2) lowSat += 1;
          count += 1;
        }
      }

      if (count) {
        const paperShare = paper / count;
        const inkShare = ink / count;
        const lowSatShare = lowSat / count;
        if (paperShare > 0.35 && inkShare > 0.03 && inkShare < 0.42 && lowSatShare > 0.68) {
          textLikeCells += 1;
        }
        totalCells += 1;
      }
    }
  }

  const barcodeRowShare = sampledRows ? barcodeRows / sampledRows : 0;
  const barcodeColShare = sampledCols ? barcodeCols / sampledCols : 0;
  const textCellShare = totalCells ? textLikeCells / totalCells : 0;

  return {
    barcodeRowShare,
    barcodeColShare,
    textCellShare,
    isLikelyBarcodeOrTextDocument: barcodeRowShare > 0.006
      || barcodeColShare > 0.006
      || textCellShare > 0.08,
  };
}

function inspectLocalNonGeologyArtifacts() {
  const bounds = state.analysisBounds || { x: 0, y: 0, width: sourceCanvas.width, height: sourceCanvas.height };
  const startX = Math.max(0, Math.floor(bounds.x));
  const startY = Math.max(0, Math.floor(bounds.y));
  const endX = Math.min(sourceCanvas.width, Math.ceil(bounds.x + bounds.width));
  const endY = Math.min(sourceCanvas.height, Math.ceil(bounds.y + bounds.height));
  const width = Math.max(1, endX - startX);
  const height = Math.max(1, endY - startY);
  const tile = Math.max(42, Math.floor(Math.min(width, height) / 8));

  let tiles = 0;
  let skinTiles = 0;
  let smoothSkinTiles = 0;
  let documentTiles = 0;
  let textTiles = 0;
  let barcodeTiles = 0;
  let maxSkinTileShare = 0;
  let maxSmoothSkinTileShare = 0;
  let maxDarkFeatureTileShare = 0;

  for (let y = startY; y < endY; y += tile) {
    for (let x = startX; x < endX; x += tile) {
      const summary = summarizeArtifactTile(x, y, Math.min(endX, x + tile), Math.min(endY, y + tile));
      tiles += 1;

      maxSkinTileShare = Math.max(maxSkinTileShare, summary.skinShare);
      maxSmoothSkinTileShare = Math.max(maxSmoothSkinTileShare, summary.smoothSkinShare);
      maxDarkFeatureTileShare = Math.max(maxDarkFeatureTileShare, summary.darkFeatureShare);

      if (summary.skinShare > 0.16) skinTiles += 1;
      if (summary.skinShare > 0.12 && summary.smoothSkinShare > 0.18) smoothSkinTiles += 1;
      if (summary.paperShare > 0.34 && summary.inkShare > 0.012 && summary.lowSaturationShare > 0.48) documentTiles += 1;
      if (summary.textLike) textTiles += 1;
      if (summary.barcodeLike) barcodeTiles += 1;
    }
  }

  const skinTileShare = tiles ? skinTiles / tiles : 0;
  const smoothSkinTileShare = tiles ? smoothSkinTiles / tiles : 0;
  const documentTileShare = tiles ? documentTiles / tiles : 0;
  const textTileShare = tiles ? textTiles / tiles : 0;
  const barcodeTileShare = tiles ? barcodeTiles / tiles : 0;

  return {
    maxSkinTileShare,
    maxSmoothSkinTileShare,
    maxDarkFeatureTileShare,
    skinTileShare,
    smoothSkinTileShare,
    documentTileShare,
    textTileShare,
    barcodeTileShare,
    isLikelyArtifactImage: barcodeTileShare > 0
      || textTileShare > 0.03
      || documentTileShare > 0.04
      || (documentTileShare > 0.02 && textTileShare > 0.015),
  };
}

function summarizeArtifactTile(startX, startY, endX, endY) {
  const step = 3;
  let total = 0;
  let paper = 0;
  let ink = 0;
  let lowSaturation = 0;
  let skin = 0;
  let smoothSkin = 0;
  let smoothSkinChecks = 0;
  let darkFeature = 0;
  let barcodeRows = 0;
  let sampledRows = 0;

  for (let y = startY; y < endY; y += step) {
    let rowTransitions = 0;
    let previous = null;
    let rowDarkBright = 0;
    let rowPixels = 0;

    for (let x = startX; x < endX; x += step) {
      const pixel = suitabilityPixelAt(x, y);
      const stateValue = barcodePixelState(pixel);
      const isSkin = isHumanSkinTone(pixel);

      if (pixel.paper) paper += 1;
      if (pixel.ink) ink += 1;
      if (pixel.saturation < 0.2) lowSaturation += 1;
      if (isSkin) {
        skin += 1;
        const right = suitabilityPixelAt(Math.min(endX - 1, x + step), y);
        const down = suitabilityPixelAt(x, Math.min(endY - 1, y + step));
        if (isHumanSkinTone(right)) {
          smoothSkin += Math.abs(pixel.luminance - right.luminance) < 0.08 ? 1 : 0;
          smoothSkinChecks += 1;
        }
        if (isHumanSkinTone(down)) {
          smoothSkin += Math.abs(pixel.luminance - down.luminance) < 0.08 ? 1 : 0;
          smoothSkinChecks += 1;
        }
      }

      if (pixel.luminance < 0.28 && pixel.saturation < 0.58) {
        darkFeature += 1;
      }

      if (stateValue !== 0) rowDarkBright += 1;
      if (previous !== null && stateValue !== 0 && previous !== 0 && stateValue !== previous) {
        rowTransitions += 1;
      }
      if (stateValue !== 0) {
        previous = stateValue;
      }

      rowPixels += 1;
      total += 1;
    }

    if (rowPixels && rowTransitions >= 6 && rowDarkBright / rowPixels > 0.34) {
      barcodeRows += 1;
    }
    sampledRows += 1;
  }

  const paperShare = total ? paper / total : 0;
  const inkShare = total ? ink / total : 0;
  const lowSaturationShare = total ? lowSaturation / total : 0;
  const skinShare = total ? skin / total : 0;
  const smoothSkinShare = smoothSkinChecks ? smoothSkin / smoothSkinChecks : 0;
  const barcodeRowShare = sampledRows ? barcodeRows / sampledRows : 0;
  const darkFeatureShare = total ? darkFeature / total : 0;

  return {
    paperShare,
    inkShare,
    lowSaturationShare,
    skinShare,
    smoothSkinShare,
    darkFeatureShare,
    textLike: paperShare > 0.28 && inkShare > 0.018 && inkShare < 0.48 && lowSaturationShare > 0.48,
    barcodeLike: barcodeRowShare > 0.08,
  };
}

function barcodePixelState(pixel) {
  if (pixel.saturation > 0.24) {
    return 0;
  }
  if (pixel.luminance > 0.82) {
    return 1;
  }
  if (pixel.luminance < 0.28) {
    return -1;
  }
  return 0;
}

function inspectHumanPortraitPattern() {
  const bounds = state.analysisBounds || { x: 0, y: 0, width: sourceCanvas.width, height: sourceCanvas.height };
  const startX = Math.max(0, Math.floor(bounds.x));
  const startY = Math.max(0, Math.floor(bounds.y));
  const endX = Math.min(sourceCanvas.width, Math.ceil(bounds.x + bounds.width));
  const endY = Math.min(sourceCanvas.height, Math.ceil(bounds.y + bounds.height));
  const width = Math.max(1, endX - startX);
  const height = Math.max(1, endY - startY);
  const sampleEvery = 3;

  let total = 0;
  let skin = 0;
  let centerTotal = 0;
  let centerSkin = 0;
  let upperCenterTotal = 0;
  let upperCenterSkin = 0;
  let darkFeature = 0;
  let skinSmooth = 0;
  let skinSmoothChecks = 0;

  for (let y = startY; y < endY; y += sampleEvery) {
    for (let x = startX; x < endX; x += sampleEvery) {
      const pixel = suitabilityPixelAt(x, y);
      const nx = (x - startX) / width;
      const ny = (y - startY) / height;
      const inCenter = nx > 0.2 && nx < 0.8 && ny > 0.08 && ny < 0.92;
      const inUpperCenter = nx > 0.26 && nx < 0.74 && ny > 0.06 && ny < 0.68;
      const isSkin = isHumanSkinTone(pixel);

      if (inCenter) centerTotal += 1;
      if (inUpperCenter) upperCenterTotal += 1;

      if (isSkin) {
        skin += 1;
        if (inCenter) centerSkin += 1;
        if (inUpperCenter) upperCenterSkin += 1;

        const right = suitabilityPixelAt(Math.min(endX - 1, x + sampleEvery), y);
        const down = suitabilityPixelAt(x, Math.min(endY - 1, y + sampleEvery));
        if (isHumanSkinTone(right)) {
          skinSmooth += Math.abs(pixel.luminance - right.luminance) < 0.08 ? 1 : 0;
          skinSmoothChecks += 1;
        }
        if (isHumanSkinTone(down)) {
          skinSmooth += Math.abs(pixel.luminance - down.luminance) < 0.08 ? 1 : 0;
          skinSmoothChecks += 1;
        }
      }

      if (inUpperCenter && pixel.luminance < 0.28 && pixel.saturation < 0.58) {
        darkFeature += 1;
      }

      total += 1;
    }
  }

  const skinShare = total ? skin / total : 0;
  const centerSkinShare = centerTotal ? centerSkin / centerTotal : 0;
  const upperCenterSkinShare = upperCenterTotal ? upperCenterSkin / upperCenterTotal : 0;

  return {
    skinShare,
    centerSkinShare,
    upperCenterSkinShare,
    centralSkinDominance: skinShare ? centerSkinShare / skinShare : 0,
    darkFeatureShare: upperCenterTotal ? darkFeature / upperCenterTotal : 0,
    skinSmoothShare: skinSmoothChecks ? skinSmooth / skinSmoothChecks : 0,
  };
}

function isHumanSkinTone(pixel) {
  const r = pixel.r;
  const g = pixel.g;
  const b = pixel.b;
  const y = 0.299 * r + 0.587 * g + 0.114 * b;
  const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
  const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

  return r > 45
    && g > 30
    && b > 18
    && r > g * 1.04
    && r > b * 1.16
    && y > 55
    && y < 235
    && cb > 72
    && cb < 142
    && cr > 128
    && cr < 188
    && pixel.saturation > 0.12
    && pixel.saturation < 0.72;
}

function suitabilityPixelAt(x, y) {
  const [r, g, b] = sourceRgbAt(x, y);
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  const saturation = max === 0 ? 0 : (max - min) / max;
  const luminance = analysisValueAt(x, y) / 255;

  return {
    r,
    g,
    b,
    luminance,
    saturation,
    paper: luminance > 0.88 && saturation < 0.14,
    ink: luminance < 0.32 && saturation < 0.26,
    accent: saturation > 0.34 && luminance > 0.18 && luminance < 0.86,
  };
}

function isPaperInkTransition(a, b) {
  return (a.paper && b.ink) || (a.ink && b.paper);
}

function drawSampleTexture(sampleCtx, width, height, sample) {
  sampleCtx.fillStyle = rgb(sample.base);
  sampleCtx.fillRect(0, 0, width, height);
  const image = sampleCtx.getImageData(0, 0, width, height);
  const data = image.data;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const wave = Math.sin((x * 0.02) + (y * 0.055)) * 0.5 + 0.5;
      const grain = randomFromPoint(x, y);
      const fine = randomFromPoint(x * 3 + 12, y * 3 + 7);
      let mix = 0.2 + fine * 0.24;
      let color = sample.base;

      if (sample.mode === "speckle") {
        if (grain > 0.88) color = sample.accent;
        if (grain < 0.18) color = sample.warm;
        mix = grain > 0.82 || grain < 0.22 ? 0.9 : 0.18 + fine * 0.22;
      }

      if (sample.mode === "layered-grain") {
        const layer = Math.sin(y * 0.045 + Math.sin(x * 0.015) * 1.4);
        color = layer > 0.35 ? sample.warm : sample.base;
        if (grain > 0.9) color = sample.accent;
        mix = 0.32 + fine * 0.36;
      }

      if (sample.mode === "banded") {
        const band = Math.sin(y * 0.032 + Math.sin(x * 0.018) * 2.8);
        color = band > 0.18 ? sample.base : sample.accent;
        if (grain > 0.94) color = sample.warm;
        mix = 0.5 + wave * 0.34;
      }

      if (sample.mode === "dark-fine") {
        color = grain > 0.93 ? sample.warm : sample.base;
        if (grain < 0.12) color = sample.accent;
        mix = 0.2 + fine * 0.18;
      }

      data[index] = clampChannel(sample.base[0] * (1 - mix) + color[0] * mix + (fine - 0.5) * 28);
      data[index + 1] = clampChannel(sample.base[1] * (1 - mix) + color[1] * mix + (fine - 0.5) * 28);
      data[index + 2] = clampChannel(sample.base[2] * (1 - mix) + color[2] * mix + (fine - 0.5) * 28);
      data[index + 3] = 255;
    }
  }

  sampleCtx.putImageData(image, 0, 0);
}

function randomFromPoint(x, y) {
  const value = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return value - Math.floor(value);
}

function clampChannel(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function rgb(parts) {
  return `rgb(${parts[0]}, ${parts[1]}, ${parts[2]})`;
}

function createBasicImageMetadata(file) {
  return {
    fileName: file?.name || "Untitled image",
    fileSize: file?.size || 0,
    mimeType: file?.type || "Unknown",
    lastModified: file?.lastModified || null,
    format: inferFormatFromFile(file),
    formatDetail: "",
    encodedWidth: null,
    encodedHeight: null,
    encodedBandCount: null,
    encodedBandLabels: [],
    colorModel: "Unknown",
    bitDepth: "",
    decodedWidth: null,
    decodedHeight: null,
    displayBandCount: null,
    displayBandLabels: [],
    displayNote: "",
    workingBandCount: null,
    workingBandLabels: [],
    workingSourceType: "",
    inferredSingleBand: false,
    canvasInspection: null,
    notes: [],
  };
}

function createGeneratedImageMetadata(name, width, height) {
  return {
    fileName: name,
    fileSize: 0,
    mimeType: "Generated sample",
    lastModified: null,
    format: "Canvas sample",
    formatDetail: "Generated by the demo texture renderer",
    encodedWidth: width,
    encodedHeight: height,
    encodedBandCount: 3,
    encodedBandLabels: ["Red", "Green", "Blue"],
    colorModel: "RGB",
    bitDepth: "8-bit",
    decodedWidth: width,
    decodedHeight: height,
    displayBandCount: 3,
    displayBandLabels: ["Red", "Green", "Blue"],
    displayNote: "Generated RGB canvas sample",
    workingBandCount: 3,
    workingBandLabels: ["Red", "Green", "Blue"],
    workingSourceType: "Generated RGB sample",
    inferredSingleBand: false,
    canvasInspection: null,
    notes: ["Demo samples are generated RGB images, not source raster files."],
  };
}

function createMultibandMetadata(sourceType) {
  return {
    fileName: sourceType,
    fileSize: 0,
    mimeType: "Supplied band set",
    lastModified: null,
    format: "Multiband raster",
    formatDetail: "Loaded through window.loadMultibandBandSet",
    encodedWidth: sourceCanvas.width,
    encodedHeight: sourceCanvas.height,
    encodedBandCount: sourceBandSet.bands.length,
    encodedBandLabels: [...sourceBandSet.labels],
    colorModel: "Numeric raster bands",
    bitDepth: "Normalized to 8-bit for display",
    decodedWidth: sourceCanvas.width,
    decodedHeight: sourceCanvas.height,
    displayBandCount: Math.min(3, sourceBandSet.bands.length),
    displayBandLabels: sourceBandSet.labels.slice(0, Math.min(3, sourceBandSet.bands.length)),
    displayNote: "Rendered from supplied band set",
    workingBandCount: sourceBandSet.bands.length,
    workingBandLabels: [...sourceBandSet.labels],
    workingSourceType: sourceType,
    inferredSingleBand: false,
    canvasInspection: null,
    notes: ["External raster loaders can supply one band or many bands directly."],
  };
}

function readImageMetadata(file, buffer) {
  const metadata = createBasicImageMetadata(file);
  const bytes = new Uint8Array(buffer);
  const parsed = parsePngMetadata(bytes)
    || parseJpegMetadata(bytes)
    || parseGifMetadata(bytes)
    || parseWebpMetadata(bytes)
    || parseBmpMetadata(bytes);

  if (parsed) {
    Object.assign(metadata, parsed);
  } else {
    metadata.notes.push("No supported image header was found. The browser decode will still be used for display and analysis.");
  }

  return metadata;
}

function inferFormatFromFile(file) {
  const mimeType = file?.type || "";
  if (mimeType.includes("jpeg")) return "JPEG";
  if (mimeType.includes("png")) return "PNG";
  if (mimeType.includes("gif")) return "GIF";
  if (mimeType.includes("webp")) return "WebP";
  if (mimeType.includes("bmp")) return "BMP";

  const extension = String(file?.name || "").split(".").pop().toLowerCase();
  const known = {
    jpg: "JPEG",
    jpeg: "JPEG",
    png: "PNG",
    gif: "GIF",
    webp: "WebP",
    bmp: "BMP",
  };
  return known[extension] || "Unknown";
}

function isImageFile(file) {
  if (file?.type) {
    return file.type.startsWith("image/");
  }
  return /\.(jpe?g|png|gif|webp|bmp)$/i.test(file?.name || "");
}

function extensionForMimeType(mimeType) {
  const extensions = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
    "image/bmp": "bmp",
  };
  return extensions[mimeType] || "png";
}

function parsePngMetadata(bytes) {
  const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (!startsWithBytes(bytes, pngSignature) || asciiAt(bytes, 12, 4) !== "IHDR") {
    return null;
  }

  const colorType = bytes[25];
  const colorTypes = {
    0: { model: "Grayscale", labels: ["Gray"] },
    2: { model: "RGB", labels: ["Red", "Green", "Blue"] },
    3: { model: "Indexed color", labels: ["Palette index"] },
    4: { model: "Grayscale with alpha", labels: ["Gray", "Alpha"] },
    6: { model: "RGB with alpha", labels: ["Red", "Green", "Blue", "Alpha"] },
  };
  const colorInfo = colorTypes[colorType] || { model: `PNG color type ${colorType}`, labels: [] };

  return {
    format: "PNG",
    formatDetail: `PNG IHDR color type ${colorType}`,
    encodedWidth: readUint32BE(bytes, 16),
    encodedHeight: readUint32BE(bytes, 20),
    encodedBandCount: colorInfo.labels.length || null,
    encodedBandLabels: colorInfo.labels,
    colorModel: colorInfo.model,
    bitDepth: `${bytes[24]}-bit`,
  };
}

function parseJpegMetadata(bytes) {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    return null;
  }

  let offset = 2;
  while (offset < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    while (bytes[offset] === 0xff) {
      offset += 1;
    }

    const marker = bytes[offset];
    offset += 1;

    if (marker === 0xd9 || marker === 0xda) {
      break;
    }

    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      continue;
    }

    if (offset + 2 > bytes.length) {
      break;
    }

    const length = readUint16BE(bytes, offset);
    const segmentStart = offset + 2;
    if (length < 2 || segmentStart + length - 2 > bytes.length) {
      break;
    }

    if (isJpegSofMarker(marker)) {
      const componentCount = bytes[segmentStart + 5];
      const componentInfo = jpegComponentInfo(componentCount);
      return {
        format: "JPEG",
        formatDetail: `JPEG SOF marker 0x${marker.toString(16).toUpperCase()}`,
        encodedWidth: readUint16BE(bytes, segmentStart + 3),
        encodedHeight: readUint16BE(bytes, segmentStart + 1),
        encodedBandCount: componentCount,
        encodedBandLabels: componentInfo.labels,
        colorModel: componentInfo.model,
        bitDepth: `${bytes[segmentStart]}-bit`,
      };
    }

    offset += length;
  }

  return {
    format: "JPEG",
    colorModel: "Unknown JPEG color model",
    notes: ["JPEG header was found, but no start-of-frame metadata was available before the compressed image data."],
  };
}

function parseGifMetadata(bytes) {
  const header = asciiAt(bytes, 0, 6);
  if (header !== "GIF87a" && header !== "GIF89a") {
    return null;
  }

  const packed = bytes[10] || 0;
  const colorResolution = ((packed >> 4) & 0x07) + 1;
  return {
    format: "GIF",
    formatDetail: header,
    encodedWidth: readUint16LE(bytes, 6),
    encodedHeight: readUint16LE(bytes, 8),
    encodedBandCount: 1,
    encodedBandLabels: ["Palette index"],
    colorModel: "Indexed color",
    bitDepth: `${colorResolution}-bit palette`,
  };
}

function parseWebpMetadata(bytes) {
  if (asciiAt(bytes, 0, 4) !== "RIFF" || asciiAt(bytes, 8, 4) !== "WEBP") {
    return null;
  }

  let offset = 12;
  while (offset + 8 <= bytes.length) {
    const chunkType = asciiAt(bytes, offset, 4);
    const chunkSize = readUint32LE(bytes, offset + 4);
    const dataOffset = offset + 8;

    if (chunkType === "VP8X" && dataOffset + 10 <= bytes.length) {
      const flags = bytes[dataOffset];
      return {
        format: "WebP",
        formatDetail: "Extended WebP",
        encodedWidth: 1 + readUint24LE(bytes, dataOffset + 4),
        encodedHeight: 1 + readUint24LE(bytes, dataOffset + 7),
        encodedBandCount: flags & 0x10 ? 4 : 3,
        encodedBandLabels: flags & 0x10 ? ["Red", "Green", "Blue", "Alpha"] : ["Red", "Green", "Blue"],
        colorModel: flags & 0x10 ? "RGB with alpha" : "RGB",
        bitDepth: "8-bit",
      };
    }

    if (chunkType === "VP8 " && dataOffset + 10 <= bytes.length) {
      return {
        format: "WebP",
        formatDetail: "Lossy WebP",
        encodedWidth: readUint16LE(bytes, dataOffset + 6) & 0x3fff,
        encodedHeight: readUint16LE(bytes, dataOffset + 8) & 0x3fff,
        encodedBandCount: 3,
        encodedBandLabels: ["Red", "Green", "Blue"],
        colorModel: "RGB",
        bitDepth: "8-bit",
      };
    }

    if (chunkType === "VP8L" && dataOffset + 5 <= bytes.length) {
      const b0 = bytes[dataOffset + 1];
      const b1 = bytes[dataOffset + 2];
      const b2 = bytes[dataOffset + 3];
      const b3 = bytes[dataOffset + 4];
      return {
        format: "WebP",
        formatDetail: "Lossless WebP",
        encodedWidth: 1 + (((b1 & 0x3f) << 8) | b0),
        encodedHeight: 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6)),
        encodedBandCount: 4,
        encodedBandLabels: ["Red", "Green", "Blue", "Alpha"],
        colorModel: "RGB with optional alpha",
        bitDepth: "8-bit",
      };
    }

    offset = dataOffset + chunkSize + (chunkSize % 2);
  }

  return {
    format: "WebP",
    colorModel: "Unknown WebP color model",
    notes: ["WebP header was found, but dimensions and bands could not be resolved from supported chunks."],
  };
}

function parseBmpMetadata(bytes) {
  if (asciiAt(bytes, 0, 2) !== "BM" || bytes.length < 30) {
    return null;
  }

  const bitDepth = readUint16LE(bytes, 28);
  const bandInfo = bmpBandInfo(bitDepth);
  return {
    format: "BMP",
    formatDetail: "Bitmap image",
    encodedWidth: Math.abs(readInt32LE(bytes, 18)),
    encodedHeight: Math.abs(readInt32LE(bytes, 22)),
    encodedBandCount: bandInfo.count,
    encodedBandLabels: bandInfo.labels,
    colorModel: bandInfo.model,
    bitDepth: `${bitDepth}-bit`,
  };
}

function jpegComponentInfo(componentCount) {
  if (componentCount === 1) {
    return { model: "Grayscale", labels: ["Gray"] };
  }
  if (componentCount === 3) {
    return { model: "YCbCr or RGB", labels: ["Red/YCbCr Y", "Green/Cb", "Blue/Cr"] };
  }
  if (componentCount === 4) {
    return { model: "CMYK or YCCK", labels: ["C/Y", "M/Cb", "Y/Cr", "K"] };
  }
  return {
    model: `${componentCount} JPEG components`,
    labels: Array.from({ length: componentCount }, (_, index) => `Component ${index + 1}`),
  };
}

function bmpBandInfo(bitDepth) {
  if (bitDepth <= 8) {
    return { count: 1, labels: ["Palette index"], model: "Indexed color" };
  }
  if (bitDepth === 32) {
    return { count: 4, labels: ["Blue", "Green", "Red", "Alpha"], model: "BGRA" };
  }
  return { count: 3, labels: ["Blue", "Green", "Red"], model: "BGR" };
}

function isJpegSofMarker(marker) {
  return [
    0xc0, 0xc1, 0xc2, 0xc3,
    0xc5, 0xc6, 0xc7,
    0xc9, 0xca, 0xcb,
    0xcd, 0xce, 0xcf,
  ].includes(marker);
}

function startsWithBytes(bytes, signature) {
  return signature.every((value, index) => bytes[index] === value);
}

function asciiAt(bytes, offset, length) {
  if (offset + length > bytes.length) {
    return "";
  }
  let text = "";
  for (let index = 0; index < length; index += 1) {
    text += String.fromCharCode(bytes[offset + index]);
  }
  return text;
}

function readUint16BE(bytes, offset) {
  return (bytes[offset] << 8) | bytes[offset + 1];
}

function readUint32BE(bytes, offset) {
  return ((bytes[offset] * 0x1000000) + ((bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3])) >>> 0;
}

function readUint16LE(bytes, offset) {
  return bytes[offset] | (bytes[offset + 1] << 8);
}

function readUint24LE(bytes, offset) {
  return bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16);
}

function readUint32LE(bytes, offset) {
  return (bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24)) >>> 0;
}

function readInt32LE(bytes, offset) {
  const value = readUint32LE(bytes, offset);
  return value > 0x7fffffff ? value - 0x100000000 : value;
}

function inspectDecodedCanvasBands(bounds) {
  const startX = Math.max(0, Math.floor(bounds.x));
  const startY = Math.max(0, Math.floor(bounds.y));
  const endX = Math.min(sourceCanvas.width, Math.ceil(bounds.x + bounds.width));
  const endY = Math.min(sourceCanvas.height, Math.ceil(bounds.y + bounds.height));
  const image = sourceCtx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
  const sampleEvery = 4;

  let count = 0;
  let closeChannels = 0;
  let spreadTotal = 0;
  let spreadMax = 0;

  for (let y = startY; y < endY; y += sampleEvery) {
    for (let x = startX; x < endX; x += sampleEvery) {
      const index = (y * sourceCanvas.width + x) * 4;
      const r = image.data[index];
      const g = image.data[index + 1];
      const b = image.data[index + 2];
      const spread = Math.max(r, g, b) - Math.min(r, g, b);

      spreadTotal += spread;
      spreadMax = Math.max(spreadMax, spread);
      if (spread <= 4) {
        closeChannels += 1;
      }
      count += 1;
    }
  }

  const averageSpread = count ? spreadTotal / count : 0;
  const closeShare = count ? closeChannels / count : 0;

  return {
    averageSpread,
    maxSpread: spreadMax,
    closeShare,
    isLikelySingleBandGray: count > 0 && averageSpread <= 2.5 && closeShare >= 0.98,
  };
}

function metadataUsesSingleGrayBand(metadata) {
  return metadata?.encodedBandLabels?.[0] === "Gray" && String(metadata?.colorModel || "").includes("Grayscale");
}

function shouldUseSingleGrayBand(metadata, inspection) {
  return metadataUsesSingleGrayBand(metadata) || Boolean(inspection?.isLikelySingleBandGray);
}

function syncMetadataWithWorkingBands(metadata, canvasInfo = {}) {
  if (!metadata) {
    return;
  }

  metadata.decodedWidth = canvasInfo.decodedWidth || metadata.decodedWidth;
  metadata.decodedHeight = canvasInfo.decodedHeight || metadata.decodedHeight;
  metadata.displayBandCount = canvasInfo.displayBandCount || metadata.displayBandCount || 3;
  metadata.displayBandLabels = canvasInfo.displayBandLabels || metadata.displayBandLabels || ["Red", "Green", "Blue"];
  metadata.displayNote = canvasInfo.displayNote || metadata.displayNote || "Browser display decode";
  metadata.workingBandCount = sourceBandSet.bands.length;
  metadata.workingBandLabels = [...sourceBandSet.labels];
  metadata.workingSourceType = sourceBandSet.sourceType;
  metadata.inferredSingleBand = Boolean(canvasInfo.inferredSingleBand);
  metadata.canvasInspection = canvasInfo.canvasInspection || metadata.canvasInspection;
}

function rebuildBandSetFromSourceCanvas(sourceType, options = {}) {
  const image = sourceCtx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
  const totalPixels = sourceCanvas.width * sourceCanvas.height;
  const singleGrayBand = Boolean(options.singleGrayBand);
  const gray = singleGrayBand ? new Uint8ClampedArray(totalPixels) : null;
  const red = new Uint8ClampedArray(totalPixels);
  const green = new Uint8ClampedArray(totalPixels);
  const blue = new Uint8ClampedArray(totalPixels);

  for (let index = 0, pixel = 0; index < image.data.length; index += 4, pixel += 1) {
    const r = image.data[index];
    const g = image.data[index + 1];
    const b = image.data[index + 2];
    red[pixel] = r;
    green[pixel] = g;
    blue[pixel] = b;
    if (gray) {
      gray[pixel] = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
    }
  }

  setSourceBandSet({
    width: sourceCanvas.width,
    height: sourceCanvas.height,
    bands: gray ? [gray] : [red, green, blue],
    labels: gray ? ["Gray"] : ["Red", "Green", "Blue"],
    sourceType,
  });
}

function setSourceBandSet({ width, height, bands, labels = [], sourceType = "multiband image" }) {
  const totalPixels = width * height;
  const normalizedBands = bands
    .filter((band) => band && band.length === totalPixels)
    .map((band) => band instanceof Uint8ClampedArray ? band : normalizeBandToByteRange(band));

  if (!normalizedBands.length) {
    throw new Error(`No valid bands supplied. Expected one value per pixel (${totalPixels.toLocaleString()} values per band).`);
  }

  sourceBandSet = {
    width,
    height,
    bands: normalizedBands,
    labels: normalizedBands.map((_, index) => labels[index] || `Band ${index + 1}`),
    sourceType,
  };
}

function normalizeBandToByteRange(band) {
  let min = Infinity;
  let max = -Infinity;

  for (const value of band) {
    if (!Number.isFinite(value)) continue;
    if (value < min) min = value;
    if (value > max) max = value;
  }

  const range = Math.max(1, max - min);
  const normalized = new Uint8ClampedArray(band.length);
  for (let index = 0; index < band.length; index += 1) {
    const value = Number.isFinite(band[index]) ? band[index] : min;
    normalized[index] = clampChannel(((value - min) / range) * 255);
  }
  return normalized;
}

function pixelOffset(x, y) {
  return y * sourceBandSet.width + x;
}

function bandValueAt(x, y, bandIndex) {
  const band = sourceBandSet.bands[bandIndex];
  return band ? band[pixelOffset(x, y)] : 0;
}

function sourceRgbAt(x, y) {
  if (sourceBandSet.bands.length >= 3) {
    return [
      bandValueAt(x, y, 0),
      bandValueAt(x, y, 1),
      bandValueAt(x, y, 2),
    ];
  }

  const value = analysisValueAt(x, y);
  return [value, value, value];
}

function analysisValueAt(x, y) {
  const bandCount = sourceBandSet.bands.length;
  if (bandCount > 3) {
    let total = 0;
    for (let index = 0; index < bandCount; index += 1) {
      total += bandValueAt(x, y, index);
    }
    return Math.round(total / bandCount);
  }

  if (bandCount === 3) {
    const r = bandValueAt(x, y, 0);
    const g = bandValueAt(x, y, 1);
    const b = bandValueAt(x, y, 2);
    return Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
  }

  if (bandCount === 1) {
    return bandValueAt(x, y, 0);
  }

  return 0;
}

function bandDescription() {
  const count = sourceBandSet.bands.length;
  if (!count) {
    return "No bands loaded";
  }
  return `${count} band${count === 1 ? "" : "s"}: ${sourceBandSet.labels.join(", ")}`;
}

function paintBandSetToSourceCanvas() {
  const image = sourceCtx.createImageData(sourceCanvas.width, sourceCanvas.height);

  for (let y = 0; y < sourceCanvas.height; y += 1) {
    for (let x = 0; x < sourceCanvas.width; x += 1) {
      const [r, g, b] = sourceRgbAt(x, y);
      const index = (y * sourceCanvas.width + x) * 4;
      image.data[index] = r;
      image.data[index + 1] = g;
      image.data[index + 2] = b;
      image.data[index + 3] = 255;
    }
  }

  sourceCtx.putImageData(image, 0, 0);
}

function loadMultibandBandSet({ bands, labels = [], sourceType = "multiband image" }) {
  setSourceBandSet({
    width: sourceCanvas.width,
    height: sourceCanvas.height,
    bands,
    labels,
    sourceType,
  });
  paintBandSetToSourceCanvas();
  state.imageLoaded = true;
  state.imageName = `${sourceType} (${bandDescription()})`;
  state.analysisBounds = { x: 0, y: 0, width: canvas.width, height: canvas.height };
  state.lastPixelClassification = null;
  state.imageMetadata = createMultibandMetadata(sourceType);
  syncMetadataWithWorkingBands(state.imageMetadata, {
    decodedWidth: sourceCanvas.width,
    decodedHeight: sourceCanvas.height,
    displayBandCount: Math.min(3, sourceBandSet.bands.length),
    displayBandLabels: sourceBandSet.labels.slice(0, Math.min(3, sourceBandSet.bands.length)),
    displayNote: "Rendered from supplied band set",
    inferredSingleBand: false,
  });
  renderSourceImage({ restoreCaption: true });
  renderImageMetadata(state.imageMetadata);
  imageStatus.textContent = state.imageName;
  analyzeCurrentCanvas();
  if (state.activePack === "classification") {
    runPixelClassification();
  }
}

window.loadMultibandBandSet = loadMultibandBandSet;

function renderSourceImage({ restoreCaption = false } = {}) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(sourceCanvas, 0, 0);
  clearCalloutLayer();
  if (restoreCaption && state.imageLoaded && state.imageName) {
    previewCaption.textContent = state.imageName;
  }
}

function updateVisibleSections() {
  modeSections.forEach((section) => {
    const modes = (section.dataset.visibleModes || "").split(/\s+/);
    section.classList.toggle("is-hidden", !modes.includes(state.activePack));
  });
}

function setZoom(nextZoom) {
  const previousZoom = state.zoom;
  state.zoom = clamp(nextZoom, 0.5, 3);
  canvas.style.width = `${state.zoom * 100}%`;
  zoomLevel.textContent = `${Math.round(state.zoom * 100)}%`;

  const scaleRatio = previousZoom ? state.zoom / previousZoom : 1;
  canvasViewport.scrollLeft = (canvasViewport.scrollLeft + canvasViewport.clientWidth / 2) * scaleRatio - canvasViewport.clientWidth / 2;
  canvasViewport.scrollTop = (canvasViewport.scrollTop + canvasViewport.clientHeight / 2) * scaleRatio - canvasViewport.clientHeight / 2;
  window.requestAnimationFrame(updateCalloutPositions);
}

function analyzeCurrentCanvas() {
  const features = extractFeatures();
  refreshClassificationOptions(features);
  updateCatalogStatus();
  const results = classifyWithHeuristics(features, getAnalysisPack());
  renderResults(results, features);
}

function getAnalysisPack() {
  return state.activePack === "classification"
    ? categoryPacks.geology
    : categoryPacks[state.activePack];
}

function extractFeatures() {
  const width = canvas.width;
  const height = canvas.height;
  const bounds = state.analysisBounds || { x: 0, y: 0, width, height };
  const startX = Math.max(0, Math.floor(bounds.x));
  const startY = Math.max(0, Math.floor(bounds.y));
  const endX = Math.min(width, Math.ceil(bounds.x + bounds.width));
  const endY = Math.min(height, Math.ceil(bounds.y + bounds.height));
  const sampleEvery = 4;
  const luminanceRows = new Float32Array(height);
  const luminanceCols = new Float32Array(width);
  const rowCounts = new Uint16Array(height);
  const colCounts = new Uint16Array(width);

  let red = 0;
  let green = 0;
  let blue = 0;
  let brightness = 0;
  let saturation = 0;
  let warm = 0;
  let texture = 0;
  let edge = 0;
  let count = 0;
  let previousLum = null;

  for (let y = startY; y < endY; y += sampleEvery) {
    for (let x = startX; x < endX; x += sampleEvery) {
      const [r, g, b] = sourceRgbAt(x, y);
      const lum = analysisValueAt(x, y) / 255;
      const max = Math.max(r, g, b) / 255;
      const min = Math.min(r, g, b) / 255;
      const sat = max === 0 ? 0 : (max - min) / max;
      const warmth = clamp(((r - b) / 255 + 1) / 2);

      red += r / 255;
      green += g / 255;
      blue += b / 255;
      brightness += lum;
      saturation += sat;
      warm += warmth;
      luminanceRows[y] += lum;
      luminanceCols[x] += lum;
      rowCounts[y] += 1;
      colCounts[x] += 1;

      if (previousLum !== null) {
        texture += Math.abs(lum - previousLum);
      }

      const rightLum = analysisValueAt(Math.min(endX - 1, x + sampleEvery), y) / 255;
      const downLum = analysisValueAt(x, Math.min(endY - 1, y + sampleEvery)) / 255;
      edge += Math.abs(lum - rightLum) + Math.abs(lum - downLum);

      previousLum = lum;
      count += 1;
    }
  }

  const avgBrightness = brightness / count;
  const avgTexture = clamp((texture / count) * 7);
  const avgEdge = clamp((edge / count) * 5);
  const banding = calculateBanding(luminanceRows, rowCounts, luminanceCols, colCounts);
  const dominantTone = describeTone(red / count, green / count, blue / count);

  return {
    brightness: avgBrightness,
    saturation: saturation / count,
    warm: warm / count,
    texture: avgTexture,
    edge: avgEdge,
    banding,
    darkness: 1 - avgBrightness,
    dominantTone,
  };
}

function calculateBanding(rows, rowCounts, cols, colCounts) {
  const rowVariance = averageNeighborDifference(rows, rowCounts);
  const colVariance = averageNeighborDifference(cols, colCounts);
  const strongerAxis = Math.max(rowVariance, colVariance);
  const weakerAxis = Math.min(rowVariance, colVariance);
  return clamp((strongerAxis - weakerAxis * 0.42) * 7);
}

function averageNeighborDifference(values, counts) {
  let previous = null;
  let total = 0;
  let count = 0;

  for (let index = 0; index < values.length; index += 1) {
    if (!counts[index]) {
      continue;
    }
    const value = values[index] / counts[index];
    if (previous !== null) {
      total += Math.abs(value - previous);
      count += 1;
    }
    previous = value;
  }

  return count ? total / count : 0;
}

function describeTone(red, green, blue) {
  if (red > green * 1.14 && red > blue * 1.18) return "warm red-brown";
  if (red > blue * 1.08 && green > blue * 1.03) return "tan or buff";
  if (blue > red * 1.08 && green > red * 1.04) return "cool gray";
  if ((red + green + blue) / 3 < 0.24) return "dark neutral";
  if ((red + green + blue) / 3 > 0.72) return "light neutral";
  return "mixed neutral";
}

function classifyWithHeuristics(features, pack) {
  const featureKeys = ["brightness", "saturation", "warm", "texture", "edge", "banding", "darkness"];
  const scored = pack.categories.map((category) => {
    const closeness = featureKeys.reduce((sum, key) => {
      const tolerance = key === "warm" ? 0.38 : 0.34;
      return sum + distanceScore(features[key], category.weights[key], tolerance);
    }, 0);
    const score = closeness / featureKeys.length;
    return {
      ...category,
      score,
      confidence: confidenceFromScore(score),
    };
  });

  return scored.sort((a, b) => b.score - a.score);
}

function confidenceFromScore(score) {
  return clamp(0.18 + score * 0.78);
}

function renderResults(results, features) {
  const [top, ...alternatives] = results;
  const visibleAlternatives = alternatives.slice(0, 4);
  const confidenceText = percent(top.confidence);

  if (state.activePack !== "classification") {
    resultSummary.innerHTML = `
      <div class="prediction">
        <div class="prediction__label">
          <strong>${escapeHtml(top.label)}</strong>
          <span class="badge">${escapeHtml(top.family)}</span>
        </div>
        <div class="confidence" aria-label="Confidence ${confidenceText}">
          <span>${confidenceText} confidence</span>
          <div class="confidence__track">
            <div class="confidence__bar" style="width: ${confidenceText}"></div>
          </div>
        </div>
      </div>
      <ul class="alternatives" aria-label="Alternative classifications">
        ${visibleAlternatives.map((item) => `
          <li class="alternative">
            <span>${escapeHtml(item.label)} <small>${escapeHtml(item.family)}</small></span>
            <strong>${percent(item.confidence)}</strong>
          </li>
        `).join("")}
      </ul>
    `;
  }

  if (state.activePack !== "classification") {
    renderMetrics(features);
  }
  if (state.activePack === "geology") {
    renderGeologyPixelRanges([top, ...visibleAlternatives], features);
  }
  renderGeomorphology(top, features);
  renderEvidence(top, features);
}

function runPixelClassification() {
  if (!state.imageLoaded) {
    renderPixelClassMessage("Load an image before classifying pixel values.", "error");
    pixelClassResults.innerHTML = "";
    state.lastPixelClassification = null;
    renderSourceImage({ restoreCaption: true });
    return;
  }

  const requestedClasses = Number(pixelClassCount.value);
  if (!Number.isInteger(requestedClasses) || requestedClasses < 1) {
    renderPixelClassMessage("Enter a whole number of classes greater than zero.", "error");
    pixelClassResults.innerHTML = "";
    state.lastPixelClassification = null;
    renderSourceImage({ restoreCaption: true });
    return;
  }

  const stats = extractPixelValueStats();
  pixelClassCount.max = String(stats.totalPixels);

  if (requestedClasses > stats.totalPixels) {
    renderPixelClassMessage(`Rejected: ${requestedClasses.toLocaleString()} classes is greater than ${stats.totalPixels.toLocaleString()} analyzed pixels.`, "error");
    pixelClassResults.innerHTML = "";
    state.lastPixelClassification = null;
    renderSourceImage({ restoreCaption: true });
    return;
  }

  if (requestedClasses > 100) {
    renderPixelClassMessage("Rejected: more than 100 classes cannot satisfy the minimum 1% pixel share rule.", "error");
    pixelClassResults.innerHTML = `
      <p class="form-message">Observed pixel range: ${stats.low}-${stats.high}. Total analyzed pixels: ${stats.totalPixels.toLocaleString()}.</p>
    `;
    state.lastPixelClassification = null;
    renderSourceImage({ restoreCaption: true });
    return;
  }

  const features = extractFeatures();
  const visibleCategories = buildVisibleClassificationOptions(features);
  state.classificationOptions = visibleCategories;

  if (!visibleCategories.length) {
    renderPixelClassMessage(`No ${classificationSourceLabel().toLowerCase()} matches are available for Classification labels.`, "error");
    pixelClassResults.innerHTML = "";
    state.lastPixelClassification = null;
    renderSourceImage({ restoreCaption: true });
    return;
  }

  const visiblePack = { label: "Visible classes", categories: visibleCategories };
  const visibleResults = classifyWithHeuristics(features, visiblePack);
  const classification = classifyPixelValues(stats, requestedClasses, features, visibleResults, visibleCategories);
  const smallestClass = classification.classes.reduce((lowest, item) => Math.min(lowest, item.percent), 1);
  const mergeMessage = classification.rawClassCount > classification.classes.length
    ? ` Merged ${classification.rawClassCount} pixel bins into ${classification.classes.length} interpreted classes.`
    : "";

  if (smallestClass < 0.01) {
    const smallestLabel = formatPixelPercent(smallestClass);
    classification.classes.forEach((item) => {
      item.included = item.percent >= 0.01;
    });
    state.lastPixelClassification = { classification, stats };
    renderPixelClassMessage(`Classes below 1% start unchecked. Smallest class is ${smallestLabel}; use the checkboxes to review or hide classes.${mergeMessage}`, "success");
    renderPixelClassResults(classification, stats);
    renderSourceImage({ restoreCaption: true });
    applyPixelClassificationOverlay(classification, stats);
    return;
  }

  renderPixelClassMessage(`Accepted: ${classification.classes.length.toLocaleString()} interpreted classes from low ${stats.low} to high ${stats.high}, labeled from ${classificationSourceLabel()}. Use each result checkbox to show or hide that class.${mergeMessage}`, "success");
  state.lastPixelClassification = { classification, stats };
  renderPixelClassResults(classification, stats);
  applyPixelClassificationOverlay(classification, stats);
}

function extractPixelValueStats() {
  const width = canvas.width;
  const height = canvas.height;
  const bounds = state.analysisBounds || { x: 0, y: 0, width, height };
  const startX = Math.max(0, Math.floor(bounds.x));
  const startY = Math.max(0, Math.floor(bounds.y));
  const endX = Math.min(width, Math.ceil(bounds.x + bounds.width));
  const endY = Math.min(height, Math.ceil(bounds.y + bounds.height));
  const totalPixels = Math.max(0, (endX - startX) * (endY - startY));
  const values = new Uint8Array(totalPixels);

  let low = 255;
  let high = 0;
  let valueIndex = 0;

  for (let y = startY; y < endY; y += 1) {
    for (let x = startX; x < endX; x += 1) {
      const value = analysisValueAt(x, y);
      values[valueIndex] = value;
      valueIndex += 1;
      if (value < low) low = value;
      if (value > high) high = value;
    }
  }

  return {
    values,
    low,
    high,
    totalPixels,
  };
}

function classifyPixelValues(stats, requestedClasses, features, categoryResults, selectedCategories = state.classificationOptions) {
  const range = stats.high - stats.low + 1;
  const interval = range / requestedClasses;
  const classes = Array.from({ length: requestedClasses }, (_, index) => {
    const low = Math.floor(stats.low + index * interval);
    const high = index === requestedClasses - 1
      ? stats.high
      : Math.floor(stats.low + (index + 1) * interval) - 1;

    return {
      id: index + 1,
      rawId: index + 1,
      low,
      high: Math.max(low, high),
      count: 0,
      percent: 0,
      color: colorForClass(index),
      category: "",
      geologyLabel: "",
      categoryReason: "",
      included: true,
      segments: [],
    };
  });

  for (const value of stats.values) {
    const rawIndex = Math.floor((value - stats.low) / interval);
    const classIndex = Math.min(requestedClasses - 1, Math.max(0, rawIndex));
    classes[classIndex].count += 1;
  }

  const usedGeologyLabels = new Set();
  classes.forEach((item) => {
    item.percent = item.count / stats.totalPixels;
    const suggestion = suggestVisibleCategory(item, stats, features, categoryResults, usedGeologyLabels, selectedCategories);
    item.category = suggestion.text;
    item.geologyLabel = suggestion.label;
    item.categoryReason = suggestion.reason;
    item.segments = [{ low: item.low, high: item.high, count: item.count, rawId: item.rawId }];
    usedGeologyLabels.add(suggestion.label);
  });

  return mergeSimilarClassificationClasses(classes, stats, requestedClasses);
}

function mergeSimilarClassificationClasses(classes, stats, rawClassCount) {
  const groups = new Map();
  const orderedGroups = [];

  classes.forEach((item) => {
    const key = item.category.toLowerCase();
    if (!groups.has(key)) {
      const group = {
        id: orderedGroups.length + 1,
        sourceRawIds: [],
        low: item.low,
        high: item.high,
        count: 0,
        percent: 0,
        color: colorForClass(orderedGroups.length),
        category: item.category,
        geologyLabel: item.geologyLabel,
        categoryReason: item.categoryReason,
        included: true,
        segments: [],
      };
      groups.set(key, group);
      orderedGroups.push(group);
    }

    const group = groups.get(key);
    group.low = Math.min(group.low, item.low);
    group.high = Math.max(group.high, item.high);
    group.count += item.count;
    group.sourceRawIds.push(item.rawId);
    group.segments.push(...item.segments);
  });

  const valueClassMap = new Int16Array(256).fill(-1);
  orderedGroups.forEach((item, index) => {
    item.id = index + 1;
    item.percent = item.count / stats.totalPixels;
    item.segmentCount = item.segments.length;

    if (item.segmentCount > 1) {
      item.categoryReason = `Merged ${item.segmentCount} pixel bins because they share the same interpretation. ${item.categoryReason}`;
    }

    item.segments.forEach((segment) => {
      for (let value = segment.low; value <= segment.high; value += 1) {
        valueClassMap[value] = index;
      }
    });
  });

  return {
    classes: orderedGroups,
    rawClassCount,
    mergedCount: rawClassCount - orderedGroups.length,
    valueClassMap,
  };
}

function getRawPixelClassIndex(value, stats, classCount) {
  const interval = (stats.high - stats.low + 1) / classCount;
  const rawIndex = Math.floor((value - stats.low) / interval);
  return Math.min(classCount - 1, Math.max(0, rawIndex));
}

function getClassificationClassIndex(value, classification, stats) {
  if (classification.valueClassMap) {
    return classification.valueClassMap[value] ?? -1;
  }
  return getRawPixelClassIndex(value, stats, classification.classes.length);
}

function colorForClass(index) {
  const base = pixelPalette[index % pixelPalette.length];
  const cycle = Math.floor(index / pixelPalette.length);
  if (!cycle) {
    return base;
  }
  const lift = Math.min(45, cycle * 16);
  return base.map((channel) => Math.min(245, channel + lift));
}

function colorToCss(color) {
  return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
}

function suggestVisibleCategory(item, stats, features, categoryResults, usedGeologyLabels, selectedCategories) {
  const midpoint = (item.low + item.high) / 2;
  const brightness = midpoint / 255;
  const darkness = 1 - brightness;
  const rankedBias = new Map(categoryResults.map((item, index) => [item.optionKey || item.id, Math.max(0, 0.14 - index * 0.018)]));
  const candidates = selectedCategories
    .map((category) => {
      const alreadyUsedPenalty = usedGeologyLabels.has(category.label) ? 0.08 : 0;
      const score =
        distanceScore(brightness, category.weights.brightness, 0.28) * 0.34 +
        distanceScore(darkness, category.weights.darkness, 0.28) * 0.22 +
        distanceScore(features.warm, category.weights.warm, 0.42) * 0.12 +
        distanceScore(features.texture, category.weights.texture, 0.42) * 0.12 +
        distanceScore(features.edge, category.weights.edge, 0.42) * 0.08 +
        distanceScore(features.banding, category.weights.banding, 0.42) * 0.08 +
        (rankedBias.get(category.optionKey || category.id) || 0) -
        alreadyUsedPenalty;

      return { category, score };
    })
    .sort((a, b) => b.score - a.score);

  const best = candidates[0].category;
  const tone = describePixelTone(brightness);
  const reason = `${tone} pixels are closest to ${best.label} using brightness plus image texture, color, edge, and banding cues.`;

  return {
    label: best.label,
    text: `Possible ${best.label} (${classificationCategoryContext(best)})`,
    reason,
  };
}

function classificationCategoryContext(category) {
  if (category.sourcePack === "geology") {
    return category.family || "Geology";
  }
  if (category.sourcePack === "geomorphology") {
    return "Geomorphology";
  }
  return category.family || category.sourceLabel || "Classification";
}

function describePixelTone(brightness) {
  if (brightness < 0.18) return "very low-value";
  if (brightness < 0.36) return "low-value";
  if (brightness < 0.62) return "midtone";
  if (brightness < 0.82) return "high-value";
  return "very high-value";
}

function applyPixelClassificationOverlay(classification, stats) {
  const width = canvas.width;
  const height = canvas.height;
  const bounds = state.analysisBounds || { x: 0, y: 0, width, height };
  const startX = Math.max(0, Math.floor(bounds.x));
  const startY = Math.max(0, Math.floor(bounds.y));
  const endX = Math.min(width, Math.ceil(bounds.x + bounds.width));
  const endY = Math.min(height, Math.ceil(bounds.y + bounds.height));
  const image = sourceCtx.getImageData(0, 0, width, height);
  const data = image.data;
  const labelStats = classification.classes.map(() => ({ count: 0, sumX: 0, sumY: 0 }));
  const includedCount = classification.classes.filter((item) => item.included !== false).length;

  for (let y = startY; y < endY; y += 1) {
    for (let x = startX; x < endX; x += 1) {
      const index = (y * width + x) * 4;
      const value = analysisValueAt(x, y);
      const classIndex = getClassificationClassIndex(value, classification, stats);
      if (classIndex < 0) {
        continue;
      }
      const classItem = classification.classes[classIndex];
      if (classItem.included === false) {
        continue;
      }

      const color = classItem.color;

      data[index] = Math.round(data[index] * 0.28 + color[0] * 0.72);
      data[index + 1] = Math.round(data[index + 1] * 0.28 + color[1] * 0.72);
      data[index + 2] = Math.round(data[index + 2] * 0.28 + color[2] * 0.72);

      labelStats[classIndex].count += 1;
      labelStats[classIndex].sumX += x;
      labelStats[classIndex].sumY += y;
    }
  }

  ctx.putImageData(image, 0, 0);
  renderPixelClassCallouts(classification, labelStats);
  previewCaption.textContent = includedCount
    ? `Geology-labeled pixel overlay: ${includedCount} of ${classification.classes.length} colored classes shown across ${stats.totalPixels.toLocaleString()} pixels.`
    : "Pixel classification overlay hidden. Select at least one result checkbox to show a class.";
}

function renderPixelClassCallouts(classification, labelStats) {
  state.lastCallouts = classification.classes
    .map((item, index) => ({ item, stats: labelStats[index] }))
    .filter(({ item, stats }) => item.included !== false && stats.count > 0)
    .sort((a, b) => b.stats.count - a.stats.count)
    .slice(0, 8)
    .map(({ item, stats }) => ({
      id: item.id,
      label: `C${item.id} ${item.geologyLabel}`,
      detail: formatPixelPercent(item.percent),
      color: item.color,
      x: stats.sumX / stats.count,
      y: stats.sumY / stats.count,
    }));

  updateCalloutPositions();
}

function updateCalloutPositions() {
  if (!state.lastCallouts.length || state.activePack !== "classification") {
    clearCalloutLayer();
    return;
  }

  const viewportRect = canvasViewport.getBoundingClientRect();
  const canvasRect = canvas.getBoundingClientRect();
  const viewportWidth = Math.max(0, viewportRect.width);
  const viewportHeight = Math.max(0, viewportRect.height);

  if (!viewportWidth || !viewportHeight) {
    clearCalloutLayer();
    return;
  }

  calloutLayer.style.display = "block";
  calloutLayer.style.left = `${viewportRect.left}px`;
  calloutLayer.style.top = `${viewportRect.top}px`;
  calloutLayer.style.width = `${viewportWidth}px`;
  calloutLayer.style.height = `${viewportHeight}px`;

  const scale = canvasRect.width / canvas.width;
  const callouts = state.lastCallouts
    .map((callout) => ({
      ...callout,
      anchorX: canvasRect.left - viewportRect.left + callout.x * scale,
      anchorY: canvasRect.top - viewportRect.top + callout.y * scale,
    }))
    .sort((a, b) => a.anchorY - b.anchorY);

  const labelWidth = Math.min(220, Math.max(150, viewportWidth * 0.42));
  const labelHeight = 46;
  const pad = 10;
  const slotHeight = viewportHeight / Math.max(1, callouts.length);
  const lines = [];
  const labels = [];

  callouts.forEach((callout, index) => {
    const anchorX = clamp(callout.anchorX, pad, viewportWidth - pad);
    const anchorY = clamp(callout.anchorY, pad, viewportHeight - pad);
    const useLeft = index % 2 === 0 ? anchorX > viewportWidth * 0.42 : anchorX > viewportWidth * 0.58;
    const labelLeft = useLeft ? pad : viewportWidth - labelWidth - pad;
    const labelTop = clamp(slotHeight * (index + 0.5) - labelHeight / 2, pad, viewportHeight - labelHeight - pad);
    const edgeX = useLeft ? labelLeft + labelWidth : labelLeft;
    const edgeY = labelTop + labelHeight / 2;
    const color = colorToCss(callout.color);

    lines.push(`<line x1="${edgeX}" y1="${edgeY}" x2="${anchorX}" y2="${anchorY}" stroke="${color}" />`);
    lines.push(`<circle cx="${anchorX}" cy="${anchorY}" r="4" fill="${color}" />`);
    labels.push(`
      <div class="callout-label" style="left: ${labelLeft}px; top: ${labelTop}px; width: ${labelWidth}px; border-color: ${color};">
        <strong>${escapeHtml(callout.label)}</strong>
        <span>${escapeHtml(callout.detail)}</span>
      </div>
    `);
  });

  calloutLayer.innerHTML = `
    <svg class="callout-leaders" viewBox="0 0 ${viewportWidth} ${viewportHeight}" preserveAspectRatio="none" aria-hidden="true">
      ${lines.join("")}
    </svg>
    ${labels.join("")}
  `;
}

function clearCalloutLayer() {
  state.lastCallouts = [];
  calloutLayer.innerHTML = "";
  calloutLayer.style.display = "none";
}

function renderPixelClassMessage(message, type) {
  pixelClassMessage.textContent = message;
  pixelClassMessage.classList.toggle("is-error", type === "error");
  pixelClassMessage.classList.toggle("is-success", type === "success");
}

function renderPixelClassResults(classification, stats, options = {}) {
  const disabled = Boolean(options.disabled);
  const rows = classification.classes.map((item) => {
    const checked = item.included !== false;
    const mergeNote = item.segmentCount > 1
      ? `<span class="pixel-merge-note">Merged from ${item.segmentCount} pixel bins</span>`
      : "";
    return `
      <li class="pixel-class-row">
        <label class="pixel-class-toggle">
          <input type="checkbox" name="pixelClassInclude" value="${item.id}" ${checked ? "checked" : ""} ${disabled ? "disabled" : ""} />
          <span>Show class ${item.id}</span>
        </label>
        <span class="pixel-swatch pixel-swatch--legend" style="background: ${colorToCss(item.color)}"></span>
        <span class="pixel-class-range">
          <strong>Class ${item.id}: ${item.low}-${item.high}</strong>
          <span>${item.count.toLocaleString()} pixels</span>
          ${mergeNote}
          <span class="pixel-label">${escapeHtml(item.category)}</span>
          <span>${escapeHtml(item.categoryReason)}</span>
        </span>
        <strong class="pixel-class-share">${formatPixelPercent(item.percent)}</strong>
      </li>
    `;
  }).join("");

  pixelClassResults.innerHTML = `
    <p class="form-message">Observed pixel range: ${stats.low}-${stats.high}. Total analyzed pixels: ${stats.totalPixels.toLocaleString()}.</p>
    <ul class="pixel-class-list">${rows}</ul>
  `;
}

function handlePixelClassResultToggle(event) {
  if (!event.target.matches("input[name='pixelClassInclude']")) {
    return;
  }

  if (!state.lastPixelClassification) {
    return;
  }

  const selectedIds = new Set(
    Array.from(pixelClassResults.querySelectorAll("input[name='pixelClassInclude']:checked"))
      .map((input) => Number(input.value))
  );
  const { classification, stats } = state.lastPixelClassification;

  classification.classes.forEach((item) => {
    item.included = selectedIds.has(item.id);
  });

  const includedCount = classification.classes.filter((item) => item.included !== false).length;
  renderSourceImage({ restoreCaption: true });
  applyPixelClassificationOverlay(classification, stats);

  if (includedCount) {
    renderPixelClassMessage(`${includedCount} of ${classification.classes.length} pixel classes are visible on the overlay.`, "success");
  } else {
    renderPixelClassMessage("No pixel classes are selected. Check at least one class to show it on the overlay.", "error");
  }
}

function formatPixelPercent(value) {
  const amount = value * 100;
  if (amount === 0) {
    return "0%";
  }
  if (amount < 1) {
    return `${amount.toFixed(3)}%`;
  }
  if (amount < 10) {
    return `${amount.toFixed(1)}%`;
  }
  return `${Math.round(amount)}%`;
}

function renderMetrics(features) {
  const metrics = [
    ["Analysis bands", bandDescription()],
    ["Dominant tone", features.dominantTone],
    ["Brightness", percent(features.brightness)],
    ["Texture", percent(features.texture)],
    ["Banding", percent(features.banding)],
    ["Edge contrast", percent(features.edge)],
    ["Warm color signal", percent(features.warm)],
  ];

  metricsGrid.innerHTML = metrics.map(([label, value]) => `
    <div class="metric">
      <span>${label}</span>
      <strong>${value}</strong>
    </div>
  `).join("");
}

function renderEmptyMetadata() {
  metadataNote.textContent = "Load an image to read source metadata.";
  metadataGrid.innerHTML = [
    ["Source bands", "Waiting"],
    ["Analysis bands", "Waiting"],
    ["Format", "Waiting"],
    ["Encoded size", "Waiting"],
  ].map(([label, value]) => metadataRow(label, value)).join("");
}

function renderImageMetadata(metadata = state.imageMetadata) {
  if (!metadata) {
    renderEmptyMetadata();
    return;
  }

  const rows = [
    ["File", metadata.fileName],
    ["Format", formatMetadataFormat(metadata)],
    ["Encoded size", formatDimensions(metadata.encodedWidth, metadata.encodedHeight)],
    ["Decoded size", formatDimensions(metadata.decodedWidth, metadata.decodedHeight)],
    ["Source bands", formatBandList(metadata.encodedBandCount, metadata.encodedBandLabels)],
    ["Analysis bands", metadata.workingBandCount ? formatBandList(metadata.workingBandCount, metadata.workingBandLabels) : "Waiting"],
    ["Display decode", formatBandList(metadata.displayBandCount, metadata.displayBandLabels)],
    ["Bit depth", metadata.bitDepth || "Unknown"],
    ["File size", formatFileSize(metadata.fileSize)],
    ["Modified", formatModifiedDate(metadata.lastModified)],
  ];

  metadataGrid.innerHTML = rows.map(([label, value]) => metadataRow(label, value)).join("");
  metadataNote.textContent = metadataSummary(metadata);
}

function metadataRow(label, value) {
  return `
    <div class="metadata-item">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value || "Unknown")}</strong>
    </div>
  `;
}

function metadataSummary(metadata) {
  if (metadataUsesSingleGrayBand(metadata)) {
    return "Source header reports a grayscale source band; analysis is using one Gray band.";
  }

  if (metadata.inferredSingleBand) {
    return "RGB display channels are nearly identical; analysis is treating the image as one Gray band.";
  }

  if (metadata.encodedBandCount && metadata.workingBandCount && metadata.encodedBandCount !== metadata.workingBandCount) {
    return "Source metadata and analysis bands differ because browser display pixels were converted before analysis.";
  }

  if (metadata.notes?.length) {
    return metadata.notes[metadata.notes.length - 1];
  }

  return "Source metadata is separated from browser display bands.";
}

function formatMetadataFormat(metadata) {
  const parts = [metadata.format, metadata.colorModel].filter(Boolean);
  return parts.length ? parts.join(" - ") : "Unknown";
}

function formatDimensions(width, height) {
  return width && height ? `${width.toLocaleString()} x ${height.toLocaleString()} px` : "Unknown";
}

function formatBandList(count, labels = []) {
  if (!count) {
    return "Unknown";
  }
  const cleanLabels = labels.length ? labels.join(", ") : "Unlabeled";
  return `${count} band${count === 1 ? "" : "s"}: ${cleanLabels}`;
}

function formatFileSize(bytes) {
  if (!bytes) {
    return "Generated";
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatModifiedDate(timestamp) {
  if (!timestamp) {
    return "Unknown";
  }
  return new Date(timestamp).toLocaleString();
}

function renderGeologyPixelRanges(geologyItems, features) {
  if (!state.imageLoaded) {
    renderEmptyGeologyRanges();
    return;
  }

  const stats = extractPixelValueStats();
  const candidates = uniqueGeologyCandidates(geologyItems).slice(0, 5);
  const summaries = summarizeGeologyRanges(candidates, stats, features);
  const visibleSummaries = summaries.filter((item) => item.count > 0);

  if (!visibleSummaries.length) {
    geologyRangeResults.innerHTML = `
      <p class="form-message">No pixel ranges could be assigned to the current geology matches.</p>
    `;
    return;
  }

  const rows = visibleSummaries.map((item, index) => `
    <li class="geology-range-row">
      <span class="pixel-swatch pixel-swatch--legend" style="background: ${colorToCss(colorForClass(index))}"></span>
      <span class="geology-range-copy">
        <strong>${escapeHtml(item.label)} <small>${escapeHtml(item.family)}</small></strong>
        <span>Pixel range ${item.low}-${item.high}</span>
        <span>${item.count.toLocaleString()} pixels assigned from the current image</span>
      </span>
      <strong class="pixel-class-share">${formatPixelPercent(item.percent)}</strong>
    </li>
  `).join("");

  geologyRangeResults.innerHTML = `
    <p class="form-message">Observed grayscale range: ${stats.low}-${stats.high}. These ranges use the current geology matches as class seeds.</p>
    <ul class="geology-range-list">${rows}</ul>
    <p class="classification-prompt">Next: switch to Classification, choose ${Math.max(2, Math.min(visibleSummaries.length, 8))} classes, and review the colored geology-label overlay.</p>
  `;
}

function uniqueGeologyCandidates(items) {
  const byLabel = new Map();
  items.forEach((item) => {
    if (!byLabel.has(item.label)) {
      byLabel.set(item.label, item);
    }
  });
  return Array.from(byLabel.values());
}

function summarizeGeologyRanges(candidates, stats, features) {
  const summaries = candidates.map((category) => ({
    id: category.id,
    label: category.label,
    family: category.family,
    low: 255,
    high: 0,
    count: 0,
    percent: 0,
    category,
  }));

  for (const value of stats.values) {
    let bestIndex = 0;
    let bestScore = -Infinity;

    candidates.forEach((category, index) => {
      const score = scoreValueForGeologyRange(value, features, category, index);
      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    });

    const summary = summaries[bestIndex];
    summary.count += 1;
    if (value < summary.low) summary.low = value;
    if (value > summary.high) summary.high = value;
  }

  summaries.forEach((summary) => {
    summary.percent = summary.count / stats.totalPixels;
    if (!summary.count) {
      summary.low = 0;
      summary.high = 0;
    }
  });

  return summaries.sort((a, b) => b.count - a.count);
}

function scoreValueForGeologyRange(value, features, category, rankIndex) {
  const brightness = value / 255;
  const darkness = 1 - brightness;
  return (
    distanceScore(brightness, category.weights.brightness, 0.3) * 0.42 +
    distanceScore(darkness, category.weights.darkness, 0.3) * 0.22 +
    distanceScore(features.warm, category.weights.warm, 0.42) * 0.1 +
    distanceScore(features.texture, category.weights.texture, 0.42) * 0.1 +
    distanceScore(features.edge, category.weights.edge, 0.42) * 0.06 +
    distanceScore(features.banding, category.weights.banding, 0.42) * 0.06 +
    (category.score || 0) * 0.06 -
    rankIndex * 0.01
  );
}

function renderEvidence(top, features) {
  const featureEvidence = [
    features.banding > 0.62 ? "Layering or foliation signal is strong." : "",
    features.texture > 0.66 ? "Texture contrast suggests visible grains, clasts, or rough fabric." : "",
    features.darkness > 0.7 ? "The image is dominated by dark material." : "",
    features.warm > 0.72 ? "Warm red, buff, or iron-rich color is prominent." : "",
    features.edge > 0.68 ? "Sharp discontinuities or broken fabric are present." : "",
  ].filter(Boolean);

  const evidence = [...top.cues, ...featureEvidence].slice(0, 6);
  evidenceList.innerHTML = evidence.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
}

function renderGeomorphology(top, features) {
  const interpretation = interpretGeomorphology(top, features);

  geomorphologySummary.textContent = interpretation.summary;
  geomorphologyList.innerHTML = interpretation.notes
    .map((note) => `<li>${escapeHtml(note)}</li>`)
    .join("");
}

function interpretGeomorphology(top, features) {
  const notes = [];
  const landformHints = [];

  if (features.banding > 0.64) {
    landformHints.push("layered terrain or structural fabric");
    notes.push("Extractable feature: bedding, foliation, terrace-like breaks, or repeated slope benches may be present where banding is strong.");
  }

  if (features.edge > 0.68) {
    landformHints.push("lineament or scarp expression");
    notes.push("Extractable feature: sharp tonal boundaries can indicate fractures, fault traces, contacts, scarps, drainage edges, or man-made cut faces.");
  }

  if (features.texture > 0.68) {
    landformHints.push("rough or dissected surface");
    notes.push("Extractable feature: high texture supports interpretation of rough bedrock, blocky colluvium, talus, clast-rich ground, gullies, or eroded surface relief.");
  }

  if (features.warm > 0.72 && features.saturation > 0.32) {
    landformHints.push("weathered or sediment-covered surface");
    notes.push("Extractable feature: warm red-brown or buff tones may reflect oxidation, transported sediment, exposed soil, alluvium, or weathered regolith.");
  }

  if (features.darkness > 0.7 && features.texture > 0.45) {
    landformHints.push("dark resistant terrain");
    notes.push("Extractable feature: dark rough surfaces can suggest volcanic flow fields, mafic bedrock, shadowed relief, desert pavement, or resistant ridge material.");
  }

  if (features.brightness > 0.68 && features.texture < 0.45) {
    landformHints.push("smooth light-toned surface");
    notes.push("Extractable feature: light smoother areas may represent carbonate exposure, quartz-rich material, dry sediment flats, pale soil, or low-relief weathered ground.");
  }

  if (top.family === "Structure") {
    notes.push("Priority interpretation: map linear trends, offsets, repeated bands, and cross-cutting relationships before assigning a structural landform label.");
  }

  if (top.family === "Outcrop" || top.id === "stratified-outcrop") {
    notes.push("Priority interpretation: trace bedding continuity, dip direction, slope breaks, and possible erosion-resistant layers across the image.");
  }

  if (top.family === "Landform" || top.id === "volcanic-terrain") {
    notes.push("Priority interpretation: compare roughness, flow-like margins, dark tone, and drainage disruption to separate volcanic terrain from shadowed slopes.");
  }

  if (!notes.length) {
    landformHints.push("general surface-form cues");
    notes.push("Extractable feature: tone, texture, and contrast are visible, but the current image does not show a strong single landform signal.");
  }

  if (!landformHints.length) {
    landformHints.push("general surface-form cues");
  }

  return {
    summary: `Likely geomorphological cues: ${landformHints.slice(0, 3).join(", ")}.`,
    notes: [
      ...notes.slice(0, 5),
      "Interpretation limit: confirm with image scale, coordinates, slope or DEM data, drainage context, and field observations.",
    ],
  };
}

function renderEmptyMetrics() {
  metricsGrid.innerHTML = ["Analysis bands", "Dominant tone", "Brightness", "Texture", "Banding"].map((label) => `
    <div class="metric">
      <span>${label}</span>
      <strong>Waiting</strong>
    </div>
  `).join("");
}

function renderEmptyGeologyRanges() {
  geologyRangeResults.innerHTML = `
    <p class="form-message">Load an image to estimate pixel ranges for geology classes.</p>
  `;
}

function renderEmptyGeomorphology() {
  geomorphologySummary.textContent = "Load an image to extract surface-form notes.";
  geomorphologyList.innerHTML = `
    <li>Potential landform, drainage, lineament, weathering, and surface roughness cues will appear here.</li>
  `;
}

function populatePackSelect() {
  packSelect.innerHTML = Object.entries(categoryPacks).map(([id, pack]) => `
    <option value="${escapeHtml(id)}">${escapeHtml(pack.label)}</option>
  `).join("");
  packSelect.value = state.activePack;
}

function refreshClassificationOptions(features) {
  state.classificationOptions = buildVisibleClassificationOptions(features);
}

function buildVisibleClassificationOptions(features) {
  const visibleSources = [
    { id: "geology", label: "Geology", pack: categoryPacks.geology },
    { id: "geomorphology", label: "Geomorphology", pack: categoryPacks.geomorphology },
  ].filter((source) => state.classificationLabelSource === "both" || source.id === state.classificationLabelSource);
  const seen = new Set();
  const options = [];

  visibleSources.forEach((source) => {
    const candidateLimit = source.id === "geology" ? 8 : 6;
    classifyWithHeuristics(features, source.pack).slice(0, candidateLimit).forEach((category) => {
      const optionKey = `${source.id}:${category.id}`;
      if (seen.has(optionKey)) {
        return;
      }
      seen.add(optionKey);
      options.push({
        ...category,
        optionKey,
        sourcePack: source.id,
        sourceLabel: source.label,
      });
    });
  });

  return options;
}

function classificationSourceLabel() {
  if (state.classificationLabelSource === "geology") {
    return "Geology";
  }
  if (state.classificationLabelSource === "geomorphology") {
    return "Geomorphology";
  }
  return "Geology + Geomorphology";
}

function addCategory(event) {
  event.preventDefault();
  const form = new FormData(categoryForm);
  const label = String(form.get("newClassName") || "").trim();
  const family = String(form.get("newClassFamily") || "").trim() || "Custom";

  if (!label) {
    categoryMessage.textContent = "Add a class name first.";
    return;
  }

  const activePack = categoryPacks[state.activePack];
  const id = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  activePack.categories.push({
    id: id || `custom-${Date.now()}`,
    label,
    family,
    cues: ["custom catalog class", "add model examples before production use"],
    weights: { brightness: 0.5, saturation: 0.3, warm: 0.5, texture: 0.5, edge: 0.5, banding: 0.35, darkness: 0.35 },
  });

  categoryForm.reset();
  categoryMessage.textContent = `${label} added to ${activePack.label}.`;
  updateCatalogStatus();

  if (state.imageLoaded) {
    analyzeCurrentCanvas();
  }
}

function updateCatalogStatus() {
  const activePack = categoryPacks[state.activePack];
  modelMode.textContent = `${activePack.label} pack active`;
  if (state.activePack === "classification") {
    catalogStatus.textContent = `${state.classificationOptions.length} ${classificationSourceLabel()} label classes`;
    return;
  }
  catalogStatus.textContent = `${activePack.categories.length} classes ready`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

setup();
