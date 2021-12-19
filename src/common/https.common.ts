import { get } from 'https';

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
