// src/app.js

import express from 'express';
import cookieParser from 'cookie-parser';
import logMiddleware from './middlewares/log.middleware.js';
import ErrorHandlingMiddleware from './middlewares/error-handling.middleware.js';
import UsersRouter from './routes/users.router.js';
import PostsRouter from './routes/posts.router.js';
import CommentsRouter from './routes/comments.router.js';



const app = express();
const PORT = 3018;

app.use(logMiddleware); // 최상단위치
app.use(express.json());
app.use(cookieParser());
app.use('/api', [UsersRouter, PostsRouter, CommentsRouter]);
app.use(ErrorHandlingMiddleware); // 전역미들웨어중 에러핸들링미들웨어는 **최하단** 에 위치해야함 

app.listen(PORT, () => {
  console.log(PORT, '포트로 서버가 열렸어요!');
});


