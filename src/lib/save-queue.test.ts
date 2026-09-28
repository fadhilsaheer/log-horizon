import { test, expect } from "bun:test";
import { SaveQueue } from "./save-queue";
import { readPile } from "../types/entry";
test("a save acknowledgement never drops a newer draft", async () => {
  let release!: () => void;
  const written: string[] = [];
  const queue = new SaveQueue(
    async (d) => {
      written.push(d.content);
      if (written.length === 1)
        await new Promise<void>((r) => {
          release = r;
        });
    },
    () => {},
  );
  queue.enqueue({ id: "a", title: "", content: "first" });
  const first = queue.flush();
  queue.enqueue({ id: "a", title: "", content: "latest" });
  release();
  await first;
  expect(written).toEqual(["first", "latest"]);
  expect(queue.hasPending()).toBe(false);
});
test("failed saves remain retryable", async () => {
  let fail = true;
  const queue = new SaveQueue(
    async () => {
      if (fail) throw Error("disk full");
    },
    () => {},
  );
  queue.enqueue({ id: "a", title: "", content: "keep this" });
  await expect(queue.flush()).rejects.toThrow("disk full");
  expect(queue.hasPending()).toBe(true);
  fail = false;
  await queue.flush();
  expect(queue.hasPending()).toBe(false);
});
test("legacy piles preserve order, text, and timestamps", () => {
  expect(readPile('[{"id":"one","text":"hello","timestamp":123}]')).toEqual({
    draft: "",
    items: [{ id: "one", text: "hello", timestamp: 123 }],
  });
  expect(() => readPile('{"items":[{}],"draft":""}')).toThrow();
});
