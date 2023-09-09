import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma/index.js';


export default async function (req, res, next) {

//  **[게시판 프로젝트] 사용자 인증 미들웨어 비즈니스 로직**

// 1. 클라이언트로 부터 **쿠키(Cookie)**를 전달받습니다.
try {
const { authorization } = req.cookies; // 쿠키안에서 authorization 하나만 사용할것임으로 객체분해 할당을 통해서 가지고온다.

// 2. **쿠키(Cookie)**가 **Bearer 토큰** 형식인지 확인합니다.

const [tokenType, token] = authorization.split(' '); // 왼쪽에는 barer 오른쪽에는 토큰이 들어있음 둘을 분리하기위해 split메서드 사용
if (tokenType !== 'Bearer') throw new Error(' 토큰 타입이 일치하지 않습니다.');// barer 토큰이 맞는지 확인해야함.

// 3. 서버에서 발급한 **JWT가 맞는지 검증**합니다. → jwt의 비밀키 ‘ ‘

const decodedToken = jwt.verify(token, 'customized_secret_key'); // jwt 사용하기위해 위에 import jsonwebtoken 해줘야함
    const userId = decodedToken.userId;
// user.router.js 에서 검증하는 과정에 'customized_secret_key'사용했음으로 동일하게 넣어준다.
// jwt.verify는 인증에 실패하면 err발생됨 때문에 try / catch문으로 묶어줘야한다. -> 그래야 서버가 꺼지지않고 다음에러로 넘어감

// 4. JWT의 `userId`를 이용해 사용자를 조회합니다.
    const user = await prisma.users.findFirst({ // 한개의 데이터만 찾음으로 findfirst
    where: { userId: +userId }, // user 아이디가 Int 타입임으로 + 붙여줌 
  });
  // 조회된 사용자가 없다면 err 발생 및 쿠키를 삭제하는 방식을 한번 더 써줘여함.->클라이언트는 동일한 쿠키로 서버에 요청 못하도록해줘야함
  if (!user) {
    res.clearCookie('authorization');
    throw new Error('토큰 사용자가 존재하지 않습니다.'); // 에러메세지를 catch로 넘김 
  }

// 5. `req.user` 에 조회된 사용자 정보를 할당합니다.
req.user = user;

// 6. 다음 미들웨어를 실행합니다.
next();
} catch (error){
    res.clearCookie('authorization'); // 쿠키인증에 실패하면 삭제 > 특정쿠키를 삭제시킨다.

    switch(error.name){
    case 'TokenExpiredError': // 토큰이 만료되었을떄 발생하는 에러 
    return res.status(401).json({ message: '토큰이 만료되었습니다.' });
   
   case 'JsonWebTokenError': // 토큰 검증이 실패했을때 발생하는 에러 
   return res.status(401).json({ message: '토큰이 조작되었습니다.' });
  
    default:
    return res.status(401).json({ message: error.message ?? '비정상적인 요청입니다.' }); 
    // -> ?? 의미 : 에러에있는 메세지가 존재할때만 비정상적인 요청입니다가 출력되도록 구현하는것
     
}
}
} 