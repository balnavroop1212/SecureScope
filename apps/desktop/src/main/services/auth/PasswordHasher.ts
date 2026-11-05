import * as crypto from 'crypto';

export class PasswordHasher {
  private static readonly KEY_LEN = 64;
  private static readonly SALT_LEN = 32;
  private static readonly COST = 16384;
  private static readonly BLOCK_SIZE = 8;
  private static readonly PARALLELISM = 1;

  /**
   * Hashes a plaintext password using Scrypt with a high-entropy 32-byte salt.
   * Returns formatted string: $scrypt$N=16384,r=8,p=1$<salt_hex>$<derived_key_hex>
   */
  public static async hashPassword(password: string): Promise<string> {
    const salt = crypto.randomBytes(this.SALT_LEN);
    return new Promise((resolve, reject) => {
      crypto.scrypt(
        password,
        salt,
        this.KEY_LEN,
        {
          N: this.COST,
          r: this.BLOCK_SIZE,
          p: this.PARALLELISM,
        },
        (err, derivedKey) => {
          if (err) return reject(err);
          const saltHex = salt.toString('hex');
          const keyHex = derivedKey.toString('hex');
          resolve(
            `$scrypt$N=${this.COST},r=${this.BLOCK_SIZE},p=${this.PARALLELISM}$${saltHex}$${keyHex}`
          );
        }
      );
    });
  }

  /**
   * Verifies a candidate password against a stored Scrypt hash in constant time
   * using crypto.timingSafeEqual to prevent side-channel timing attacks.
   */
  public static async verifyPassword(
    candidate: string,
    storedHash: string
  ): Promise<boolean> {
    try {
      const parts = storedHash.split('$');
      // Format: ["", "scrypt", "N=...,r=...,p=...", "saltHex", "keyHex"]
      if (parts.length < 5 || parts[1] !== 'scrypt') {
        return false;
      }

      const salt = Buffer.from(parts[3], 'hex');
      const expectedKey = Buffer.from(parts[4], 'hex');

      return new Promise((resolve) => {
        crypto.scrypt(
          candidate,
          salt,
          this.KEY_LEN,
          {
            N: this.COST,
            r: this.BLOCK_SIZE,
            p: this.PARALLELISM,
          },
          (err, derivedKey) => {
            if (err) return resolve(false);
            if (derivedKey.length !== expectedKey.length) {
              return resolve(false);
            }
            const isMatch = crypto.timingSafeEqual(derivedKey, expectedKey);
            resolve(isMatch);
          }
        );
      });
    } catch {
      return false;
    }
  }
}
