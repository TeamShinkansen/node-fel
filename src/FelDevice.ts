import * as usb from "usb"
import * as USBPromises from "./_UsbPromises"
import { Fel } from "./Fel"
import { FelStandardRequest } from "./FelStandardRequest";
import { AwUsbRequest } from "./AwUsbRequest";
import { AwUsbResponse } from "./AwUsbResponse";
import { FelError } from "./FelError";
import * as fs from "fs"
import { FelMessage } from "./FelMessage";
import { FelConstants } from "./FelConstants";
import { FelStatusResponse } from "./FelStatusResponse";
import { AwVerifyDeviceResponse } from "./AwVerifyDeviceResponse";

/**
 * Class to represent a connected USB device in FEL mode.
 */
export class FelDevice {
  /** The USB device */
  private device: usb.Device

  /** The claimed USB FEL interface */
  private iface: usb.Interface

  /** The endpoint to read from the USB device */
  private inEndpoint: usb.InEndpoint

  /** The endpoint to write to the USB device */
  private outEndpoint: usb.OutEndpoint

  /** The binary for fes1.bin */
  private fes1Bin: Buffer = Buffer.alloc(0)

  /** The binary for uboot.bin */
  private ubootBin: Buffer = Buffer.alloc(0)

  /** Says whether or not the DRAM is initialized */
  private dramInitialized: boolean = false

  /** Uboot command offset */
  private commandOffset: number = 0

  /**
   * Constructs a new FEL device.
   * @param device 
   * @param iface 
   * @param inEndpoint 
   * @param outEndpoint 
   */
  constructor(device: usb.Device, iface: usb.Interface, inEndpoint: usb.InEndpoint, outEndpoint: usb.OutEndpoint){
    this.device = device
    this.iface = iface
    this.inEndpoint = inEndpoint;
    this.outEndpoint = outEndpoint
  }

  /**
   * Opens the FEL device. When you are finished communicating with the device, you should call the close() method.
   */
  public async open(): Promise<void> {
    this.device.open()
    this.iface.claim()

    console.log("Trying to verify device")
    // var verification: VerifyDeviceResponse = await this.verifyDevice()

    // if (verification.board != 0x00166700) {
    //   throw new FelError(`Invalid board ID: ${verification.board}`)
    // }
  }

  /**
   * Closes the FEL device
   */
  public async close(): Promise<void> {
    await USBPromises.DevicePromises.reset(this.device)
    await USBPromises.InterfacePromises.release(this.iface, true)
    this.device.close()
  }

  /**
   * Loads the uboot into memory.
   * @param ubootPath 
   */
  public async loadUboot(ubootPath: string): Promise<void> {
    var ubootBin = fs.readFileSync(ubootPath)
    if (ubootBin instanceof Buffer) {
      this.setUbootBin(ubootBin)
    } else {
      throw new Error(`"${ubootPath}" does not exist`)
    }
  }

  /**
   * Loads the fes1 into memory.
   * @param fes1Path 
   */
  public loadFes1(fes1Path: string): void {
    var fes1Bin = fs.readFileSync(fes1Path)
    if (fes1Bin instanceof Buffer) {
      this.setFes1Bin(fes1Bin)
    } else {
      throw new Error(`"${fes1Path}" does not exist`)
    }
  }

  public isUbootLoaded(): boolean {
    return this.ubootBin.length > 0
  }

  public isFes1Loaded(): boolean {
    return this.fes1Bin.length > 0
  }

  /**
   * Sends data directly to the USB interface for the FEL device
   * @param buffer 
   */
  public async writeToUSB(buffer: Buffer): Promise<void> {
    await USBPromises.OutEndpointPromises.transfer(this.outEndpoint, buffer)
    console.log(`FEL -> ${buffer.length} bytes`)
  }

