// After the `authenticate` middleware runs, these fields hold the identity
// read from the JWT. Declared here so handlers can use `req.userId` without
// casting `req` to `any`.
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: string;
    }
  }
}

export {};
