'use client';

function bufferToBase64Url(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBuffer(b64: string): ArrayBuffer {
  const std = b64.replace(/-/g, '+').replace(/_/g, '/');
  const pad = std.length % 4 === 0 ? '' : '='.repeat(4 - (std.length % 4));
  const binary = atob(std + pad);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return buffer;
}

export interface EncryptedPayload {
  ciphertext: string;
  iv: string;
}

export async function encryptShare(data: unknown): Promise<{
  payload: EncryptedPayload;
  keyB64: string;
}> {
  const json = JSON.stringify(data);
  const encoded = new TextEncoder().encode(json);

  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  );
  const exported = await crypto.subtle.exportKey('raw', key);

  return {
    payload: {
      ciphertext: bufferToBase64Url(ciphertext),
      iv: bufferToBase64Url(iv),
    },
    keyB64: bufferToBase64Url(exported),
  };
}

export async function decryptShare<T = unknown>(
  payload: EncryptedPayload,
  keyB64: string
): Promise<T> {
  const ciphertext = base64UrlToBuffer(payload.ciphertext);
  const iv = new Uint8Array(base64UrlToBuffer(payload.iv));
  const keyData = base64UrlToBuffer(keyB64);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );
  return JSON.parse(new TextDecoder().decode(decrypted)) as T;
}
