import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SVG Lab",
    short_name: "SVG Lab",
    description:
      "Client-side SVG viewer for safe preview, worker inspection, and practical export.",
    start_url: "/",
    display: "standalone",
    background_color: "#010104",
    theme_color: "#010104",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
