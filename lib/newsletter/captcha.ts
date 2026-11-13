// Google's public v2 test credentials are limited to development.
const dev = process.env.NODE_ENV === "development"
export const captchaSiteKey = process.env.RECAPTCHA_SITE_KEY || (dev ? "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI" : "")
const secret = process.env.RECAPTCHA_SECRET_KEY || (dev ? "6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe" : "")

export async function verifyCaptcha(token: string) {
  if (!secret || !captchaSiteKey) throw new Error("CAPTCHA unavailable")
  const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST", body: new URLSearchParams({ secret, response: token }), signal: AbortSignal.timeout(5000),
  })
  if (!response.ok) throw new Error("CAPTCHA unavailable")
  const result = await response.json()
  const testMode = dev && !process.env.RECAPTCHA_SECRET_KEY
  const allowed = (process.env.RECAPTCHA_HOSTNAMES || "liberture.com,www.liberture.com").split(",").map(s => s.trim())
  return result.success === true && (testMode || allowed.includes(result.hostname))
}
