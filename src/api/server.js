import dotenv from 'dotenv';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import bodyParser from 'body-parser';
import { route } from './route/index.js';
import errorHandler from './middleware/errorHandler.js';
import specs from '../../swagger.js'

dotenv.config();

const app = express();
app.use(bodyParser.json());

// Định nghĩa các route và controller ở đây
route(app);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

app.use((err, req, res, next) => {
  errorHandler(err, res);
})

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Server is running on port ${port}. http://localhost:${port}`);
  console.log(`The Swagger documentation in http://localhost:${port}/api-docs`);
});
