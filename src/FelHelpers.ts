import { FelDevice } from "./FelDevice";
import { FelConstants } from "./FelConstants";
import { FelError } from "./FelError";
import { FelWriteVerifyError } from "./FelWriteVerifyError";
import { BootImageSizeError } from "./BootImageSizeError";

export class FelHelpers  {
   /**
    * Pads input buffer to the sector boundary.
    * @param input The buffer to pad
    */
  public static padToSectorBoundary(input: Buffer): Buffer {
    if (input.length % FelConstants.SECTOR_SIZE != 0) {
      var newBuf: Buffer = Buffer.alloc(Math.ceil(input.length / FelConstants.SECTOR_SIZE) * FelConstants.SECTOR_SIZE)
      input.copy(newBuf, 0, 0, input.length)
      return newBuf
    }
    return input
  }

  public static calculateBootImageSize(bootImage: Buffer): number {
    if (Buffer.from("ANDROID!", "ascii").compare(bootImage.slice(0, 8)) != 0) {
      throw new TypeError("Invalid boot image magic")
    }

    var kernel_size: number = (bootImage[8] | (bootImage[9] * 0x100) | (bootImage[10] * 0x10000) | (bootImage[11] * 0x1000000));
    var kernel_addr: number = (bootImage[12] | (bootImage[13] * 0x100) | (bootImage[14] * 0x10000) | (bootImage[15] * 0x1000000));
    var ramdisk_size: number = (bootImage[16] | (bootImage[17] * 0x100) | (bootImage[18] * 0x10000) | (bootImage[19] * 0x1000000));
    var ramdisk_addr: number = (bootImage[20] | (bootImage[21] * 0x100) | (bootImage[22] * 0x10000) | (bootImage[23] * 0x1000000));
    var second_size: number = (bootImage[24] | (bootImage[25] * 0x100) | (bootImage[26] * 0x10000) | (bootImage[27] * 0x1000000));
    var second_addr: number = (bootImage[28] | (bootImage[29] * 0x100) | (bootImage[30] * 0x10000) | (bootImage[31] * 0x1000000));
    var tags_addr: number = (bootImage[32] | (bootImage[33] * 0x100) | (bootImage[34] * 0x10000) | (bootImage[35] * 0x1000000));
    var page_size: number = (bootImage[36] | (bootImage[37] * 0x100) | (bootImage[38] * 0x10000) | (bootImage[39] * 0x1000000));
    var dt_size: number = (bootImage[40] | (bootImage[41] * 0x100) | (bootImage[42] * 0x10000) | (bootImage[43] * 0x1000000));
    var pages: number = 1;
    pages += (kernel_size + page_size - 1) / page_size;
    pages += (ramdisk_size + page_size - 1) / page_size;
    pages += (second_size + page_size - 1) / page_size;
    pages += (dt_size + page_size - 1) / page_size;
    return pages * page_size;
  }

  /**
   * Loads the specified boot image into memory and boots it.
   * @param device The fel device
   * @param bootImage The boot image buffer
   * @throws {BootImageSizeError | FelError}
   */
  public static async memboot(device: FelDevice, bootImage: Buffer, progressCallback?: FelDevice.ProgressCallback): Promise<void> {
    const bootImageSize = this.calculateBootImageSize(bootImage)

    if (bootImageSize > bootImage.length) {
      throw new BootImageSizeError("Invalid boot image")
    }

    if (bootImage.length > FelConstants.TRANSFER_MAX_SIZE) {
      throw new FelError("Boot image size exceeds the max transfer size")
    }

    await device.open()
    await device.writeDeviceMemory(FelConstants.TRANSFER_BASE_M, bootImage, progressCallback)
    await device.runUbootCommand(`boota ${FelConstants.TRANSFER_BASE_M.toString(16)}`, true, progressCallback)
  }

  /**
   * Writes the specified uboot to NAND
   * @param device The fel device
   * @param uboot The uboot
   * @param verifyWrite Whether to verify that the write was successful
   * @param progressCallback 
   * @throws {FelError | FelWriteVerifyError}
   */
  public static async writeUboot(device: FelDevice, uboot: Buffer, verifyWrite: boolean = false, progressCallback?: FelDevice.ProgressCallback): Promise<void> {
    uboot = await this.padToSectorBoundary(uboot)
    
    if (uboot.length > FelConstants.UBOOT_MAX_SIZE_F) {
      throw new FelError("Uboot is too large")
    }
    
    await device.open()
    await device.writeDeviceFlash(FelConstants.UBOOT_BASE_F, uboot, progressCallback)

    if (verifyWrite === true) {
      const data: Buffer = await device.readDeviceFlash(FelConstants.UBOOT_BASE_F, uboot.length, progressCallback)

      if (data.compare(uboot) != 0) {
        throw new FelWriteVerifyError("Could not verify the data that was written")
      }
    }
  }

  /**
   * Writes the specified boot image to NAND
   * @param device The fel device
   * @param bootImage The boot image buffer
   * @param verifyWrite Whether to verify that the write was successful
   * @param progressCallback 
   * @throws {FelError | FelWriteVerifyError}
   */
  public static async writeBootImage(device: FelDevice, bootImage: Buffer, verifyWrite: boolean = false, progressCallback?: FelDevice.ProgressCallback): Promise<void> {
    bootImage = await this.padToSectorBoundary(bootImage)

    if (bootImage.length > FelConstants.BOOT_IMAGE_MAX_SIZE) {
      throw new FelError("Boot image is too large")
    }

    await device.open()
    await device.writeDeviceFlash(FelConstants.BOOT_IMAGE_BASE_F, bootImage, progressCallback)

    if (verifyWrite === true) {
      const data: Buffer = await device.readDeviceFlash(FelConstants.BOOT_IMAGE_BASE_F, bootImage.length, progressCallback)

      if (data.compare(bootImage) != 0) {
        throw new FelWriteVerifyError("Could not verify the data that was written")
      }
    }
  }

  /**
   * Reads the uboot from NAND
   * @param device The fel device
   * @param progressCallback 
   */
  public static async readUboot(device: FelDevice, progressCallback?: FelDevice.ProgressCallback): Promise<Buffer> {
    await device.open()
    const uboot: Buffer = await device.readDeviceFlash(FelConstants.UBOOT_BASE_F, FelConstants.UBOOT_MAX_SIZE_F, progressCallback)
    return uboot
  }

  /**
   * Reads the boot image from NAND
   * @param device The fel device
   * @param progressCallback 
   * @throws {BootImageSizeError}
   */
  public static async readBootImage(device: FelDevice, progressCallback?: FelDevice.ProgressCallback): Promise<Buffer> {
    await device.open()
    const bootImage = await device.readDeviceFlash(FelConstants.BOOT_IMAGE_BASE_F, FelConstants.BOOT_IMAGE_MAX_SIZE, progressCallback)
    const bootImageSize = this.calculateBootImageSize(bootImage)

    if (bootImageSize > bootImage.length) {
      throw new BootImageSizeError("Incomplete boot image")
    }

    return bootImage.slice(0, bootImageSize)
  }
}