import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/connect";
import { StudyDocumentModel } from "@/models/study";
import { createWorker } from "tesseract.js";
import { createCanvas } from "@napi-rs/canvas";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import path from "path";
import mammoth from "mammoth";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 15 * 1024 * 1024;

function getFileExtension(fileName: string): string {
  return path.extname(fileName).toLowerCase();
}

export async function POST(req: Request) {
  let extractedText = "";

  try {
    const user = await requireUser();
    await connectToDatabase();

    const formData = await req.formData();
    const fileEntry = formData.get("file");
    const subjectEntry = formData.get("subject");

    if (!fileEntry || typeof fileEntry === "string") {
      return NextResponse.json(
        { success: false, error: "Please select a file to upload." },
        { status: 400 },
      );
    }

    const file = fileEntry as File;
    const subject =
      typeof subjectEntry === "string" && subjectEntry.trim()
        ? subjectEntry.trim()
        : "General";

    if (file.size === 0) {
      return NextResponse.json(
        { success: false, error: "The selected file is empty." },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "File exceeds the 15 MB limit." },
        { status: 413 },
      );
    }

    const extension = getFileExtension(file.name);
    const isPdf = extension === ".pdf";
    const isTxt = extension === ".txt";
    const isDocx = extension === ".docx";
    const isImage = file.type.startsWith("image/");

    const supported =
      isPdf ||
      isTxt ||
      isDocx ||
      [".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tif", ".tiff"].includes(
        extension,
      ) ||
      isImage;

    if (!supported) {
      return NextResponse.json(
        {
          success: false,
          error: "Unsupported file type. Upload PDF, DOCX, TXT, or an image.",
        },
        { status: 415 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // 1. Extract text from TXT files.
    if (isTxt) {
      extractedText = buffer.toString("utf8").trim();
    }

    // 2. Extract text from Word DOCX files.
    else if (isDocx) {
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value.trim();
    }

    // 3. Extract text from PDFs.
    else if (isPdf) {
      try {
        const pdfParseModule = await import("pdf-parse");
        const moduleAny = pdfParseModule as any;

        const parseFunction =
          typeof moduleAny.default === "function"
            ? moduleAny.default
            : typeof moduleAny.pdf === "function"
              ? moduleAny.pdf
              : null;

        if (parseFunction) {
          const result = await parseFunction(buffer);
          extractedText = result?.text?.trim() ?? "";
        } else if (typeof moduleAny.PDFParse === "function") {
          const parser = new moduleAny.PDFParse({ data: buffer });

          try {
            const result = await parser.getText();
            extractedText =
              typeof result === "string"
                ? result.trim()
                : (result?.text ?? "").trim();
          } finally {
            await parser.destroy();
          }
        } else {
          throw new Error("No compatible PDF parser API was found.");
        }
      } catch (error) {
        console.error("PDF text extraction failed:", error);
      }
    }

    // 4. OCR fallback for scanned PDFs and image files.
    if ((isPdf && extractedText.length < 50) || isImage) {
      console.log(`OCR started for ${file.name}`);

      let worker: Awaited<ReturnType<typeof createWorker>> | undefined;

      try {
        const workerPath = path.join(
          process.cwd(),
          "node_modules",
          "tesseract.js",
          "src",
          "worker-script",
          "node",
          "index.js",
        );

        worker = await createWorker("eng", 1, { workerPath });

        if (isPdf) {
          const loadingTask = pdfjs.getDocument({
            data: new Uint8Array(buffer),
          });

          const pdfDoc = await loadingTask.promise;
          const ocrPages: string[] = [];

          try {
            for (let pageNumber = 1; pageNumber <= pdfDoc.numPages; pageNumber++) {
              const page = await pdfDoc.getPage(pageNumber);
              const viewport = page.getViewport({ scale: 2 });
              const canvas = createCanvas(
                Math.ceil(viewport.width),
                Math.ceil(viewport.height),
              );
              const context = canvas.getContext("2d");

              await page.render({
                canvasContext: context as any,
                canvas: canvas as any,
                viewport,
              }).promise;

              const imageBuffer = canvas.toBuffer("image/png");
              const result = await worker.recognize(imageBuffer);

              if (result.data.text.trim()) {
                ocrPages.push(result.data.text.trim());
              }

              page.cleanup();
            }
          } finally {
            // 👇 FIX: Destroy the loadingTask instead of the proxy
            await loadingTask.destroy();
          }

          const ocrText = ocrPages.join("\n\n").trim();

          if (ocrText.length > extractedText.length) {
            extractedText = ocrText;
          }
        } else if (isImage) {
          const result = await worker.recognize(buffer);
          extractedText = result.data.text.trim();
        }
      } catch (error) {
        console.error("OCR extraction failed:", error);
      } finally {
        if (worker) {
          await worker.terminate().catch((error) => {
            console.error("Failed to stop OCR worker:", error);
          });
        }
      }
    }

    extractedText = extractedText.trim();

    console.log(
      `Extracted ${extractedText.length} characters from ${file.name}`,
    );

    if (!extractedText) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No readable text could be extracted. Check that the file is not empty, password-protected, or an unsupported document.",
        },
        { status: 422 },
      );
    }

    // 5. Save the extracted text for later AI document searches.
    const doc = await StudyDocumentModel.create({
      userId: user.id,
      fileName: file.name,
      fileSize: file.size,
      subject,
      status: "ready",
      summary: `Extracted ${extractedText.length} characters.`,
      fullText: extractedText,
    });

    return NextResponse.json(
      {
        success: true,
        documentId: String(doc._id),
        fileName: file.name,
        extractedCharacters: extractedText.length,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Document upload failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Upload or text extraction failed. Please try again.",
      },
      { status: 500 },
    );
  }
}