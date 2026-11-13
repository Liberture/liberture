import { expect, it } from "vitest"
import { rankProfiles } from "../search-profiles"

it("puts keyword matches from follows first and keeps each public key once", () => {
  const follow = { npub: "one", name: "Leon", keywords: "leon leon@domain", address: "", picture: "" }
  const outside = { ...follow, npub: "two", keywords: "leona" }
  const unrelated = { ...follow, npub: "three", keywords: "bob" }
  expect(rankProfiles("@LEO", [follow], [outside, unrelated, follow])).toEqual([follow, outside])
  expect(rankProfiles("domain", [follow], [])).toEqual([follow])
})
