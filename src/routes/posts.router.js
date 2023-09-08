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
      data: { UserId: userId,
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

router.get('/posts', async (req, res, next) => {
  
  try {
  // 요구사항 중 게시글 내용이 포함되지 않도록 구현해야 한다.
  const posts = await prisma.posts.findMany({
    select: {
      postId: true,
      userId: true,
      createdAt: true,
      updatedAt: true,
      Users: {
        select: { 
          userId : true,
          nickname : true,
      }
    },
  },
    orderBy: {
      createdAt: 'desc', // 작성 날짜 기준으로 내림차순 정렬
    },
  });

  return res.status(200).json({ data: posts });
} catch (err) {
    next(err);
}
});

//** 게시글 상세 조회 API **//
router.get('/Posts/:postId',  async (req, res, next) => {
  const { postId } = req.params;
  const post = await prisma.posts.findFirst({
    where: { postId: +postId },
    select: {
      postId: true,
      userId: true,
      createdAt: true,
      updatedAt: true,
      Users: {
        select: { 
          userId : true,
          nickname : true,
      },
    },
  },
  });
  

  return res.status(200).json({ data: post });
});


// ** 게시글 수정 API **//


router.put('/postId/:postId', authMiddleware, async (req, res) => {
  try {
    const resultSchema = postSchema.validate(req.body);
    if (resultSchema.error) {
      return res.status(412).json({
        errorMessage: '데이터 형식이 올바르지 않습니다.',
      });
    }

    const { postId } = req.params;
    const { title, content } = resultSchema.value;
    const { userId } = res.locals.user;

    if (
      !isRegexMatch(title, RE_TITLE) ||
      isRegexMatch(title, RE_HTML_ERROR)
    ) {
      return res.status(412).json({
        errorMessage: '게시글 제목의 형식이 일치하지 않습니다.',
      });
    }
    if (!isRegexMatch(content, RE_CONTENT)) {
      return res.status(412).json({
        errorMessage: '게시글 내용의 형식이 일치하지 않습니다.',
      });
    }

    const updateCount = await Posts.update(
      { title, content },
      { where: { postId, UserId: userId } }
    );

    if (updateCount < 1) {
      return res.status(401).json({
        errorMessage: '게시글이 정상적으로 수정되지 않았습니다.',
      });
    }
    return res.status(200).json({ message: '게시글을 수정하였습니다.' });
  } catch (error) {
    console.error(`${req.method} ${req.originalUrl} : ${error.message}`);
    return res.status(400).json({
      errorMessage: '게시글 수정에 실패하였습니다.',
    });
  }
});


router.put('/:postId', async (req, res, next) => {
  // 1. **Path Parameters**로 어떤 게시글을 수정할 지 `postId`를 전달받습니다.
  const { postId } = req.params;
  // 2. 변경할 `title`, `content`와 권한 검증을 위한 `password`를 **body**로 전달받습니다.
  const { password, title, content } = req.body;
  // 3. `postId`를 기준으로 게시글을 검색하고, 게시글이 존재하는지 확인합니다.
  const post = await prisma.posts.findUnique({
    where: { postId: +postId },
  });
  // 4. 게시글이 조회되었다면 해당하는 게시글의 `password`가 일치하는지 확인합니다.
  // 오류 검사
  if (!post) {
    return res
      .status(404)
      .json({ errorMessage: '게시글이 존재하지 않습니다.' });
  } else if (post.password !== password) {
    return res
      .status(401)
      .json({ errorMessage: '비밀번호가 일치하지 않습니다.' });
  }

  // 5. 모든 조건을 통과하였다면 **게시글을 수정**합니다.
  await prisma.posts.update({
    data: { title, content },
    where: {
      postId: +postId,
      password,
    },
  });

  return res.status(200).json({ data: '게시글을 수정하였습니다.' });
});

// // ** 게시글 삭제 Api **// 
// export const deletePost = asyncHandler(async (req, res, next) => {
//   const { userId } = req.user;
//   const postId = req.params.postId;
//   const result = await PostService.deletePost(userId, postId);
//   return res.status(200).json(result);
// });
export default router;
