import { FelParseError } from "./FelParseError";
import * as NumberChecks from "./_NumberChecks"
/**
 * Class to represent an Allwinner USB request for a device in FEL mode.
 */
export class AwUsbRequest {
  /** int */
  private tag: number = 0

  /** int */
  private len: number

  private command: AwUsbRequest.RequestType

  /** byte */
  private commandLen = 0x0C

  /** The Allwinner USB Request Magic (AWUC) */
  public static readonly magic: Buffer = Buffer.from('AWUC', "ascii")

  /**
   * Checks to make sure the input data contains the magic string
   * @param data 
   */
  public static checkMagic(data: Buffer): boolean {
    const sliced: Buffer = data.slice(0, AwUsbRequest.magic.length)
    return sliced.compare(AwUsbRequest.magic) === 0
  }

  constructor(data?: Buffer) {
    if (data == null) {
      this.len = this.command = 0
      return
    }

    if (AwUsbRequest.checkMagic(data)) {
      throw new FelParseError("Unable to find magic bytes in the provided data")
    }

    this.tag = (data[4] | (data[5] * 0x100) | (data[6] * 0x10000) | (data[7] * 0x1000000))
    this.len = (data[8] | (data[9] * 0x100) | (data[10] * 0x10000) | (data[11] * 0x1000000))
    this.commandLen = data[15]
    this.command = AwUsbRequest.RequestType.getRequestType(data[16])
  }

  public getData(): Buffer {
    console.log("USB request")
    const data: Buffer = Buffer.alloc(32)
    AwUsbRequest.magic.copy(data)
    data[4] = (this.tag & 0xFF) // tag
    data[5] = ((this.tag >> 8) & 0xFF) // tag
    data[6] = ((this.tag >> 16) & 0xFF) // tag
    data[7] = ((this.tag >> 24) & 0xFF) // tag
    data[8] = (this.len & 0xFF) // len
    data[9] = ((this.len >> 8) & 0xFF) // len
    data[10] = ((this.len >> 16) & 0xFF) // len
    data[11] = ((this.len >> 24) & 0xFF) // len
    data[12] = 0 // reserved1
    data[13] = 0 // reserved1
    data[14] = 0 // reserved2
    data[15] = this.commandLen // cmd_len
    data[16] = this.command
    data[17] = 0 // reserved3
    data[18] = (this.len & 0xFF) // len
    data[19] = ((this.len >> 8) & 0xFF) // len
    data[20] = ((this.len >> 16) & 0xFF) // len
    data[21] = ((this.len >> 24) & 0xFF) // len

    return data
  }

  public getTag(): number {
    return this.tag
  }

  public setTag(tag: number): void {
    this.tag = tag
  }

  public getLen(): number {
    return this.len
  }

  public setLen(len: number): void {
    this.len = len
  }

  public getCommand(): AwUsbRequest.RequestType {
    return this.command
  }

  public setCommand(command: AwUsbRequest.RequestType): void {
    this.command = AwUsbRequest.RequestType.getRequestType(command)
  }

  public getCommandLen(): number {
    return this.commandLen
  }

  public setCommandLen(commandLen: number): void {
    this.commandLen = NumberChecks.checkUint8(commandLen, "commandLen")
  }
}

export module AwUsbRequest {
  /**
    * Request type enum for Allwinner USB requests
    */
  export enum RequestType {
    AW_USB_READ = 0x11,
    AW_USB_WRITE = 0x12
  }
  
  export module RequestType {
    export function getRequestType(value: number): RequestType {
      if (!Object.values(RequestType).includes(value))
        throw new TypeError("Given value is not a valid RequestType")

      return value;
    }
  }
}