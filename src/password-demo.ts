import * as argon2 from "argon2";

async function testPassword() {
  const password = "YueTest2026!";

  const passwordHash = await argon2.hash(password);

  console.log("原密码：", password);
  console.log("密码 Hash：", passwordHash);

  const correctResult = await argon2.verify(
    passwordHash,
    "YueTest2026!"
  );

  const wrongResult = await argon2.verify(
    passwordHash,
    "wrong-password"
  );

  console.log("正确密码：", correctResult);
  console.log("错误密码：", wrongResult);
}

testPassword();