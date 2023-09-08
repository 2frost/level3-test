// src/routes/comments.router.js

import express from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import { prisma } from '../utils/prisma/index.js';

const router = express.Router();




// 4. **Comments** 테이블에 댓글을 생성합니다.

/** 댓글 생성 API **/
router.post( '/posts/:postId/comments', authMiddleware, async (req, res, next) => {
    
    // 1. 댓글을 작성하려는 클라이언트가 로그인된 사용자인지 검증합니다.

    const { userId } = req.user; // req.user은 authMiddleware 부분에 넣는다.

// 2. 게시물을 특정하기 위한 `postId`를 **Path Parameters**로 전달받습니다.

    const { postId } = req.params;

    // 3. 댓글 생성을 위한 `content`를 **body**로 전달받습니다.

    const { content } = req.body;

// 게시이 존재하는지 검증

    const post = await prisma.posts.findFirst({
      where: {
        postId: +postId,
      },
    });
    if (!post)
      return res.status(404).json({ message: '게시글이 존재하지 않습니다.' });

    // 4. **Comments** 테이블에 댓글을 생성합니다.

    const comment = await prisma.comments.create({
      data: {
        UserId: +userId, // 댓글 작성자 ID
        PostId: +postId, // 댓글 작성 게시글 ID
        content: content,
      },
    });

    return res.status(201).json({ data: comment });
  },
);


// ** 댓글조회 ** //
router.get('/posts/:postId/comments', async (req, res, next) => {
    const { postId } = req.params;
  
    const post = await prisma.posts.findFirst({
      where: { postId: +postId },
    });
    if (!post) {
      return res.status(404).json({ errorMessage : '게시글이 존재하지 않습니다.' });
    }



    const comments = await prisma.comments.findMany({
      where: { PostId: +postId},
      orderBy: {createdAt: 'desc' },
    });
  
    return res.status(200).json({ data: comments });
  });
export default router;