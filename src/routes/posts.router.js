import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router(); // express.Router()를 이용해 라우터를 생성합니다.

//**게시글생성**//

router.post('/posts', authMiddleware, async (req, res, next) => {

  try {
  const { userId } = req.user;
  const { title, content } = req.body;

  if (!title) {
    return res
      .status(412)
      .json({ errorMessage: "게시글 제목의 형식이 일치하지 않습니다." });
  }
  if (!content) {
    return res
      .status(412)
      .json({ errorMessage: "게시글 내용의 형식이 일치하지 않습니다." });
  }

 await prisma.posts.create({
      data: { 
        UserId: userId,
        title,
        content,
      },
    });

    return res.status(201).json({ message: '게시글 작성에 성공하였습니다.' });
  } catch (err) {
    next(err);
  }
});


//** 게시글  조회 API **//

router.get('/', async (req, res, next) => {
  try{
  // 요구사항 중 게시글 내용이 포함되지 않도록 구현해야 한다.
  const posts = await prisma.posts.findMany({
    select: {
      postId: true,
      title: true,
      createdAt: true,
      updatedAt: true,
      User:{
        select: {
          userId: true,
          nickname: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc', // 작성 날짜 기준으로 내림차순 정렬
    },
  });

  return res.status(200).json({ posts: posts });
} catch {
  return res
    .status(400)
    .json({ message: '게시글 조회에 실패하였습니다.' });
}
});

//** 게시글 상세 조회 API **//
router.get('/:postId', async (req, res, next) => {
  try{
  const { postId } = req.params;
  console.log(postId);
  const posts = await prisma.posts.findFirst({
    where: { postId: +postId },
    select: {
      postId: true,
      title: true,
      content: true,
      createdAt: true,
      updatedAt: true,
      User:{
        select: {
          userId: true,
          nickname: true,
        },
      },
    },
  });

  return res.status(200).json({ post: posts });
  } catch {
    return res
      .status(400)
      .json({ message: '게시글 조회에 실패하였습니다.' });
  }
});


// ** 게시글 수정 API **//


router.put('/:postId', authMiddleware, async (req, res, next) => {
  try{
    const { userId } = req.user;
    const { postId } = req.params;
    const { title, content } = req.body;


     if (!title || !content) {
    return res
      .status(412)
      .send({ message: '데이터 형식이 올바르지 않습니다.' });
  }

  if (typeof title !== 'string') {
    return res.status(412).send({ message: '게시글 제목의 형식이 일치하지 않습니다.' });
  }

  if (typeof content !== 'string') {
    return res.status(412).send({ message: '게시글 내용의 형식이 일치하지 않습니다.' });
  }

  if ( post.UserId !== userId) {  
    return res.status(403).json({ message: '게시글 수정의 권한이 존재하지 않습니다.' });
  }


  const post = await prisma.posts.findUnique({
    where: { postId: +postId },
  });

  if (!post) {
    return res.status(404).json({ message: '게시글 조회에 실패하였습니다.' });
  }

  if ( post.UserId !== userId) {  
    return res.status(403).json({ message: '게시글 수정의 권한이 존재하지 않습니다.' });
  }

  await prisma.posts.update({
    data: { title, content },
    where: {
      postId: +postId,
    },
  });



  return res.status(200).json({ data: '게시글을 수정하였습니다.' });
  } catch (error){
    console.log(error);
    return res
      .status(400)
      .json({ message: '게시글 수정에 실패하였습니다.' });
  }
});


// ** 게시글삭제 **//
router.delete('/:postId', authMiddleware, async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { postId } = req.params;
    // 3. `postId`를 기준으로 게시글을 검색하고, 게시글이 존재하는지 확인합니다.
    const post = await prisma.posts.findUnique({
      where: { postId: +postId },
    });

    if (!post) {
      return res
        .status(404)
        .json({ errorMessage: '게시글이 존재하지 않습니다.' });
    }
    if (userId !== post.UserId) {
      return res
        .status(403)
        .json({ errorMessage: '게시글의 삭제 권한이 존재하지 않습니다.' });
    } 

    await prisma.posts.delete({
      where: {
        postId: +postId,
      },
    });
    return res.status(200).json({ data: '게시글 삭제가 완료되었습니다.' });
  } catch {
    return res
      .status(400)
      .json({ message: '게시글 삭제에 실패하였습니다.' });
  }
});
export default router;
