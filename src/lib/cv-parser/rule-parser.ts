import type { CvParsed, Educacion, ExperienciaLaboral, Idioma } from './types';
import { emptyCvParsed } from './types';
import {
  SKILLS_BLANDAS,
  SKILLS_TECNICAS,
  detectIdiomas,
  detectUbicacion,
  matchCatalogSkills,
} from './skills-chile';
import { extractKeywords } from './keywords';

const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
// Teléfonos Chile: +56 9 XXXX XXXX, 9 XXXX XXXX, +56 2 XXXX XXXX, etc.
const PHONE_RE =
  /(?:\+?56[\s\-.]?)?(?:\(?0?2\)?[\s\-.]?)?(?:9[\s\-.]?)?\d{4}[\s\-.]?\d{4}\b|(?:\+?56[\s\-.]?)?9[\s\-.]*\d{4}[\s\-.]*\d{4}/g;

const SECTION_HEADERS: Record<string, RegExp> = {
  experiencia:
    /^(experiencia(?:\s+laboral)?|historial\s+laboral|trayectoria|experiencia\s+profesional|work\s+experience|employment)\b/i,
  educacion:
    /^(educaci[oó]n|formaci[oó]n(?:\s+acad[eé]mica)?|estudios|academic|education)\b/i,
  skills:
    /^(habilidades|competencias|skills|conocimientos|tecnolog[ií]as|herramientas)\b/i,
  idiomas: /^(idiomas|languages)\b/i,
  resumen:
    /^(perfil(?:\s+profesional)?|resumen(?:\s+profesional)?|objetivo(?:\s+profesional)?|acerca\s+de\s+m[ií]|about\s+me|summary|profile)\b/i,
};

/**
 * Parser rule-based (sin LLM). Funciona offline y como fallback.
 */
export function parseWithRules(
  cleanedText: string,
  opts: {
    formNombre?: string | null;
    formEmail?: string | null;
  } = {},
): CvParsed {
  const warnings: string[] = [];
  if (!cleanedText.trim()) {
    return emptyCvParsed({
      nombre_completo: opts.formNombre || null,
      email: opts.formEmail || null,
      parse_method: 'rule',
      warnings: ['Sin texto extraíble del CV'],
    });
  }

  const lines = cleanedText.split('\n').map((l) => l.trim()).filter(Boolean);
  const emails = cleanedText.match(EMAIL_RE) || [];
  const phones = cleanedText.match(PHONE_RE) || [];

  const email =
    opts.formEmail ||
    emails.find((e) => !/example|test|domain/i.test(e)) ||
    emails[0] ||
    null;

  const telefono = phones[0]?.replace(/\s+/g, ' ').trim() || null;

  const sections = splitSections(lines);
  const nombre = opts.formNombre || guessNombre(lines, email) || null;
  const titulo = guessTituloProfesional(lines, sections) || null;
  const resumen = extractResumen(sections, lines) || null;
  const experiencia = parseExperiencia(sections.experiencia || []);
  const educacion = parseEducacion(sections.educacion || []);
  const skills_tecnicas = matchCatalogSkills(cleanedText, SKILLS_TECNICAS);
  const skills_blandas = matchCatalogSkills(cleanedText, SKILLS_BLANDAS);
  const keywords = extractKeywords(cleanedText, 25);
  const idiomas: Idioma[] = detectIdiomas(cleanedText);
  const ubicacion = detectUbicacion(cleanedText);
  const anos = estimateYearsExperience(cleanedText, experiencia);

  if (experiencia.length === 0) warnings.push('No se detectó experiencia laboral estructurada');
  if (skills_tecnicas.length === 0 && skills_blandas.length === 0) {
    warnings.push('Pocas skills del catálogo detectadas');
  }

  return emptyCvParsed({
    nombre_completo: nombre,
    email,
    telefono,
    titulo_profesional: titulo,
    resumen,
    experiencia,
    educacion,
    skills_tecnicas,
    skills_blandas,
    keywords,
    idiomas,
    anos_experiencia: anos,
    ubicacion,
    parse_method: 'rule',
    raw_text_length: cleanedText.length,
    warnings,
  });
}

