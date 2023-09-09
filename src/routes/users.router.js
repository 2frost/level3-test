import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma/index.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();


/** 사용자 회원가입 API **/
router.post('/sign-up', async (req, res, next) => {
try {
  // throw new Error ('에러처리 테스트용입니다')
// 1. `email`, `password`, `name`, `age`, `gender`, `profileImage`를 **body**로 전달받습니다.
const { email, password, name, age, gender, profileImage } = req.body;

// 2. 동일한 `email`을 가진 사용자가 있는지 확인합니다.
const isExistUser = await prisma.users.findFirst({
    where: { email }
    });
if (isExistUser) {
  return res.status(409).json({ message: '이미 존재하는 이메일입니다.' });
}
// 3. **Users** 테이블에 `email`, `password`를 이용해 사용자를 생성합니다.
const hashedPassword = await bcrypt.hash(password, 10);   // 사용자 비밀번호를 암호화합니다.
const user = await prisma.users.create({
    data: { email , password: hashedPassword },
});   
 
// 4. **UserInfos** 테이블에 `name`, `age`, `gender`, `profileImage`를 이용해 사용자 정보를 생성합니다.
const userInfo = await prisma.userInfos.create({
    data: {
        UserId: user.userId, // 생성한 유저의 userId를 바탕으로 사용자 정보를 생성합니다.
        name,
        age,
        gender: gender.toUpperCase(), // 성별을 대문자로 치환해줄수있도록 해준다.
        profileImage,
      },
    });

    return res.status(201).json({ message: '회원가입이 완료되었습니다.' });
}  catch (err) {
  next(err);
}
});
    
// ** 사용자 로그인 API ** //
router.post('/sign-in', async (req, res, next) => {

// 1. `email`, `password`를 **body**로 전달받습니다.

const { email, password } = req.body;
// 2. 전달 받은 `email`에 해당하는 사용자가 있는지 확인합니다.

const user = await prisma.users.findFirst({ where: { email } });
  if (!user){
    return res.status(401).json({ message: '존재하지 않는 이메일입니다.' });
  }
// 3. 전달 받은 `password`와 데이터베이스의 저장된 `password`를 bcrypt를 이용해 검증합니다.
   if (!await bcrypt.compare(password, user.password)){
    return res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' });
   }
// 4. 로그인에 성공한다면, 사용자에게 JWT를 발급합니다.
// jason web token libray 를 가지고온다. 상단에 'jsonwebtoken' impor해주기! 
const token = jwt.sign(
{
  userId: user.userId,
},
'customized_secret_key',// 비밀키, dotenv를 이용해서 외부에서 코드를 보내더라도 알수없도록 구현해야한다.
);

// authotization 쿠키에 Berer 토큰 형식으로 JWT를 저장
res.cookie('authorization', `Bearer ${token}`);
return res.status(200).json({ message: '로그인 성공' });
});

//  **  사용자 정보 조회 API **
router.get('/users', authMiddleware, async (req, res, next) => {
  // get메소드 user url실행  authMiddleware 실행 비지니스로직수행함. next콜백함수 실행되면 오른쪽 api 수행됨 (=즉 authMiddleware가 정상적으로 수행되어야함.)
// 1. 클라이언트가 **로그인된 사용자인지 검증**합니다. -> auth 미들웨어에서 수행할수있도록 함 (사용자인증에서)
const { userId } = req.user;

// 2. 사용자를 조회할 때, 1:1 관계를 맺고 있는 **Users**와 **UserInfos** 테이블을 조회합니다.
const user = await prisma.users.findFirst({
  where: { userId: +userId },
  // 특정컬럼만 조회하는 파라미터 (컨트롤 + 스페이스 )
  select: {
    userId: true,
    email: true,
    createdAt: true,
    updatedAt: true,
    UserInfos: { 
      select: {
        name: true,
        age: true,
        gender: true,
        profileImage: true,
      },
  },
},
});
// 3. 조회한 사용자의 상세한 정보를 클라이언트에게 반환합니다.
return res.status(200).json({ data: user });

});




export default router;