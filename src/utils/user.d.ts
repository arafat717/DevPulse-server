// Source - https://stackoverflow.com/q/76193788
// Posted by Mehrad Farahnak
// Retrieved 2026-05-18, License - CC BY-SA 4.0

import type { JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
