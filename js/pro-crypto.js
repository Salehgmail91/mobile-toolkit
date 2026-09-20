/**
 * Krypton Studio — Pro Crypto Utilities
 * ECDSA P-256 + AES-GCM encryption for private key storage
 */

(function (global) {
  'use strict';

  // ─── Base64URL helpers ───
  function bufToB64url(buf) {
    const bytes = new Uint8Array(buf);
    let s = '';
    for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function b64urlToBuf(str) {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) str += '=';
    const bin = atob(str);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes.buffer;
  }

  function strToBuf(str) { return new TextEncoder().encode(str); }
  function bufToStr(buf) { return new TextDecoder().decode(buf); }

  // ─── ECDSA P-256 Key Generation ───
  async function generateKeyPair() {
    const pair = await crypto.subtle.generateKey(
      { name: 'ECDSA', namedCurve: 'P-256' },
      true,
      ['sign', 'verify']
    );
    return pair;
  }

  async function exportPublicKey(key) {
    const spki = await crypto.subtle.exportKey('spki', key);
    return bufToB64url(spki);
  }

  async function exportPrivateKey(key) {
    const pkcs8 = await crypto.subtle.exportKey('pkcs8', key);
    return bufToB64url(pkcs8);
  }

  async function importPublicKey(b64url) {
    const buf = b64urlToBuf(b64url);
    return crypto.subtle.importKey(
      'spki',
      buf,
      { name: 'ECDSA', namedCurve: 'P-256' },
      true,
      ['verify']
    );
  }

  async function importPrivateKey(b64url) {
    const buf = b64urlToBuf(b64url);
    return crypto.subtle.importKey(
      'pkcs8',
      buf,
      { name: 'ECDSA', namedCurve: 'P-256' },
      true,
      ['sign']
    );
  }

  // ─── Sign / Verify ───
  async function sign(privateKey, message) {
    const data = typeof message === 'string' ? strToBuf(message) : message;
    const sig = await crypto.subtle.sign(
      { name: 'ECDSA', hash: 'SHA-256' },
      privateKey,
      data
    );
    return bufToB64url(sig);
  }

  async function verify(publicKey, signature, message) {
    try {
      const data = typeof message === 'string' ? strToBuf(message) : message;
      const sigBuf = b64urlToBuf(signature);
      return await crypto.subtle.verify(
        { name: 'ECDSA', hash: 'SHA-256' },
        publicKey,
        sigBuf,
        data
      );
    } catch (e) {
      return false;
    }
  }

  // ─── Password-based encryption (AES-GCM + PBKDF2) ───
  async function deriveKey(password, salt) {
    const baseKey = await crypto.subtle.importKey(
      'raw',
      strToBuf(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 250000, hash: 'SHA-256' },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  async function encryptPrivateKey(privateKeyB64url, password) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(password, salt);
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      strToBuf(privateKeyB64url)
    );
    return {
      v: 1,
      salt: bufToB64url(salt),
      iv: bufToB64url(iv),
      data: bufToB64url(ciphertext)
    };
  }

  async function decryptPrivateKey(encrypted, password) {
    const salt = new Uint8Array(b64urlToBuf(encrypted.salt));
    const iv = new Uint8Array(b64urlToBuf(encrypted.iv));
    const data = b64urlToBuf(encrypted.data);
    const key = await deriveKey(password, salt);
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );
    return bufToStr(plain);
  }

  // ─── Fingerprint (short hash of public key for display) ───
  async function fingerprint(publicKeyB64url) {
    const buf = b64urlToBuf(publicKeyB64url);
    const hash = await crypto.subtle.digest('SHA-256', buf);
    const bytes = new Uint8Array(hash);
    let hex = '';
    for (let i = 0; i < 8; i++) hex += bytes[i].toString(16).padStart(2, '0');
    return hex.toUpperCase().match(/.{2}/g).join(' ');
  }

  global.ProCrypto = {
    bufToB64url,
    b64urlToBuf,
    generateKeyPair,
    exportPublicKey,
    exportPrivateKey,
    importPublicKey,
    importPrivateKey,
    sign,
    verify,
    encryptPrivateKey,
    decryptPrivateKey,
    fingerprint
  };
})(window);