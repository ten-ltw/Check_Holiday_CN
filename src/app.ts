import express from 'express';

import { Service } from './service';

const service = new Service();

const app = express();
app.use(express.static('public'));

app.get('/check', async (req, res) => {
  const reg = /^\d{4}\/\d{2}\/\d{2}/;
  const date = req.query.date?.toString();

  if (!date) return res.send('Empty param!');
  if (!reg.exec(date)) return res.send('Wrong param!');

  const state = await service.holiday.caculateState(new Date(date));

  return res.send(JSON.stringify({ date, state }));
});

app.get('/today', async (_req, res) => {
  const date = new Date();

  const state = await service.holiday.caculateState(date);

  return res.send(JSON.stringify({ date, state }));
});

// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});
