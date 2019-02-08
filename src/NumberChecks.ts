export function checkRange(input: number, min: number, max: number, name: string = "Object"): number {
  if (typeof(input) != "number") {
    throw new TypeError(`${name} is not a number`)
  }

  if (input > max || input < min) {
    throw new RangeError(`${name} is out of range (${min}-${max})`)
  }

  return input
}

export function checkInt8(input: number, name: string): number {
  return checkRange(input, -128, 127, name)
}

export function checkUint8(input: number, name: string): number {
  return checkRange(input, 0, 255, name)
}

export function checkInt16(input: number, name: string): number {
  return checkRange(input, -32768, 32767, name)
}

export function checkUint16(input: number, name: string): number {
  return checkRange(input, 0, 65535, name)
}

export function checkInt32(input: number, name: string): number {
  return checkRange(input, -2147483648, 2147483647, name)
}

export function checkUint32(input: number, name: string): number {
  return checkRange(input, 0, 4294967295, name)
}

