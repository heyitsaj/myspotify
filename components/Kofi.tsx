"use client";

import { useEffect } from "react";

export default function KofiWidget() {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://storage.ko-fi.com/cdn/scripts/overlay-widget.js";
    script.async = true;

    script.onload = () => {
      // @ts-expect-error because kofiWidgetOverlay isn't typed
      if (window.kofiWidgetOverlay) {
        // @ts-expect-error because bruh
        window.kofiWidgetOverlay.draw("andrewjaymccauley", {
          type: "floating-chat",
          "floating-chat.donateButton.text": "Support me",
          "floating-chat.donateButton.background-color": "#00b9fe",
          "floating-chat.donateButton.text-color": "#fff",
        });
      }
    };

    document.body.appendChild(script);
  }, []);

  return null; // nothing visual is rendered directly
}
