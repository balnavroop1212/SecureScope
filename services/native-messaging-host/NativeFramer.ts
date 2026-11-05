/**
 * SecureScope — Native Messaging Binary Wire Protocol Framer
 * 
 * Chrome Native Messaging Protocol Specification:
 * 1. Each message is serialized as UTF-8 JSON.
 * 2. Preceded by a 32-bit unsigned integer (4 bytes, little-endian) indicating payload byte length.
 * 3. Max message size is 1MB (1,048,576 bytes).
 */

export interface NativeMessage {
  type: string;
  [key: string]: any;
}

export class NativeFramer {
  private static MAX_MESSAGE_SIZE = 1024 * 1024; // 1 MB limit per Chrome spec

  /**
   * Encodes a JavaScript object into a 32-bit LE length-prefixed Buffer.
   */
  public static encode(payload: object): Buffer {
    const jsonStr = JSON.stringify(payload);
    const jsonBuffer = Buffer.from(jsonStr, 'utf-8');

    if (jsonBuffer.length > this.MAX_MESSAGE_SIZE) {
      throw new Error(`Message payload exceeds 1MB limit (${jsonBuffer.length} bytes)`);
    }

    const lengthBuffer = Buffer.alloc(4);
    lengthBuffer.writeUInt32LE(jsonBuffer.length, 0);

    return Buffer.concat([lengthBuffer, jsonBuffer]);
  }

  /**
   * Parses messages from a binary buffer stream.
   * Handles partial chunks and multiple consecutive messages.
   */
  public static decode(buffer: Buffer): { messages: NativeMessage[]; remainder: Buffer } {
    const messages: NativeMessage[] = [];
    let offset = 0;

    while (buffer.length - offset >= 4) {
      const messageLength = buffer.readUInt32LE(offset);

      if (messageLength > this.MAX_MESSAGE_SIZE) {
        throw new Error(`Invalid message length in frame: ${messageLength} bytes`);
      }

      const totalFrameSize = 4 + messageLength;
      if (buffer.length - offset < totalFrameSize) {
        // Incomplete message in buffer; wait for more data
        break;
      }

      const jsonSlice = buffer.subarray(offset + 4, offset + totalFrameSize);
      const jsonStr = jsonSlice.toString('utf-8');

      try {
        const parsed = JSON.parse(jsonStr);
        messages.push(parsed);
      } catch (err: any) {
        throw new Error(`Malformed JSON in native frame: ${err.message}`);
      }

      offset += totalFrameSize;
    }

    const remainder = buffer.subarray(offset);
    return { messages, remainder };
  }
}

