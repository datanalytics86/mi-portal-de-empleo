import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

/**
 * Extrae texto plano de un PDF o DOCX.
 * Devuelve cadena vacía si el formato no es compatible (.doc legacy).
 */
export async function extractText(buffer: ArrayBuffer, mimeType: string): Promise<string> {
  const buf = Buffer.from(buffer);

  if (mimeType === 'application/pdf') {
    const data = await pdfParse(buf);
    return data.text;
  }

  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const result = await mammoth.extractRawText({ buffer: buf });
    return result.value;
  }

  // .doc (Word 97-2003) no soportado sin binarios nativos
  return '';
}
