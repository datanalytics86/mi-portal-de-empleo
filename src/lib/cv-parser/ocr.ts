/**
 * OCR para PDFs escaneados (sin capa de texto).
 *
 * Estrategias (en orden):
 * 1. OCR.space (si OCR_SPACE_API_KEY) — acepta PDF multipágina, ideal en Vercel
 * 2. Local: pdfjs-dist + @napi-rs/canvas + tesseract.js (spa+eng)
 *
 * Límites de producción: primeras N páginas, timeout, fail-open.
 */

export interface OcrResult {
  text: string;
  engine: 'ocr_space' | 'tesseract' | 'none';
  pages: number;
  ms: number;
  error?: string;
}

const MIN_USEFUL_CHARS = 40;

function envBool(name: string, fallback: boolean): boolean {
  const v =
    (typeof import.meta !== 'undefined' && (import.meta.env as Record<string, string | undefined>)?.[name]) ||
    (typeof process !== 'undefined' ? process.env?.[name] : undefined);
  if (v == null || v === '') return fallback;
  return !['0', 'false', 'no', 'off'].includes(String(v).toLowerCase());
}

function envInt(name: string, fallback: number): number {
  const v =
    (typeof import.meta !== 'undefined' && (import.meta.env as Record<string, string | undefined>)?.[name]) ||
    (typeof process !== 'undefined' ? process.env?.[name] : undefined);
  const n = v ? parseInt(String(v), 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function envStr(name: string): string {
  return (
    (typeof import.meta !== 'undefined' && (import.meta.env as Record<string, string | undefined>)?.[name]) ||
    (typeof process !== 'undefined' ? process.env?.[name] : undefined) ||
    ''
  );
}

export function isOcrEnabled(): boolean {
  return envBool('CV_OCR_ENABLED', true);
}

/**
 * Ejecuta OCR sobre un PDF binario. Nunca lanza.
 */
export async function ocrPdf(buffer: ArrayBuffer): Promise<OcrResult> {
  const started = Date.now();
  const maxPages = envInt('CV_OCR_MAX_PAGES', 3);
  const timeoutMs = envInt('CV_OCR_TIMEOUT_MS', 50_000);

  if (!isOcrEnabled()) {
    return { text: '', engine: 'none', pages: 0, ms: 0, error: 'OCR deshabilitado (CV_OCR_ENABLED=false)' };
  }

  try {
    return await withTimeout(runOcrStrategies(buffer, maxPages, started), timeoutMs);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[ocr] timeout/fatal:', msg);
    return {
      text: '',
      engine: 'none',
      pages: 0,
      ms: Date.now() - started,
      error: msg.includes('timeout') ? `OCR timeout (${timeoutMs}ms)` : msg,
    };
  }
}

async function runOcrStrategies(
  buffer: ArrayBuffer,
  maxPages: number,
  started: number,
): Promise<OcrResult> {
  const ocrSpaceKey = envStr('OCR_SPACE_API_KEY');

  // 1) Cloud: OCR.space (rápido en serverless, multipágina nativo)
  if (ocrSpaceKey) {
    const cloud = await ocrWithOcrSpace(buffer, ocrSpaceKey, maxPages);
    if (cloud.text.replace(/\s/g, '').length >= MIN_USEFUL_CHARS) {
      console.info(`[ocr] ocr.space ok pages≈${cloud.pages} ms=${Date.now() - started}`);
      return { ...cloud, ms: Date.now() - started };
    }
    console.warn('[ocr] ocr.space insuficiente, intentando tesseract local:', cloud.error);
  }

  // 2) Local: render páginas + tesseract
  const local = await ocrWithTesseract(buffer, maxPages);
  return { ...local, ms: Date.now() - started };
}

// ─── OCR.space ───────────────────────────────────────────────

async function ocrWithOcrSpace(
  buffer: ArrayBuffer,
  apiKey: string,
  maxPages: number,
): Promise<OcrResult> {
  try {
    const b64 = Buffer.from(buffer).toString('base64');
    // Límite práctico ~1MB base64 en free tier; si es muy grande, truncamos riesgo
    if (b64.length > 1_400_000) {
      console.warn('[ocr] PDF grande para OCR.space; se intenta igual');
    }

    const body = new URLSearchParams();
    body.set('base64Image', `data:application/pdf;base64,${b64}`);
    body.set('language', 'spa');
    body.set('isOverlayRequired', 'false');
    body.set('OCREngine', '2');
    body.set('scale', 'true');
    body.set('detectOrientation', 'true');
    // OCR.space procesa multipágina; limitamos vía filetype
    body.set('filetype', 'PDF');

    const res = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      headers: {
        apikey: apiKey,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!res.ok) {
      return {
        text: '',
        engine: 'ocr_space',
        pages: 0,
        ms: 0,
        error: `OCR.space HTTP ${res.status}`,
      };
    }

    const data = (await res.json()) as {
      IsErroredOnProcessing?: boolean;
      ErrorMessage?: string | string[];
      ParsedResults?: Array<{ ParsedText?: string }>;
    };

    if (data.IsErroredOnProcessing) {
      const err = Array.isArray(data.ErrorMessage)
        ? data.ErrorMessage.join('; ')
        : data.ErrorMessage || 'OCR.space error';
      return { text: '', engine: 'ocr_space', pages: 0, ms: 0, error: err };
    }

    const parts = (data.ParsedResults || [])
      .map((r) => r.ParsedText || '')
      .filter(Boolean)
      .slice(0, maxPages);

    return {
      text: parts.join('\n\n'),
      engine: 'ocr_space',
      pages: parts.length,
      ms: 0,
    };
  } catch (e) {
    return {
      text: '',
      engine: 'ocr_space',
      pages: 0,
      ms: 0,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

// ─── Tesseract local ─────────────────────────────────────────

async function ocrWithTesseract(buffer: ArrayBuffer, maxPages: number): Promise<OcrResult> {
  let worker: { recognize: (img: Buffer) => Promise<{ data: { text: string } }>; terminate: () => Promise<void> } | null =
    null;

  try {
    const pages = await renderPdfPages(buffer, maxPages);
    if (pages.length === 0) {
      return {
        text: '',
        engine: 'tesseract',
        pages: 0,
        ms: 0,
        error: 'No se pudieron renderizar páginas del PDF',
      };
    }

    const { createWorker } = await import('tesseract.js');
    // spa+eng: CVs mixtos en Chile
    worker = (await createWorker('spa+eng', 1, {
      logger: () => {},
    })) as typeof worker;

    if (!worker) {
      return { text: '', engine: 'tesseract', pages: 0, ms: 0, error: 'No se inició Tesseract' };
    }

    const texts: string[] = [];
    for (let i = 0; i < pages.length; i++) {
      const pageStarted = Date.now();
      const { data } = await worker.recognize(pages[i]!);
      const t = (data.text || '').trim();
      if (t) texts.push(t);
      console.info(`[ocr] tesseract page ${i + 1}/${pages.length} chars=${t.length} ms=${Date.now() - pageStarted}`);
    }

    return {
      text: texts.join('\n\n'),
      engine: 'tesseract',
      pages: pages.length,
      ms: 0,
    };
  } catch (e) {
    console.error('[ocr] tesseract error:', e);
    return {
      text: '',
      engine: 'tesseract',
      pages: 0,
      ms: 0,
      error: e instanceof Error ? e.message : String(e),
    };
  } finally {
    if (worker) {
      try {
        await worker.terminate();
      } catch {
        /* ignore */
      }
    }
  }
}

/**
 * Renderiza las primeras N páginas del PDF a PNG (Buffer).
 * Usa pdfjs-dist + @napi-rs/canvas (compatible Linux/Vercel).
 */
async function renderPdfPages(buffer: ArrayBuffer, maxPages: number): Promise<Buffer[]> {
  try {
    const { createCanvas } = await import('@napi-rs/canvas');

    // Preferir legacy build (Node-friendly). Fallback al entry principal.
    let getDocument: (src: object) => { promise: Promise<PdfDoc> };
    try {
      const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
      getDocument = pdfjs.getDocument as typeof getDocument;
    } catch {
      const pdfjs = await import('pdfjs-dist');
      getDocument = pdfjs.getDocument as typeof getDocument;
    }

    const loadingTask = getDocument({
      data: new Uint8Array(buffer),
      useSystemFonts: true,
      isEvalSupported: false,
      disableFontFace: true,
      // Sin worker en serverless
      useWorkerFetch: false,
      isOffscreenCanvasSupported: false,
    });

    const pdf = await loadingTask.promise;
    const n = Math.min(pdf.numPages, maxPages);
    const out: Buffer[] = [];

    for (let i = 1; i <= n; i++) {
      const page = await pdf.getPage(i);
      // Escala balanceada: legible para OCR sin explotar memoria
      const base = page.getViewport({ scale: 1 });
      const scale = Math.min(2.0, Math.max(1.2, 1400 / Math.max(base.width, 1)));
      const viewport = page.getViewport({ scale });

      const width = Math.ceil(viewport.width);
      const height = Math.ceil(viewport.height);
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');
      // Fondo blanco (PDFs transparentes / escaneados grises)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      const renderTask = page.render({
        canvasContext: ctx as unknown as CanvasRenderingContext2D,
        viewport,
      });
      await renderTask.promise;

      out.push(canvas.toBuffer('image/png'));
    }

    return out;
  } catch (e) {
    console.error('[ocr] renderPdfPages error:', e);
    return [];
  }
}

/** Tipado mínimo del doc pdfjs (evita acoplar a types frágiles) */
interface PdfDoc {
  numPages: number;
  getPage: (n: number) => Promise<{
    getViewport: (opts: { scale: number }) => { width: number; height: number };
    render: (opts: {
      canvasContext: CanvasRenderingContext2D;
      viewport: { width: number; height: number };
    }) => { promise: Promise<void> };
  }>;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`OCR timeout after ${ms}ms`)), ms);
    promise
      .then((v) => {
        clearTimeout(t);
        resolve(v);
      })
      .catch((e) => {
        clearTimeout(t);
        reject(e);
      });
  });
}
