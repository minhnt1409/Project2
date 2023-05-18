import dotenv from 'dotenv';
import express from 'express';
import bodyParser from 'body-parser';
import { route } from './route/index.js';
import errorHandler from './middleware/errorHandler.js';

dotenv.config();

const app = express();
app.use(bodyParser.json());

// Định nghĩa các route và controller ở đây
route(app);

app.use((err, req, res, next) => {
  errorHandler(err, res);
})

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}. http://localhost:${port}`);
});
