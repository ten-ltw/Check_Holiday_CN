import { config } from 'dotenv';
import { scheduleJob } from 'node-schedule';

import { Holiday } from './holiday';
import { Weather } from './weather';

export class Service {

  constructor (
    public holiday = new Holiday(),
    public weather = new Weather(),
  ) {
    this.preInitialize();
  }

  private preInitialize() {

    // add .env file
    config();

    this.holiday.getNewHoliday();

    this.scheduleFetchHoliday();
  }

  /**
   * Get new special date automation
   * One month once
   */
  private scheduleFetchHoliday() {
    scheduleJob('1 1 0 1 * *', () => {
      //         * * * * * *
      //         ┬ ┬ ┬ ┬ ┬ ┬
      //         │ │ │ │ │ └ day of week (0 - 7) (0 or 7 is Sun)
      //         │ │ │ │ └───── month (1 - 12)
      //         │ │ │ └────────── day of month (1 - 31)
      //         │ │ └─────────────── hour (0 - 23)
      //         │ └──────────────────── minute (0 - 59)
      //         └───────────────────────── second (0 - 59, OPTIONAL)
      this.holiday.getNewHoliday();
    });
  }
}