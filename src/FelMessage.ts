import { FelStandardRequest } from "./FelStandardRequest"
import { FelStatusResponse } from "./FelStatusResponse"
import * as NumberChecks from "./NumberChecks"

/**
 * Class to represent a message to a FEL device.
 */
export class FelMessage {
  private command: FelStandardRequest.RequestType

  /** uint16 */
  private tag: number

  /** uint32 */
  private address: number

  /** uint32 */
  private length: number

  /** uint32 */
  private flags: number

  constructor(data?: Buffer) {
    if (data == null) {
      this.command = this.tag = this.address = this.length = this.flags = 0
      return
    }
    this.command = FelStandardRequest.RequestType.getRequestType(data[0] | (data[1] * 0x100))
    this.tag = (data[2] | (data[3] * 0x100))
    this.address = (data[4] | (data[5] * 0x100) | (data[6] * 0x10000) | (data[7] * 0x1000000))
    this.length = (data[8] | (data[9] * 0x100) | (data[10] * 0x10000) | (data[11] * 0x1000000))
    this.flags = (data[12] | (data[13] * 0x100) | (data[14] * 0x10000) | (data[15] * 0x1000000))
  }

  getData(): Buffer {
    console.log("FEL message")
    const data: Buffer = Buffer.alloc(16)
    data[0] = (FelStandardRequest.RequestType.getRequestType(this.command) & 0xFF) // mark
    data[1] = ((FelStandardRequest.RequestType.getRequestType(this.command) >> 8) & 0xFF) // mark
    data[2] = (this.tag & 0xFF) // tag
    data[3] = ((this.tag >> 8) & 0xFF) // tag
    data[4] = (this.address & 0xFF) // address
    data[5] = ((this.address >> 8) & 0xFF) // address
    data[6] = ((this.address >> 16) & 0xFF) // address
    data[7] = ((this.address >> 24) & 0xFF) // address
    data[8] = (this.length & 0xFF) // len
    data[9] = ((this.length >> 8) & 0xFF) // len
    data[10] = ((this.length >> 16) & 0xFF) // len
    data[11] = ((this.length >> 24) & 0xFF) // len
    data[12] = (this.flags & 0xFF) // flags
    data[13] = ((this.flags >> 8) & 0xFF) // flags
    data[14] = ((this.flags >> 16) & 0xFF) // flags
    data[15] = ((this.flags >> 24) & 0xFF) // flags

    return data
  }

  getCommand(): FelStandardRequest.RequestType {
    return this.command
  }

  setCommand(command: FelStandardRequest.RequestType) {
    this.command = FelStandardRequest.RequestType.getRequestType(command)
  }

  getTag(): number {
    return this.tag
  }

  setTag(tag: number) {
    this.tag = NumberChecks.checkUint16(tag, "tag")
  }

  getAddress(): number {
    return this.address
  }

  setAddress(address: number) {
    this.address = NumberChecks.checkUint32(address, "address")
  }

  getLength(): number {
    return this.length
  }

  setLength(length: number) {
    this.length = NumberChecks.checkUint32(length, "length")
  }

  getFlags(): number {
    return this.flags
  }

  setFlags(flags: number) {
    this.flags = NumberChecks.checkUint32(flags, "flags")
  }
}