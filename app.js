const canvas = document.querySelector("#previewCanvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });
const sourceCanvas = document.createElement("canvas");
sourceCanvas.width = canvas.width;
sourceCanvas.height = canvas.height;
const sourceCtx = sourceCanvas.getContext("2d", { willReadFrequently: true });
const canvasViewport = document.querySelector("#canvasViewport");
const calloutLayer = document.querySelector("#calloutLayer");
const pageBackgroundPalette = document.querySelector("#pageBackgroundPalette");
const dropZone = document.querySelector("#dropZone");
const imageInput = document.querySelector("#imageInput");
const chooseImage = document.querySelector("#chooseImage");
const previewCaption = document.querySelector("#previewCaption");
const metadataGrid = document.querySelector("#metadataGrid");
const metadataNote = document.querySelector("#metadataNote");
const metadataSummaryText = document.querySelector("#metadataSummary");
const bandComposerNote = document.querySelector("#bandComposerNote");
const bandPresetSelect = document.querySelector("#bandPresetSelect");
const bandRedSelect = document.querySelector("#bandRedSelect");
const bandGreenSelect = document.querySelector("#bandGreenSelect");
const bandBlueSelect = document.querySelector("#bandBlueSelect");
const bandRedMin = document.querySelector("#bandRedMin");
const bandRedMax = document.querySelector("#bandRedMax");
const bandGreenMin = document.querySelector("#bandGreenMin");
const bandGreenMax = document.querySelector("#bandGreenMax");
const bandBlueMin = document.querySelector("#bandBlueMin");
const bandBlueMax = document.querySelector("#bandBlueMax");
const bandAutoStretch = document.querySelector("#bandAutoStretch");
const bandReset = document.querySelector("#bandReset");
const bandComposerStatus = document.querySelector("#bandComposerStatus");
const resultSummary = document.querySelector("#resultSummary");
const metricsGrid = document.querySelector("#metricsGrid");
const evidenceList = document.querySelector("#evidenceList");
const geologyRangeResults = document.querySelector("#geologyRangeResults");
const structuralGeologySummary = document.querySelector("#structuralGeologySummary");
const structuralGeologyList = document.querySelector("#structuralGeologyList");
const geomorphologySummary = document.querySelector("#geomorphologySummary");
const geomorphologyList = document.querySelector("#geomorphologyList");
const sceneContextPanel = document.querySelector("#sceneContextPanel");
const landscapeContextSelect = document.querySelector("#landscapeContextSelect");
const sceneClueGrid = document.querySelector("#sceneClueGrid");
const sceneContextStatus = document.querySelector("#sceneContextStatus");
const sceneContextSummary = document.querySelector("#sceneContextSummary");
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

const PAGE_BACKGROUND_STORAGE_KEY = "geoImageClassifier.pageBackground";
const pageBackgroundOptions = [
  { id: "paper", label: "Paper", color: "#eef5f0" },
  { id: "mist", label: "Mist", color: "#e9f0ed" },
  { id: "sky", label: "Sky", color: "#e7eef5" },
  { id: "sand", label: "Sand", color: "#f3efe4" },
  { id: "blush", label: "Blush", color: "#f4e8ee" },
];

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
  primaryLandscape: "auto",
  sceneClues: [],
  pageBackground: loadStoredPageBackground(),
  zoom: 1,
  bandComposer: {
    presetId: "custom",
    channels: [
      { bandIndex: 0, min: 0, max: 255 },
      { bandIndex: 1, min: 0, max: 255 },
      { bandIndex: 2, min: 0, max: 255 },
    ],
  },
};

const bandChannelControls = [
  { key: "red", label: "Red", select: bandRedSelect, minInput: bandRedMin, maxInput: bandRedMax },
  { key: "green", label: "Green", select: bandGreenSelect, minInput: bandGreenMin, maxInput: bandGreenMax },
  { key: "blue", label: "Blue", select: bandBlueSelect, minInput: bandBlueMin, maxInput: bandBlueMax },
];

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
        label: "Granite Gneiss",
        family: "Crystalline Basement",
        cues: ["coarse felsic-mafic crystalline mix", "speckled granite to gneissic fabric", "basement rock texture common in shield terrain"],
        weights: { brightness: 0.56, saturation: 0.22, warm: 0.5, texture: 0.76, edge: 0.48, banding: 0.28, darkness: 0.22 },
      },
      {
        id: "basalt",
        label: "Deccan Basalt",
        family: "Igneous",
        cues: ["dark mafic lava flow", "fine texture", "Deccan Trap style low color variation"],
        weights: { brightness: 0.18, saturation: 0.18, warm: 0.24, texture: 0.32, edge: 0.3, banding: 0.14, darkness: 0.86 },
      },
      {
        id: "obsidian",
        label: "Dolerite Dyke",
        family: "Igneous Intrusive",
        cues: ["dark intrusive body", "medium to fine texture", "sharp linear contact or dyke-like contrast"],
        weights: { brightness: 0.14, saturation: 0.14, warm: 0.18, texture: 0.34, edge: 0.56, banding: 0.22, darkness: 0.9 },
      },
      {
        id: "sandstone",
        label: "Gondwana Sandstone",
        family: "Sedimentary",
        cues: ["warm buff to reddish mineral color", "granular texture", "plateau-forming bedding common in Gondwana basins"],
        weights: { brightness: 0.64, saturation: 0.44, warm: 0.82, texture: 0.6, edge: 0.38, banding: 0.38, darkness: 0.14 },
      },
      {
        id: "limestone",
        label: "Limestone / Dolomite",
        family: "Sedimentary",
        cues: ["pale gray to buff carbonate tone", "low saturation", "smooth to softly mottled carbonate texture"],
        weights: { brightness: 0.7, saturation: 0.14, warm: 0.44, texture: 0.3, edge: 0.22, banding: 0.16, darkness: 0.08 },
      },
      {
        id: "shale",
        label: "Shale / Mudstone",
        family: "Sedimentary",
        cues: ["fine-grained dark layers", "bedding or fissility", "muted color"],
        weights: { brightness: 0.28, saturation: 0.16, warm: 0.32, texture: 0.36, edge: 0.5, banding: 0.72, darkness: 0.64 },
      },
      {
        id: "conglomerate",
        label: "Pebbly Sandstone / Conglomerate",
        family: "Sedimentary",
        cues: ["mixed clast sizes", "strong texture contrast", "rounded to pebbly fragment pattern"],
        weights: { brightness: 0.52, saturation: 0.32, warm: 0.48, texture: 0.9, edge: 0.74, banding: 0.24, darkness: 0.28 },
      },
      {
        id: "gneiss",
        label: "Peninsular Gneiss",
        family: "Metamorphic",
        cues: ["alternating felsic and mafic bands", "strong foliation", "crystalline basement texture"],
        weights: { brightness: 0.5, saturation: 0.18, warm: 0.36, texture: 0.72, edge: 0.64, banding: 0.9, darkness: 0.36 },
      },
      {
        id: "schist",
        label: "Dharwar Schist",
        family: "Metamorphic",
        cues: ["foliated schistose fabric", "micaceous or chloritic mineral texture", "directional grain common in Dharwar belts"],
        weights: { brightness: 0.44, saturation: 0.22, warm: 0.34, texture: 0.8, edge: 0.62, banding: 0.7, darkness: 0.38 },
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
        label: "Charnockite",
        family: "Granulite",
        cues: ["dark greenish to gray crystalline rock", "granular high-grade texture", "massive to weakly foliated charnockitic fabric"],
        weights: { brightness: 0.32, saturation: 0.18, warm: 0.24, texture: 0.54, edge: 0.44, banding: 0.32, darkness: 0.7 },
      },
      {
        id: "quartzite",
        label: "Aravalli Quartzite",
        family: "Metasedimentary",
        cues: ["hard quartz-rich fabric", "bright massive to weakly banded texture", "ridge-forming quartzite signal"],
        weights: { brightness: 0.72, saturation: 0.12, warm: 0.36, texture: 0.42, edge: 0.42, banding: 0.34, darkness: 0.08 },
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
        label: "Khondalite",
        family: "Metasedimentary",
        cues: ["banded aluminous metamorphic layers", "garnet-sillimanite bearing terrain signal", "weathered brown to buff gneissic fabric"],
        weights: { brightness: 0.54, saturation: 0.26, warm: 0.52, texture: 0.68, edge: 0.5, banding: 0.8, darkness: 0.26 },
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
        label: "Quartz Vein",
        family: "Vein",
        cues: ["bright quartz-rich vein material", "low saturation", "clean high-contrast vein or reef surfaces"],
        weights: { brightness: 0.86, saturation: 0.08, warm: 0.34, texture: 0.22, edge: 0.34, banding: 0.16, darkness: 0.02 },
      },
      {
        id: "calcite",
        label: "Laterite",
        family: "Residual Cover",
        cues: ["red-brown ferruginous crust", "earthy weathered texture", "warm lateritic surface response"],
        weights: { brightness: 0.5, saturation: 0.54, warm: 0.9, texture: 0.42, edge: 0.28, banding: 0.1, darkness: 0.24 },
      },
      {
        id: "hematite",
        label: "Banded Iron Formation",
        family: "Iron Formation",
        cues: ["iron-rich red-black bands", "ferruginous ridge material", "repeated dark-light banding"],
        weights: { brightness: 0.34, saturation: 0.4, warm: 0.72, texture: 0.62, edge: 0.58, banding: 0.84, darkness: 0.56 },
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
        id: "fault-lineament",
        label: "Fault Line / Lineament",
        family: "Structure",
        cues: ["long straight to gently curving structural trace", "persistent tonal lineament", "possible fault line or fracture-controlled alignment"],
        weights: { brightness: 0.44, saturation: 0.2, warm: 0.34, texture: 0.58, edge: 0.94, banding: 0.6, darkness: 0.38 },
      },
      {
        id: "joint-fracture-set",
        label: "Joint / Fracture Set",
        family: "Structure",
        cues: ["closely spaced linear breaks", "repeated fracture traces", "joint-controlled surface pattern"],
        weights: { brightness: 0.42, saturation: 0.2, warm: 0.34, texture: 0.62, edge: 0.84, banding: 0.48, darkness: 0.4 },
      },
      {
        id: "shear-zone",
        label: "Shear Zone",
        family: "Structure",
        cues: ["elongate deformed fabric", "strong planar banding", "possible sheared or mylonitic zone"],
        weights: { brightness: 0.46, saturation: 0.22, warm: 0.38, texture: 0.74, edge: 0.72, banding: 0.9, darkness: 0.34 },
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
        label: "Deccan Trap Surface",
        family: "Landform",
        cues: ["dark step-like basaltic surface", "high texture", "lava flow or trap-like plateau pattern"],
        weights: { brightness: 0.26, saturation: 0.24, warm: 0.34, texture: 0.78, edge: 0.72, banding: 0.26, darkness: 0.78 },
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
        id: "rugged-mountain-terrain",
        label: "Rugged Mountain Terrain",
        family: "Geomorphology",
        cues: ["bright or high-relief mountain texture", "strong ridge-shadow contrast", "rugged mountain terrain expression"],
        weights: { brightness: 0.56, saturation: 0.12, warm: 0.48, texture: 0.86, edge: 0.92, banding: 0.18, darkness: 0.42 },
      },
      {
        id: "glacier-icefield",
        label: "Glacier / Icefield",
        family: "Geomorphology",
        cues: ["bright low-saturation snow or ice cover", "icefield or glacier surface response", "snow-ice mass bounded by dark relief"],
        weights: { brightness: 0.62, saturation: 0.08, warm: 0.46, texture: 0.72, edge: 0.8, banding: 0.16, darkness: 0.34 },
      },
      {
        id: "glacial-valley",
        label: "Valley",
        family: "Geomorphology",
        cues: ["broad valley or ravine corridor", "snow-ice or meltwater path", "shadowed mountain incision"],
        weights: { brightness: 0.5, saturation: 0.12, warm: 0.46, texture: 0.82, edge: 0.9, banding: 0.22, darkness: 0.5 },
      },
      {
        id: "alpine-ridge-arete",
        label: "Mountain Ridge / Crestline",
        family: "Geomorphology",
        cues: ["sharp ridge or crestline expression", "sharp crest-line contrast", "high-relief ridge-shadow boundary"],
        weights: { brightness: 0.44, saturation: 0.12, warm: 0.46, texture: 0.78, edge: 0.96, banding: 0.28, darkness: 0.56 },
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
    caption: "Demo sample: granite gneiss-like speckled crystalline texture",
    base: [190, 181, 168],
    accent: [46, 49, 48],
    warm: [196, 117, 102],
    mode: "speckle",
  },
  sandstone: {
    caption: "Demo sample: Gondwana sandstone-like grains with warm bedding",
    base: [182, 143, 88],
    accent: [121, 91, 52],
    warm: [212, 166, 92],
    mode: "layered-grain",
  },
  gneiss: {
    caption: "Demo sample: Peninsular gneiss-like alternating bands",
    base: [176, 176, 166],
    accent: [42, 45, 45],
    warm: [132, 118, 98],
    mode: "banded",
  },
  basalt: {
    caption: "Demo sample: Deccan basalt-like dark fine-grained rock",
    base: [39, 45, 43],
    accent: [20, 23, 22],
    warm: [70, 62, 51],
    mode: "dark-fine",
  },
};

