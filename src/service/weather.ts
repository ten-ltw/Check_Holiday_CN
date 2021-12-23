import axios from 'axios';

import { Weather } from '../datamodel';

export class WeatherService {
  public async getWeatherNow(): Promise<string> {
    return new Promise<string>((resolve) => {
      const loaction = '121.64,38.92';
      Promise.all([getNowData(loaction), get24HData(loaction)]).then((args) => {
        const weatherNow: Weather = args[0].data.now;
        const weather24H: Weather[] = args[1].data.hourly;
        resolve(this.makeATextForTTS(weatherNow, weather24H));
      })
    });
  }

  private makeATextForTTS(now: Weather, hours: Weather[]) {
    if (!now.feelsLike) {
      return '代码有问题，请检查！';
    }
    const feelsLike = now.feelsLike < 0 ? `零下${Math.abs(now.feelsLike)}` : Math.abs(now.feelsLike);

    let wear;
    if (now.feelsLike >= 4 && now.feelsLike < 10) {
      wear = `穿秋裤，毛呢或薄羽绒服。`;
    }
    if (now.feelsLike < 4) {
      wear = `穿厚打底裤，中等羽绒服。`;
    }
    if (now.feelsLike < -4) {
      wear = `穿最厚的衣裤。`;
    }

    const wind = now.feelsLike < 8 && now.windSpeed > 3 ? `风较大，穿防风衣裤。` : ``;

    let rain = '';
    if (hours[0].pop && hours[0].pop === 0) {
      rain = `未来一小时没有雨。`
    }
    if (hours[0].pop && hours[0].pop !== 0 && hours[0].pop <= 30) {
      rain = `未来一小时降水概率${hours[0].pop}%，降雨概率较小。`
    }
    if (hours[0].pop && hours[0].pop > 30 && hours[0].pop < 60) {
      rain = `未来一小时降水概率${hours[0].pop}%，可能降雨。`
    }
    if (hours[0].pop && hours[0].pop >= 60 && hours[0].pop < 75) {
      rain = `未来一小时降水概率${hours[0].pop}%，降雨概率较大。`
    }
    if (hours[0].pop && hours[0].pop >= 75 && hours[0].pop !== 100) {
      rain = `未来一小时降水概率${hours[0].pop}%，降雨可能性很大。`
    }
    if (hours[0].pop && hours[0].pop === 100) {
      rain = `未来一小时有雨。`
    }

    return `${now.text}。体感温度${feelsLike}摄氏度。${wear}${wind}${rain}`;
  }
}


export function getNowData(pos: string) {
  return request({
    url: '/now',
    params: {
      location: pos
    }
  })
}

export function get24HData(pos: string) {
  return request({
    url: '/24h',
    params: {
      location: pos
    }
  })
}

function request(config: any) {

  const instance = axios.create({
    baseURL: 'https://devapi.qweather.com/v7/weather',
    timeout: 5000
  });

  instance.interceptors.request.use(
    (config: any) => {
      config.params.key = process.env.HE_FENG_KEY;
      return config
    },
    (err: unknown) => { console.log(err) }
  )


  return instance(config);
}