  /**
   * Reads data directly from the USB interface.
   * @param length The amount of bytes to read
   */
  public async readFromUSB(length: number): Promise<Buffer> {
    var output = await USBPromises.InEndpointPromises.transfer(this.inEndpoint, length)
    console.log(`FEL <- ${output.buffer.length} bytes`)
    return output.buffer
  }

  /**
   * Writes data to the FEL device.
   * @param buffer
   */
  public async felWrite(buffer: Buffer): Promise<void> {
    const req: AwUsbRequest = new AwUsbRequest()
    req.setCommand(AwUsbRequest.RequestType.AW_USB_WRITE)
    req.setLen(buffer.length)
    await this.writeToUSB(req.getData())
    await this.writeToUSB(buffer)
    const rawResp: Buffer = await this.readFromUSB(13)
    const resp = new AwUsbResponse(rawResp)

    if (resp.getCswStatus() !== 0) {
      throw new FelError("FEL write error")
    }
  }

  /**
   * Reads data from the FEL device.
   * @param length length The length of data to read.
   * @returns A Buffer of the given length containing data from the FEL device.
   */
  public async felRead(length: number): Promise<Buffer> {
    const req: AwUsbRequest = new AwUsbRequest()
    req.setCommand(AwUsbRequest.RequestType.AW_USB_READ)
    req.setLen(length)
    await this.writeToUSB(req.getData())

    const result: Buffer = await this.readFromUSB(length)
    const rawResp: Buffer = await this.readFromUSB(13)
    const resp: AwUsbResponse = new AwUsbResponse(rawResp)

    if (resp.getCswStatus() != 0) {
      throw new FelError("FEL read error")
    }

    return result
  }

  /**
   * Send a FEL request to the device
   * @param command The command to send
   * @param address The address to set on the command
   * @param length The length to set on the command
   */
  public async felRequest(command: FelStandardRequest.RequestType, address?: number, length?: number): Promise<void> {
    const req: FelMessage = new FelMessage()
    req.setCommand(command)
    if (typeof(address) == "number") {
      req.setAddress(address)
    }
    if (typeof(length) == "number") {
      req.setLength(length)
    }
    await this.felWrite(req.getData())
  }

  /**
   * Initializes the system DRAM once fes1 and uboot have been loaded.
   * @returns Whether or not the DRAM was initialized
   */
  public async initializeDRAM(): Promise<boolean> {
    if (this.dramInitialized) {
      return true
    }

    if (this.fes1Bin == null || this.fes1Bin.length < FelConstants.FES1_TEST_SIZE) {
      throw new FelError("Can't initialize DRAM, incorrect fes1.bin")
    }

    const buf: Buffer = await this.readDeviceMemory((FelConstants.FES1_BASE_M + this.fes1Bin.length - FelConstants.FES1_TEST_SIZE), FelConstants.FES1_TEST_SIZE)
    const buf2: Buffer = Buffer.alloc(FelConstants.FES1_TEST_SIZE)
    this.fes1Bin.slice(this.fes1Bin.length - FelConstants.FES1_TEST_SIZE, this.fes1Bin.length).copy(buf2, 0)

    // check to see if we've already initialized DRAM
    if (buf.compare(buf2) === 0) {
      this.dramInitialized = true
      return true
    }

    await this.writeDeviceMemory(FelConstants.FES1_BASE_M, this.fes1Bin)
    await this.execute(FelConstants.FES1_BASE_M)

    await new Promise(resolve => setTimeout(resolve, 2000))

    this.dramInitialized = true
    return true
  }

  public async verifyDevice(): Promise<AwVerifyDeviceResponse> {
    //TODO: fixme
    await this.felRequest(FelStandardRequest.RequestType.FEL_VERIFY_DEVICE)
    var resp: Buffer
    try {
      resp = await this.felRead(32)
    } catch {
      resp = Buffer.alloc(32)
    }
    var rawStatus = await this.felRead(8)
    var status: FelStatusResponse = new FelStatusResponse(rawStatus)
    return new AwVerifyDeviceResponse(resp) 
  }

