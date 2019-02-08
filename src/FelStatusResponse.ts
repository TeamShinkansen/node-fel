
import * as NumberChecks from "./_NumberChecks"

/**
 * Class to represent a FEL status response.
 */
export class FelStatusResponse {
  /** uint16 */
  private mark: number = 0xFFFF

  /** uint16 */
  private tag: number = 0

  /** byte */
  private state: number
  
  constructor(data: Buffer) {
    this.mark = (data[0] | (data[1] * 0x100))
    this.tag = (data[2] | (data[3] * 0x100))
    this.state = data[4]
  }

  getData(): Buffer {
    const data: Buffer = Buffer.alloc(8)
    data[0] = (this.mark & 0xFF) // mark
    data[1] = ((this.mark >> 8) & 0xFF) // mark
    data[2] = (this.tag & 0xFF) // tag
    data[3] = ((this.tag >> 8) & 0xFF) // tag
    data[4] = this.state;
    return data;
  }

  getMark(): number {
    return this.mark
  }

  setMark(mark: number): void {
    this.mark = NumberChecks.checkUint16(mark, "mark")
  }

  getTag(): number {
    return this.tag
  }

  setTag(tag: number): void {
    this.tag = NumberChecks.checkUint16(tag, "tag")
  }

  getState(): number {
    return this.state
  }

  setState(state: number) {
    this.state = NumberChecks.checkUint8(state, "state")
  }
}