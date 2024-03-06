import './style.css'

import {BrowserMultiFormatReader, Exception} from "@zxing/library";

export type onDeviceScan = (data: Array<MediaDeviceInfo>, err: Exception | null) => void
export type onScannerResult = (result: string, err: Exception | null) => void

export class QrScanner {
    private selectedSource: MediaDeviceInfo | null = null
    private listDevices: Array<MediaDeviceInfo> = []
    private reader: BrowserMultiFormatReader | null = null
    private html: HTMLElement | null = null
    private videElement: HTMLVideoElement | null = null

    private onDevicesFound: Map<string, onDeviceScan> = new Map<string, onDeviceScan>()
    private onResultScan: Map<string, onScannerResult> = new Map<string, onScannerResult>()

    addOnDeviceListener(callback: onDeviceScan) {
        this.onDevicesFound.set('1', callback)
    }

    addScannerListener(callback: onScannerResult) {
        this.onResultScan.set('1', callback)
    }

    searchMediaSource() {
        this.getMediaPermission()
        if (this.reader == null) return this.onDevicesFound
            .forEach(cb => cb([], new Exception(`Detector belum diinisiasi.`)))

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
        if (this.videElement == null) return this.onResultScan
            .forEach(cb => cb("", new Exception(`Elemen preview tidak ditemukan`)))
        if (this.reader == null) return this.onResultScan
            .forEach(cb => cb("", new Exception(`Scanner belum diinisiasi`)))

        this.reader.decodeOnceFromVideoDevice(
            this.selectedSource?.deviceId,
            this.videElement!!,
        ).then((result => {
            this.onResultScan.forEach(cb => cb(result.getText(), null))
        })).catch(err => {
            this.onResultScan.forEach(cb => cb("", err))
        })
    }


    constructor(html: HTMLElement | null, reader: BrowserMultiFormatReader, devices: Array<MediaDeviceInfo>) {
        this.html = html
        this.listDevices = devices
        this.reader = reader
        this.videElement = document.createElement("video")
        this.html?.append(this.videElement)
    }

    static init(target: string): QrScanner {
        let data: Array<MediaDeviceInfo> = []
        const targetElement = document.querySelector<HTMLDivElement>(target)
        const reader = new BrowserMultiFormatReader()
        return new QrScanner(targetElement, reader, data)
    }

    private getMediaPermission() {
        if (!this.isSupported()) {
            navigator.mediaDevices
                .getUserMedia({
                    video: {
                        facingMode: {
                            ideal: "environment"
                        }
                    },
                    audio: false
                })
                .then(() => {
                })
                .catch(err => {
                    this.onDevicesFound.forEach(cb => cb([], err))
                })
        } else {
            this.onDevicesFound.forEach(cb => cb([], new Exception(`browser tidak mendukung`)))
        }
    }

    private isSupported(): boolean {
        if (navigator.mediaDevices) {
            return true
        }
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

// @ts-ignore
window.QrScanner = QrScanner
