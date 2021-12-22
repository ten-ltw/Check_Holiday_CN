import { get } from 'https';
import { brotliCompress } from 'zlib';

export function asyncGetString(url: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    get(url, (response) => {
      const data: Buffer[] = [];
      response.on('data', (chunk) => {
        data.push(chunk);
      });
      response.on('end', () => {
        resolve(Buffer.concat(data).toString('utf-8'));
      });
    }).on('error', (error) => {
      reject(error);
    });
  })
}

export function asyncGetJson(url: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    get(url, { headers: { 'Content-Type': 'application/json' } }, (response) => {
      response.on('data', (chunk) => {
        brotliCompress(chunk, (error, compressedBuffer) => {
          if (error) reject(error);
          resolve(compressedBuffer.toString());
        })
      });
    }).on('error', (error) => {
      reject(error);
    });
  })
}

