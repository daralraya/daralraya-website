import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, Redo2, Save, Trash2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import {
  useContent,
  type AddedVisualImage,
  type VisualEditorState,
  type VisualOverride,
} from "@/lib/content";

type SelectedElement = {
  selector: string;
  tag: string;
  label: string;
  text?: string;
  imageSrc?: string;
  addedImageId?: string;
};

function selectorFor(element: Element): string {
  const parts: string[] = [];
  let node: Element | null = element;
  while (node && node.tagName.toLowerCase() !== "body") {
    if (node.id) {
      parts.unshift(`#${node.id}`);
      break;
    }
    const parent: Element | null = node.parentElement;
    if (!parent) break;
    const tag = node.tagName.toLowerCase();
    const siblings = Array.from(parent.children).filter((child: Element) => child.tagName.toLowerCase() === tag);
    const index = siblings.indexOf(node) + 1;
    parts.unshift(`${tag}:nth-of-type(${Math.max(index, 1)})`);
    node = parent;
  }
  return parts.join(" > ");
}

function isImageElement(element: Element | null): element is HTMLImageElement {
  return Boolean(element && element.tagName.toLowerCase() === "img");
}

function editableTarget(target: EventTarget | null): HTMLElement | null {
  // Elements inside an iframe belong to a different Window, so instanceof HTMLElement
  // is unreliable here. Checking for the DOM closest() method works in both documents.
  if (!target || typeof (target as Element).closest !== "function") return null;
  const element = target as HTMLElement;
  const image = element.closest("img");
  if (image) return image as HTMLElement;
  return element.closest("h1,h2,h3,h4,p,span,a,button,li");
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("تعذر قراءة الصورة"));
    reader.onerror = () => reject(new Error("تعذر قراءة الصورة"));
    reader.readAsDataURL(file);
  });
}

function findOverride(state: VisualEditorState, selector: string): VisualOverride {
  return state.overrides.find((item) => item.selector === selector) ?? { selector, styles: {} };
}

function upsertOverride(state: VisualEditorState, next: VisualOverride): VisualEditorState {
  const exists = state.overrides.some((item) => item.selector === next.selector);
  return {
    ...state,
    overrides: exists
      ? state.overrides.map((item) => item.selector === next.selector ? next : item)
      : [...state.overrides, next],
  };
}

function patchStyle(state: VisualEditorState, selector: string, style: string, value: string): VisualEditorState {
  const current = findOverride(state, selector);
  return upsertOverride(state, {
    ...current,
    styles: { ...current.styles, [style]: value },
  });
}

const reversibleStyleKeys = ["color", "backgroundColor", "fontSize", "fontFamily", "fontWeight", "lineHeight", "letterSpacing", "backgroundColor", "width", "height", "translate", "display"] as const;

function restoreDocumentBaseline(doc: Document) {
  doc.querySelectorAll<HTMLElement>("[data-live-original-text]").forEach((element) => {
    const original = element.getAttribute("data-live-original-text");
    if (original !== null) element.textContent = original;
    element.removeAttribute("data-live-original-text");
  });
  doc.querySelectorAll<HTMLImageElement>("[data-live-original-image-src]").forEach((element) => {
    const original = element.getAttribute("data-live-original-image-src");
    if (original !== null) element.src = original;
    element.removeAttribute("data-live-original-image-src");
  });
  for (const styleKey of reversibleStyleKeys) {
    const attribute = `data-live-original-style-${styleKey}`;
    doc.querySelectorAll<HTMLElement>(`[${attribute}]`).forEach((element) => {
      const original = element.getAttribute(attribute) ?? "";
      (element.style as unknown as Record<string, string>)[styleKey] = original;
      element.removeAttribute(attribute);
    });
  }
}

