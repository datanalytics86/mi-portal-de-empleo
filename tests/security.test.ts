import { describe, it, expect } from 'vitest';
import { hashIP, getClientIP, validateFileContent } from '../src/lib/utils/security';

describe('Security Utils', () => {
  describe('hashIP', () => {
    it('should hash an IP address consistently', () => {
      const ip = '192.168.1.1';
      const hash1 = hashIP(ip);
      const hash2 = hashIP(ip);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 produces 64 hex characters
    });

    it('should produce different hashes for different IPs', () => {
      const hash1 = hashIP('192.168.1.1');
      const hash2 = hashIP('192.168.1.2');

      expect(hash1).not.toBe(hash2);
    });

    it('should not include the original IP in the hash', () => {
      const ip = '192.168.1.1';
      const hash = hashIP(ip);

      expect(hash).not.toContain(ip);
    });
  });

  describe('validateFileContent', () => {
    it('should validate PDF files by magic numbers', async () => {
      // PDF magic number: %PDF
      const pdfBuffer = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);
      const result = await validateFileContent(pdfBuffer.buffer);

      expect(result.isValid).toBe(true);
      expect(result.detectedType).toBe('pdf');
    });

    it('should reject invalid file types', async () => {
      // Random bytes that don't match any valid type
      const invalidBuffer = new Uint8Array([0x00, 0x00, 0x00, 0x00]);
      const result = await validateFileContent(invalidBuffer.buffer);

      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should validate DOC files by magic numbers', async () => {
      // DOC magic number
      const docBuffer = new Uint8Array([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
      const result = await validateFileContent(docBuffer.buffer);

      expect(result.isValid).toBe(true);
      expect(result.detectedType).toBe('doc');
    });
  });
});
