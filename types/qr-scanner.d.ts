declare module "qr-scanner" {
  export default class QrScanner {
    constructor(
      videoElem: HTMLVideoElement,
      onDecode: (result: string) => void,
      options?: object
    );
    start(): Promise<void>;
    stop(): void;
    destroy(): void;
    static scanImage(
      imageOrFileOrUrl:
        | HTMLCanvasElement
        | HTMLVideoElement
        | ImageBitmap
        | HTMLImageElement
        | File
        | URL
        | string
    ): Promise<string>;
  }
}
