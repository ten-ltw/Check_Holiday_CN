/**
 * Save sepcial dates about this years from
 * https://fangjia.bmcx.com/
 */
import fs from "fs";
import cheerio from "cheerio";
import * as https from "https";

// Make our call as a browser call
const headers = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.65 Safari/537.36",
};
const options: https.RequestOptions = {
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

  private callWebSite(): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      https.get(this.seedURL, options, (response) => {

        // called when a data chunk is received.
        response.on('data', (chunk) => {
          resolve(chunk);
        });

      }).on("error", (err) => {
        reject(err);
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
          timeFrom.toLocaleDateString(),
          timeTo.toLocaleDateString()
        );
        let nextDay = new Date(timeFrom.setDate(timeFrom.getDate() + 1));
        while (nextDay.toLocaleDateString() !== timeTo.toLocaleDateString()) {
          specialDate.workingdayHoliday.push(nextDay.toLocaleDateString());
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
            specialDate.weekendWoringday.push(time.toLocaleDateString());
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