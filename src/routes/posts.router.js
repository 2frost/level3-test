import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

/** 게시글 생성 API **/
router.post('/posts', authMiddleware, async (req, res, next) => {
// 1. 게시글을 작성하려는 클라이언트가 로그인된 사용자인지 검증합니다.
// 2. 게시물을 특정하기 위한 `postId`를 **Path Parameters**로 전달받습니다.
const { userId } = req.user;
const { title, content } = req.body;
// 3. 댓글 생성을 위한 `content`를 **body**로 전달받습니다.

const post = await prisma.posts.create({

    data: {
      UserId: userId,
      title,
      content,
    },
  });

  return res.status(201).json({ data: post });
});
// 4. **Comments** 테이블에 댓글을 생성합니다.


/** 게시글 목록 조회 API **/
router.get('/posts', async (req, res, next) => {
  const posts = await prisma.posts.findMany({
    select: {
      postId: true,
      title: true, 
      createdAt: true,
      updatedAt: true,
    },
    orderBy: {
      createdAt: 'desc'// 게시글을 최신순으로 정렬합니다. asc는 오름차순
    },
  });

  return res.status(200).json({ data: posts });
});

/** 게시글 상세 조회 API **/
router.get('/posts/:postId', async (req, res, next) => {
  const { postId } = req.params;
  const post = await prisma.posts.findFirst({
    where: { postId: +postId }, // 조건이 일치할때만 조회할것임
    select: {
      postId: true,
      title: true,
      content: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return res.status(200).json({ data: post });
});

/** 게시글 상세 조회 API **/ 
export default router;