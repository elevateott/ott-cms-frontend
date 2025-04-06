// types.d.ts
declare global {
  interface HTMLMuxUploaderElement extends HTMLElement {
    addEventListener(
      type: 'uploadcomplete',
      listener: (event: CustomEvent) => void,
      options?: boolean | AddEventListenerOptions,
    ): void

    removeEventListener(
      type: 'uploadcomplete',
      listener: (event: CustomEvent) => void,
      options?: boolean | EventListenerOptions,
    ): void
  }
}

export {}
