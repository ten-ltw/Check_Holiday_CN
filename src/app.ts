import fs from "fs";
import { HolidayHelper, SpecialDate } from "./holiday_helper"

/**
 * Get new special date automation
 * One month once
 * And make the first json file when service start
 */
import { scheduleJob } from "node-schedule";

const holidayHelper = new HolidayHelper();
holidayHelper.getNewHoliday();

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
    holidayHelper.getNewHoliday();
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
app.get("/check", async (req, res) => {
  const reg = /^\d{4}\/\d{2}\/\d{2}/;
  const date = req.query.date?.toString();

  if (!date) return res.send("Empty param!");
  if (!reg.exec(date)) return res.send("Wrong param!");

  const state = await caculateState(new Date(date));
  return res.send(JSON.stringify({ date, state }));
});

app.get("/today", async (req, res) => {
  const date = new Date();

  const state = await caculateState(date);
  return res.send(JSON.stringify({ date, state }));
});

// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});

async function caculateState(date: Date): Promise<number> {
  console.log('======== compared local date:', date.toLocaleDateString(), ' ========')
  console.log('======== compared local time:', date.toLocaleTimeString(), ' ========')
  const year = date.getFullYear().toString();
  // TODO: If we don't have made the file before, we should do it again
  const specialDatesJson = await fs.readFileSync(year + ".json");
  const specialDates: SpecialDate = JSON.parse(
    specialDatesJson.toString("utf-8")
  );

  let state = 0;
  if (specialDates.workingdayHoliday.some((specialDate) => specialDate === date.toLocaleDateString())) {
    // 2: holiday
    state = 2;
    return state;
  } else if (specialDates.weekendWoringday.some((specialDate) => specialDate === date.toLocaleDateString())) {
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
