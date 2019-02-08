import * as usb from "usb"

export module DevicePromises {
  /**
   * Perform a control transfer with `libusb_control_transfer`.
   *
   * Parameter `data_or_length` can be a integer length for an IN transfer, or a Buffer for an out transfer. The type must match the direction specified in the MSB of bmRequestType.
   *
   * The `data` parameter of the callback is always undefined for OUT transfers, or will be passed a Buffer for IN transfers.
   *
   * The device must be open to use this method.
   * @param device 
   * @param bmRequestType 
   * @param bRequest 
   * @param wValue 
   * @param wIndex 
   * @param data_or_length 
   */
  export function controlTransfer(device: usb.Device, bmRequestType: number, bRequest: number, wValue: number, wIndex: number, data_or_length: any): Promise<Buffer> {
    return new Promise(function(resolve, reject) {
      device.controlTransfer(bmRequestType, bmRequestType, wValue, wIndex, data_or_length, function(error, buf) {
        if (error != null) {
          reject(error)
          return
        }

        resolve(buf)
      })
    })
  }

  /**
   * Perform a control transfer to retrieve a string descriptor
   *
   * The device must be open to use this method.
   * @param device 
   * @param desc_index 
   */
  export function getStringDescriptor(device: usb.Device, desc_index: number): Promise<Buffer> {
    return new Promise(function(resolve, reject) {
      device.getStringDescriptor(desc_index, function(error, buf) {
        if (error != null) {
          reject(error)
          return
        }

        resolve(buf)
      })
    })
  }

  /**
   * Perform a control transfer to retrieve an object with properties for the fields of the Binary Object Store descriptor.
   *
   * The device must be open to use this method.
   * @param device 
   */
  export function getBosDescriptor(device: usb.Device): Promise<usb.BosDescriptor> {
    return new Promise(function(resolve, reject) {
      device.getBosDescriptor(function(error, descriptor) {
        if (error != null) {
          reject(error)
          return
        }

        resolve(descriptor)
      })
    })
  }

  /**
   * Retrieve a list of Capability objects for the Binary Object Store capabilities of the device.
   *
   * The device must be open to use this method.
   * @param device 
   */
  export function getCapabilities(device: usb.Device): Promise<usb.Capability[]> {
    return new Promise(function(resolve, reject) {
      device.getCapabilities(function(error, capabilities) {
        if (error != null) {
          reject(error)
          return
        }

        resolve(capabilities)
      })
    })
  }

  /**
   * Set the device configuration to something other than the default (0). To use this, first call `.open(false)` (which tells it not to auto configure),
   * then before claiming an interface, call this method.
   *
   * The device must be open to use this method.
   * @param device 
   * @param desired 
   */
  export function setConfiguration(device: usb.Device, desired: number): Promise<void> {
    return new Promise(function(resolve, reject) {
      device.setConfiguration(desired, function(error) {
        if (error != null) {
          reject(error)
          return
        }

        resolve()
      })
    })
  }

  /**
   * Performs a reset of the device. Callback is called when complete.
   *
   * The device must be open to use this method.
   * @param device 
   */
  export function reset(device: usb.Device): Promise<void> {
    return new Promise(function(resolve, reject) {
      device.reset(function(error) {
        if (error != null) {
          reject(error)
          return
        }

        resolve()
      })
    })
  }

}

export module InterfacePromises {
  /**
   * Releases the interface and resets the alternate setting. Calls callback when complete.
   *
   * It is an error to release an interface with pending transfers. If the optional closeEndpoints
   * parameter is true, any active endpoint streams are stopped (see `Endpoint.stopStream`),
   * and the interface is released after the stream transfers are cancelled. Transfers submitted
   * individually with `Endpoint.transfer` are not affected by this parameter.
   *
   * The device must be open to use this method.
   * @param iface 
   * @param closeEndpoints 
   */
  export function release(iface: usb.Interface, closeEndpoints?: boolean): Promise<void> {
    return new Promise(function(resolve, reject) {
      if (closeEndpoints != null) {
        iface.release(closeEndpoints, function(error) {
          if (error != null) {
            reject(error)
            return
          }

          resolve()
        })
      } else {
        iface.release(function(error) {
          if (error != null) {
            reject(error)
            return
          }

          resolve()
        })
      }
    })
  }

  /**
   * Sets the alternate setting. It updates the `interface.endpoints` array to reflect the endpoints found in the alternate setting.
   *
   * The device must be open to use this method.
   * @param iface 
   * @param altSetting 
   */
  export function setAltSetting(iface: usb.Interface, altSetting: number): Promise<void> {
    return new Promise(function(resolve, reject) {
      iface.setAltSetting(altSetting, function(error) {
        if (error != null) {
          reject(error)
          return
        }

        resolve()
      })
    })
  }

}

export module EndpointPromises {
  

}

export module InEndpointPromises {
  /**
   * Perform a transfer to read data from the endpoint.
   *
   * If length is greater than maxPacketSize, libusb will automatically split the transfer in multiple packets, and you will receive one callback with all data once all packets are complete.
   *
   * `this` in the callback is the InEndpoint object.
   *
   * The device must be open to use this method.
   * @param endpoint 
   * @param length 
   * @param callback 
   */
  export function transfer(endpoint: usb.InEndpoint, length: number): Promise<{
    endpoint: usb.InEndpoint,
    buffer: Buffer
  }> {
    return new Promise(function(resolve, reject) {
      endpoint.transfer(length, function(error, data) {
        if (error != null) {
          reject(error)
          return
        }

        resolve({
          endpoint: endpoint,
          buffer: data
        })
      })
    })
  }

  /**
   * Start polling the endpoint.
   *
   * The library will keep `nTransfers` transfers of size `transferSize` pending in the kernel at all times to ensure continuous data flow.
   * This is handled by the libusb event thread, so it continues even if the Node v8 thread is busy. The `data` and `error` events are emitted as transfers complete.
   *
   * The device must be open to use this method.
   * @param endpoint 
   */
  export function stopPoll(endpoint: usb.InEndpoint): Promise<void> {
    return new Promise(function(resolve, reject) {
      endpoint.stopPoll(resolve)
    })
  }

}

export module OutEndpointPromises {
  /**
   * Perform a transfer to write `data` to the endpoint.
   *
   * If length is greater than maxPacketSize, libusb will automatically split the transfer in multiple packets, and you will receive one callback once all packets are complete.
   *
   * `this` in the callback is the OutEndpoint object.
   *
   * The device must be open to use this method.
   * @param endpoint 
   * @param buffer 
   */
  export function transfer(endpoint: usb.OutEndpoint, buffer: Buffer): Promise<usb.OutEndpoint> {
    return new Promise(function(resolve, reject) {
      endpoint.transfer(buffer, function(error) {
        if (error != null) {
          reject(error)
          return
        }

        resolve(endpoint)
      })
    })
  }

  export function transferWithZLP(endpoint: usb.OutEndpoint, buf: Buffer): Promise<void> {
    return new Promise(function(resolve, reject) {
      endpoint.transferWithZLP(buf, function(error) {
        if (error != null) {
          reject(error)
          return
        }

        resolve()
      })
    })
  }

}