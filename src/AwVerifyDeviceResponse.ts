import { AwUsbResponse } from "./AwUsbResponse"
import { FelParseError } from "./FelParseError"

export class AwVerifyDeviceResponse {
  /** UInt32 */
  board: number

  /** UInt32 */
  fw: number

  /** UInt16 */
  mode: number

  /** byte */
  dataFlag: number

  /** byte */
  dataLength: number

  /** UInt32 */
  dataStartAddress: number

  /** The Allwinner USB FEX Response Magic (AWUSBFEX) */
  public static readonly magic: Buffer = Buffer.from('AWUSBFEX', "ascii")

  /**
   * Checks to make sure the input data contains the magic string
   * @param data 
   */
  public static checkMagic(data: Buffer): boolean {
    const sliced: Buffer = data.slice(0, AwVerifyDeviceResponse.magic.length)
    return sliced.compare(AwVerifyDeviceResponse.magic) === 0
  }
  
  constructor(data: Buffer) {
    if (!AwVerifyDeviceResponse.checkMagic(data)) {
      throw new FelParseError("Unable to find magic bytes in the provided data")
    }

    this.board = (data[8] | (data[9] * 0x100) | (data[10] * 0x10000) | (data[11] * 0x1000000))
    this.fw = (data[12] | (data[13] * 0x100) | (data[14] * 0x10000) | (data[15] * 0x1000000))
    this.mode = (data[16] | (data[17] * 0x100))
    this.dataFlag = data[18]
    this.dataLength = data[19]
    this.dataStartAddress = (data[20] | (data[21] * 0x100) | (data[22] * 0x10000) | (data[23] * 0x1000000))
  }

  public getData(): Buffer {
    const data = Buffer.alloc(32)
    AwVerifyDeviceResponse.magic.copy(data)
    data[8] = (this.board & 0xFF) // board
    data[9] = ((this.board >> 8) & 0xFF) // board
    data[10] = ((this.board >> 16) & 0xFF) // board
    data[11] = ((this.board >> 24) & 0xFF) // board
    data[12] = (this.fw & 0xFF) // fw
    data[13] = ((this.fw >> 8) & 0xFF) // fw
    data[14] = ((this.fw >> 16) & 0xFF) // fw
    data[15] = ((this.fw >> 24) & 0xFF) // fw
    data[16] = (this.mode & 0xFF) // mode
    data[17] = ((this.mode >> 8) & 0xFF) // mode
    data[18] = this.dataFlag
    data[19] = this.dataLength
    data[20] = (this.dataStartAddress & 0xFF) // data_start_address
    data[21] = ((this.dataStartAddress >> 8) & 0xFF) // data_start_address
    data[22] = ((this.dataStartAddress >> 16) & 0xFF) // data_start_address
    data[23] = ((this.dataStartAddress >> 24) & 0xFF) // data_start_address
    return data;
  }
}