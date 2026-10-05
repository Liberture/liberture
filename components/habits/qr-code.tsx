"use client"

import { useTranslations } from "@/components/i18n/locale-provider"

interface QrCodeProps {
  value: string
  className?: string
  title?: string
}

const TOTAL_CODEWORDS = [
  0, 26, 44, 70, 100, 134, 172, 196, 242, 292, 346, 404, 466, 532, 581, 655,
  733, 815, 901, 991, 1085, 1156, 1258, 1364, 1474, 1588, 1706, 1828, 1921,
  2051, 2185, 2323, 2465, 2611, 2761, 2876, 3034, 3196, 3362, 3532, 3706,
]

const LOW_ECC_CODEWORDS_PER_BLOCK = [
  0, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30,
  28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
  30, 30, 30,
]

const LOW_ERROR_CORRECTION_BLOCKS = [
  0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9,
  10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25,
]

function appendBits(bits: number[], value: number, length: number) {
  for (let i = length - 1; i >= 0; i--) {
    bits.push((value >>> i) & 1)
  }
}

function getByteModeCharCountBits(version: number): number {
  if (version <= 9) return 8
  if (version <= 26) return 16
  return 16
}

function getDataCodewordCount(version: number): number {
  return (
    TOTAL_CODEWORDS[version] -
    LOW_ECC_CODEWORDS_PER_BLOCK[version] * LOW_ERROR_CORRECTION_BLOCKS[version]
  )
}

function chooseVersion(byteLength: number): number {
  for (let version = 1; version <= 40; version++) {
    const neededBits = 4 + getByteModeCharCountBits(version) + byteLength * 8
    if (neededBits <= getDataCodewordCount(version) * 8) {
      return version
    }
  }
  throw new Error("QR code data is too long")
}

function encodeDataCodewords(value: string, version: number): number[] {
  const bytes = Array.from(new TextEncoder().encode(value))
  const dataCodewordCount = getDataCodewordCount(version)
  const capacityBits = dataCodewordCount * 8
  const bits: number[] = []

  appendBits(bits, 0b0100, 4)
  appendBits(bits, bytes.length, getByteModeCharCountBits(version))
  for (const byte of bytes) appendBits(bits, byte, 8)

  const terminatorLength = Math.min(4, capacityBits - bits.length)
  appendBits(bits, 0, terminatorLength)
  while (bits.length % 8 !== 0) bits.push(0)

  const codewords: number[] = []
  for (let i = 0; i < bits.length; i += 8) {
    let codeword = 0
    for (let j = 0; j < 8; j++) codeword = (codeword << 1) | bits[i + j]
    codewords.push(codeword)
  }

  for (let pad = 0xec; codewords.length < dataCodewordCount; pad ^= 0xec ^ 0x11) {
    codewords.push(pad)
  }

  return codewords
}

function gfMultiply(x: number, y: number): number {
  let z = 0
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d)
    z ^= ((y >>> i) & 1) * x
  }
  return z & 0xff
}

function gfPow(x: number, power: number): number {
  let result = 1
  for (let i = 0; i < power; i++) result = gfMultiply(result, x)
  return result
}

function reedSolomonDivisor(degree: number): number[] {
  let result = [1]
  for (let i = 0; i < degree; i++) {
    const next = new Array(result.length + 1).fill(0)
    const root = gfPow(2, i)
    for (let j = 0; j < result.length; j++) {
      next[j] ^= result[j]
      next[j + 1] ^= gfMultiply(result[j], root)
    }
    result = next
  }
  return result
}

function reedSolomonRemainder(data: number[], degree: number): number[] {
  const divisor = reedSolomonDivisor(degree)
  const result = data.concat(new Array(degree).fill(0))

  for (let i = 0; i < data.length; i++) {
    const factor = result[i]
    if (factor === 0) continue
    for (let j = 0; j < divisor.length; j++) {
      result[i + j] ^= gfMultiply(divisor[j], factor)
    }
  }

  return result.slice(data.length)
}

function addErrorCorrection(dataCodewords: number[], version: number): number[] {
  const rawCodewords = TOTAL_CODEWORDS[version]
  const blockCount = LOW_ERROR_CORRECTION_BLOCKS[version]
  const eccLength = LOW_ECC_CODEWORDS_PER_BLOCK[version]
  const shortBlockCount = blockCount - (rawCodewords % blockCount)
  const shortDataLength = Math.floor(rawCodewords / blockCount) - eccLength
  const blocks: Array<{ data: number[]; ecc: number[] }> = []
  let offset = 0

  for (let i = 0; i < blockCount; i++) {
    const dataLength = shortDataLength + (i >= shortBlockCount ? 1 : 0)
    const data = dataCodewords.slice(offset, offset + dataLength)
    offset += dataLength
    blocks.push({ data, ecc: reedSolomonRemainder(data, eccLength) })
  }

  const result: number[] = []
  const maxDataLength = Math.max(...blocks.map((block) => block.data.length))
  for (let i = 0; i < maxDataLength; i++) {
    for (const block of blocks) {
      if (i < block.data.length) result.push(block.data[i])
    }
  }
  for (let i = 0; i < eccLength; i++) {
    for (const block of blocks) result.push(block.ecc[i])
  }

  return result
}

function alignmentPatternPositions(version: number): number[] {
  if (version === 1) return []
  const size = version * 4 + 17
  const count = Math.floor(version / 7) + 2
  const step =
    version === 32
      ? 26
      : Math.ceil((version * 4 + 4) / (count * 2 - 2)) * 2
  const result = [6]

  for (let pos = size - 7; result.length < count; pos -= step) {
    result.splice(1, 0, pos)
  }

  return result
}

