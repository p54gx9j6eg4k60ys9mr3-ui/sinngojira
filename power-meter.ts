//% color=#276F68 icon="\uf0e7" block="風車電力計"
namespace powerMeter {
    const address = 0x48
    const config = 0xC583 // AIN0/GND, ±2.048 V, single shot, 128 SPS
    const digits = [63, 6, 91, 79, 102, 109, 125, 7, 127, 111]
    let order = WindDigitOrder.DS1Left
    let running = false

    function display(glyphs: number[]) {
        for (let stage = 3; stage >= 0; stage--) {
            let index = order == WindDigitOrder.DS1Left ? stage : 3 - stage
            let value = 255 ^ glyphs[index]
            for (let bit = 7; bit >= 0; bit--) {
                pins.digitalWritePin(DigitalPin.P15, (value >> bit) & 1)
                pins.digitalWritePin(DigitalPin.P13, 1)
                pins.digitalWritePin(DigitalPin.P13, 0)
            }
        }
        pins.digitalWritePin(DigitalPin.P16, 1)
        pins.digitalWritePin(DigitalPin.P16, 0)
    }

    function updatePower() {
        let request = pins.createBuffer(3)
        request[0] = 1
        request[1] = config >> 8
        request[2] = config & 255
        pins.i2cWriteBuffer(address, request)
        basic.pause(12)
        pins.i2cWriteNumber(address, 1, NumberFormat.UInt8BE, true)
        if (pins.i2cReadNumber(address, NumberFormat.UInt16BE) != config) {
            display([0, 121, 80, 80]) // Err
            return
        }
        pins.i2cWriteNumber(address, 0, NumberFormat.UInt8BE, true)
        let raw = pins.i2cReadNumber(address, NumberFormat.Int16BE)
        if (raw == 32767) {
            display([0, 0, 118, 6]) // HI: ADC full scale
            return
        }
        
        // 0.0625 mV/count × 分圧比(x3) から電圧(mV)を算出し、100Ωでの電力(mW)を計算
        let voltageMv = Math.max(0, raw) * 0.1875
        let powerMw = Math.round((voltageMv * voltageMv) / 100000)
        let displayVal = Math.min(9999, powerMw)

        let d3 = Math.idiv(displayVal, 1000) % 10
        let d2 = Math.idiv(displayVal, 100) % 10
        let d1 = Math.idiv(displayVal, 10) % 10
        let d0 = displayVal % 10

        display([
            d3 ? digits[d3] : 0,
            d2 ? digits[d2] : 0,
            digits[d1],
            digits[d0]
        ])
    }

    /** 100Ωの負荷電力を起動直後から2秒ごとに表示する。 */
    //% blockId=wind_meter_start_power block="100Ωの電力を2秒ごとに表示する %direction"
    export function startPower(direction: WindDigitOrder) {
        order = direction
        if (running) return
        running = true
        pins.digitalWritePin(DigitalPin.P8, 1)
        pins.digitalWritePin(DigitalPin.P13, 0)
        pins.digitalWritePin(DigitalPin.P16, 0)
        display([0, 0, 0, 0])
        pins.digitalWritePin(DigitalPin.P8, 0)
        control.inBackground(function () {
            while (true) {
                let startTime = input.runningTime()
                updatePower()
                basic.pause(Math.max(1, 2000 - (input.runningTime() - startTime)))
            }
        })
    }
}
