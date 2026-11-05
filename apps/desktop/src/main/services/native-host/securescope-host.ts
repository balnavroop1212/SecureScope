import { NativeFramer } from './NativeFramer';
import { NativeHostEngine } from './NativeHostEngine';

// Ensure standard IO encoding is binary/raw
process.stdin.resume();

const engine = new NativeHostEngine();
let buffer = Buffer.alloc(0);

process.stdin.on('data', async (chunk: Buffer) => {
  buffer = Buffer.concat([buffer, chunk]);

  try {
    const { messages, remainder } = NativeFramer.decode(buffer);
    buffer = Buffer.from(remainder);

    for (const msg of messages) {
      const result = await engine.handleMessage(msg);
      const encodedResponse = NativeFramer.encode(result.response);
      process.stdout.write(encodedResponse);

      if (result.closeAfterSend) {
        process.exit(0);
      }
    }
  } catch (err: any) {
    // If decoding or execution fails catastrophically, write error frame and reset
    try {
      const errorFrame = NativeFramer.encode({
        type: 'FATAL_HOST_ERROR',
        success: false,
        error: err.message,
      });
      process.stdout.write(errorFrame);
    } catch {
      // Ignored if stdout is broken
    }
  }
});

process.stdin.on('end', () => {
  process.exit(0);
});

process.on('uncaughtException', (err) => {
  try {
    const errorFrame = NativeFramer.encode({
      type: 'FATAL_UNCAUGHT_ERROR',
      success: false,
      error: err.message,
    });
    process.stdout.write(errorFrame);
  } catch {}
  process.exit(1);
});
