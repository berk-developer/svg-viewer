export interface SvgSample {
  name: string;
  description: string;
  text: string;
}

export const sampleSvgs: SvgSample[] = [
  {
    name: "Signal Mesh",
    description: "Gradient-rich poster with sharp geometry and soft glow.",
    text: `<svg width="720" height="540" viewBox="0 0 720 540" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="meshGlow" x1="84" y1="66" x2="650" y2="462" gradientUnits="userSpaceOnUse">
      <stop stop-color="#0F46E9"/>
      <stop offset="0.44" stop-color="#74FF5C"/>
      <stop offset="1" stop-color="#F58B67"/>
    </linearGradient>
    <filter id="softBlur" x="-25%" y="-25%" width="150%" height="150%">
      <feGaussianBlur stdDeviation="18"/>
    </filter>
  </defs>
  <rect width="720" height="540" rx="44" fill="#F6F0E4"/>
  <rect x="28" y="28" width="664" height="484" rx="30" stroke="#111111" stroke-width="3"/>
  <circle cx="154" cy="138" r="84" fill="url(#meshGlow)" filter="url(#softBlur)" opacity="0.28"/>
  <circle cx="580" cy="408" r="92" fill="#0F46E9" opacity="0.12"/>
  <path d="M98 422L252 104L360 274L454 176L616 422" stroke="url(#meshGlow)" stroke-width="24" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M110 422H612" stroke="#111111" stroke-width="3" stroke-dasharray="10 12"/>
  <path d="M146 168L210 168" stroke="#111111" stroke-width="3"/>
  <path d="M492 352L566 352" stroke="#111111" stroke-width="3"/>
  <text x="72" y="100" fill="#111111" font-size="28" font-family="'Avenir Next', sans-serif" letter-spacing="0.18em">PUBLIC SVG VIEWER</text>
  <text x="72" y="472" fill="#111111" font-size="68" font-family="'Iowan Old Style', serif">Safe preview, sharp inspection.</text>
</svg>`,
  },
  {
    name: "Orbital Notes",
    description: "Editorial card with text, ids, classes, and layered strokes.",
    text: `<svg width="640" height="640" viewBox="0 0 640 640" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="aura" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(210 220) rotate(37) scale(280 260)">
      <stop stop-color="#70FF57"/>
      <stop offset="1" stop-color="#70FF57" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="640" height="640" rx="38" fill="#F8F4EA"/>
  <g id="card-frame" class="frame outer">
    <rect x="26" y="26" width="588" height="588" rx="26" stroke="#111111" stroke-width="3"/>
    <rect x="42" y="42" width="556" height="556" rx="20" stroke="#111111" stroke-opacity="0.26" stroke-width="1.5"/>
  </g>
  <circle cx="214" cy="214" r="154" fill="url(#aura)"/>
  <g id="orbit-system" class="orbit detail">
    <circle cx="320" cy="320" r="184" stroke="#111111" stroke-opacity="0.16" stroke-width="2"/>
    <circle cx="320" cy="320" r="128" stroke="#111111" stroke-opacity="0.2" stroke-width="2" stroke-dasharray="14 10"/>
    <circle cx="320" cy="320" r="58" fill="#0F46E9"/>
    <circle cx="452" cy="270" r="20" fill="#F58B67"/>
    <circle cx="186" cy="372" r="14" fill="#111111"/>
  </g>
  <path d="M168 470C226 418 296 392 370 392C440 392 492 410 532 446" stroke="#111111" stroke-width="3.5" stroke-linecap="round"/>
  <text x="72" y="112" fill="#111111" font-size="24" font-family="'Avenir Next', sans-serif" letter-spacing="0.22em">EDITORIAL SAMPLE</text>
  <text x="72" y="500" fill="#111111" font-size="64" font-family="'Iowan Old Style', serif">Track the structure.</text>
  <text x="72" y="548" fill="#111111" fill-opacity="0.72" font-size="26" font-family="'Avenir Next', sans-serif">Worker parsing, palette scan, and export-ready triage.</text>
</svg>`,
  },
  {
    name: "Contour Bloom",
    description: "Mask-based composition with checker-friendly negative space.",
    text: `<svg width="720" height="520" viewBox="0 0 720 520" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="field" x1="64" y1="74" x2="654" y2="438" gradientUnits="userSpaceOnUse">
      <stop stop-color="#102A84"/>
      <stop offset="0.52" stop-color="#2A62F0"/>
      <stop offset="1" stop-color="#78F860"/>
    </linearGradient>
    <mask id="windowMask">
      <rect width="720" height="520" fill="white"/>
      <rect x="244" y="120" width="236" height="280" rx="116" fill="black"/>
    </mask>
  </defs>
  <rect width="720" height="520" rx="40" fill="#F3EDDF"/>
  <rect x="24" y="24" width="672" height="472" rx="30" stroke="#111111" stroke-width="3"/>
  <g mask="url(#windowMask)">
    <rect x="80" y="86" width="560" height="348" rx="174" fill="url(#field)"/>
    <path d="M108 372C162 312 226 280 302 280C376 280 438 304 532 392" stroke="#F3EDDF" stroke-width="34" stroke-linecap="round"/>
    <path d="M170 180C220 132 302 118 378 152C438 178 490 232 548 330" stroke="#F3EDDF" stroke-opacity="0.64" stroke-width="24" stroke-linecap="round"/>
  </g>
  <path d="M246 260C246 190.964 302.964 134 372 134C441.036 134 498 190.964 498 260C498 329.036 441.036 386 372 386C302.964 386 246 329.036 246 260Z" stroke="#111111" stroke-width="3"/>
  <text x="70" y="106" fill="#111111" font-size="24" font-family="'Avenir Next', sans-serif" letter-spacing="0.18em">MASKED SAMPLE</text>
  <text x="70" y="454" fill="#111111" font-size="62" font-family="'Iowan Old Style', serif">Preview without inline SVG mount.</text>
</svg>`,
  },
];

