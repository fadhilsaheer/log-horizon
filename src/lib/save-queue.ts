export interface Draft {
  id: string;
  title: string;
  content: string;
}
/** One writer. An acknowledgement can never erase a newer draft. Failed writes stay pending. */
export class SaveQueue {
  private pending: Draft | null = null;
  private running: Promise<void> | null = null;
  private timer: ReturnType<typeof setTimeout> | undefined;
  constructor(
    private write: (draft: Draft) => Promise<void>,
    private status: (
      state: "saving" | "saved" | "error",
      error?: unknown,
    ) => void,
  ) {}
  enqueue(draft: Draft) {
    this.pending = draft;
    this.status("saving");
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      void this.flush().catch(() => {});
    }, 250);
  }
  pendingDraft() {
    return this.pending;
  }
  hasPending() {
    return this.pending !== null || this.running !== null;
  }
  async flush(): Promise<void> {
    clearTimeout(this.timer);
    if (this.running) {
      await this.running;
      if (this.pending) return this.flush();
      return;
    }
    this.running = this.drain();
    try {
      await this.running;
    } finally {
      this.running = null;
    }
  }
  private async drain() {
    while (this.pending) {
      const draft = this.pending;
      try {
        await this.write(draft);
      } catch (error) {
        this.status("error", error);
        throw error;
      }
      if (this.pending === draft) this.pending = null;
    }
    this.status("saved");
  }
}
