import { createFileRoute } from "@tanstack/react-router";
import { getStoredCoverFile } from "@/lib/catalog-cover-upload-server";
import { getStoredDownloadFile } from "@/lib/downloads-server";

function imageContentType(filename: string): string {
  const extension = filename.split(".").pop()?.toLowerCase();
  if (extension === "png") return "image/png";
  if (extension === "webp") return "image/webp";
  return "image/jpeg";
}

function downloadContentType(filename: string): string {
  const extension = filename.split(".").pop()?.toLowerCase();
  return {
    csv: "text/csv; charset=utf-8",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ods: "application/vnd.oasis.opendocument.spreadsheet",
    odt: "application/vnd.oasis.opendocument.text",
    pdf: "application/pdf",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    zip: "application/zip",
  }[extension ?? ""] ?? "application/octet-stream";
}

function safeAttachmentFilename(filename: string): string {
  return filename.replace(/[\\"\r\n]/g, "-");
}

export const Route = createFileRoute("/media/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        let requestedPath: string;
        try {
          requestedPath = decodeURIComponent(params._splat ?? "");
        } catch {
          return new Response("Not found", { status: 404 });
        }

        const [kind, identifier, ...rest] = requestedPath.split("/");
        if (rest.length > 0 || !kind || !identifier) return new Response("Not found", { status: 404 });

        if (kind === "cover") {
          const data = await getStoredCoverFile(identifier);
          if (!data) return new Response("Not found", { status: 404 });
          return new Response(data, {
            headers: {
              "Content-Type": imageContentType(identifier),
              "Cache-Control": "public, max-age=31536000, immutable",
            },
          });
        }

        if (kind === "download") {
          const file = await getStoredDownloadFile(identifier);
          if (!file) return new Response("Not found", { status: 404 });
          const filename = safeAttachmentFilename(file.filename);
          return new Response(file.data, {
            headers: {
              "Content-Type": downloadContentType(filename),
              "Content-Disposition": `attachment; filename="${filename}"`,
              "Cache-Control": "private, max-age=0, no-store",
            },
          });
        }

        return new Response("Not found", { status: 404 });
      },
    },
  },
});
