//% color=#00b4d8 weight=90 icon="\uf1ec"
namespace 風車電力計 {

    /**
     * アナログピンから電圧(V)を測定します
     * @param pin 測定するピン
     */
    //% block="電圧を測定する ピン %pin"
    export function measureVoltage(pin: AnalogPin): number {
        let raw = pins.analogReadPin(pin);
        let voltage = (raw * 3.3) / 1023;
        return Math.round(voltage * 100) / 100;
    }

    /**
     * 100Ωの抵抗を使って電力(W)を計算します
     * @param pin 測定するピン
     */
    //% block="100Ωの電力を計算する ピン %pin"
    export function measurePower(pin: AnalogPin): number {
        let v = measureVoltage(pin);
        let power = (v * v) / 100;
        return Math.round(power * 1000) / 1000;
    }
}
