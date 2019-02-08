import { FelParseError } from "./FelParseError"
import * as NumberChecks from "./NumberChecks"

/**
 * Class to represent an Allwinner USB response from a device in FEL mode.
 */
export class AwUsbResponse {
  /** int */
  private tag: number

  /** int */
  private residue: number

  /** byte */
  private cswStatus: number

  /** The Allwinner USB Response Magic (AWUS) */
  public static readonly magic: Buffer = Buffer.from('AWUS', "ascii")

  /**
   * Checks to make sure the input data contains the magic string
   * @param data 
   */
  public static checkMagic(data: Buffer): boolean {
    const sliced: Buffer = data.slice(0, AwUsbResponse.magic.length)
    return sliced.compare(AwUsbResponse.magic) === 0
  }
  
  constructor(data: Buffer) {
    if (!AwUsbResponse.checkMagic(data)) {
      throw new FelParseError("Unable to find magic bytes in the provided data")
    }

    this.tag = (data[4] | (data[5] * 0x100) | (data[6] * 0x10000) | (data[7] * 0x1000000))
    this.residue = (data[8] | (data[9] * 0x100) | (data[10] * 0x10000) | (data[11] * 0x1000000))
    this.cswStatus = data[12]
  }

  public getData(): Buffer {
    console.log("USB response")
    const data: Buffer = Buffer.alloc(13)
    AwUsbResponse.magic.copy(data)
    data[4] = (this.tag & 0xFF) // tag
    data[5] = ((this.tag >> 8) & 0xFF) // tag
    data[6] = ((this.tag >> 16) & 0xFF) // tag
    data[7] = ((this.tag >> 24) & 0xFF) // tag
    data[8] = (this.residue & 0xFF) // residue
    data[9] = ((this.residue >> 8) & 0xFF) // residue
    data[10] = ((this.residue >> 16) & 0xFF) // residue
    data[11] = ((this.residue >> 24) & 0xFF) // residue
    data[12] = this.cswStatus // csw_status
    return data
  }

  public getTag(): number {
    return this.tag
  }

  public setTag(tag: number): void {
    this.tag = tag
  }

  public getResidue(): number {
    return this.residue
  }

  public setResidue(residue: number): void {
    this.residue = residue
  }

  public getCswStatus(): number {
    return this.cswStatus
  }

  public setCswStatus(cswStatus: number): void {
    this.cswStatus = NumberChecks.checkUint8(cswStatus, "cswStatus")
  }
}