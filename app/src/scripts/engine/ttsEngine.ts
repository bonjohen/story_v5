/** Callbacks from the TTS engine. */
export interface TTSCallbacks {
  onSegmentStart?: (index: number) => void
  onSegmentEnd?: (index: number) => void
  onBoundary?: (charIndex: number) => void
  onComplete?: () => void
  onError?: (err: Error) => void
}

export interface TTSOptions {
  voice?: SpeechSynthesisVoice | null
  rate?: number
  callbacks?: TTSCallbacks
}

/**
 * TTS engine that wraps the Web Speech API.
 * Speaks one segment (paragraph) at a time to avoid Chrome's 15-second cutoff.
 * Chains segments via onend callbacks.
 *
 * Uses a generation counter to prevent stale callbacks from cancelled
 * utterances from interfering with the current speech chain.
 */
export class TTSEngine {
  private segments: string[] = []
  private currentIndex = -1
  private options: TTSOptions = {}
  private synth: SpeechSynthesis
  /** Incremented on every speak()/jumpTo() to invalidate stale onend callbacks. */
  private generation = 0

  constructor(synth?: SpeechSynthesis) {
    this.synth = synth ?? window.speechSynthesis
  }

  /** Begin speaking an array of text segments sequentially. */
  speak(segments: string[], options: TTSOptions = {}): void {
    this.generation++
    this.synth.cancel()
    this.segments = segments
    this.options = options
    this.currentIndex = -1
    this.speakNext()
  }

  /** Pause speech. */
  pause(): void {
    this.synth.pause()
  }

  /** Resume paused speech. */
  resume(): void {
    this.synth.resume()
  }

  /** Cancel all speech and reset. */
  cancel(): void {
    this.generation++
    this.synth.cancel()
    this.currentIndex = -1
  }

  /** Jump to a specific segment index and start speaking from there. */
  jumpTo(segmentIndex: number): void {
    if (segmentIndex < 0 || segmentIndex >= this.segments.length) return
    this.generation++
    this.synth.cancel()
    this.currentIndex = segmentIndex - 1
    this.speakNext()
  }

  /** Update speech rate (applied to next utterance). */
  setRate(rate: number): void {
    this.options.rate = rate
  }

  /** Update voice (applied to next utterance). */
  setVoice(voice: SpeechSynthesisVoice | null): void {
    this.options.voice = voice
  }

  /** Get available voices. */
  getVoices(): SpeechSynthesisVoice[] {
    return this.synth.getVoices()
  }

  /** Listen for voices to load (async on some browsers). */
  onVoicesChanged(cb: () => void): void {
    this.synth.addEventListener('voiceschanged', cb)
  }

  /** Remove voiceschanged listener. */
  offVoicesChanged(cb: () => void): void {
    this.synth.removeEventListener('voiceschanged', cb)
  }

  /** Get current segment index. */
  getCurrentIndex(): number {
    return this.currentIndex
  }

  /** Check if speech synthesis is speaking. */
  get speaking(): boolean {
    return this.synth.speaking
  }

  /** Check if speech synthesis is paused. */
  get paused(): boolean {
    return this.synth.paused
  }

  private speakNext(): void {
    // Capture generation at the start of this chain link
    const gen = this.generation

    this.currentIndex++
    if (this.currentIndex >= this.segments.length) {
      this.options.callbacks?.onComplete?.()
      return
    }

    const text = this.segments[this.currentIndex]
    if (!text.trim()) {
      // Skip empty segments
      this.speakNext()
      return
    }

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = this.options.rate ?? 1.0
    if (this.options.voice) {
      utterance.voice = this.options.voice
    }

    const idx = this.currentIndex
    this.options.callbacks?.onSegmentStart?.(idx)

    utterance.onend = () => {
      // Ignore if a new speak/jumpTo/cancel has happened since this utterance was queued
      if (this.generation !== gen) return
      this.options.callbacks?.onSegmentEnd?.(idx)
      this.speakNext()
    }

    utterance.onerror = (event) => {
      // 'canceled' is expected when we call cancel()/jumpTo()
      if (event.error === 'canceled') return
      // Also ignore stale errors
      if (this.generation !== gen) return
      this.options.callbacks?.onError?.(new Error(`TTS error: ${event.error}`))
    }

    utterance.onboundary = (event) => {
      if (this.generation !== gen) return
      this.options.callbacks?.onBoundary?.(event.charIndex)
    }

    this.synth.speak(utterance)
  }
}
