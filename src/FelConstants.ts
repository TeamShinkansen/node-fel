/**
 * Holds constants we need during FEL operations.
 */
export class FelConstants {
  //TODO: Double-check with C#
  static readonly FES1_TEST_SIZE: number = 0x80
  static readonly FES1_BASE_M: number = 0x2000
  static readonly DRAM_BASE: number = 0x40000000
  static readonly UBOOT_BASE_M: number = FelConstants.DRAM_BASE + 0x7000000
  static readonly UBOOT_BASE_F: number = 0x100000
  static readonly SECTOR_SIZE: number = 0x20000
  static readonly UBOOT_MAX_SIZE_F: number = (FelConstants.SECTOR_SIZE * 0x10)
  static readonly KERNEL_BASE_F: number = (FelConstants.SECTOR_SIZE * 0x30)
  static readonly KERNEL_MAX_SIZE: number = (FelConstants.SECTOR_SIZE * 0x20)
  static readonly TRANSFER_BASE_M: number = (FelConstants.DRAM_BASE + 0x7400000)
  static readonly TRANSFER_MAX_SIZE: number = (FelConstants.SECTOR_SIZE * 0x100)
  static readonly MAX_BULK_SIZE: number = 0x10000
  static readonly FASTBOOT: string = "efex_test"
}