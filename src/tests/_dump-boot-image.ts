import * as path from "path"
import * as fs from "fs"
import { Fel } from "../Fel"
import { FelHelpers } from "../FelHelpers";

var devices = Fel.findConnectedConsolesInFelMode()

async function run() {
  if (devices.length > 0) {
    var device = devices[0]
  
    device.open()
    device.loadFes1(path.resolve(path.join(__dirname, "..", "..", "src", "tests", "fes1.bin")))
    device.loadUboot(path.resolve(path.join(__dirname, "..", "..", "src", "tests", "uboot.bin")))
    var response = await FelHelpers.readBootImage(device, console.log)
    fs.writeFileSync(path.join(__dirname, "..", "..", "src", "tests", "bootimagedump.bin"), response)
  }
}
run().then(console.log).catch(function(error: Error) {
  console.log(error.name, error.message, error.stack)
})