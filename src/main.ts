import {BrowserMultiFormatReader, Exception, Result} from "@zxing/library";

export type onDeviceScan = (data: Array<MediaDeviceInfo>, err: Exception | null) => void
export type onScannerResult = (result: string, err: Exception | null) => void

export class QrScanner {
    private selectedSource: MediaDeviceInfo | null = null
    private listMediaSource: Array<MediaDeviceInfo> = []
    private reader: BrowserMultiFormatReader | null = null
    private html: HTMLElement | null = null
    private videoElement: HTMLVideoElement | null = null
    private readonly retryAfterResult: boolean = false

    private onDevicesFound: Map<string, onDeviceScan> = new Map<string, onDeviceScan>()
    private onResultScan: Map<string, onScannerResult> = new Map<string, onScannerResult>()

    constructor(html: HTMLElement | null, reader: BrowserMultiFormatReader, repeat: boolean) {
        this.html = html
        this.retryAfterResult = repeat
        this.reader = reader
        this.listMediaSource = []
        this.videoElement = document.createElement("video")
        this.html?.append(this.videoElement)
    }

    static init(target: string, repeat: boolean = false): QrScanner {
        console.info(`QrScanner`, `initialize`)
        const targetElement = document.querySelector<HTMLDivElement>(target)
        const reader = new BrowserMultiFormatReader()
        return new QrScanner(targetElement, reader, repeat)
    }

    addOnMediaSourceListener(callback: onDeviceScan): QrScanner {
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
            this.notifyMediaSourceError(new Exception(`Detector belum diinisiasi.`))
            return
        }
        this.reader.listVideoInputDevices().then(result=>this.notifyMediaSourceSuccess(result))
    }

    searchMediaSourceWithCallback(callback: onDeviceScan) {
        this.addOnMediaSourceListener(callback)
        this.searchMediaSource()
    }

    start() {
        console.info(`QrScanner`, `scanning`)
        if (this.videoElement == null) return this.notifyScannerError(new Exception(`Elemen preview tidak ditemukan`))
        if (this.reader == null) return this.notifyScannerError(new Exception(`Scanner belum diinisiasi`))

        this.reader.decodeOnceFromVideoDevice(this.selectedSource?.deviceId, this.videoElement!!,)
            .then((value)=>this.notifyScannerSuccess(value))
            .catch(err=>this.notifyScannerError(err))
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
                .catch(err=>this.notifyMediaSourceError(err))
        }
    }

    private notifyMediaSourceError(err: Exception) {
        this.onDevicesFound.forEach(callback => callback([], err))
    }

    private notifyMediaSourceSuccess(devices: Array<MediaDeviceInfo>) {
        if(this.listMediaSource != undefined) {
            this.listMediaSource = devices
        }
        this.onDevicesFound.forEach(callback => callback(devices, null))
    }

    private notifyScannerError(err: Exception) {
        this.onResultScan.forEach(callback => callback("", err))
    }

    private notifyScannerSuccess(result: Result) {
        this.onResultScan.forEach(cb => cb(result.getText(), null))
        if (this.retryAfterResult) {
            setTimeout(()=>this.start(), 1000)
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

    getAvailableMediaSource(): Array<MediaDeviceInfo> {
        return this.listMediaSource
    }
}

// function tes() {
//     const qr = QrScanner.init("#app", true)
//         .addOnMediaSourceListener((devices, err) => {
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
