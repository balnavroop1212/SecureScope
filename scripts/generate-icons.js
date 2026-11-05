/**
 * Generates PNG icons for SecureScope Chrome extension without any external dependencies.
 * Uses Node.js standard zlib and crc32 for valid PNG chunks.
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function crc32(buf) {
  let table = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ (-1)) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeAndData = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData), 0);
  return Buffer.concat([len, typeAndData, crc]);
}

function generateIcon(size) {
  const width = size;
  const height = size;
  const rawBytes = [];

  for (let y = 0; y < height; y++) {
    rawBytes.push(0); // Filter type: None
    for (let x = 0; x < width; x++) {
      // Distance from center
      const dx = x - width / 2;
      const dy = y - height / 2;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const radius = width * 0.44;

      if (dist <= radius) {
        // Border ring in cyan (#37C8F2), inside dark graphite (#111B2A)
        if (dist >= radius - (size > 32 ? 4 : 2)) {
          rawBytes.push(55, 200, 242, 255); // Cyan #37C8F2
        } else {
          // Inside shield / scope center
          if (Math.abs(dx) <= 2 || Math.abs(dy) <= 2) {
            rawBytes.push(165, 139, 250, 255); // Violet #A58BFA crosshair
          } else {
            rawBytes.push(17, 27, 42, 255); // Graphite #111B2A
          }
        }
      } else {
        rawBytes.push(0, 0, 0, 0); // Transparent background
      }
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const idatData = zlib.deflateSync(Buffer.from(rawBytes));

  const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', idatData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([pngSignature, ihdrChunk, idatChunk, iendChunk]);
}

const assetsDir = path.resolve(__dirname, '../apps/chrome-extension/assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

[16, 48, 128].forEach(size => {
  const iconBuffer = generateIcon(size);
  const filePath = path.join(assetsDir, `icon-${size}.png`);
  fs.writeFileSync(filePath, iconBuffer);
  console.log(`Generated icon: ${filePath} (${iconBuffer.length} bytes)`);
});
