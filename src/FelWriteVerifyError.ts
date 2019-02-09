export class FelWriteVerifyError extends Error {
  constructor(message?: string | undefined){
    super(message)
    Object.setPrototypeOf(this, new.target.prototype)
  }
}