function applyToDocument(doc: Document, state: VisualEditorState) {
  restoreDocumentBaseline(doc);
  for (const override of state.overrides) {
    let elements: HTMLElement[] = [];
    try { elements = Array.from(doc.querySelectorAll<HTMLElement>(override.selector)); } catch { /* ignore invalid selector */ }
    elements.forEach((element) => {
      if (override.text !== undefined) {
        if (!element.hasAttribute("data-live-original-text")) element.setAttribute("data-live-original-text", element.textContent ?? "");
        if (element.textContent !== override.text) element.textContent = override.text;
      }
      if (override.imageSrc && isImageElement(element)) {
        if (!element.hasAttribute("data-live-original-image-src")) element.setAttribute("data-live-original-image-src", element.src);
        if (element.src !== override.imageSrc) element.src = override.imageSrc;
      }
      Object.entries(override.styles).forEach(([key, value]) => {
        const attribute = `data-live-original-style-${key}`;
        if (!element.hasAttribute(attribute)) element.setAttribute(attribute, (element.style as unknown as Record<string, string>)[key] ?? "");
        (element.style as unknown as Record<string, string>)[key] = value;
      });
    });
  }

  const configured = new Set(state.addedImages.map((image) => image.id));
  doc.querySelectorAll<HTMLImageElement>("[data-live-image-id]").forEach((image) => {
    if (!configured.has(image.dataset["liveImageId"] ?? "")) image.remove();
  });

  state.addedImages.forEach((image) => {
    const existing = doc.querySelector<HTMLImageElement>(`[data-live-image-id="${image.id}"]`);
    let parent: Element | null = null;
    try { parent = doc.querySelector(image.parentSelector); } catch { parent = null; }
    const node = existing ?? doc.createElement("img");
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
    if (!existing) (parent ?? doc.querySelector("main") ?? doc.body).appendChild(node);
  });
}