  /**
   * Writes data directly to the FEL device's memory.
   * @param address The address to write to
   * @param buffer The data to write to memory
   */
  public async writeDeviceMemory(address: number, buffer: Buffer, progressCallback?: (bytesTransferred: number, totalBytes: number, address: number)=>void): Promise<void> {
    if ( address >= FelConstants.DRAM_BASE) {
      await this.initializeDRAM()
    }

    var length: number = buffer.length
    if (length != (length & ~3)) {
      length = (length + 3) & ~3
      const newBuffer: Buffer = Buffer.alloc(length)
      buffer.copy(newBuffer)
      buffer = newBuffer
    }

    var pos: number = 0
    while (pos < buffer.length) {
      const buf: Buffer = Buffer.alloc(Math.min(buffer.length - pos, FelConstants.MAX_BULK_SIZE))
      buffer.slice(pos, pos + buf.length).copy(buf)
      await this.felRequest(FelStandardRequest.RequestType.FEL_DOWNLOAD, address + pos, buf.length)
      await this.felWrite(buf)
      const rawStatus: Buffer = await this.felRead(8)
      const status: FelStatusResponse = new FelStatusResponse(rawStatus)

      if (status.getState() != 0) {
        throw new FelError("FEL write error")
      }

      pos += buf.length

      if (typeof(progressCallback) == "function") {
        progressCallback(pos, buffer.length, address)
      }
    }
  }

  /**
   * Read data directly from the FEL device's memory.
   * @param address The address to read from
   * @param length The length of data to read
   * @returns A Buffer representing the data at the given address of the given length
   */
  public async readDeviceMemory(address: number, length: number, progressCallback?: (bytesTransferred: number, totalBytes: number, address: number)=>void): Promise<Buffer> {
    if (address > FelConstants.DRAM_BASE) {
      await this.initializeDRAM()
    }

    length = (length + 3) & ~3
    var result: Buffer[] = []

    const initialLength = length
    const initialAddress = address

    while(length > 0) {
      var l: number = Math.min(length, FelConstants.MAX_BULK_SIZE)
      await this.felRequest(FelStandardRequest.RequestType.FEL_UPLOAD, address, l)
      const r: Buffer = await this.felRead(l)

      result.push(r)

      const rawStatus: Buffer = await this.felRead(8)
      const status: FelStatusResponse = new FelStatusResponse(rawStatus)
      if (status.getState() != 0) {
        throw new FelError("FEL read error")
      }

      length -= l
      address += l

      if (typeof(progressCallback) == "function") {
        progressCallback(initialLength - length, initialLength, initialAddress)
      }
    }

    return Buffer.concat(result)
  }

  /**
   * Reads the device NAND memory
   * @param address 
   * @param length 
   */
  public async readDeviceFlash(address: number, length: number, progressCallback?: (bytesTransferred: number, totalBytes: number, address: number)=>void): Promise<Buffer> {
    var result: Buffer[] = []
    const inputLength: number = length
    
    if ((address % FelConstants.SECTOR_SIZE) != 0) {
      throw new FelError(`Invalid flash address: 0x${address.toString(16).toUpperCase()}`)
    }

    if ((length % FelConstants.SECTOR_SIZE) != 0) {
      throw new FelError(`Invalid flash length: 0x${length.toString(16).toUpperCase()}`)
    }

    while (length > 0) {
      const requestLength: number = Math.min(length, FelConstants.TRANSFER_MAX_SIZE)
      const command = `sunxi_flash phy_read ${FelConstants.TRANSFER_BASE_M.toString(16)} ${(address / FelConstants.SECTOR_SIZE).toString(16)} ${(Math.floor(requestLength / FelConstants.SECTOR_SIZE)).toString(16)};${FelConstants.FASTBOOT}`
      await this.runUbootCmd(command, false, progressCallback)
      await new Promise((resolve) => setTimeout(resolve, 500))
      const buf = await this.readDeviceMemory(FelConstants.TRANSFER_BASE_M + address % FelConstants.SECTOR_SIZE, requestLength, progressCallback)
      
      result.push(buf)
      address += buf.length
      length -= buf.length
    }

    return Buffer.concat(result)
  }