function splitSections(lines: string[]): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  let current = 'header';
  result[current] = [];

  for (const line of lines) {
    let matched = false;
    for (const [key, re] of Object.entries(SECTION_HEADERS)) {
      if (re.test(line) && line.length < 80) {
        current = key;
        if (!result[current]) result[current] = [];
        matched = true;
        break;
      }
    }
    if (!matched) {
      if (!result[current]) result[current] = [];
      result[current].push(line);
    }
  }
  return result;
}

function guessNombre(lines: string[], email: string | null): string | null {
  // Primeras líneas: nombre completo típico (2–4 palabras, capitalizadas)
  for (const line of lines.slice(0, 8)) {
    if (line.includes('@')) continue;
    if (/^\+?\d/.test(line)) continue;
    if (SECTION_HEADERS.experiencia.test(line)) break;
    if (SECTION_HEADERS.resumen.test(line)) continue;
    if (line.length < 5 || line.length > 60) continue;
    const words = line.split(/\s+/);
    if (words.length >= 2 && words.length <= 5) {
      const looksLikeName = words.every(
        (w) =>
          /^[A-ZÁÉÍÓÚÑ][a-záéíóúñ'’]+$/.test(w) ||
          /^(de|del|la|los|las|y|e)$/i.test(w),
      );
      if (looksLikeName) return line;
    }
  }

  // Fallback: parte local del email
  if (email) {
    const local = email.split('@')[0]?.replace(/[._0-9]+/g, ' ').trim();
    if (local && local.length > 3) {
      return local
        .split(/\s+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
    }
  }
  return null;
}

function guessTituloProfesional(
  lines: string[],
  sections: Record<string, string[]>,
): string | null {
  // Línea debajo del nombre a menudo es el título
  for (const line of lines.slice(0, 12)) {
    if (/desarrollador|engineer|ingenier[oa]|analista|contador|abogad[oa]|diseñador|designer|gerente|jefe|coordinador|especialista|consultor|data|full\s*stack|frontend|backend|devops|product\s*owner|scrum|marketing|vendedor|enfermer/i.test(line)
      && line.length < 80
      && !line.includes('@')) {
      return line;
    }
  }
  if (sections.resumen?.[0] && sections.resumen[0].length < 100) {
    return sections.resumen[0];
  }
  return null;
}

function extractResumen(
  sections: Record<string, string[]>,
  lines: string[],
): string | null {
  if (sections.resumen?.length) {
    const text = sections.resumen.join(' ').slice(0, 600).trim();
    return text || null;
  }
  // Primer párrafo largo del header
  const header = (sections.header || []).filter((l) => l.length > 80);
  if (header[0]) return header[0].slice(0, 600);
  const longLine = lines.find((l) => l.length > 120 && !l.includes('@'));
  return longLine?.slice(0, 600) || null;
}

function parseExperiencia(lines: string[]): ExperienciaLaboral[] {
  if (!lines.length) return [];
  const items: ExperienciaLaboral[] = [];
  let current: ExperienciaLaboral | null = null;

  const dateRe =
    /((?:ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*)?(?:20\d{2}|19\d{2})(?:\s*[-–—/a]+\s*(?:(?:ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)[a-z]*\.?\s*)?(?:20\d{2}|19\d{2}|actualidad|presente|hoy|actual))?/i;

  for (const line of lines) {
    const hasDate = dateRe.test(line);
    const looksLikeRole =
      /desarrollador|ingenier|analista|contador|gerente|jefe|coordinador|especialista|consultor|asistente|ejecutivo|vendedor|diseñador|practicante|pasante|lead|senior|junior|fullstack|full-stack/i.test(
        line,
      );

    if ((hasDate || looksLikeRole) && line.length < 120) {
      if (current) items.push(current);
      const dates = extractDateRange(line);
      current = {
        empresa: null,
        cargo: looksLikeRole ? line.replace(dateRe, '').replace(/[-–—|]/g, ' ').trim() || line : line,
        fecha_inicio: dates[0],
        fecha_fin: dates[1],
        descripcion: null,
      };
      // Si hay "Cargo en Empresa" o "Cargo | Empresa"
      const parts = line.split(/\s+[|@–—-]\s+|\s+en\s+/i);
      if (parts.length >= 2) {
        current.cargo = parts[0]?.trim() || current.cargo;
        current.empresa = parts[1]?.replace(dateRe, '').trim() || null;
      }
    } else if (current) {
      const desc = [current.descripcion, line].filter(Boolean).join(' ');
      current.descripcion = desc.slice(0, 400);
      if (!current.empresa && line.length < 60 && !hasDate) {
        // posible línea de empresa
        if (!/^(responsabilidades|logros|funciones)/i.test(line)) {
          current.empresa = current.empresa || line;
        }
      }
    }
    if (items.length >= 8) break;
  }
  if (current) items.push(current);
  return items.slice(0, 8);
}

function parseEducacion(lines: string[]): Educacion[] {
  if (!lines.length) return [];
  const items: Educacion[] = [];
  const degreeRe =
    /(?:ingenier[ií]a|licenciatura|t[eé]cnico|mag[ií]ster|master|mba|doctorado|diplomado|certificado|bootcamp|curso|university|universidad|instituto|duoc|inacap|ute[cm]|puc|uchile|usach|udp|uai|uandes)/i;

  let buf: string[] = [];
  const flush = () => {
    if (!buf.length) return;
    const block = buf.join(' ');
    const year = block.match(/20\d{2}|19\d{2}/)?.[0] || null;
    items.push({
      institucion: buf.find((l) => /universidad|instituto|duoc|inacap|college|school/i.test(l)) || buf[1] || null,
      titulo: buf.find((l) => degreeRe.test(l)) || buf[0] || null,
      fecha: year,
      descripcion: block.slice(0, 200),
    });
    buf = [];
  };

  for (const line of lines) {
    if (degreeRe.test(line) && buf.length > 0) flush();
    buf.push(line);
    if (buf.length >= 4) flush();
    if (items.length >= 6) break;
  }
  flush();
  return items.slice(0, 6);
}

function extractDateRange(line: string): [string | null, string | null] {
  const years = line.match(/20\d{2}|19\d{2}/g) || [];
  const endActual = /actualidad|presente|hoy|actual/i.test(line);
  if (years.length >= 2) return [years[0], years[1]];
  if (years.length === 1) return [years[0], endActual ? 'actualidad' : null];
  return [null, endActual ? 'actualidad' : null];
}

function estimateYearsExperience(
  text: string,
  experiencia: ExperienciaLaboral[],
): number | null {
  const explicit = text.match(
    /(\d{1,2})\s*\+?\s*(?:a[nñ]os?)(?:\s+de)?\s+experiencia/i,
  );
  if (explicit?.[1]) {
    const n = parseInt(explicit[1], 10);
    if (n > 0 && n < 50) return n;
  }

  const years: number[] = [];
  for (const e of experiencia) {
    const a = e.fecha_inicio ? parseInt(e.fecha_inicio, 10) : NaN;
    let b = e.fecha_fin === 'actualidad' ? new Date().getFullYear() : parseInt(e.fecha_fin || '', 10);
    if (!isNaN(a) && !isNaN(b) && b >= a) years.push(b - a);
  }
  if (!years.length) return null;
  // Suma simple (puede sobrecontar solapes) — aproximación
  const sum = years.reduce((a, b) => a + b, 0);
  return Math.min(40, Math.max(1, sum));
}
