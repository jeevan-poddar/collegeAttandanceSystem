import nacl from "tweetnacl";
import naclUtil from "tweetnacl-util";

const { decodeUTF8, encodeBase64, decodeBase64 } = naclUtil;

// 32-byte secret key (Must be exactly 32 characters)
const SECRET_KEY = decodeBase64(process.env.ENCRYPTION_KEY); // Use the key from .env

function encryptData(payload) {
  const messageString = JSON.stringify(payload);
  console.log("messageString", messageString);
  const messageBytes = decodeUTF8(messageString);
  console.log("messageBytes", messageBytes);

  const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
  console.log("nonce", nonce);
  const encrypted = nacl.secretbox(messageBytes, nonce, SECRET_KEY);
  console.log("encrypted:", encrypted);

  const fullPackage = new Uint8Array(nonce.length + encrypted.length);
  fullPackage.set(nonce);
  fullPackage.set(encrypted, nonce.length);
  console.log("fullPackage", fullPackage);

  return encodeBase64(fullPackage);
}

function decryptData(base64Package) {
  try {
    console.log("base64Package", base64Package);
    const fullPackage = decodeBase64(base64Package);
    console.log("fullPackage", fullPackage);
    const nonce = fullPackage.slice(0, nacl.secretbox.nonceLength);
    console.log("nonce", nonce);
    const encrypted = fullPackage.slice(nacl.secretbox.nonceLength);
    console.log("encrypted", encrypted);

    const decryptedBytes = nacl.secretbox.open(encrypted, nonce, SECRET_KEY);
    console.log("decryptedBytes", decryptedBytes);

    if (!decryptedBytes) {
      return { success: false, error: "Invalid or tampered QR code!" };
    }

    // Convert bytes back to string using tweetnacl-util's encodeUTF8
    const messageString = new TextDecoder().decode(decryptedBytes);
    console.log("messageString", messageString);
    return { success: true, data: JSON.parse(messageString) };
  } catch (err) {
    return { success: false, error: "Decryption failed." };
  }
}

// --- RUN THE TEST ---
const originalData = { sessionId: 101, timestamp: Date.now() };
console.log("1. Original Data:", originalData);

// Encrypt it
const encryptedCode = encryptData(originalData);
console.log(
  "\n2. Encrypted QR String (Looks like gibberish):\n",
  encryptedCode,
);

// Decrypt it back
const result = decryptData(encryptedCode);
console.log("\n3. Decrypted Result on Server:", result);