  /**
   * Runs the given uboot command
   * @param command The uboot command to run
   * @param noReturn Whether or not to check for FEL connectivity afterward
   */
  public async runUbootCmd(command: string, noReturn: boolean, progressCallback?: (bytesTransferred: number, totalBytes: number, address: number)=>void): Promise<void> {
    if (this.commandOffset <= 0) {
      throw new TypeError("Invalid uboot binary, boot command not found")
    }

    console.log(`Running uboot command: ${command}`)

    const testSize: number = 0x20
    if (this.ubootBin == null || this.ubootBin.length < testSize) {
      throw new FelError("Can't init uboot, incorrect uboot binary")
    }

    const buf: Buffer = await this.readDeviceMemory(FelConstants.UBOOT_BASE_M, testSize)
    const buf2: Buffer = this.ubootBin.slice(0, testSize)

    if (buf.compare(buf2) != 0) {
      await this.writeDeviceMemory(FelConstants.UBOOT_BASE_M, this.ubootBin, progressCallback)
    }

    const cmdBuff: Buffer = Buffer.from(command + "\0", "ascii")
    await this.writeDeviceMemory(FelConstants.UBOOT_BASE_M + this.commandOffset, cmdBuff)
    await this.execute(FelConstants.UBOOT_BASE_M)

    if (noReturn) {
      return
    }

    for (var i: number = 0; i < 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 500))
      // Running command...
    }

    await this.close()

    var errorCount: number = 0
    while (true) {
      var devices: FelDevice[] = Fel.findConnectedConsolesInFelMode()
      if (devices.length == 0) {
        errorCount++

        if (errorCount >= 10) {
          await this.close()
          throw new FelError("No answer from device")
        }

        await new Promise(resolve => setTimeout(resolve, 2000))
      } else {
        this.device = devices[0].device
        this.iface = devices[0].iface
        this.inEndpoint = devices[0].inEndpoint
        this.outEndpoint = devices[0].outEndpoint
        await this.open()
        break
      }
    }
  }

  /**
   * Executes the code at the given address.
   * @param address The address to jump to.
   */
  public async execute(address: number): Promise<void> {
    await this.felRequest(FelStandardRequest.RequestType.FEL_RUN, address, 0)
    const rawStatus: Buffer = await this.felRead(8)
    const status: FelStatusResponse = new FelStatusResponse(rawStatus)

    if (status.getState() != 0) {
      throw new FelError("FEL execution error")
    }
  }

  /**
   * Gets the FES1 binary data.
   * @returns The FES1 binary data
   */
  public getFes1Bin(): Buffer {
    return this.fes1Bin
  }

  /**
   * Sets the FES1 binary data
   * @param fes1Bin The FES1 binary data
   */
  public setFes1Bin(fes1Bin: Buffer): void {
    this.fes1Bin = fes1Bin
  }

  /**
   * Gets the uboot binary data
   * @returns The uboot binary data
   */
  public getUbootBin(): Buffer {
    return this.ubootBin
  }

  /**
   * Sets the uboot binary data
   * @param ubootBin The uboot binary data
   */
  public setUbootBin(ubootBin: Buffer): void {
    this.ubootBin = ubootBin

    // find the command offset in the uboot binary
    const prefix: Buffer = Buffer.from("bootcmd=", "ascii")
    for(var i: number = 0; i < ubootBin.length - prefix.length; i++) {
      if (ubootBin.slice(i, i + prefix.length).compare(prefix) === 0) {
        this.commandOffset = i + prefix.length
        break
      }
    }
  }
}