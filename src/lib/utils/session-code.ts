/**
 * Generate a random 4-character session code.
 * Uses uppercase letters, excluding confusable characters (O, I, L).
 */
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ";

export function generateSessionCode(): string {
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return code;
}
