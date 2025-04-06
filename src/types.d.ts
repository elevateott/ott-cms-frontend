// src/types.d.ts
declare namespace JSX {
  interface IntrinsicElements {
    'mux-uploader': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      endpoint?: string | (() => Promise<string>)
      cancelable?: boolean
    }
  }
}

interface UploadProgressEvent extends CustomEvent {
  detail: {
    progress: number
  }
}

interface UploadCompleteEvent extends CustomEvent {
  detail: {
    upload_id: string
    asset_id: string
    playback_ids: Array<{ id: string }>
  }
}

interface UploadErrorEvent extends CustomEvent {
  detail: {
    message: string
  }
}

declare global {
  interface HTMLElementEventMap {
    uploadprogress: UploadProgressEvent
    uploadcomplete: UploadCompleteEvent
    uploaderror: UploadErrorEvent
  }

  interface HTMLMuxUploaderElement extends HTMLElement {
    endpoint?: string | (() => Promise<string>)
    cancelable?: boolean

    addEventListener(
      type: 'uploadprogress',
      listener: (event: UploadProgressEvent) => void,
      options?: boolean | AddEventListenerOptions,
    ): void

    addEventListener(
      type: 'uploadcomplete',
      listener: (event: UploadCompleteEvent) => void,
      options?: boolean | AddEventListenerOptions,
    ): void

    addEventListener(
      type: 'uploaderror',
      listener: (event: UploadErrorEvent) => void,
      options?: boolean | AddEventListenerOptions,
    ): void

    removeEventListener(
      type: 'uploadprogress' | 'uploadcomplete' | 'uploaderror',
      listener: EventListenerOrEventListenerObject,
      options?: boolean | EventListenerOptions,
    ): void
  }
}

export {}
