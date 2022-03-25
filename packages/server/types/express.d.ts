declare interface CurrentUser {
  cn: string
  displayName: string
  mail: string
}

declare namespace Express {
  export interface Request {
    user?: CurrentUser
  }
}
