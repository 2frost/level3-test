  //**회원가입 API **//

  import express from 'express';
  import bcrypt from 'bcrypt';
  import { prisma } from '../utils/prisma/index.js';
  import jwt from 'jsonwebtoken';

  
  const router = express.Router();
  const nicknameRegex = /^(?=.*[0-9]+)[a-zA-Z][a-zA-Z0-9]{3,10}$/g
  const passwordRegx = /^.{4,}$/; 


  /** 사용자 회원가입 API **/
  router.post('/sign-up', async (req, res, next) => {
      try{
        const {  nickname, password, confirm } = req.body;

        if (!nickname || !password || !confirm) {
          return res
            .status(400)
            .send({ message: "요청한 데이터 형식이 올바르지 않습니다." });
        }

        if (!nicknameRegex.test(nickname)) {
          return res
          .status(412)
          .json({ message: '닉네임의 형식이 일치하지 않습니다.' });
          }

          if (!passwordRegx.test(password)) {
            return res
              .status(412)
              .json({ errorMessage: "패스워드 형식이 일치하지 않습니다." });
          }

          // ** 패스워드 확인하기 **//
          if (password !== confirm) {
            return res
              .status(412)
              .json({ errorMessage: "패스워드가 일치하지 않습니다." });
          } 

    const isExistUser = await prisma.users.findFirst({
      where: { nickname }
    });
    if (isExistUser) {
      return res.status(400).json({ message: '이미 존재하는 아이디입니다.' });
      
    }
 
  
   // 비밀번호 암호화 
   const hashedPassword = await bcrypt.hash(password, 10);   // 사용자 비밀번호를 암호화합니다.


  
    // Users 테이블에 사용자를 추가합니다.
    const Users = await prisma.users.create({
      data: { nickname, 
        password: hashedPassword },
    });
  
    return res.status(201).json({ message: "회원가입이 완료되었습니다." });
  } catch (err) {
    return res
      .status(400)
      .json({ errorMessage: "요청한 데이터 형식이 올바르지 않습니다." });
  }
});
  
    // 
  
  
    // // UserInfos 테이블에 사용자 정보를 추가합니다.
  
    // const users = await prisma.users.create({
    //   data: {
    //     userId: +users.id,
    //     nickname,
    //     password: hashedPassword,
      
    //   },
    // });
  
  

  
  
  // ** 로그인 api ** // 
  router.post('/log-in', async (req, res, next) => {
      const { nickname, password } = req.body;
      const user = await prisma.users.findFirst({ where: { nickname } });
  
      if (!user)
      return res.status(401).json({ message: "존재하지 않는 형식입니다." });
    // 입력받은 사용자의 비밀번호와 데이터베이스에 저장된 비밀번호를 비교합니다.
    else if (!(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ message: "비밀번호가 일치하지 않습니다." });
  
      // 로그인에 성공하면, 사용자의 userId를 바탕으로 토큰을 생성합니다.
    const token = jwt.sign(
      {
        userId: user.userId
      },
      'customized_secret_key',
    );
  
    // authotization 쿠키에 Berer 토큰 형식으로 JWT를 저장합니다.
    res.cookie('authorization', `Bearer ${token}`);
    return res.status(200).json({ message: '로그인 성공' });
  }); 
  
  
 
  
  export default router;