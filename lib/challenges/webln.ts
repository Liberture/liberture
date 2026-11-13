interface WebLnProvider {
  enable(): Promise<unknown>
  isEnabled?(): Promise<boolean> | boolean
  sendPayment(invoice: string): Promise<unknown>
}

/** Called from the Pay action. The mint confirms whether the invoice actually settled. */
export async function payWithWebLn(invoice: string): Promise<boolean> {
  const provider = (window as Window & { webln?: WebLnProvider }).webln
  if (typeof provider?.sendPayment !== "function") return false
  try {
    if (!(await provider.isEnabled?.())) await provider.enable()
    await provider.sendPayment(invoice)
    return true
  } catch {
    return false
  }
}