export function LiveVisualEditor() {
  const { content, save, saving, hydrated } = useContent();
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [selected, setSelected] = useState<SelectedElement | null>(null);
  const [history, setHistory] = useState<VisualEditorState[]>([content.visualEditor]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [loadedInitialState, setLoadedInitialState] = useState(false);
  const textEditGroup = useRef<{ selector: string } | null>(null);
  const historyRef = useRef({ states: [content.visualEditor], index: 0 });
  const historyTouched = useRef(false);

  useEffect(() => {
    if (!hydrated || loadedInitialState || historyTouched.current) return;
    const initialStates = [content.visualEditor];
    historyRef.current = { states: initialStates, index: 0 };
    setHistory(initialStates);
    setHistoryIndex(0);
    setLoadedInitialState(true);
  }, [content.visualEditor, hydrated, loadedInitialState]);

  const current = history[historyIndex] ?? content.visualEditor;
  const selectedOverride = useMemo(
    () => selected && !selected.addedImageId ? findOverride(current, selected.selector) : undefined,
    [current, selected],
  );
  const selectedImage = useMemo(
    () => selected?.addedImageId ? current.addedImages.find((image) => image.id === selected.addedImageId) : undefined,
    [current.addedImages, selected],
  );

  const commit = useCallback((next: VisualEditorState) => {
    historyTouched.current = true;
    const snapshot = historyRef.current;
    const states = [...snapshot.states.slice(0, snapshot.index + 1), next].slice(-60);
    const index = states.length - 1;
    historyRef.current = { states, index };
    setHistory(states);
    setHistoryIndex(index);
  }, []);

  const undo = useCallback(() => {
    textEditGroup.current = null;
    const index = Math.max(0, historyRef.current.index - 1);
    historyRef.current = { ...historyRef.current, index };
    setHistoryIndex(index);
  }, []);
  const redo = useCallback(() => {
    textEditGroup.current = null;
    const index = Math.min(historyRef.current.states.length - 1, historyRef.current.index + 1);
    historyRef.current = { ...historyRef.current, index };
    setHistoryIndex(index);
  }, []);

  useEffect(() => {
    const frame = frameRef.current;
    const doc = frame?.contentDocument;
    if (doc) applyToDocument(doc, current);
  }, [current]);

  const selectedSelector = selected?.selector;
  const selectedTag = selected?.tag;
  const selectedAddedImageId = selected?.addedImageId;

  useEffect(() => {
    if (!selectedSelector || selectedTag === "img" || selectedAddedImageId) return;
    const doc = frameRef.current?.contentDocument;
    let element: HTMLElement | null = null;
    try { element = doc?.querySelector<HTMLElement>(selectedSelector) ?? null; } catch { element = null; }
    if (!element) return;
    const text = element.textContent ?? "";
    setSelected((previous) => {
      if (!previous || previous.selector !== selectedSelector || previous.text === text) return previous;
      return { ...previous, text, label: text.slice(0, 80) };
    });
  }, [current, selectedSelector, selectedTag, selectedAddedImageId]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      if (event.key.toLowerCase() !== "z") return;
      event.preventDefault();
      if (event.shiftKey) redo(); else undo();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [redo, undo]);

  const handleHistoryKeyDown = (event: React.KeyboardEvent) => {
    if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "z") return;
    event.preventDefault();
    if (event.shiftKey) redo(); else undo();
  };

  const selectFromFrame = () => {
    const doc = frameRef.current?.contentDocument;
    if (!doc) return;
    doc.addEventListener("click", (event) => {
      const target = editableTarget(event.target);
      if (!target) return;
      if (target.closest("a") && !event.altKey) return;
      event.preventDefault();
      event.stopPropagation();
      const addedImageId = target.dataset["liveImageId"];
      textEditGroup.current = null;
      const nextSelected: SelectedElement = {
        selector: selectorFor(target),
        tag: target.tagName.toLowerCase(),
        label: isImageElement(target) ? target.alt || "صورة" : (target.textContent || target.tagName).slice(0, 80),
      };
      if (isImageElement(target)) nextSelected.imageSrc = target.src;
      else nextSelected.text = target.textContent || "";
      if (addedImageId) nextSelected.addedImageId = addedImageId;
      setSelected(nextSelected);
      doc.querySelectorAll<HTMLElement>("[data-live-selected]").forEach((node) => {
        node.style.outline = "";
        delete node.dataset["liveSelected"];
      });
      target.dataset["liveSelected"] = "true";
      target.style.outline = "2px solid #c8a75b";
      target.style.outlineOffset = "3px";
    }, true);
  };

  const updateText = (text: string) => {
    if (!selected || selected.addedImageId) return;
    const next = upsertOverride(current, { ...findOverride(current, selected.selector), text, styles: findOverride(current, selected.selector).styles });
    if (textEditGroup.current?.selector === selected.selector && historyRef.current.index === historyRef.current.states.length - 1) {
      const states = [...historyRef.current.states];
      states[historyRef.current.index] = next;
      historyRef.current = { ...historyRef.current, states };
      setHistory(states);
    } else {
      textEditGroup.current = { selector: selected.selector };
      commit(next);
    }
    setSelected({ ...selected, text, label: text.slice(0, 80) });
  };

  const updateStyle = (style: string, value: string) => {
    if (!selected) return;
    textEditGroup.current = null;
    if (selected.addedImageId) {
      const nextImages = current.addedImages.map((image) => {
        if (image.id !== selected.addedImageId) return image;
        if (style === "width") return { ...image, width: Number(value) || image.width };
        if (style === "height") return { ...image, height: Number(value) || image.height };
        if (style === "x") return { ...image, x: Number(value) || 0 };
        if (style === "y") return { ...image, y: Number(value) || 0 };
        return image;
      });
      commit({ ...current, addedImages: nextImages });
      return;
    }
    if (style === "x" || style === "y") {
      const previous = findOverride(current, selected.selector).styles["translate"] ?? "0px 0px";
      const [x = "0px", y = "0px"] = previous.split(" ");
      commit(patchStyle(current, selected.selector, "translate", style === "x" ? `${value}px ${y}` : `${x} ${value}px`));
      return;
    }
    commit(patchStyle(current, selected.selector, style, style === "width" || style === "height" ? `${value}px` : value));
  };

  const replaceImage = async (file: File) => {
    if (!selected || selected.tag !== "img") return;
    if (!file.type.match(/^image\/(jpeg|png|webp)$/) || file.size > 1_500_000) {
      toast.error("اختر صورة JPG أو PNG أو WebP بحجم لا يتجاوز 1.5 MB");
      return;
    }
    const source = await readAsDataUrl(file);
    if (selected.addedImageId) {
      commit({ ...current, addedImages: current.addedImages.map((image) => image.id === selected.addedImageId ? { ...image, src: source } : image) });
    } else {
      commit(upsertOverride(current, { ...findOverride(current, selected.selector), imageSrc: source, styles: findOverride(current, selected.selector).styles }));
    }
  };

  const addImage = async (file: File) => {
    if (!selected || !file.type.match(/^image\/(jpeg|png|webp)$/) || file.size > 1_500_000) {
      toast.error("اختر صورة JPG أو PNG أو WebP بحجم لا يتجاوز 1.5 MB");
      return;
    }
    const source = await readAsDataUrl(file);
    const id = `live-${Date.now()}`;
    const image: AddedVisualImage = {
      id,
      parentSelector: selected.tag === "img" ? "main" : selected.selector,
      src: source,
      alt: "صورة مضافة",
      x: 0,
      y: 0,
      width: 260,
      height: 180,
    };
    commit({ ...current, addedImages: [...current.addedImages, image] });
    setSelected({ selector: `[data-live-image-id="${id}"]`, tag: "img", label: "صورة مضافة", imageSrc: source, addedImageId: id });
  };

  const deleteAddedImage = () => {
    if (!selected?.addedImageId) return;
    commit({ ...current, addedImages: current.addedImages.filter((image) => image.id !== selected.addedImageId) });
    setSelected(null);
  };

  const hideOriginalImage = () => {
    if (!selected || selected.tag !== "img" || selected.addedImageId) return;
    commit(patchStyle(current, selected.selector, "display", "none"));
    toast.success("تم إخفاء الصورة — استخدم Ctrl+Z للتراجع");
  };

  const saveVisuals = async () => {
    await save({ ...content, visualEditor: current });
    toast.success("تم حفظ التعديل المرئي");
  };

  const translate = selectedOverride?.styles["translate"]?.split(" ") ?? ["0px", "0px"];
  const controls = selectedImage
    ? { width: selectedImage.width, height: selectedImage.height, x: selectedImage.x, y: selectedImage.y }
    : {
        width: Number.parseInt(selectedOverride?.styles["width"] ?? "0", 10) || 0,
        height: Number.parseInt(selectedOverride?.styles["height"] ?? "0", 10) || 0,
        x: Number.parseInt(translate[0] ?? "0", 10) || 0,
        y: Number.parseInt(translate[1] ?? "0", 10) || 0,
      };

  return (
    <div className="mt-8 grid min-h-[78vh] gap-5 xl:grid-cols-[minmax(280px,340px)_minmax(0,1fr)]" dir="rtl" onKeyDownCapture={handleHistoryKeyDown}>
      <aside className="order-2 h-fit space-y-5 rounded-sm border border-border bg-background p-4 xl:order-1 xl:sticky xl:top-5">
        <div className="flex items-center justify-between gap-2 border-b border-border pb-3">
          <div>
            <p className="font-display text-xl text-brass-soft">المحرر المرئي</p>
            <p className="mt-1 text-xs text-muted-foreground">انقر عنصراً لتعديله؛ استخدم Alt+نقر لتحديد رابط والتنقل بالنقر العادي.</p>
          </div>
          <div className="flex gap-1">
            <button type="button" onClick={undo} disabled={historyIndex === 0} className="border border-border p-2 disabled:opacity-35" title="تراجع Ctrl+Z"><Undo2 className="h-4 w-4" /></button>
            <button type="button" onClick={redo} disabled={historyIndex >= history.length - 1} className="border border-border p-2 disabled:opacity-35" title="إعادة Ctrl+Shift+Z"><Redo2 className="h-4 w-4" /></button>
          </div>
        </div>

        {!selected ? (
          <div className="py-10 text-center text-sm leading-loose text-muted-foreground">اختر نصاً أو صورة من المعاينة الحية لتظهر أدوات التعديل هنا.</div>
        ) : (
          <div className="space-y-4">
            <div className="border-b border-border pb-3">
              <p className="text-[0.65rem] tracking-[0.16em] text-brass uppercase">العنصر المحدد</p>
              <p className="mt-1 line-clamp-2 text-sm">{selected.label}</p>
            </div>

            {selected.tag !== "img" && !selected.addedImageId && (
              <label className="block text-sm">
                النص
                <textarea value={selectedOverride?.text ?? selected.text ?? ""} onInput={(event) => updateText(event.currentTarget.value)} onKeyDown={handleHistoryKeyDown} rows={4} className="mt-1 w-full border border-border bg-surface p-2 text-sm outline-none focus:border-brass" />
              </label>
            )}

            {!selected.addedImageId && selected.tag !== "img" && (
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm">اللون<input type="color" value={selectedOverride?.styles["color"] ?? "#141a2b"} onChange={(event) => updateStyle("color", event.target.value)} className="mt-1 h-10 w-full border border-border bg-surface" /></label>
                <label className="text-sm">الخلفية<input type="color" value={selectedOverride?.styles["backgroundColor"] ?? "#ffffff"} onChange={(event) => updateStyle("backgroundColor", event.target.value)} className="mt-1 h-10 w-full border border-border bg-surface" /></label>
                <label className="text-sm">حجم الخط<input type="number" min="8" max="160" value={Number.parseInt(selectedOverride?.styles["fontSize"] ?? "16", 10)} onChange={(event) => updateStyle("fontSize", `${event.target.value}px`)} className="mt-1 w-full border border-border bg-surface p-2" /></label>
                <label className="text-sm">سماكة الخط<select value={selectedOverride?.styles["fontWeight"] ?? "400"} onChange={(event) => updateStyle("fontWeight", event.target.value)} className="mt-1 w-full border border-border bg-surface p-2"><option value="300">خفيف</option><option value="400">عادي</option><option value="500">متوسط</option><option value="700">عريض</option></select></label>
                <label className="col-span-2 text-sm">الخط<select value={selectedOverride?.styles["fontFamily"] ?? "inherit"} onChange={(event) => updateStyle("fontFamily", event.target.value)} className="mt-1 w-full border border-border bg-surface p-2"><option value="inherit">الافتراضي</option><option value="Tajawal, sans-serif">Tajawal</option><option value="Amiri, serif">Amiri</option><option value="Manrope, sans-serif">Manrope</option><option value="Cormorant Garamond, serif">Cormorant Garamond</option></select></label>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 border-t border-border pt-4">
              <label className="text-sm">تحريك أفقي<input type="number" value={controls.x} onChange={(event) => updateStyle("x", event.target.value)} className="mt-1 w-full border border-border bg-surface p-2" /></label>
              <label className="text-sm">تحريك عمودي<input type="number" value={controls.y} onChange={(event) => updateStyle("y", event.target.value)} className="mt-1 w-full border border-border bg-surface p-2" /></label>
              <label className="text-sm">العرض<input type="number" min="0" value={controls.width} onChange={(event) => updateStyle("width", event.target.value)} className="mt-1 w-full border border-border bg-surface p-2" /></label>
              <label className="text-sm">الارتفاع<input type="number" min="0" value={controls.height} onChange={(event) => updateStyle("height", event.target.value)} className="mt-1 w-full border border-border bg-surface p-2" /></label>
            </div>

            {selected.tag === "img" && (
              <label className="flex cursor-pointer items-center justify-center gap-2 border border-brass px-3 py-2.5 text-sm text-brass hover:bg-brass/10"><ImagePlus className="h-4 w-4" />استبدال الصورة<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) replaceImage(file); event.currentTarget.value = ""; }} /></label>
            )}
            <label className="flex cursor-pointer items-center justify-center gap-2 border border-border px-3 py-2.5 text-sm hover:border-brass"><ImagePlus className="h-4 w-4" />إضافة صورة هنا<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) addImage(file); event.currentTarget.value = ""; }} /></label>
            {selected.addedImageId && <button type="button" onClick={deleteAddedImage} className="flex w-full items-center justify-center gap-2 border border-destructive px-3 py-2.5 text-sm text-destructive"><Trash2 className="h-4 w-4" />حذف الصورة المضافة</button>}
            {selected.tag === "img" && !selected.addedImageId && <button type="button" onClick={hideOriginalImage} className="flex w-full items-center justify-center gap-2 border border-destructive px-3 py-2.5 text-sm text-destructive"><Trash2 className="h-4 w-4" />إخفاء الصورة</button>}
          </div>
        )}

        <button type="button" onClick={saveVisuals} disabled={saving} className="flex w-full items-center justify-center gap-2 bg-primary px-4 py-3 text-sm text-primary-foreground disabled:opacity-60"><Save className="h-4 w-4" />{saving ? "جارٍ الحفظ..." : "حفظ التعديلات"}</button>
      </aside>

      <section className="order-1 overflow-hidden rounded-sm border border-border bg-surface xl:order-2">
        <div className="flex items-center justify-between border-b border-border bg-background px-4 py-3"><span className="text-sm font-medium">المعاينة الحية — انقر أي نص أو صورة</span><span className="text-xs text-muted-foreground">Ctrl+Z / Ctrl+Shift+Z</span></div>
        <iframe
          ref={frameRef}
          src="/"
          title="المعاينة الحية للموقع"
          className="h-[78vh] w-full bg-background"
          onLoad={() => {
            selectFromFrame();
            const doc = frameRef.current?.contentDocument;
            if (doc) applyToDocument(doc, current);
          }}
        />
      </section>
    </div>
  );
}
