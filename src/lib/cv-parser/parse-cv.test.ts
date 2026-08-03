import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CvFormat } from './file-validation';
import type { ExtractTextResult } from './extract-text';

/**
 * Tests del contrato never-throw de parseCv.
 * Mockeamos extractores pesados para no depender de pdf-parse / OCR / LLM.
 */

const { extractCvTextMock, parseWithRulesMock, parseWithLlmMock, extractKeywordsMock } =
  vi.hoisted(() => ({
    extractCvTextMock: vi.fn(),
    parseWithRulesMock: vi.fn(),
    parseWithLlmMock: vi.fn().mockResolvedValue(null),
    extractKeywordsMock: vi.fn().mockReturnValue(['keyword-test']),
  }));

vi.mock('./extract-text', () => ({
  extractCvText: extractCvTextMock,
  extractText: extractCvTextMock,
  cleanCvText: (t: string) => t,
}));

vi.mock('./llm-parser', () => ({
  parseWithLlm: parseWithLlmMock,
}));

vi.mock('./rule-parser', () => ({
  parseWithRules: parseWithRulesMock,
}));

vi.mock('./keywords', () => ({
  extractKeywords: extractKeywordsMock,
}));

import { parseCv } from './index';
import { emptyCvParsed } from './types';

function baseInput(format: CvFormat = 'pdf') {
  return {
    buffer: new ArrayBuffer(8),
    mimeType: 'application/pdf',
    fileName: 'cv.pdf',
    format,
    formNombre: 'Ana Test',
    formEmail: 'ana@test.cl',
    ofertaTexto:
      'Buscamos desarrollador React con TypeScript y experiencia en equipos ágiles en Santiago Chile.',
  };
}

function extractResult(partial: Partial<ExtractTextResult> & { cleaned: string }): ExtractTextResult {
  return {
    text: partial.text ?? partial.cleaned,
    cleaned: partial.cleaned,
    likelyScanned: partial.likelyScanned ?? false,
    usedOcr: partial.usedOcr ?? false,
    ocrEngine: partial.ocrEngine ?? 'none',
    format: partial.format ?? 'pdf',
    warning: partial.warning,
  };
}

describe('parseCv — never-throw contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    parseWithLlmMock.mockResolvedValue(null);
    extractKeywordsMock.mockReturnValue(['keyword-test']);
  });

  it('nunca lanza: captura errores fatales y devuelve status failed', async () => {
    extractCvTextMock.mockRejectedValue(new Error('boom extractor'));

    await expect(parseCv(baseInput())).resolves.toMatchObject({
      status: 'failed',
      keywords: [],
      match_score: null,
      error: expect.stringContaining('boom'),
    });
  });

  it('marca skipped para formato .doc legacy', async () => {
    extractCvTextMock.mockResolvedValue(
      extractResult({
        cleaned: '',
        format: 'doc',
        warning: 'DOC legacy no soportado completamente',
      }),
    );

    const result = await parseCv(baseInput('doc'));
    expect(result.status).toBe('skipped');
    expect(result.cv_parsed?.nombre_completo).toBe('Ana Test');
    expect(result.cv_parsed?.email).toBe('ana@test.cl');
    expect(result.keywords).toEqual([]);
  });

  it('marca failed si no hay texto extraíble', async () => {
    extractCvTextMock.mockResolvedValue(
      extractResult({
        cleaned: '   ',
        warning: 'Sin texto',
      }),
    );

    const result = await parseCv(baseInput());
    expect(result.status).toBe('failed');
    expect(result.error).toBeTruthy();
    expect(result.match_score).toBeNull();
  });

  it('devuelve success con keywords cuando hay texto útil', async () => {
    const longText = [
      'Ana Test',
      'Desarrolladora Frontend',
      'React TypeScript Node.js',
      'Experiencia de 4 años en Santiago',
      'Skills: React, TypeScript, CSS, Git, Scrum',
      'Educación: Ingeniería Informática Universidad de Chile',
    ].join('\n');

    extractCvTextMock.mockResolvedValue(
      extractResult({
        cleaned: longText,
        text: longText,
      }),
    );

    parseWithRulesMock.mockReturnValue(
      emptyCvParsed({
        nombre_completo: 'Ana Test',
        email: 'ana@test.cl',
        titulo_profesional: 'Desarrolladora Frontend',
        skills_tecnicas: ['React', 'TypeScript', 'Node.js'],
        keywords: ['React', 'TypeScript'],
        parse_method: 'rule',
        raw_text_length: longText.length,
      }),
    );

    const result = await parseCv(baseInput());
    expect(result.status).toBe('success');
    expect(result.cv_parsed).toBeTruthy();
    expect(result.keywords.length).toBeGreaterThan(0);
    expect(result.match_score === null || typeof result.match_score === 'number').toBe(true);
  });

  it('propaga formNombre/formEmail en emptyCvParsed ante fallo', async () => {
    extractCvTextMock.mockRejectedValue(new Error('disk full'));
    const result = await parseCv({
      ...baseInput(),
      formNombre: 'Pedro',
      formEmail: 'pedro@empresa.cl',
    });
    expect(result.status).toBe('failed');
    expect(result.cv_parsed?.nombre_completo).toBe('Pedro');
    expect(result.cv_parsed?.email).toBe('pedro@empresa.cl');
  });
});
