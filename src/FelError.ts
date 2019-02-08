export class FelError extends Error {
  constructor(message?: string | undefined) {
    super(message)
    Object.setPrototypeOf(this, new.target.prototype)
  }
}