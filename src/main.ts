import {BrowserMultiFormatReader, Exception} from "@zxing/library";

export type onDeviceScan = (data: Array<MediaDeviceInfo>, err: Exception | null) => void
export type onScannerResult = (result: string, err: Exception | null) => void

export class QrScanner {
    private selectedSource: MediaDeviceInfo | null = null
    private listDevices: Array<MediaDeviceInfo> = []
    private reader: BrowserMultiFormatReader | null = null
    private html: HTMLElement | null = null
    private videoElement: HTMLVideoElement | null = null
    private retryAfterResult: boolean = false

    private onDevicesFound: Map<string, onDeviceScan> = new Map<string, onDeviceScan>()
    private onResultScan: Map<string, onScannerResult> = new Map<string, onScannerResult>()

    constructor(html: HTMLElement | null, reader: BrowserMultiFormatReader, repeat: boolean) {
        this.html = html
        this.retryAfterResult = repeat
        this.reader = reader
        this.videoElement = document.createElement("video")
        this.html?.append(this.videoElement)
    }

    static init(target: string, repeat: boolean = false): QrScanner {
        console.info(`QrScanner`, `initialize`)
        const targetElement = document.querySelector<HTMLDivElement>(target)
        const reader = new BrowserMultiFormatReader()
        return new QrScanner(targetElement, reader, repeat)
    }

    addOnDeviceListener(callback: onDeviceScan): QrScanner {
        this.onDevicesFound.set('1', callback)
        return this
    }

    addScannerListener(callback: onScannerResult): QrScanner {
        this.onResultScan.set('1', callback)
        return this
    }

    searchMediaSource() {
        this.getMediaPermission()
        if (this.reader == null) {
            this.onDevicesFound.forEach(cb => cb([], new Exception(`Detector belum diinisiasi.`)))
            return
        }

        this.reader.listVideoInputDevices().then((value) => {
            this.listDevices = value
            this.onDevicesFound.forEach(cb => cb(this.listDevices, null))
        })
    }

    searchMediaSourceWithCallback(callback: onDeviceScan) {
        this.addOnDeviceListener(callback)
        this.searchMediaSource()
    }

    start() {
        console.info(`QrScanner`, `scanning`)
        if (this.videoElement == null) return this.onResultScan
            .forEach(cb => cb("", new Exception(`Elemen preview tidak ditemukan`)))
        if (this.reader == null) return this.onResultScan
            .forEach(cb => cb("", new Exception(`Scanner belum diinisiasi`)))

        this.reader.decodeOnceFromVideoDevice(
            this.selectedSource?.deviceId,
            this.videoElement!!,
        ).then((result => {
            this.onResultScan.forEach(cb => cb(result.getText(), null))
            if (this.retryAfterResult) {
                setTimeout(() => {
                    this.start()
                }, 500)
            }
        })).catch(err => this.onResultScan.forEach(cb => cb("", err)))
    }

    private getMediaPermission() {
        if (!this.isSupported()) {
            navigator.mediaDevices
                .getUserMedia({
                    video: {
                        facingMode: {ideal: "environment"}
                    },
                    audio: false
                })
                .then((v) => v)
                .catch(err => this.onDevicesFound.forEach(cb => cb([], err)))
        }
    }

    private isSupported(): boolean {
        if (navigator.mediaDevices) return true
        return false
    }

    setTargetSource(mediaSource: MediaDeviceInfo) {
        this.selectedSource = mediaSource
        this.start()
    }

    getSelectedSource(): MediaDeviceInfo | null {
        return this.selectedSource
    }
}

// function tes() {
//     const qr = QrScanner.init("#app", true)
//         .addOnDeviceListener((devices, err) => {
//             if (err) {
//                 console.error(err)
//             }
//             console.table(devices)
//         })
//         .addScannerListener((result, err) => {
//             if (err) {
//                 console.error(err)
//             }
//             if (result) {
//                 console.log(result)
//             }
//         })
//
//     qr.searchMediaSource()
//     qr.start()
// }
//
// tes()

// @ts-ignore
window.QrScanner = QrScanner
