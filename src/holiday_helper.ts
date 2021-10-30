import fs from "fs";
import cheerio from "cheerio";
import { get, Response } from "request";

// Make our call as a browser call
const headers = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.65 Safari/537.36",
};
const options = {
  headers,
  timeout: 10000,
};

export class HolidayHelper {
  private year = new Date().getFullYear().toString();
  private get seedURL(): string {
    return "https://fangjia.bmcx.com/" + this.year + "__fangjia/";
  }

  public async getNewHoliday(): Promise<void> {
    let responseBody: Buffer;
    this.year = new Date().getFullYear().toString();
    try {
      responseBody = await this.callWebSite();

      const specialDate = this.makeSpecialDateData(responseBody);

      this.writeFileSync(specialDate);
    } catch (error) {
      console.error("Some error occurred in request: " + error);
    }
  }

  private async callWebSite(): Promise<Buffer> {
    return await new Promise((resolve, reject) => {
      get(this.seedURL, options, (err: unknown, response: Response) => {
        if (err) {
          reject(err);
        } else {
          resolve(response.body);
        }
      });
    });
  }

  private makeSpecialDateData(body: Buffer): SpecialDate {
    const specialDate: SpecialDate = {
      workingdayHoliday: [],
      weekendWoringday: [],
    };

    try {
      const html = body.toString("utf-8");
      // cheerio parse html
      const $ = cheerio.load(html, { decodeEntities: true });
      const seedurlTbody = $("tbody");
      // tslint:disable-next-line: no-any
      const tr = seedurlTbody.children("tr");

      let lineCounter = 1;
      for (; lineCounter < 8; lineCounter++) {
        const workingdayHoliday = tr
          .eq(lineCounter)
          .find("td")
          .eq(1)
          .html()
          ?.toString()
          .replace(/月/g, "/")
          .replace(/日/g, "");
        const workingdayHolidayFrom = workingdayHoliday?.split("~")?.[0];
        const workingdayHolidayTo = workingdayHoliday?.split("~")?.[1];
        const timeFrom = new Date(this.year + "/" + workingdayHolidayFrom);
        const timeTo = new Date(this.year + "/" + workingdayHolidayTo);
        specialDate.workingdayHoliday.push(
          timeToDateString(timeFrom),
          timeToDateString(timeTo)
        );
        let nextDay = new Date(timeFrom.setDate(timeFrom.getDate() + 1));
        while (timeToDateString(nextDay) !== timeToDateString(timeTo)) {
          specialDate.workingdayHoliday.push(timeToDateString(nextDay));
          nextDay = new Date(nextDay.setDate(nextDay.getDate() + 1));
        }

        const weekendWorking = tr
          .eq(lineCounter)
          .find("td")
          .eq(2)
          .html()
          ?.toString()
          .replace("(周日)", "")
          .replace("(周六)", "")
          .replace("上班", "")
          .replace("无调休", "")
          .replace(/月/g, "/")
          .replace(/日/g, "");

        if (!!weekendWorking?.length) {
          const weekendWorkingDays = weekendWorking?.split("、");
          weekendWorkingDays?.forEach((dateWithoutYear) => {
            const time = new Date(this.year + "/" + dateWithoutYear);
            specialDate.weekendWoringday.push(timeToDateString(time));
          });
        }
      }
    } catch (error) {
      console.error("Some error occurred in dataParse: " + error);
    }

    return specialDate;
  }

  private writeFileSync(data: SpecialDate): void {
    const filename = this.year + ".json";
    fs.writeFileSync(filename, JSON.stringify(data));
  }
}

export type SpecialDate = {
  workingdayHoliday: string[];
  weekendWoringday: string[];
}

export function timeToDateString(time: Date): string {
  const slash = "/";
  const year = time.getFullYear().toString();
  const month =
    (time.getMonth() + 1).toString().length > 1
      ? (time.getMonth() + 1).toString()
      : "0" + (time.getMonth() + 1).toString();
  const date =
    time.getDate().toString().length > 1
      ? time.getDate().toString()
      : "0" + time.getDate().toString();
  return year + slash + month + slash + date;
}