const landscapeContextOptions = [
  { id: "auto", label: "Auto" },
  { id: "plain", label: "Plain" },
  { id: "plateau", label: "Plateau" },
  { id: "hill", label: "Hill" },
  { id: "hill-range", label: "Hill Range" },
  { id: "sea-coast", label: "Sea / Coastal" },
  { id: "water-body", label: "Water Body" },
  { id: "snow-ice", label: "Snow / Ice" },
];

const sceneClueDefinitions = [
  {
    id: "drainage-incision",
    label: "Drainage / valleys",
  },
  {
    id: "linear-ridges-breaks",
    label: "Ridges / escarpments",
  },
  {
    id: "bench-plateau",
    label: "Stepped slopes",
  },
  {
    id: "volcanic-surface",
    label: "Dark volcanic surface",
  },
];

function createBandComposerChannel(bandIndex = 0) {
  return {
    bandIndex,
    min: 0,
    max: 255,
  };
}

function cloneBandComposerSettings(settings = state.bandComposer) {
  return {
    presetId: settings?.presetId || "custom",
    channels: (settings?.channels || []).map((channel) => ({
      bandIndex: Number.isFinite(channel?.bandIndex) ? channel.bandIndex : 0,
      min: Number.isFinite(channel?.min) ? channel.min : 0,
      max: Number.isFinite(channel?.max) ? channel.max : 255,
    })),
  };
}

function currentBandCount() {
  return sourceBandSet.bands.length;
}

function clampBandIndex(index) {
  const count = currentBandCount();
  if (!count) {
    return 0;
  }
  return Math.max(0, Math.min(count - 1, Math.round(Number(index) || 0)));
}

function defaultChannelIndicesForBandCount(count) {
  if (count >= 3) {
    return [0, 1, 2];
  }
  if (count === 2) {
    return [0, 1, 1];
  }
  if (count === 1) {
    return [0, 0, 0];
  }
  return [0, 0, 0];
}

