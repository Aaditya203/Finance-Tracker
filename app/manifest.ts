import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Partner Finance Tracker",
    short_name: "Finance",
    description: "Private shared finance workspace for partners",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#fff8f1",
    theme_color: "#fa5d00",
    orientation: "portrait",
    scope: "/",
    icons: [
      {
        src: "/logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
