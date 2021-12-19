export interface Weather {
  /**
   * 预报时间 预报有
   */
  fxTime?: Date;
  /**
   * 体感 即时有
   */
  feelsLike?: number;
  /**
   * 天气状况的文字描述
   */
  text: string;
  /**
   * 风向
   */
  windDir: string;
  /**
   * 风级
   */
  windScale: string;
  /**
   * 风速
   */
  windSpeed: number;
  /**
   * 湿度
   */
  humidity: number;
  /**
   * 降雨概率
   */
  pop?: number;
  /**
   * 降雨量
   */
  precip: number;
}