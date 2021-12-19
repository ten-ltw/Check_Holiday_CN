export const weatherParameter = {
  location: '38.92,121.64',
  key: process.env.HE_FENG_KEY,
} as IWeatherParameters;

interface IWeatherParameters {
  [key: string]: string;
}