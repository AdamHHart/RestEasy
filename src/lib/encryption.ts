export async function encryptData(data: string) {
  const key = crypto.getRandomValues(new Uint8Array(32));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encodedData = new TextEncoder().encode(data);

  const encryptedData = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    ),
    encodedData
  );

  return {
    encryptedData: new Uint8Array(encryptedData),
    key,
    iv
  };
}

export async function decryptData(
  encryptedData: Uint8Array,
  key: Uint8Array,
  iv: Uint8Array
) {
  const decryptedData = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    ),
    encryptedData
  );

  return new TextDecoder().decode(decryptedData);
}