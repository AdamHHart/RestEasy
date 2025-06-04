import { describe, it, expect } from 'vitest';
import { encryptData, decryptData } from '../../lib/encryption';

describe('Document Encryption', () => {
  const testData = 'Sensitive document content';
  
  it('encrypts and decrypts data correctly', async () => {
    const { encryptedData, key, iv } = await encryptData(testData);
    const decrypted = await decryptData(encryptedData, key, iv);
    expect(decrypted).toBe(testData);
  });

  it('generates unique IVs for each encryption', async () => {
    const encryption1 = await encryptData(testData);
    const encryption2 = await encryptData(testData);
    expect(encryption1.iv).not.toEqual(encryption2.iv);
  });

  it('fails to decrypt with wrong key', async () => {
    const { encryptedData, iv } = await encryptData(testData);
    const wrongKey = crypto.getRandomValues(new Uint8Array(32));
    
    await expect(decryptData(encryptedData, wrongKey, iv))
      .rejects.toThrow();
  });
});