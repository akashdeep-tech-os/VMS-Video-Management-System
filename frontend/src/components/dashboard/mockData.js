// ============================================
// CENTRALIZED MOCK DATA FOR VMS DASHBOARD
// ============================================
// NOTE: Camera data is now fetched from the real backend API.
// This file only retains geographic constants (districts/boundaries) for map overlays.

// Police Station Districts
export const districts = [
  { id: "d1", name: "Muradka", zone: "North" },
  { id: "d2", name: "Nangloi", zone: "West" },
  { id: "d3", name: "Nihal Vihar", zone: "West" },
  { id: "d4", name: "Sultan Puri", zone: "North" },
  { id: "d5", name: "Paschim Vihar East", zone: "West" },
  { id: "d6", name: "Paschim Vihar West", zone: "West" },
  { id: "d7", name: "Rani Bagh", zone: "North" },
  { id: "d8", name: "Mangolpuri", zone: "North" },
  { id: "d9", name: "Ranhola", zone: "West" },
  { id: "d10", name: "Mundka", zone: "West" },
  { id: "d11", name: "Raj Park", zone: "Central" },
];

// District boundary polygons (approximate GeoJSON-style coordinates for map overlays)
export const districtBoundaries = {
  "Muradka": [
    [77.13, 28.66], [77.17, 28.66], [77.17, 28.70], [77.13, 28.70], [77.13, 28.66],
  ],
  "Nangloi": [
    [77.03, 28.60], [77.07, 28.60], [77.07, 28.64], [77.03, 28.64], [77.03, 28.60],
  ],
  "Nihal Vihar": [
    [77.04, 28.61], [77.08, 28.61], [77.08, 28.65], [77.04, 28.65], [77.04, 28.61],
  ],
  "Sultan Puri": [
    [77.10, 28.65], [77.14, 28.65], [77.14, 28.69], [77.10, 28.69], [77.10, 28.65],
  ],
  "Paschim Vihar East": [
    [77.085, 28.635], [77.115, 28.635], [77.115, 28.665], [77.085, 28.665], [77.085, 28.635],
  ],
  "Paschim Vihar West": [
    [77.075, 28.635], [77.105, 28.635], [77.105, 28.665], [77.075, 28.665], [77.075, 28.635],
  ],
  "Rani Bagh": [
    [77.115, 28.665], [77.145, 28.665], [77.145, 28.695], [77.115, 28.695], [77.115, 28.665],
  ],
  "Mangolpuri": [
    [77.095, 28.675], [77.125, 28.675], [77.125, 28.705], [77.095, 28.705], [77.095, 28.675],
  ],
  "Ranhola": [
    [77.065, 28.625], [77.095, 28.625], [77.095, 28.655], [77.065, 28.655], [77.065, 28.625],
  ],
  "Mundka": [
    [77.055, 28.665], [77.085, 28.665], [77.085, 28.695], [77.055, 28.695], [77.055, 28.665],
  ],
  "Raj Park": [
    [77.125, 28.625], [77.155, 28.625], [77.155, 28.655], [77.125, 28.655], [77.125, 28.625],
  ],
};