function getBchCode(value: number, generator: number, degree: number): number {
  let result = value << degree
  for (let i = Math.floor(Math.log2(result)); i >= degree; i--) {
    if (((result >>> i) & 1) !== 0) result ^= generator << (i - degree)
  }
  return (value << degree) | result
}

function makeQrMatrix(value: string): boolean[][] {
  const bytes = new TextEncoder().encode(value)
  const version = chooseVersion(bytes.length)
  const size = version * 4 + 17
  const matrix = Array.from({ length: size }, () => new Array(size).fill(false))
  const isFunction = Array.from({ length: size }, () => new Array(size).fill(false))

  const setFunction = (x: number, y: number, dark: boolean) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return
    matrix[y][x] = dark
    isFunction[y][x] = true
  }

  const setModule = (x: number, y: number, dark: boolean) => {
    matrix[y][x] = dark
  }

  const drawFinderPattern = (left: number, top: number) => {
    for (let y = -1; y <= 7; y++) {
      for (let x = -1; x <= 7; x++) {
        const xx = left + x
        const yy = top + y
        const max = Math.max(Math.abs(x - 3), Math.abs(y - 3))
        setFunction(xx, yy, max !== 2 && max !== 4)
      }
    }
  }

  const drawAlignmentPattern = (centerX: number, centerY: number) => {
    for (let y = -2; y <= 2; y++) {
      for (let x = -2; x <= 2; x++) {
        const max = Math.max(Math.abs(x), Math.abs(y))
        setFunction(centerX + x, centerY + y, max === 0 || max === 2)
      }
    }
  }

  drawFinderPattern(0, 0)
  drawFinderPattern(size - 7, 0)
  drawFinderPattern(0, size - 7)

  for (let i = 0; i < size; i++) {
    if (!isFunction[6][i]) setFunction(i, 6, i % 2 === 0)
    if (!isFunction[i][6]) setFunction(6, i, i % 2 === 0)
  }

  for (const y of alignmentPatternPositions(version)) {
    for (const x of alignmentPatternPositions(version)) {
      if (!isFunction[y][x]) drawAlignmentPattern(x, y)
    }
  }

  for (let i = 0; i < 9; i++) {
    if (i !== 6) {
      setFunction(8, i, false)
      setFunction(i, 8, false)
    }
  }
  for (let i = 0; i < 8; i++) {
    setFunction(size - 1 - i, 8, false)
    setFunction(8, size - 1 - i, false)
  }
  setFunction(8, size - 8, true)

  if (version >= 7) {
    for (let i = 0; i < 18; i++) {
      setFunction(size - 11 + (i % 3), Math.floor(i / 3), false)
      setFunction(Math.floor(i / 3), size - 11 + (i % 3), false)
    }
  }

  const codewords = addErrorCorrection(encodeDataCodewords(value, version), version)
  let bitIndex = 0
  let upward = true

  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right--
    for (let vertical = 0; vertical < size; vertical++) {
      const y = upward ? size - 1 - vertical : vertical
      for (let column = 0; column < 2; column++) {
        const x = right - column
        if (isFunction[y][x]) continue
        const bit =
          bitIndex < codewords.length * 8
            ? ((codewords[bitIndex >>> 3] >>> (7 - (bitIndex & 7))) & 1) !== 0
            : false
        const masked = bit !== ((x + y) % 2 === 0)
        setModule(x, y, masked)
        bitIndex++
      }
    }
    upward = !upward
  }

  const formatBits = getBchCode((1 << 3) | 0, 0x537, 10) ^ 0x5412
  const formatBit = (i: number) => ((formatBits >>> i) & 1) !== 0

  for (let i = 0; i <= 5; i++) setFunction(8, i, formatBit(i))
  setFunction(8, 7, formatBit(6))
  setFunction(8, 8, formatBit(7))
  setFunction(7, 8, formatBit(8))
  for (let i = 9; i < 15; i++) setFunction(14 - i, 8, formatBit(i))
  for (let i = 0; i < 8; i++) setFunction(size - 1 - i, 8, formatBit(i))
  for (let i = 8; i < 15; i++) setFunction(8, size - 15 + i, formatBit(i))
  setFunction(8, size - 8, true)

  if (version >= 7) {
    const versionBits = getBchCode(version, 0x1f25, 12)
    for (let i = 0; i < 18; i++) {
      const bit = ((versionBits >>> i) & 1) !== 0
      setFunction(size - 11 + (i % 3), Math.floor(i / 3), bit)
      setFunction(Math.floor(i / 3), size - 11 + (i % 3), bit)
    }
  }

  return matrix
}

export function QrCode({ value, className, title }: QrCodeProps) {
  const t = useTranslations().habits.app.qrCode
  const matrix = makeQrMatrix(value)
  const quietZone = 4
  const size = matrix.length + quietZone * 2
  const path = matrix
    .flatMap((row, y) =>
      row.map((dark, x) =>
        dark ? `M${x + quietZone} ${y + quietZone}h1v1H${x + quietZone}z` : ""
      )
    )
    .join("")

  return (
    <svg
      role="img"
      aria-label={title ?? t.defaultTitle}
      viewBox={`0 0 ${size} ${size}`}
      shapeRendering="crispEdges"
      className={className}
    >
      <rect width={size} height={size} fill="white" rx="2" />
      <path d={path} fill="black" />
    </svg>
  )
}
