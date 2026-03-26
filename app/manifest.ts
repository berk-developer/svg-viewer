import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SVG Viewer",
    short_name: "SVG Viewer",
    description:
      "Client-side SVG viewer for safe preview, worker inspection, and practical export.",
    start_url: "/",
    display: "standalone",
    background_color: "#f0e8d7",
    theme_color: "#111111",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}

