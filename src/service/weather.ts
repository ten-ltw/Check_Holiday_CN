import { createHash } from 'crypto';
import { get } from 'https';

export class Weather {

}

export function getWeatherData() {
  // https://devapi.qweather.com/v7/weather/24h?
  const a = {
    username: 'HE2112191027211539',
    location: '38.92,121.64',
  };
  const params = 'sign=' + getSignature(a, process.env.HE_FENG_KEY);
  get('https://devapi.qweather.com/v7/weather/now?' + params, (response) => {
    let body = '';

    response.on('data', function (chunk) {
      body += chunk;
    });

    response.on('end', function () {
      return body;
    });
  })
}

function getSignature(parameterObject: any, privateKey?: string) {
  const keys = [];
  for (let k in parameterObject) {
    if (k !== 'key' && k !== 'sign' && !/^\s+$/.test(k) && !/^\s+$/.test(parameterObject[k])) {
      keys.push(k);
    }
  }

  keys.sort();

  let str = '';
  for (let i in keys) {
    let k = keys[i];
    if (!/\s+/.test(parameterObject[k])) {
      str += k + '=' + parameterObject[k] + '&';
    }
  }
  str = str.substr(0, str.length - 1) + privateKey;
  return md5(str);
}

function md5(data: any) {
  // 以md5的格式创建一个哈希值
  let hash: any = createHash('md5');
  return hash.update(data).digest('base64');
}