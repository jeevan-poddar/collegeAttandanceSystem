import nacl from "tweetnacl";
import naclUtil from "tweetnacl-util";

const { decodeUTF8, encodeBase64, decodeBase64 } = naclUtil;

// 1. Your secret key (Must be 32 bytes. In production, store this in process.env.ENCRYPTION_KEY)
// For now, we can use a fixed 32-byte string or decode one.
const SECRET_KEY = decodeBase64(process.env.ENCRYPTION_KEY); // Use the key from .env
export function encryptData(payload) {
  // Convert our JavaScript object/string into raw bytes
  const messageString = JSON.stringify(payload);
  const messageBytes = decodeUTF8(messageString);
  console.log("messageBytes", messageBytes);

  // 2. Generate a "Nonce" (Number used ONCE)
  // NaCl requires a unique 24-byte random string every single time you encrypt,
  // otherwise hackers can spot patterns.
  const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
  console.log("nonce", nonce);

  // 3. Encrypt!
  // It takes the message, the unique nonce, and your secret key.
  const encrypted = nacl.secretbox(messageBytes, nonce, SECRET_KEY);
  console.log("encrypted:", encrypted);

  // 4. Package it for the QR Code
  // Because 'nonce' and 'encrypted' are two separate byte arrays, we combine them
  // into one package and convert them into a single Base64 string so it fits nicely inside a QR code.
  const fullPackage = new Uint8Array(nonce.length + encrypted.length);
  fullPackage.set(nonce);
  fullPackage.set(encrypted, nonce.length);

  console.log("fullPackage", fullPackage);

  return encodeBase64(fullPackage);
}

export function decryptData(base64Package) {
  try {
    // 1. Convert the Base64 string back into raw bytes
    const fullPackage = decodeBase64(base64Package);

    // 2. Extract the Nonce (the first 24 bytes)
    const nonce = fullPackage.slice(0, nacl.secretbox.nonceLength);

    // 3. Extract the actual encrypted message (everything after the first 24 bytes)
    const encrypted = fullPackage.slice(nacl.secretbox.nonceLength);

    // 4. Decrypt!
    const decryptedBytes = nacl.secretbox.open(encrypted, nonce, SECRET_KEY);

    // If decryption fails (because a student tampered with the QR or used a fake key),
    // nacl.secretbox.open will return `null`.
    if (!decryptedBytes) {
      return { success: false, error: "Invalid or tampered QR code!" };
    }

    // 5. Convert the bytes back into a normal JavaScript object
    const messageString = Buffer.from(decryptedBytes).toString("utf8");
    const payload = JSON.parse(messageString);

    return { success: true, data: payload };
  } catch (err) {
    return { success: false, error: "Decryption failed." };
  }
}
