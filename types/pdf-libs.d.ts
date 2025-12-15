declare module 'html2canvas' {
  interface Options {
    scale?: number;
    useCORS?: boolean;
    logging?: boolean;
    backgroundColor?: string;
    width?: number;
    height?: number;
    x?: number;
    y?: number;
    scrollX?: number;
    scrollY?: number;
    windowWidth?: number;
    windowHeight?: number;
    allowTaint?: boolean;
    foreignObjectRendering?: boolean;
    imageTimeout?: number;
    ignoreElements?: (element: Element) => boolean;
    onclone?: (document: Document) => void;
    proxy?: string;
    removeContainer?: boolean;
  }

  export default function html2canvas(
    element: HTMLElement,
    options?: Options
  ): Promise<HTMLCanvasElement>;
}

declare module 'jspdf' {
  interface jsPDFOptions {
    orientation?: 'portrait' | 'landscape';
    unit?: 'pt' | 'px' | 'in' | 'mm' | 'cm';
    format?: string | [number, number];
    compress?: boolean;
    precision?: number;
    putOnlyUsedFonts?: boolean;
    hotfixes?: string[];
  }

  export default class jsPDF {
    constructor(options?: jsPDFOptions);
    
    addImage(
      imageData: string | HTMLImageElement | HTMLCanvasElement | Uint8Array,
      format: string,
      x: number,
      y: number,
      width: number,
      height: number,
      alias?: string,
      compression?: 'NONE' | 'FAST' | 'MEDIUM' | 'SLOW',
      rotation?: number
    ): jsPDF;

    save(filename: string, options?: { returnPromise?: boolean }): jsPDF | Promise<void>;
    
    output(type: string, options?: object): string | Blob | ArrayBuffer;
    
    setFontSize(size: number): jsPDF;
    
    text(
      text: string | string[],
      x: number,
      y: number,
      options?: object
    ): jsPDF;
    
    addPage(format?: string | [number, number], orientation?: 'portrait' | 'landscape'): jsPDF;
    
    internal: {
      pageSize: {
        getWidth: () => number;
        getHeight: () => number;
      };
    };
  }
}
