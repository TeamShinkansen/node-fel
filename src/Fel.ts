import * as usb from "usb";
import { FelDevice } from "./FelDevice";

/**
 * Class to help with top-level FEL mode interactions.
 */
export class Fel {
  /**
   * The USB vendor ID for Allwinner FEL devices
   */
  public static readonly USB_VENDOR_ID: number = 0x1F3A;

  /**
   * The USB product ID for Allwinner FEL devices
   */
  public static readonly USB_PRODUCT_ID: number = 0xEFE8;

  /**
   * Returns the list of all available FEL devices.
   * @returns The list of available FEL devices.
   */
  public static findConnectedConsolesInFelMode(): FelDevice[] {
    var devices: FelDevice[] = [];

    usb.getDeviceList().forEach(device => {
      var felDev = this.checkDevice(device)

      if (felDev instanceof FelDevice) {
        devices.push(felDev)
      }
    });
    
    return devices;
  }

  private static checkDevice(device: usb.Device): FelDevice | undefined {
    var felDev: FelDevice | undefined = undefined

    // Ignore devices with the wrong VID/PID
    if (!this.isUsbDeviceNintendoSystem(device))
      return undefined;
    
    // Check interfaces of device
    try {
      device.open()
    
      device.interfaces.forEach(iface => {
        const endpoints: usb.Endpoint[] = iface.endpoints
  
        // Ignore interface if it does not have two endpoints
        if (endpoints.length != 2){
          return
        }
  
        const ed1 = endpoints[0]
        const ed2 = endpoints[1]
  
        // Ignore the interface if endpoints are not bulk endpoints
        if (((ed1.transferType & usb.LIBUSB_TRANSFER_TYPE_BULK) == 0) || ((ed2.transferType & usb.LIBUSB_TRANSFER_TYPE_BULK) == 0)) {
          return
        }
  
        // Determine which endpoint is in and which is out.
        // If both endpoints are in or out, then ignore the interface
        var inEndpoint: usb.InEndpoint
        var outEndpoint: usb.OutEndpoint
  
        if (ed1.direction == "in" && ed2.direction == "out") {
          inEndpoint = <usb.InEndpoint>ed1
          outEndpoint = <usb.OutEndpoint>ed2
        } else if (ed1.direction == "out" && ed2.direction == "in") {
          outEndpoint = <usb.OutEndpoint>ed1
          inEndpoint = <usb.InEndpoint>ed2
        } else {
          return
        }
  
        felDev = new FelDevice(device, iface, inEndpoint, outEndpoint)
      });
    } finally {
      try {
        device.close()
      } catch {}
    }
    
    return felDev
  }

  /**
   * Says whether or not the given USB device is a Nintendo Classic system connected in FEL mode.
   */
  private static isUsbDeviceNintendoSystem(device: usb.Device): boolean {
    if (!(device instanceof usb.Device))
      throw new TypeError("Not a valid USB device object")

    return (device.deviceDescriptor.idProduct == this.USB_PRODUCT_ID && device.deviceDescriptor.idVendor == this.USB_VENDOR_ID)
  }


}
