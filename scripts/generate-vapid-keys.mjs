#!/usr/bin/env node
// Prints a fresh VAPID key pair for Web Push (reminders with the app closed).
// Paste the lines into .env / .env.liberture-habits / the ENV_PRODUCTION secret.
// Keep the same keys afterwards: changing them invalidates every device's subscription.
//
//   node scripts/generate-vapid-keys.mjs
import webpush from "web-push"

const { publicKey, privateKey } = webpush.generateVAPIDKeys()
console.log(`VAPID_PUBLIC_KEY=${publicKey}`)
console.log(`VAPID_PRIVATE_KEY=${privateKey}`)
console.log(`VAPID_SUBJECT=mailto:hello@liberture.com`)
