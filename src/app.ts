/**
 * Save sepcial dates about this years from
 * https://fangjia.bmcx.com/
 */
import fs from "fs";
import request, { Response } from "request";
import cheerio from "cheerio";
// Make our call as a browser call
const headers = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.65 Safari/537.36",
};
const options = {
  headers,
  timeout: 10000,
};

class HolidayHeper {
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
      request(this.seedURL, options, (err: unknown, response: Response) => {
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
          timeToDaterSting(timeFrom),
          timeToDaterSting(timeTo)
        );
        let nextDay = new Date(timeFrom.setDate(timeFrom.getDate() + 1));
        while (timeToDaterSting(nextDay) !== timeToDaterSting(timeTo)) {
          specialDate.workingdayHoliday.push(timeToDaterSting(nextDay));
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
            specialDate.weekendWoringday.push(timeToDaterSting(time));
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

type SpecialDate = {
  workingdayHoliday: string[];
  weekendWoringday: string[];
};

function timeToDaterSting(time: Date): string {
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

/**
 * Get new special date automation
 * One month once
 * And make the first json file when service start
 */
import { scheduleJob } from "node-schedule";

const holidayHeper = new HolidayHeper();
holidayHeper.getNewHoliday();

const scheduleCronstyle = () => {
  // * * * * * *
  // ┬ ┬ ┬ ┬ ┬ ┬
  // │ │ │ │ │ |
  // │ │ │ │ │ └ day of week (0 - 7) (0 or 7 is Sun)
  // │ │ │ │ └───── month (1 - 12)
  // │ │ │ └────────── day of month (1 - 31)
  // │ │ └─────────────── hour (0 - 23)
  // │ └──────────────────── minute (0 - 59)
  // └───────────────────────── second (0 - 59, OPTIONAL)
  scheduleJob("1 1 0 1 * *", () => {
    holidayHeper.getNewHoliday();
  });
};
scheduleCronstyle();

/**
 * My service
 */
import express from "express";
const app = express();
app.use(express.static('public'));

/**
 * get method to check the date is a holiday
 * return value:
 *   - 0: work day
 *   - 1: weekend
 *   - 2: holiday
 */
app.get("/", async (req, res) => {
  const reg = /^\d{4}\/\d{2}\/\d{2}/;
  const date = req.query.date?.toString();

  if (!date) return res.send("Empty param!");
  if (!reg.exec(date)) return res.send("Wrong param!");

  const state = await caculateState(date);
  return res.send(JSON.stringify({ date, state }));
});

app.get("/today", async (req, res) => {
  const date = timeToDaterSting(new Date());

  const state = await caculateState(date);
  return res.send(JSON.stringify({ date, state }));
});

// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});

async function caculateState(date: string): Promise<number> {
  const year = new Date(date).getFullYear().toString();
  // TODO: If we don't have made the file before, we should do it again
  const specialDatesJson = await fs.readFileSync(year + ".json");
  const specialDates: SpecialDate = JSON.parse(
    specialDatesJson.toString("utf-8")
  );

  let state = 0;
  if (specialDates.workingdayHoliday.some((specialDate) => specialDate === date)) {
    // 2: holiday
    state = 2;
    return state;
  } else if (specialDates.weekendWoringday.some((specialDate) => specialDate === date)) {
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