function normalizeBandLabel(label) {
  return String(label || "")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getBandLabel(index) {
  return sourceBandSet.labels[index] || `Band ${index + 1}`;
}

function findBandRoleIndex(role) {
  const labels = sourceBandSet.labels.map(normalizeBandLabel);
  return labels.findIndex((label) => {
    if (!label) {
      return false;
    }
    if (role === "red") {
      return /\bred\b/.test(label) && !/\bred edge\b/.test(label) && !/\brededge\b/.test(label);
    }
    if (role === "green") {
      return /\bgreen\b/.test(label);
    }
    if (role === "blue") {
      return /\bblue\b/.test(label);
    }
    if (role === "nir") {
      return /\bnir\b/.test(label) || /near infrared/.test(label);
    }
    if (role === "swir1") {
      return /\bswir ?1\b/.test(label)
        || /\bswir-?1\b/.test(label)
        || /shortwave infrared 1/.test(label);
    }
    if (role === "swir2") {
      return /\bswir ?2\b/.test(label)
        || /\bswir-?2\b/.test(label)
        || /shortwave infrared 2/.test(label);
    }
    return false;
  });
}

function getNaturalColorIndices() {
  const red = findBandRoleIndex("red");
  const green = findBandRoleIndex("green");
  const blue = findBandRoleIndex("blue");
  if (red >= 0 && green >= 0 && blue >= 0) {
    return [red, green, blue];
  }
  return defaultChannelIndicesForBandCount(currentBandCount());
}

function formatBandPresetLabel(name, indices) {
  return `${name} (${indices.map((index) => getBandLabel(index)).join(" / ")})`;
}

function addBandPreset(presets, seen, id, name, indices) {
  const count = currentBandCount();
  if (!indices || indices.some((index) => index < 0 || index >= count)) {
    return;
  }
  const key = indices.join(",");
  if (seen.has(key)) {
    return;
  }
  seen.add(key);
  presets.push({
    id,
    indices,
    label: formatBandPresetLabel(name, indices),
  });
}

function buildBandPresetDefinitions() {
  const count = currentBandCount();
  if (!count) {
    return [];
  }

  const presets = [];
  const seen = new Set();

  if (count === 1) {
    addBandPreset(presets, seen, "single-band", "Single Band", [0, 0, 0]);
  } else {
    addBandPreset(presets, seen, "natural", "Natural Color", getNaturalColorIndices());

    const red = findBandRoleIndex("red");
    const green = findBandRoleIndex("green");
    const blue = findBandRoleIndex("blue");
    const nir = findBandRoleIndex("nir");
    const swir1 = findBandRoleIndex("swir1");
    const swir2 = findBandRoleIndex("swir2");

    if (nir >= 0 && red >= 0 && green >= 0) {
      addBandPreset(presets, seen, "fcc-nir-red-green", "False Color", [nir, red, green]);
    }
    if (swir1 >= 0 && nir >= 0 && red >= 0) {
      addBandPreset(presets, seen, "fcc-swir-nir-red", "SWIR / NIR / Red", [swir1, nir, red]);
    }
    if (swir2 >= 0 && swir1 >= 0 && red >= 0) {
      addBandPreset(presets, seen, "fcc-geology", "Geology FCC", [swir2, swir1, red]);
    }

    if (count >= 4) {
      addBandPreset(presets, seen, "fcc-432", "FCC 4 / 3 / 2", [3, 2, 1]);
    }
    if (count >= 5) {
      addBandPreset(presets, seen, "fcc-543", "FCC 5 / 4 / 3", [4, 3, 2]);
    }
    if (count >= 7) {
      addBandPreset(presets, seen, "fcc-753", "FCC 7 / 5 / 3", [6, 4, 2]);
    }
  }

  presets.push({ id: "custom", indices: null, label: "Custom" });
  return presets;
}

function sanitizeBandComposerState() {
  const count = currentBandCount();
  const fallbackIndices = getNaturalColorIndices();
  const channels = cloneBandComposerSettings().channels;

  state.bandComposer.channels = bandChannelControls.map((_, index) => {
    const current = channels[index] || createBandComposerChannel(fallbackIndices[index] || 0);
    const bandIndex = count ? clampBandIndex(current.bandIndex) : 0;
    let min = Math.round(clamp(Number(current.min) || 0, 0, 255));
    let max = Math.round(clamp(Number(current.max) || 255, 0, 255));
    if (max <= min) {
      if (min >= 255) {
        min = 254;
        max = 255;
      } else {
        max = min + 1;
      }
    }

    return { bandIndex, min, max };
  });
}

function initializeBandComposer() {
  const presets = buildBandPresetDefinitions();
  const preferredPreset = presets.find((preset) => preset.id === "natural" || preset.id === "single-band") || presets[0];
  const defaultIndices = preferredPreset?.indices || defaultChannelIndicesForBandCount(currentBandCount());

  state.bandComposer = {
    presetId: preferredPreset?.id || "custom",
    channels: defaultIndices.map((bandIndex) => createBandComposerChannel(clampBandIndex(bandIndex))),
  };
  sanitizeBandComposerState();
}

function compositeBandLabels() {
  return state.bandComposer.channels.map((channel) => getBandLabel(clampBandIndex(channel.bandIndex)));
}

function compositeBandSummary() {
  return [
    `Red=${getBandLabel(state.bandComposer.channels[0].bandIndex)}`,
    `Green=${getBandLabel(state.bandComposer.channels[1].bandIndex)}`,
    `Blue=${getBandLabel(state.bandComposer.channels[2].bandIndex)}`,
  ].join(", ");
}

function compositeStretchSummary() {
  return state.bandComposer.channels
    .map((channel, index) => `${bandChannelControls[index].label} ${channel.min}-${channel.max}`)
    .join(" | ");
}

function bandComposerIntroText(count = currentBandCount()) {
  if (!count) {
    return "Load an image to build RGB and false color composites.";
  }
  if (count === 1) {
    return "One source band is available now. Load more bands for true false color composites.";
  }
  if (count === 3) {
    return "Three source bands are ready. Swap channels or stretch them to test alternate RGB views.";
  }
  return "Use the preset or the channel picks below to build false color composites from the loaded bands.";
}

function bandComposerStatusText() {
  if (!currentBandCount()) {
    return "The current composite will appear here after an image is loaded.";
  }
  return `${compositeBandSummary()}. Stretch: ${compositeStretchSummary()}. The current composite now drives the preview and analysis.`;
}

function resolveBandComposerPresetId() {
  const selectedKey = state.bandComposer.channels.map((channel) => clampBandIndex(channel.bandIndex)).join(",");
  const matchedPreset = buildBandPresetDefinitions()
    .find((preset) => preset.indices && preset.indices.join(",") === selectedKey);
  return matchedPreset?.id || "custom";
}

function syncMetadataDisplayFromBandComposer(metadata = state.imageMetadata) {
  if (!metadata || !currentBandCount()) {
    return;
  }
  metadata.displayBandCount = 3;
  metadata.displayBandLabels = compositeBandLabels();
  metadata.displayNote = `Composite: ${compositeBandSummary()}.`;
}

function renderBandComposerControls() {
  sanitizeBandComposerState();

  const count = currentBandCount();
  const presets = buildBandPresetDefinitions();
  const presetId = resolveBandComposerPresetId();
  state.bandComposer.presetId = presetId;

  bandPresetSelect.innerHTML = presets.length
    ? presets.map((preset) => `<option value="${escapeHtml(preset.id)}">${escapeHtml(preset.label)}</option>`).join("")
    : `<option value="custom">Custom</option>`;
  bandPresetSelect.value = presets.some((preset) => preset.id === state.bandComposer.presetId)
    ? state.bandComposer.presetId
    : presetId;
  bandPresetSelect.disabled = !count || presets.length <= 1;

  const bandOptions = count
    ? sourceBandSet.labels.map((label, index) => `<option value="${index}">${escapeHtml(label)}</option>`).join("")
    : `<option value="0">No bands loaded</option>`;

  bandChannelControls.forEach((control, index) => {
    const channel = state.bandComposer.channels[index];
    control.select.innerHTML = bandOptions;
    control.select.disabled = !count;
    control.minInput.disabled = !count;
    control.maxInput.disabled = !count;
    control.select.value = String(clampBandIndex(channel.bandIndex));
    control.minInput.value = String(channel.min);
    control.maxInput.value = String(channel.max);
  });

  bandAutoStretch.disabled = !count;
  bandReset.disabled = !count;
  bandComposerNote.textContent = bandComposerIntroText(count);
  bandComposerStatus.textContent = bandComposerStatusText();
}

function stretchByteValue(value, min, max) {
  if (value <= min) {
    return 0;
  }
  if (value >= max) {
    return 255;
  }
  return clampChannel(((value - min) / Math.max(1, max - min)) * 255);
}

function compositeChannelValueAt(x, y, channelIndex) {
  const count = currentBandCount();
  if (!count) {
    return 0;
  }
  const channel = state.bandComposer.channels[channelIndex] || createBandComposerChannel(0);
  const bandIndex = clampBandIndex(channel.bandIndex);
  const rawValue = bandValueAt(x, y, bandIndex);
  return stretchByteValue(rawValue, channel.min, channel.max);
}

function percentileByteValue(band, percentile) {
  const histogram = new Uint32Array(256);
  for (const value of band) {
    histogram[value] += 1;
  }

  const target = Math.max(0, Math.min(band.length - 1, Math.floor(percentile * (band.length - 1))));
  let running = 0;
  for (let value = 0; value < histogram.length; value += 1) {
    running += histogram[value];
    if (running > target) {
      return value;
    }
  }
  return 255;
}

function autoStretchBandChannel(channelIndex) {
  const channel = state.bandComposer.channels[channelIndex];
  const band = sourceBandSet.bands[clampBandIndex(channel.bandIndex)];
  if (!band) {
    return;
  }

  const min = percentileByteValue(band, 0.02);
  const max = percentileByteValue(band, 0.98);
  channel.min = min;
  channel.max = max > min ? max : Math.min(255, min + 1);
}

function autoStretchCurrentComposite() {
  bandChannelControls.forEach((_, index) => autoStretchBandChannel(index));
  sanitizeBandComposerState();
}

function applyBandComposerState() {
  if (!currentBandCount()) {
    renderBandComposerControls();
    return;
  }

  sanitizeBandComposerState();
  state.bandComposer.presetId = resolveBandComposerPresetId();
  paintBandSetToSourceCanvas();
  syncMetadataDisplayFromBandComposer(state.imageMetadata);
  renderBandComposerControls();
  renderImageMetadata(state.imageMetadata);

  if (!state.imageLoaded) {
    renderSourceImage({ restoreCaption: true });
    return;
  }

  state.lastPixelClassification = null;
  analyzeCurrentCanvas();
  if (state.activePack === "classification") {
    runPixelClassification();
  } else {
    renderSourceImage({ restoreCaption: true });
  }
}

function applyBandPreset(presetId) {
  const preset = buildBandPresetDefinitions().find((item) => item.id === presetId);
  if (!preset || !preset.indices) {
    state.bandComposer.presetId = "custom";
    renderBandComposerControls();
    return;
  }

  state.bandComposer = {
    presetId: preset.id,
    channels: preset.indices.map((bandIndex) => createBandComposerChannel(clampBandIndex(bandIndex))),
  };
  applyBandComposerState();
}

function updateBandComposerFromInputs() {
  state.bandComposer.channels = bandChannelControls.map((control) => ({
    bandIndex: clampBandIndex(control.select.value),
    min: Number(control.minInput.value),
    max: Number(control.maxInput.value),
  }));
  applyBandComposerState();
}

function previewCaptionText() {
  if (!state.imageLoaded || !state.imageName) {
    return "Load an image or try a demo sample.";
  }
  const count = currentBandCount();
  if (!count || count === 1) {
    return state.imageName;
  }
  return `${state.imageName} - ${compositeBandLabels().join(" / ")}`;
}

function selectedSceneClueSet() {
  return new Set(state.sceneClues);
}

function effectiveSceneClueSet() {
  const explicit = selectedSceneClueSet();
  const effective = new Set(explicit);

  switch (state.primaryLandscape) {
    case "plain":
      effective.add("low-relief-plain");
      break;
    case "plateau":
      effective.add("bench-plateau");
      break;
    case "hill":
      if (explicit.has("linear-ridges-breaks")) {
        effective.add("steep-mountain");
      }
      break;
    case "hill-range":
      effective.add("steep-mountain");
      effective.add("linear-ridges-breaks");
      break;
    case "sea-coast":
    case "water-body":
      effective.add("low-relief-plain");
      break;
    case "snow-ice":
      effective.add("snow-ice");
      effective.add("steep-mountain");
      break;
    default:
      break;
  }

  return effective;
}

function selectedLandscapeContextLabel() {
  return landscapeContextOptions.find((item) => item.id === state.primaryLandscape)?.label || "Auto";
}

function sceneContextStatusText() {
  const parts = [];
  if (state.primaryLandscape !== "auto") {
    parts.push(`Major landform: ${selectedLandscapeContextLabel()}`);
  }

  if (state.sceneClues.length) {
    const labels = sceneClueDefinitions
      .filter((item) => state.sceneClues.includes(item.id))
      .map((item) => item.label);
    parts.push(`Hints: ${labels.join(", ")}`);
  }

  if (!parts.length) {
    return "Using image evidence only.";
  }

  if (state.primaryLandscape === "sea-coast" || state.primaryLandscape === "water-body") {
    return `${parts.join(". ")}. This mainly softens mountain-style guesses until dedicated water classes are added.`;
  }

  return `${parts.join(". ")}. These choices softly guide geomorphology.`;
}

function sceneContextHeaderSummaryText() {
  const parts = [];

  if (state.primaryLandscape !== "auto") {
    parts.push(selectedLandscapeContextLabel());
  }

  if (state.sceneClues.length) {
    const labels = sceneClueDefinitions
      .filter((item) => state.sceneClues.includes(item.id))
      .map((item) => item.label);
    const visibleLabels = labels.slice(0, 2).join(", ");
    const overflow = labels.length > 2 ? ` +${labels.length - 2}` : "";
    parts.push(`${visibleLabels}${overflow}`);
  }

  return parts.length ? parts.join(" | ") : "Auto";
}

function hasLandscapeGuidance() {
  return state.primaryLandscape !== "auto" || state.sceneClues.length > 0;
}

function renderSceneClueControls() {
  landscapeContextSelect.innerHTML = landscapeContextOptions
    .map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.label)}</option>`)
    .join("");
  landscapeContextSelect.value = landscapeContextOptions.some((item) => item.id === state.primaryLandscape)
    ? state.primaryLandscape
    : "auto";

  sceneClueGrid.innerHTML = sceneClueDefinitions.map((item) => {
    const checked = state.sceneClues.includes(item.id) ? "checked" : "";
    return `
      <label class="scene-clue">
        <input type="checkbox" name="sceneClue" value="${escapeHtml(item.id)}" ${checked} />
        <span>${escapeHtml(item.label)}</span>
      </label>
    `;
  }).join("");
  sceneContextStatus.textContent = sceneContextStatusText();
  sceneContextSummary.textContent = sceneContextHeaderSummaryText();
}

function shouldShowSceneContext() {
  if (state.activePack === "geomorphology") {
    return true;
  }
  if (state.activePack !== "classification") {
    return false;
  }
  return state.classificationLabelSource !== "geology";
}

function updateSceneContextVisibility() {
  const shouldShow = shouldShowSceneContext();
  sceneContextPanel.classList.toggle("is-hidden", !shouldShow);
  sceneContextPanel.setAttribute("aria-hidden", shouldShow ? "false" : "true");
}

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function normalizePageBackground(color) {
  const match = String(color || "").trim().match(/^#([0-9a-f]{6})$/i);
  return match ? `#${match[1].toLowerCase()}` : "#eef5f0";
}

