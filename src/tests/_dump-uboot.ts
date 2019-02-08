import * as path from "path"
import * as fs from "fs"
import { Fel } from "../Fel"
import { FelConstants } from "../FelConstants"

var devices = Fel.findConnectedConsolesInFelMode()

async function run() {
  if (devices.length > 0) {
    var device = devices[0]
  
    device.open()
    device.loadFes1(path.resolve(path.join(__dirname, "fes1.bin")))
    device.loadUboot(path.resolve(path.join(__dirname, "uboot.bin")))
    var response = await device.readDeviceFlash(FelConstants.UBOOT_BASE_F, FelConstants.UBOOT_MAX_SIZE_F, console.log)
    fs.writeFileSync(path.join(__dirname, "ubootdump.bin"), response)
    return response
  }
}
run().then(console.log).catch(function(error: Error) {
  console.log(error.name, error.message, error.stack)
})