/**
 * Class to represent a FEL request.
 */
export class FelStandardRequest {
  private command: FelStandardRequest.RequestType
  private tag: number

  constructor(data: Buffer) {
    this.command = FelStandardRequest.RequestType.getRequestType(data[0] | (data[1] * 0x100))
    this.tag = (data[2] | (data[3] * 0x100))
  }

  getData(): Buffer {
    const data: Buffer = Buffer.alloc(16)
    data[0] = (this.command & 0xFF)
    data[1] = ((this.command >> 8) & 0xFF)
    data[2] = (this.tag & 0xFF)
    data[3] = ((this.tag >> 8) & 0xFF)
    return data
  }
}

/**
 * Enum to represent a FEL mode request type.
 */
export module FelStandardRequest {
  export enum RequestType {
    /** Read length 32 => FelVerifyDeviceResponse */
    FEL_VERIFY_DEVICE = 0x1,

    FEL_SWITCH_ROLE = 0x2,

    /** Read length 8 */
    FEL_IS_READY = 0x3,

    FEL_GET_CMD_SET_VER = 0x4,

    FEL_DISCONNECT = 0x10,

    /** Write data to the device */
    FEL_DOWNLOAD = 0x101,

    /** Execute code */
    FEL_RUN = 0x102,

    /** Read data from the device */
    FEL_UPLOAD = 0x103
  }
  
  export module RequestType {
    export function getRequestType(value: number): RequestType {
      if (!Object.values(RequestType).includes(value))
        throw new TypeError("Given value is not a valid RequestType")

      return value;
    }
  }
}