function loadStoredPageBackground() {
  try {
    return normalizePageBackground(window.localStorage.getItem(PAGE_BACKGROUND_STORAGE_KEY));
  } catch (error) {
    return "#eef5f0";
  }
}

function storePageBackground(color) {
  try {
    window.localStorage.setItem(PAGE_BACKGROUND_STORAGE_KEY, normalizePageBackground(color));
  } catch (error) {
    // Ignore storage failures; the palette still works for the current session.
  }
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
  renderPageBackgroundPalette();
  applyPageBackground(state.pageBackground, { persist: false });
  bindEvents();
  renderEmptyMetrics();
  renderEmptyMetadata();
  renderEmptyGeologyRanges();
  renderEmptyStructuralGeology();
  renderEmptyGeomorphology();
  renderBandComposerControls();
  renderSceneClueControls();
  updateSceneContextVisibility();
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

  bandPresetSelect.addEventListener("change", () => {
    if (bandPresetSelect.value === "custom") {
      state.bandComposer.presetId = "custom";
      renderBandComposerControls();
      return;
    }
    applyBandPreset(bandPresetSelect.value);
  });

  bandChannelControls.forEach((control) => {
    control.select.addEventListener("change", updateBandComposerFromInputs);
    control.minInput.addEventListener("change", updateBandComposerFromInputs);
    control.maxInput.addEventListener("change", updateBandComposerFromInputs);
  });

  bandAutoStretch.addEventListener("click", () => {
    autoStretchCurrentComposite();
    applyBandComposerState();
  });

  bandReset.addEventListener("click", () => {
    initializeBandComposer();
    applyBandComposerState();
  });

  landscapeContextSelect.addEventListener("change", () => {
    state.primaryLandscape = landscapeContextSelect.value;
    renderSceneClueControls();
    if (state.imageLoaded) {
      analyzeCurrentCanvas();
      if (state.activePack === "classification") {
        runPixelClassification();
      }
    }
  });

  sceneClueGrid.addEventListener("change", (event) => {
    if (!event.target.matches("input[name='sceneClue']")) {
      return;
    }
    state.sceneClues = Array.from(sceneClueGrid.querySelectorAll("input[name='sceneClue']:checked"))
      .map((input) => input.value);
    renderSceneClueControls();
    if (state.imageLoaded) {
      analyzeCurrentCanvas();
      if (state.activePack === "classification") {
        runPixelClassification();
      }
    }
  });

  pixelClassForm.addEventListener("submit", (event) => {
    event.preventDefault();
    runPixelClassification();
  });

  classificationSourceSelect.addEventListener("change", () => {
    state.classificationLabelSource = classificationSourceSelect.value;
    state.lastPixelClassification = null;
    updateVisibleSections();
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
  pageBackgroundPalette.addEventListener("click", handlePageBackgroundSelection);

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
  initializeBandComposer();
  paintBandSetToSourceCanvas();
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
  renderBandComposerControls();
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
    initializeBandComposer();
    paintBandSetToSourceCanvas();
    syncMetadataWithWorkingBands(metadata, canvasInfo);
    const suitability = await evaluateImageSuitability(image, metadata);
    if (!suitability.accepted) {
      restoreImageState(previousState);
      imageStatus.textContent = `Blocked: ${suitability.reason}`;
      previewCaption.textContent = `${file.name} blocked. ${suitability.reason}`;
      renderPixelClassMessage(`Image blocked: ${suitability.reason} Use a rock, core, thin-section, outcrop, terrain, false-color composite, or geological raster image.`, "error");
      return;
    }

    state.imageLoaded = true;
    state.imageName = file.name;
    state.lastPixelClassification = null;
    renderImageMetadata(metadata);
    renderBandComposerControls();
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
    const isTiffLike = looksLikeTiffFile(file, metadata);
    imageStatus.textContent = isTiffLike
      ? "This browser cannot decode TIFF or GeoTIFF images yet"
      : "The image could not be decoded by this browser";
    metadata.notes.push(isTiffLike
      ? "TIFF and GeoTIFF files need a raster loader or conversion to PNG or JPEG before the browser can display them."
      : "The file header was readable, but the browser could not decode the image for display.");
    renderImageMetadata(metadata);
    renderPixelClassMessage(
      isTiffLike
        ? "This false-color raster looks valid, but TIFF and GeoTIFF files need a raster loader or conversion to PNG or JPEG before display."
        : "The browser could not decode this file for display.",
      "error",
    );
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
      bandComposer: cloneBandComposerSettings(),
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
  state.bandComposer = cloneBandComposerSettings(snapshot.state.bandComposer);

  calloutLayer.innerHTML = snapshot.calloutHtml;
  calloutLayer.style.display = snapshot.calloutDisplay;
  calloutLayer.style.left = snapshot.calloutLeft;
  calloutLayer.style.top = snapshot.calloutTop;
  calloutLayer.style.width = snapshot.calloutWidth;
  calloutLayer.style.height = snapshot.calloutHeight;

  renderImageMetadata(state.imageMetadata);
  renderBandComposerControls();
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
  const humanPattern = inspectHumanPortraitPattern();
  const artifactPattern = inspectBarcodeTextPattern();
  const localArtifacts = inspectLocalNonGeologyArtifacts();
  const terrainRasterPattern = inspectTerrainRasterPattern(features, pattern, artifactPattern, localArtifacts, metadata, tonalRange);
  // False-color and terrain rasters can overlap heavily with skin-tone thresholds,
  // so once terrain evidence is strong we stop using browser face/portrait gates.
  const shouldBypassFaceDetector = terrainRasterPattern.hasStrongTerrainEvidence;
  const faceDetection = shouldBypassFaceDetector
    ? { faces: [], source: "skipped-for-terrain" }
    : await detectHumanFacesInSource();
  const barcodeDetection = await detectBarcodesInSource();
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
  const hasStrongPersonSkinSignal = (
    humanPattern.skinShare > 0.035
    || localArtifacts.maxSkinTileShare > 0.24
    || localArtifacts.skinTileShare > 0.06
  )
    && (
      humanPattern.centralSkinDominance > 1.05
      || humanPattern.centerSkinShare > 0.05
      || humanPattern.upperCenterSkinShare > 0.05
      || localArtifacts.maxSkinTileShare > 0.28
    );
  const hasLocalHumanPatch = localArtifacts.maxSkinTileShare > 0.24
    && localArtifacts.maxSmoothSkinTileShare > 0.16
    && (
      localArtifacts.maxDarkFeatureTileShare > 0.015
      || humanPattern.darkFeatureShare > 0.006
      || pattern.paperShare > 0.1
    );
  const isLikelyPersonDocument = hasStrongPersonSkinSignal
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
  const hasDetectedHumanFace = faceDetection.faces.length > 0
    && (
      !terrainRasterPattern.hasStrongTerrainEvidence
      || hasStrongPersonSkinSignal
      || isLikelyHumanImage
      || hasLocalHumanPatch
    );
  const shouldBlockForHuman = terrainRasterPattern.hasStrongTerrainEvidence
    ? false
    : hasDetectedHumanFace || isLikelyHumanImage || isLikelyPersonDocument || hasLocalHumanPatch;

  if (shouldBlockForHuman) {
    return {
      accepted: false,
      reason: "The image appears to contain a human face or person, not a geological target.",
    };
  }

  const hasStrongArtifactSignal = barcodeDetection.codes.length
    || artifactPattern.barcodeRowShare > 0.028
    || artifactPattern.barcodeColShare > 0.028
    || localArtifacts.barcodeTileShare > 0.05
    || localArtifacts.textTileShare > 0.18
    || localArtifacts.documentTileShare > 0.22
    || (artifactPattern.textCellShare > 0.22 && pattern.paperShare > 0.24 && pattern.lowSaturationShare > 0.55);
  const hasSoftArtifactSignal = artifactPattern.isLikelyBarcodeOrTextDocument || localArtifacts.isLikelyArtifactImage;

  if (hasStrongArtifactSignal || (hasSoftArtifactSignal && !terrainRasterPattern.hasStrongTerrainEvidence)) {
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
  const isLikelyBlankDocument = !terrainRasterPattern.hasStrongTerrainEvidence
    && features.brightness > 0.88
    && features.saturation < 0.1
    && features.texture < 0.18
    && features.banding < 0.16
    && features.edge < 0.24;
  const isLikelySimpleGraphic = !terrainRasterPattern.hasStrongTerrainEvidence
    && tonalRange < 28
    && features.texture < 0.08
    && features.edge < 0.08
    && features.banding < 0.08;
  const isLikelyUiOrDocument = !terrainRasterPattern.hasStrongTerrainEvidence
    && pattern.paperShare > 0.34
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
  const terrainRasterBonus = terrainRasterPattern.looksLikeFalseColorTerrain
    ? 0.18
    : terrainRasterPattern.looksLikeSingleBandTerrain ? 0.12 : 0;
  const coldBrightTerrainBonus = terrainRasterPattern.looksLikeColdBrightTerrain ? 0.14 : 0;
  const modeledSuitabilityScore = suitabilityScore + terrainRasterBonus + coldBrightTerrainBonus;
  const finalSuitabilityScore = terrainRasterPattern.hasStrongTerrainEvidence
    ? Math.max(modeledSuitabilityScore, terrainRasterPattern.terrainOnlyScore)
    : modeledSuitabilityScore;
  const requiredSuitabilityScore = terrainRasterPattern.looksLikeColdBrightTerrain
    ? 0.34
    : terrainRasterPattern.looksLikeTerrainRaster ? 0.28 : 0.42;

  if (finalSuitabilityScore < requiredSuitabilityScore) {
    return {
      accepted: false,
      reason: "The image does not show enough rock, terrain, texture, banding, or geological tonal structure.",
    };
  }

  return {
    accepted: true,
    score: finalSuitabilityScore,
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

function inspectTerrainRasterPattern(features, pattern, artifactPattern, localArtifacts, metadata, tonalRange) {
  const lowArtifactSignal = localArtifacts.barcodeTileShare < 0.03
    && artifactPattern.barcodeRowShare < 0.025
    && artifactPattern.barcodeColShare < 0.025
    && localArtifacts.textTileShare < 0.12
    && localArtifacts.documentTileShare < 0.12
    && artifactPattern.textCellShare < 0.18;
  const hasTerrainTexture = tonalRange >= 12
    && (
      features.texture > 0.02
      || features.edge > 0.03
      || features.banding > 0.025
    );
  const hasRasterColorSpread = pattern.colorBinCount >= 12
    && pattern.paperShare < 0.28
    && pattern.inkShare < 0.88
    && pattern.lowSaturationShare < 0.97;
  const hasFalseColorSignal = features.saturation > 0.04
    && (
      pattern.accentShare > 0.012
      || pattern.colorBinCount >= 20
      || features.warm > 0.44
      || features.dominantTone !== "light neutral"
    );
  const hasGrayRasterSignal = (metadataUsesSingleGrayBand(metadata) || metadata?.inferredSingleBand)
    && tonalRange >= 12
    && pattern.paperShare < 0.28
    && pattern.inkShare < 0.88;
  const hasFieldLikeStructure = features.edge > 0.035
    || features.texture > 0.03
    || features.banding > 0.03;
  const looksLikeColdBrightTerrain = lowArtifactSignal
    && pattern.paperShare > 0.08
    && pattern.lowSaturationShare > 0.32
    && features.saturation < 0.22
    && (
      features.edge > 0.18
      || features.texture > 0.16
      || pattern.inkShare > 0.08
      || features.banding > 0.1
    )
    && pattern.colorBinCount >= 18;

  const looksLikeFalseColorTerrain = lowArtifactSignal
    && hasTerrainTexture
    && hasRasterColorSpread
    && hasFalseColorSignal
    && hasFieldLikeStructure;
  const looksLikeSingleBandTerrain = lowArtifactSignal
    && hasTerrainTexture
    && hasGrayRasterSignal
    && hasFieldLikeStructure;
  const hasStrongTerrainEvidence = lowArtifactSignal
    && (
      looksLikeFalseColorTerrain
      || looksLikeSingleBandTerrain
      || looksLikeColdBrightTerrain
      || (
        hasTerrainTexture
        && hasFieldLikeStructure
        && pattern.colorBinCount >= 18
        && pattern.inkShare > 0.04
      )
    );
  const terrainOnlyScore = lowArtifactSignal
    ? clamp(
      features.edge * 0.32 +
      features.texture * 0.24 +
      features.banding * 0.08 +
      clamp(tonalRange / 96) * 0.16 +
      clamp(pattern.colorBinCount / 48) * 0.12 +
      clamp(pattern.inkShare / 0.2) * 0.08 +
      (looksLikeColdBrightTerrain ? 0.12 : 0) +
      ((looksLikeFalseColorTerrain || looksLikeSingleBandTerrain) ? 0.08 : 0)
    )
    : 0;

  return {
    looksLikeFalseColorTerrain,
    looksLikeSingleBandTerrain,
    looksLikeColdBrightTerrain,
    hasStrongTerrainEvidence,
    terrainOnlyScore,
    looksLikeTerrainRaster: looksLikeFalseColorTerrain || looksLikeSingleBandTerrain || looksLikeColdBrightTerrain,
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
  if (mimeType.includes("tiff")) return "TIFF";

  const extension = String(file?.name || "").split(".").pop().toLowerCase();
  const known = {
    jpg: "JPEG",
    jpeg: "JPEG",
    png: "PNG",
    gif: "GIF",
    webp: "WebP",
    bmp: "BMP",
    tif: "TIFF",
    tiff: "TIFF",
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
    "image/tiff": "tif",
  };
  return extensions[mimeType] || "png";
}

function looksLikeTiffFile(file, metadata) {
  const mimeType = String(file?.type || "").toLowerCase();
  const fileName = String(file?.name || "").toLowerCase();
  const format = String(metadata?.format || "").toLowerCase();
  return mimeType.includes("tiff")
    || fileName.endsWith(".tif")
    || fileName.endsWith(".tiff")
    || format === "tiff";
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
  syncMetadataDisplayFromBandComposer(metadata);
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
  return [
    compositeChannelValueAt(x, y, 0),
    compositeChannelValueAt(x, y, 1),
    compositeChannelValueAt(x, y, 2),
  ];
}

function analysisValueAt(x, y) {
  const [r, g, b] = sourceRgbAt(x, y);
  return Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
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
  initializeBandComposer();
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
  renderBandComposerControls();
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
    previewCaption.textContent = previewCaptionText();
  }
}

function updateVisibleSections() {
  modeSections.forEach((section) => {
    const modes = (section.dataset.visibleModes || "").split(/\s+/);
    section.classList.toggle("is-hidden", !modes.includes(state.activePack));
  });
  updateSceneContextVisibility();
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

function renderPageBackgroundPalette() {
  pageBackgroundPalette.innerHTML = pageBackgroundOptions.map((option) => `
    <button
      class="background-swatch${option.color === state.pageBackground ? " is-active" : ""}"
      type="button"
      data-color="${escapeHtml(option.color)}"
      title="${escapeHtml(option.label)}"
      aria-label="${escapeHtml(option.label)} page background"
      aria-pressed="${option.color === state.pageBackground ? "true" : "false"}"
      style="--swatch-color: ${escapeHtml(option.color)};"
    ></button>
  `).join("");
}

function handlePageBackgroundSelection(event) {
  const button = event.target.closest(".background-swatch");
  if (!button) {
    return;
  }
  applyPageBackground(button.dataset.color || loadStoredPageBackground());
}

function applyPageBackground(color, { persist = true } = {}) {
  const nextColor = normalizePageBackground(color);
  state.pageBackground = nextColor;
  document.documentElement.style.setProperty("--page-background", nextColor);
  if (persist) {
    storePageBackground(nextColor);
  }
  renderPageBackgroundPalette();
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

function geomorphologySignals(features) {
  const relief = clamp(features.edge * 0.58 + features.texture * 0.3 + features.banding * 0.18);
  const plain = clamp(
    clamp((0.44 - features.edge) / 0.24) * 0.54 +
    clamp((0.34 - features.texture) / 0.2) * 0.34 +
    clamp((0.48 - features.banding) / 0.34) * 0.12
  );
  const snow = clamp(
    clamp((features.brightness - 0.38) / 0.26) * 0.42 +
    clamp((0.24 - features.saturation) / 0.18) * 0.34 +
    clamp((features.edge - 0.28) / 0.34) * 0.24
  );
  const drainage = clamp(features.edge * 0.5 + features.texture * 0.28 + features.banding * 0.22);
  const ridge = clamp(features.edge * 0.68 + features.texture * 0.16 + features.banding * 0.16);
  const bench = clamp(features.banding * 0.62 + features.edge * 0.2 + features.texture * 0.18);
  const volcanic = clamp(features.darkness * 0.42 + features.texture * 0.34 + features.edge * 0.18 + features.warm * 0.12);
  const sand = clamp(features.brightness * 0.32 + features.warm * 0.42 + clamp((0.42 - features.edge) / 0.3) * 0.26);
  const linear = clamp(features.edge * 0.66 + features.banding * 0.2 + features.texture * 0.14);

  return {
    relief,
    plain,
    snow,
    drainage,
    ridge,
    bench,
    volcanic,
    sand,
    linear,
  };
}

function clueBias(clueSet, boosts = [], penalties = []) {
  let bias = 0;
  boosts.forEach(({ id, amount }) => {
    if (clueSet.has(id)) {
      bias += amount;
    }
  });
  penalties.forEach(({ id, amount }) => {
    if (clueSet.has(id)) {
      bias -= amount;
    }
  });
  return bias;
}

function explicitGeomorphologyHintAdjustment(categoryId, explicitClueSet, signals) {
  let bias = 0;
  let gatePenalty = 0;

  const hasDrainage = explicitClueSet.has("drainage-incision");
  const hasRidges = explicitClueSet.has("linear-ridges-breaks");
  const hasStepped = explicitClueSet.has("bench-plateau");
  const hasVolcanic = explicitClueSet.has("volcanic-surface");
  const hasExplicitHints = hasDrainage || hasRidges || hasStepped || hasVolcanic;

  if (hasDrainage) {
    if (categoryId === "glacial-valley") bias += 0.2;
    if (categoryId === "drainage-trace") bias += 0.18;
    if (categoryId === "dissected-terrain") bias += 0.1;
    if (categoryId === "alluvial-fan") bias += 0.06;
    if (categoryId === "smooth-plain") gatePenalty -= 0.12;
  }

  if (hasRidges) {
    if (categoryId === "alpine-ridge-arete") bias += 0.22;
    if (categoryId === "fault-scarp") bias += 0.14;
    if (categoryId === "structural-lineament") bias += 0.12;
    if (categoryId === "glacial-valley") bias += 0.06;
    if (categoryId === "smooth-plain") gatePenalty -= 0.12;
    if (categoryId === "alluvial-fan") gatePenalty -= 0.06;
  }

  if (hasStepped) {
    if (categoryId === "stratified-slope") bias += 0.22;
    if (categoryId === "fault-scarp") bias += 0.08;
    if (categoryId === "volcanic-flow-surface") bias += 0.06;
    if (categoryId === "smooth-plain") gatePenalty -= 0.08;
  }

  if (hasVolcanic) {
    if (categoryId === "volcanic-flow-surface") bias += 0.24;
    if (categoryId === "weathered-regolith") bias += 0.06;
    if (categoryId === "rugged-mountain-terrain") gatePenalty -= 0.16;
    if (categoryId === "glacier-icefield") gatePenalty -= 0.18;
  }

  if (hasExplicitHints && state.primaryLandscape !== "snow-ice") {
    if (categoryId === "rugged-mountain-terrain" && signals.relief < 0.48 && signals.edge < 0.52) {
      gatePenalty -= 0.12;
    }
    if (categoryId === "glacier-icefield" && signals.snow < 0.72) {
      gatePenalty -= 0.16;
    }
  }

  return { bias, gatePenalty };
}

function primaryLandscapeBias(categoryId, primaryLandscape) {
  let bias = 0;
  let gatePenalty = 0;
  const highMountainCategories = new Set([
    "rugged-mountain-terrain",
    "glacier-icefield",
    "glacial-valley",
    "alpine-ridge-arete",
  ]);

  switch (primaryLandscape) {
    case "plain":
      if (categoryId === "smooth-plain") bias += 0.24;
      if (categoryId === "weathered-regolith") bias += 0.1;
      if (categoryId === "alluvial-fan") bias += 0.08;
      if (highMountainCategories.has(categoryId) || categoryId === "fault-scarp") gatePenalty -= 0.16;
      if (categoryId === "dissected-terrain") bias -= 0.08;
      break;
    case "plateau":
      if (categoryId === "stratified-slope") bias += 0.22;
      if (categoryId === "volcanic-flow-surface") bias += 0.12;
      if (categoryId === "weathered-regolith") bias += 0.08;
      if (categoryId === "smooth-plain") bias += 0.04;
      if (highMountainCategories.has(categoryId)) gatePenalty -= 0.18;
      break;
    case "hill":
      if (categoryId === "dissected-terrain") bias += 0.16;
      if (categoryId === "drainage-trace") bias += 0.08;
      if (categoryId === "structural-lineament") bias += 0.05;
      if (categoryId === "fault-scarp") bias += 0.04;
      if (categoryId === "smooth-plain") gatePenalty -= 0.1;
      if (categoryId === "glacier-icefield") gatePenalty -= 0.08;
      break;
    case "hill-range":
      if (categoryId === "dissected-terrain") bias += 0.12;
      if (categoryId === "alpine-ridge-arete") bias += 0.16;
      if (categoryId === "glacial-valley") bias += 0.12;
      if (categoryId === "structural-lineament" || categoryId === "fault-scarp") bias += 0.08;
      if (categoryId === "rugged-mountain-terrain") bias += 0.08;
      if (categoryId === "smooth-plain" || categoryId === "dune-sand-sheet") gatePenalty -= 0.14;
      break;
    case "sea-coast":
      if (categoryId === "smooth-plain") bias += 0.12;
      if (categoryId === "alluvial-fan") bias += 0.08;
      if (categoryId === "drainage-trace") bias += 0.08;
      if (categoryId === "weathered-regolith") bias += 0.04;
      if (highMountainCategories.has(categoryId) || categoryId === "fault-scarp") gatePenalty -= 0.18;
      break;
    case "water-body":
      if (categoryId === "drainage-trace") bias += 0.18;
      if (categoryId === "smooth-plain") bias += 0.06;
      if (categoryId === "alluvial-fan") bias += 0.04;
      if (highMountainCategories.has(categoryId) || categoryId === "volcanic-flow-surface") gatePenalty -= 0.18;
      break;
    case "snow-ice":
      if (categoryId === "rugged-mountain-terrain") bias += 0.18;
      if (categoryId === "glacier-icefield") bias += 0.24;
      if (categoryId === "glacial-valley") bias += 0.18;
      if (categoryId === "alpine-ridge-arete") bias += 0.1;
      if (categoryId === "smooth-plain" || categoryId === "dune-sand-sheet" || categoryId === "weathered-regolith") {
        gatePenalty -= 0.2;
      }
      break;
    default:
      break;
  }

  return { bias, gatePenalty };
}

function applyGeomorphologyAdjustments(category, features) {
  const explicitClueSet = selectedSceneClueSet();
  const clueSet = effectiveSceneClueSet();
  const signals = geomorphologySignals(features);
  const landscapeBias = primaryLandscapeBias(category.id, state.primaryLandscape);
  const explicitHintBias = explicitGeomorphologyHintAdjustment(category.id, explicitClueSet, signals);
  let bias = landscapeBias.bias + explicitHintBias.bias;
  let gatePenalty = landscapeBias.gatePenalty + explicitHintBias.gatePenalty;

  switch (category.id) {
    case "smooth-plain":
      bias += clueBias(clueSet,
        [
          { id: "low-relief-plain", amount: 0.18 },
          { id: "bench-plateau", amount: 0.05 },
        ],
        [
          { id: "steep-mountain", amount: 0.16 },
          { id: "snow-ice", amount: 0.14 },
          { id: "linear-ridges-breaks", amount: 0.08 },
        ]);
      if (signals.plain < 0.42) {
        gatePenalty -= 0.08;
      }
      if (signals.relief > 0.62) {
        gatePenalty -= 0.12;
      }
      break;
    case "stratified-slope":
      bias += clueBias(clueSet,
        [
          { id: "bench-plateau", amount: 0.16 },
          { id: "linear-ridges-breaks", amount: 0.08 },
        ],
        [
          { id: "snow-ice", amount: 0.08 },
        ]);
      if (signals.bench < 0.34) {
        gatePenalty -= 0.06;
      }
      break;
    case "dissected-terrain":
      bias += clueBias(clueSet,
        [
          { id: "drainage-incision", amount: 0.12 },
          { id: "steep-mountain", amount: 0.06 },
        ],
        [
          { id: "low-relief-plain", amount: 0.12 },
        ]);
      if (signals.relief < 0.34) {
        gatePenalty -= 0.08;
      }
      break;
    case "alluvial-fan":
      bias += clueBias(clueSet,
        [
          { id: "drainage-incision", amount: 0.1 },
          { id: "low-relief-plain", amount: 0.05 },
        ],
        [
          { id: "snow-ice", amount: 0.1 },
          { id: "volcanic-surface", amount: 0.08 },
        ]);
      break;
    case "drainage-trace":
      bias += clueBias(clueSet,
        [
          { id: "drainage-incision", amount: 0.16 },
          { id: "linear-ridges-breaks", amount: 0.04 },
        ],
        [
          { id: "sand-sheet", amount: 0.06 },
        ]);
      if (signals.drainage < 0.34) {
        gatePenalty -= 0.06;
      }
      break;
    case "rugged-mountain-terrain":
      bias += clueBias(clueSet,
        [
          { id: "steep-mountain", amount: 0.16 },
          { id: "snow-ice", amount: 0.08 },
        ],
        [
          { id: "low-relief-plain", amount: 0.22 },
          { id: "sand-sheet", amount: 0.12 },
          { id: "volcanic-surface", amount: 0.06 },
        ]);
      if (signals.relief < 0.5 || (signals.edge < 0.48 && signals.texture < 0.52)) {
        gatePenalty -= 0.28;
      }
      break;
    case "glacier-icefield":
      bias += clueBias(clueSet,
        [
          { id: "snow-ice", amount: 0.22 },
          { id: "steep-mountain", amount: 0.08 },
        ],
        [
          { id: "low-relief-plain", amount: 0.22 },
          { id: "volcanic-surface", amount: 0.1 },
          { id: "sand-sheet", amount: 0.14 },
        ]);
      if (signals.snow < 0.44) {
        gatePenalty -= 0.32;
      }
      if (signals.relief < 0.36 && !clueSet.has("snow-ice")) {
        gatePenalty -= 0.12;
      }
      break;
    case "glacial-valley":
      bias += clueBias(clueSet,
        [
          { id: "steep-mountain", amount: 0.14 },
          { id: "snow-ice", amount: 0.14 },
          { id: "drainage-incision", amount: 0.08 },
        ],
        [
          { id: "low-relief-plain", amount: 0.24 },
          { id: "volcanic-surface", amount: 0.08 },
          { id: "sand-sheet", amount: 0.12 },
        ]);
      if (signals.relief < 0.48 || signals.drainage < 0.42 || signals.snow < 0.26) {
        gatePenalty -= 0.3;
      }
      break;
    case "alpine-ridge-arete":
      bias += clueBias(clueSet,
        [
          { id: "steep-mountain", amount: 0.16 },
          { id: "linear-ridges-breaks", amount: 0.16 },
          { id: "snow-ice", amount: 0.06 },
        ],
        [
          { id: "low-relief-plain", amount: 0.24 },
          { id: "bench-plateau", amount: 0.08 },
          { id: "sand-sheet", amount: 0.12 },
          { id: "volcanic-surface", amount: 0.06 },
        ]);
      if (signals.relief < 0.52 || signals.ridge < 0.52) {
        gatePenalty -= 0.3;
      }
      break;
    case "dune-sand-sheet":
      bias += clueBias(clueSet,
        [
          { id: "sand-sheet", amount: 0.2 },
          { id: "low-relief-plain", amount: 0.05 },
        ],
        [
          { id: "snow-ice", amount: 0.16 },
          { id: "drainage-incision", amount: 0.08 },
        ]);
      if (signals.sand < 0.34) {
        gatePenalty -= 0.08;
      }
      break;
    case "weathered-regolith":
      bias += clueBias(clueSet,
        [
          { id: "low-relief-plain", amount: 0.04 },
          { id: "bench-plateau", amount: 0.06 },
        ],
        [
          { id: "snow-ice", amount: 0.08 },
        ]);
      break;
    case "volcanic-flow-surface":
      bias += clueBias(clueSet,
        [
          { id: "volcanic-surface", amount: 0.2 },
          { id: "bench-plateau", amount: 0.08 },
        ],
        [
          { id: "snow-ice", amount: 0.14 },
          { id: "low-relief-plain", amount: 0.06 },
        ]);
      if (signals.volcanic < 0.38) {
        gatePenalty -= 0.1;
      }
      break;
    case "structural-lineament":
    case "fault-scarp":
      bias += clueBias(clueSet,
        [
          { id: "linear-ridges-breaks", amount: 0.18 },
          { id: "steep-mountain", amount: 0.04 },
        ],
        [
          { id: "low-relief-plain", amount: 0.04 },
        ]);
      if (signals.linear < 0.34) {
        gatePenalty -= 0.06;
      }
      break;
    default:
      break;
  }

  return {
    score: clamp(category.score + bias + gatePenalty),
  };
}

function classifyWithHeuristics(features, pack) {
  const featureKeys = ["brightness", "saturation", "warm", "texture", "edge", "banding", "darkness"];
  const scored = pack.categories.map((category) => {
    const closeness = featureKeys.reduce((sum, key) => {
      const tolerance = key === "warm" ? 0.38 : 0.34;
      return sum + distanceScore(features[key], category.weights[key], tolerance);
    }, 0);
    const score = closeness / featureKeys.length;
    const scoredCategory = {
      ...category,
      score,
      confidence: confidenceFromScore(score),
    };

    if (pack === categoryPacks.geomorphology || category.sourcePack === "geomorphology") {
      const adjusted = applyGeomorphologyAdjustments(scoredCategory, features);
      scoredCategory.score = adjusted.score;
      scoredCategory.confidence = confidenceFromScore(adjusted.score);
    }

    return scoredCategory;
  });

  return scored.sort((a, b) => b.score - a.score);
}

function confidenceFromScore(score) {
  return clamp(0.18 + score * 0.78);
}

function visibleAlternativesForResults(results) {
  const [top, ...alternatives] = results;
  if (state.activePack !== "geomorphology") {
    return alternatives.slice(0, 4);
  }

  return alternatives
    .filter((item) => item.confidence >= Math.max(0.28, top.confidence - 0.16))
    .filter((item) => item.score >= Math.max(0.18, top.score - 0.2))
    .slice(0, 4);
}

function renderResults(results, features) {
  const [top] = results;
  const visibleAlternatives = visibleAlternativesForResults(results);
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
    renderStructuralGeology(results, features);
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
  const landscapeNote = hasLandscapeGuidance() && state.classificationLabelSource !== "geology"
    ? " Landscape context is guiding geomorphology-based class labels."
    : "";

  if (smallestClass < 0.01) {
    const smallestLabel = formatPixelPercent(smallestClass);
    classification.classes.forEach((item) => {
      item.included = item.percent >= 0.01;
    });
    state.lastPixelClassification = { classification, stats };
    renderPixelClassMessage(`Classes below 1% start unchecked. Smallest class is ${smallestLabel}; use the checkboxes to review or hide classes.${mergeMessage}${landscapeNote}`, "success");
    renderPixelClassResults(classification, stats);
    renderSourceImage({ restoreCaption: true });
    applyPixelClassificationOverlay(classification, stats);
    return;
  }

  renderPixelClassMessage(`Accepted: ${classification.classes.length.toLocaleString()} interpreted classes from low ${stats.low} to high ${stats.high}, labeled from ${classificationSourceLabel()}. Use each result checkbox to show or hide that class.${mergeMessage}${landscapeNote}`, "success");
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
  const landscapeGuided = hasLandscapeGuidance();
  const candidates = selectedCategories
    .map((category) => {
      const alreadyUsedPenalty = usedGeologyLabels.has(category.label) ? 0.08 : 0;
      const rankedBiasValue = rankedBias.get(category.optionKey || category.id) || 0;
      const contextSourceBias = landscapeGuided && state.classificationLabelSource !== "geology"
        ? category.sourcePack === "geomorphology"
          ? 0.08 + (category.score || 0) * 0.12 + (category.confidence || 0) * 0.04
          : state.classificationLabelSource === "both"
            ? -0.015
            : 0
        : 0;
      const score =
        distanceScore(brightness, category.weights.brightness, 0.28) * 0.34 +
        distanceScore(darkness, category.weights.darkness, 0.28) * 0.22 +
        distanceScore(features.warm, category.weights.warm, 0.42) * 0.12 +
        distanceScore(features.texture, category.weights.texture, 0.42) * 0.12 +
        distanceScore(features.edge, category.weights.edge, 0.42) * 0.08 +
        distanceScore(features.banding, category.weights.banding, 0.42) * 0.08 +
        rankedBiasValue +
        contextSourceBias -
        alreadyUsedPenalty;

      return { category, score };
    })
    .sort((a, b) => b.score - a.score);

  const best = candidates[0].category;
  const tone = describePixelTone(brightness);
  const reason = landscapeGuided && best.sourcePack === "geomorphology" && state.classificationLabelSource !== "geology"
    ? `${tone} pixels are closest to ${best.label} using brightness plus image texture, color, edge, banding, and the current landscape context.`
    : `${tone} pixels are closest to ${best.label} using brightness plus image texture, color, edge, and banding cues.`;

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
    ["Display composite", compositeBandSummary()],
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
  metadataSummaryText.textContent = "No image loaded";
  metadataGrid.innerHTML = [
    ["Source bands", "Waiting"],
    ["Analysis bands", "Waiting"],
    ["Display composite", "Waiting"],
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
    ["Display composite", formatBandList(metadata.displayBandCount, metadata.displayBandLabels)],
    ["Bit depth", metadata.bitDepth || "Unknown"],
    ["File size", formatFileSize(metadata.fileSize)],
    ["Modified", formatModifiedDate(metadata.lastModified)],
  ];

  metadataGrid.innerHTML = rows.map(([label, value]) => metadataRow(label, value)).join("");
  metadataNote.textContent = metadataSummary(metadata);
  metadataSummaryText.textContent = metadataHeaderSummaryText(metadata);
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

  if (metadata.displayNote) {
    return metadata.displayNote;
  }

  if (metadata.encodedBandCount && metadata.workingBandCount && metadata.encodedBandCount !== metadata.workingBandCount) {
    return "Source metadata and analysis bands differ because browser display pixels were converted before analysis.";
  }

  if (metadata.notes?.length) {
    return metadata.notes[metadata.notes.length - 1];
  }

  return "Source metadata is separated from browser display bands.";
}

function metadataHeaderSummaryText(metadata) {
  if (!metadata) {
    return "No image loaded";
  }

  const bandCount = metadata.workingBandCount || metadata.encodedBandCount || metadata.displayBandCount || 0;
  const bandLabels = metadata.workingBandLabels?.length
    ? metadata.workingBandLabels
    : metadata.encodedBandLabels?.length
      ? metadata.encodedBandLabels
      : metadata.displayBandLabels || [];
  const width = metadata.decodedWidth || metadata.encodedWidth;
  const height = metadata.decodedHeight || metadata.encodedHeight;

  const parts = [];
  if (bandCount) {
    parts.push(formatBandSummary(bandCount, bandLabels));
  }
  if (width && height) {
    parts.push(formatDimensionsSummary(width, height));
  }
  return parts.length ? parts.join(" | ") : "No image loaded";
}

function formatMetadataFormat(metadata) {
  const parts = [metadata.format, metadata.colorModel].filter(Boolean);
  return parts.length ? parts.join(" - ") : "Unknown";
}

function formatDimensions(width, height) {
  return width && height ? `${width.toLocaleString()} x ${height.toLocaleString()} px` : "Unknown";
}

function formatDimensionsSummary(width, height) {
  return width && height ? `${width.toLocaleString()} x ${height.toLocaleString()}` : "Unknown";
}

function formatBandSummary(count, labels = []) {
  if (!count) {
    return "Bands unknown";
  }

  const conciseLabels = labels.length ? labels.join(", ") : "Unlabeled";
  return `${count} band${count === 1 ? "" : "s"}: ${conciseLabels}`;
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
    features.brightness > 0.42 && features.saturation < 0.22 && features.edge > 0.55
      ? "Bright low-saturation terrain with strong relief may indicate snow or ice cover."
      : "",
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
  const hasColdBrightTerrain = features.brightness > 0.42
    && features.saturation < 0.22
    && features.edge > 0.55
    && (
      features.texture > 0.45
      || features.darkness > 0.28
      || features.banding > 0.14
    );

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

  if (hasColdBrightTerrain) {
    landformHints.push("snow or ice cover");
    landformHints.push("shadow-enhanced mountain relief");
    notes.push("Extractable feature: bright low-saturation slopes with strong ridge-shadow contrast can indicate snowfields, glacier ice, firn cover, or seasonal snow on steep mountain terrain.");
    notes.push("Extractable feature: alternating bright snow and dark shadow bands strengthen interpretation of high-relief ridges, steep hollows, ice-cut walls, ravines, or deeply incised mountain valleys.");
  }

  if (top.family === "Structure") {
    notes.push("Priority interpretation: map linear trends, offsets, repeated bands, and cross-cutting relationships before assigning a structural landform label.");
  }

  if (top.family === "Outcrop" || top.id === "stratified-outcrop") {
    notes.push("Priority interpretation: trace bedding continuity, dip direction, slope breaks, and possible erosion-resistant layers across the image.");
  }

  if (top.family === "Landform" || top.id === "volcanic-terrain") {
    notes.push("Priority interpretation: compare roughness, flow-like margins, dark tone, step-like trap surfaces, and drainage disruption to separate Deccan Trap terrain from shadowed slopes.");
  }

  if (top.id === "rugged-mountain-terrain") {
    notes.push("Priority interpretation: compare ridge-shadow relief, exposed rock or snow patches, slope breaks, and drainage incision to separate rugged mountain terrain from bright plains or cloud-like surfaces.");
  }

  if (top.id === "glacier-icefield") {
    notes.push("Priority interpretation: trace bright snow-ice masses, flow-aligned texture, meltwater margins, and dark valley-side confinement to assess glacier or icefield expression.");
  }

  if (top.id === "glacial-valley") {
    notes.push("Priority interpretation: follow the valley corridor, lateral confinement, snow-ice pathway, and meltwater or debris-fed drainage to confirm a valley, ravine, or incised channel form.");
  }

  if (top.id === "alpine-ridge-arete") {
    notes.push("Priority interpretation: map crest continuity, ridge segments, saddles, and steep shadow-enhanced ridge breaks before assigning broader mountain terrain labels.");
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
  metricsGrid.innerHTML = ["Display composite", "Analysis bands", "Dominant tone", "Brightness", "Texture", "Banding"].map((label) => `
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

const structuralGeologyIds = new Set([
  "fold",
  "fault",
  "fault-lineament",
  "joint-fracture-set",
  "shear-zone",
]);

function renderEmptyStructuralGeology() {
  structuralGeologySummary.textContent = "Load an image to screen for folds, faults, and structural traces.";
  structuralGeologyList.innerHTML = `
    <li>Likely structural geology calls will appear here in the Geology view only.</li>
  `;
}

function structuralReasonForCategory(category, features) {
  switch (category.id) {
    case "fold":
      return "Strong banding and directional fabric support folded strata, folded gneiss, or repeated curved layering.";
    case "fault":
      return "Sharp discontinuities and broken texture support a possible fault zone or disrupted structural contact.";
    case "fault-lineament":
      return "Persistent high-edge linear contrast supports a fault line, structural lineament, or fracture-controlled trace.";
    case "joint-fracture-set":
      return "Repeated linear breaks with moderate texture suggest jointing, fracture sets, or closely spaced cracks.";
    case "shear-zone":
      return "Strong planar banding with elongated texture suggests a sheared fabric, shear zone, or mylonitic belt.";
    default:
      if (features.edge > 0.72) {
        return "High edge contrast supports a structural discontinuity or fracture-controlled pattern.";
      }
      if (features.banding > 0.7) {
        return "Strong banding supports a folded or foliated structural fabric.";
      }
      return "Structural evidence is present, but the image does not isolate a single dominant structural style.";
  }
}

function renderStructuralGeology(results, features) {
  const structuralItems = results
    .filter((item) => structuralGeologyIds.has(item.id) || item.family === "Structure")
    .slice(0, 4);

  if (!structuralItems.length) {
    renderEmptyStructuralGeology();
    return;
  }

  const [top] = structuralItems;
  if (top.confidence < 0.32 && features.edge < 0.48 && features.banding < 0.52) {
    structuralGeologySummary.textContent = "Structural geology signal is weak in this image. Fold or fault interpretation should stay tentative.";
  } else if (top.confidence >= 0.56) {
    structuralGeologySummary.textContent = `Likely structural geology: ${top.label} (${percent(top.confidence)} confidence).`;
  } else {
    structuralGeologySummary.textContent = `Possible structural geology: ${top.label} (${percent(top.confidence)} confidence).`;
  }

  structuralGeologyList.innerHTML = structuralItems.map((item, index) => `
    <li>
      <strong>${escapeHtml(item.label)} <span class="structural-rank">${index === 0 ? "Top pick" : `Option ${index + 1}`}</span></strong>
      ${escapeHtml(structuralReasonForCategory(item, features))}
    </li>
  `).join("");
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
