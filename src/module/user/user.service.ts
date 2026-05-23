import { config } from "../../config";
import { pool } from "../../db";
import type { IUser } from "./user.interface";
import bycript from "bcrypt";
import jwt, { type JwtPayload } from "jsonwebtoken";

const createUserIntoDb = async (payload: IUser) => {
  console.log("payload==>", payload);
  const { name, email, role, password } = payload;

  const hashPassword = bycript.hashSync(password, 10);

  const result = pool.query(
    `
    INSERT INTO users(name, email, role, password) VALUES($1,$2,$3,$4) RETURNING *
    `,
    [name, email, role, hashPassword],
  );

  return result;
};

const loginIntoDb = async (payload: Partial<IUser>) => {
  const { email, password } = payload;
  const userExist = await pool.query(
    `
        SELECT * FROM users WHERE email=$1
        `,
    [email],
  );

  const user = userExist.rows[0];

  if (!user) {
    throw new Error("User not found!");
  }

  const isPasswordMatch = await bycript.compare(
    password as string,
    user?.password,
  );

  if (!isPasswordMatch) {
    throw new Error("Password is incorrect!");
  }

  const JwtPayload = {
    id: user?.id,
    name: user?.name,
    role: user?.role,
  };

  const token = jwt.sign(JwtPayload, config.access_token as string, {
    expiresIn: "7d",
  });
  delete user.password;

  return { token, user };
};


export const userService = {
  createUserIntoDb,
  loginIntoDb
};
