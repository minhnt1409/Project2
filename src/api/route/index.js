import { router as commentRouter } from './comment.js';
import { router as notificationRouter } from './notification.js';
import { router as roomRouter } from './room.js';
import { router as usersRouter } from './users.js';
import { router as utilRouter } from './util.js';

function route(app) {

    app.use('/user', usersRouter);
    app.use('/room', roomRouter);
    app.use('/comment', commentRouter);
    app.use('/notification', notificationRouter);
    app.use('/util', utilRouter);
}

export { route };
