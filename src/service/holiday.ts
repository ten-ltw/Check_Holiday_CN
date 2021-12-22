import { load } from 'cheerio';
import {
  readFileSync,
  writeFileSync,
} from 'fs';

import { asyncGetString } from '../common';
import { SpecialDate } from '../datamodel';

export class HolidayService {
  private year = new Date().getFullYear().toString();
  private get seedURL(): string {
    return 'https://fangjia.bmcx.com/' + this.year + '__fangjia/';
  }

  public async getNewHoliday(): Promise<void> {
    this.year = new Date().getFullYear().toString();
    try {
      const responseBody = await asyncGetString(this.seedURL);
      const specialDate = this.extractSpecialDate(responseBody);

      this.writeFileSync(specialDate);
    } catch (error) {
      console.error('Some error occurred in request: ' + error);
    }
  }

  private extractSpecialDate(html: string): SpecialDate {
    const specialDate: SpecialDate = {
      workingdayIsHoliday: [],
      weekendIsWoringday: [],
    };

    try {
      const $ = load(html, { decodeEntities: true });
      const seedurlTbody = $('tbody');
      const tr = seedurlTbody.children('tr');

      let lineCounter = 1;
      for (; lineCounter < 8; lineCounter++) {
        const workingdayHoliday = tr
          .eq(lineCounter)
          .find('td')
          .eq(1)
          .html()
          ?.toString()
          .replace(/月/g, '/')
          .replace(/日/g, '');
        const workingdayHolidayFrom = workingdayHoliday?.split('~')?.[0];
        const workingdayHolidayTo = workingdayHoliday?.split('~')?.[1];
        const timeFrom = new Date(this.year + '/' + workingdayHolidayFrom);
        const timeTo = new Date(this.year + '/' + workingdayHolidayTo);
        specialDate.workingdayIsHoliday.push(
          timeFrom.toLocaleDateString(),
          timeTo.toLocaleDateString()
        );
        let nextDay = new Date(timeFrom.setDate(timeFrom.getDate() + 1));
        while (nextDay.toLocaleDateString() !== timeTo.toLocaleDateString()) {
          specialDate.workingdayIsHoliday.push(nextDay.toLocaleDateString());
          nextDay = new Date(nextDay.setDate(nextDay.getDate() + 1));
        }

        const weekendWorking = tr
          .eq(lineCounter)
          .find('td')
          .eq(2)
          .html()
          ?.toString()
          .replace('(周日)', '')
          .replace('(周六)', '')
          .replace('上班', '')
          .replace('无调休', '')
          .replace(/月/g, '/')
          .replace(/日/g, '');

        if (!!weekendWorking?.length) {
          const weekendWorkingDays = weekendWorking?.split('、');
          weekendWorkingDays?.forEach((dateWithoutYear) => {
            const time = new Date(this.year + '/' + dateWithoutYear);
            specialDate.weekendIsWoringday.push(time.toLocaleDateString());
          });
        }
      }
    } catch (error) {
      console.error('Some error occurred in dataParse: ' + error);
    }

    return specialDate;
  }

  private writeFileSync(data: SpecialDate): void {
    const filename = this.year + '.json';
    writeFileSync(filename, JSON.stringify(data));
  }


  /**
   * return value:
   *   - 0: work day
   *   - 1: weekend
   *   - 2: holiday
   */
  public async caculateState(date: Date): Promise<number> {
    const year = date.getFullYear().toString();
    // TODO: If we don't have made the file before, we should do it again
    const specialDatesJson = await readFileSync(year + '.json');
    const specialDates: SpecialDate = JSON.parse(
      specialDatesJson.toString('utf-8')
    );

    let state = 0;
    if (specialDates.workingdayIsHoliday.some((specialDate) => specialDate === date.toLocaleDateString())) {
      // 2: holiday
      state = 2;
      return state;
    } else if (specialDates.weekendIsWoringday.some((specialDate) => specialDate === date.toLocaleDateString())) {
      // 0: work day
      return state;
    } else {
      const day = new Date(date).getDay();
      if (day === 0 || day === 6) {
        // 1: weekend
        state = 1;
      }
      return state;
    }
  }
}