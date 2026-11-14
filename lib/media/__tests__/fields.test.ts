import { expect, it } from "vitest"
import { mediaFields } from "../fields"
it("validates media updates without clearing omitted fields", () => {
  expect(mediaFields({ title: "hello" })).toEqual({})
  expect(mediaFields({ imageUrl: "" })).toEqual({ imageUrl: null })
  expect(mediaFields({ imageUrl: "https://example.com/image.webp" })).toEqual({ imageUrl: "https://example.com/image.webp" })
  for (const imageUrl of ["javascript:alert(1)", "data:image/svg+xml,test", "//evil.com", "/\\evil.com", "https://user:pass@example.com/x", 2]) expect(mediaFields({ imageUrl })).toBeNull()
})
