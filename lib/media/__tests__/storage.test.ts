import { afterEach, expect, it, vi } from "vitest"
import sharp from "sharp"
const { send } = vi.hoisted(() => ({ send: vi.fn().mockResolvedValue({}) }))
vi.mock("@aws-sdk/client-s3", () => ({ S3Client: class { send = send }, PutObjectCommand: class { constructor(public input: unknown) {} } }))
import { uploadImage } from "../storage"
afterEach(() => { vi.unstubAllEnvs(); send.mockClear() })
it("uploads bounded, content-addressed covers and correctly sized social previews", async () => {
  for (const [key,value] of Object.entries({ MEDIA_S3_ENDPOINT: "https://nbg1.your-objectstorage.com", MEDIA_S3_BUCKET: "media", MEDIA_S3_ACCESS_KEY_ID: "test", MEDIA_S3_SECRET_ACCESS_KEY: "test", MEDIA_PUBLIC_URL: "https://example.com" })) vi.stubEnv(key,value)
  const input = await sharp({ create: { width: 200, height: 100, channels: 3, background: "red" } }).png().toBuffer()
  const first = await uploadImage(input)
  expect(await uploadImage(input)).toBe(first)
  expect(first).toMatch(/^https:\/\/example.com\/images\/[a-f0-9]{64}\.webp$/)
  const preview = await uploadImage(input,true)
  expect(preview).toMatch(/\.jpg$/)
  const command = send.mock.calls.at(-1)![0].input
  const meta = await sharp(command.Body).metadata()
  expect([meta.width,meta.height,meta.format]).toEqual([1200,630,"jpeg"])
  expect(command.CacheControl).toContain("immutable")
})
