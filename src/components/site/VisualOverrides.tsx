import { useEffect } from "react";
import { useContent, type AddedVisualImage, type VisualOverride } from "@/lib/content";

const managedStyleKeys = [
  "color",
  "fontSize",
  "fontFamily",
  "fontWeight",
  "lineHeight",
  "letterSpacing",
  "backgroundColor",
  "width",
  "height",
  "translate",
] as const;

function queryAll(selector: string): HTMLElement[] {
  try {
    return Array.from(document.querySelectorAll<HTMLElement>(selector));
  } catch {
    return [];
  }
}

function applyOverride(element: HTMLElement, override: VisualOverride) {
  if (override.text !== undefined && element.textContent !== override.text) {
    element.textContent = override.text;
  }

  if (override.imageSrc && element instanceof HTMLImageElement && element.src !== override.imageSrc) {
    element.src = override.imageSrc;
  }

  for (const key of managedStyleKeys) {
    const value = override.styles[key];
    if (value !== undefined && element.style[key] !== value) {
      element.style[key] = value;
    }
  }
}

function addImage(image: AddedVisualImage) {
  const existing = document.querySelector<HTMLImageElement>(`[data-live-image-id="${image.id}"]`);
  const parent = queryAll(image.parentSelector)[0] ?? document.querySelector("main") ?? document.body;
  const node = existing ?? document.createElement("img");

  node.dataset["liveImageId"] = image.id;
  node.src = image.src;
  node.alt = image.alt || "صورة مضافة";
  node.style.position = "relative";
  node.style.display = "block";
  node.style.objectFit = "cover";
  node.style.width = `${image.width}px`;
  node.style.height = `${image.height}px`;
  node.style.translate = `${image.x}px ${image.y}px`;
  node.style.zIndex = "10";
  node.style.maxWidth = "100%";

  if (!existing) parent.appendChild(node);
}

export function VisualOverrides() {
  const { content } = useContent();

  useEffect(() => {
    const apply = () => {
      for (const override of content.visualEditor.overrides) {
        for (const element of queryAll(override.selector)) applyOverride(element, override);
      }
      for (const image of content.visualEditor.addedImages) addImage(image);

      const configured = new Set(content.visualEditor.addedImages.map((image) => image.id));
      document.querySelectorAll<HTMLImageElement>("[data-live-image-id]").forEach((element) => {
        if (!configured.has(element.dataset["liveImageId"] ?? "")) element.remove();
      });
    };

    apply();
    const observer = new MutationObserver(() => apply());
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [content.visualEditor]);

  return null;
}
