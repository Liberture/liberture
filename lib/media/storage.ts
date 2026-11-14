import { createHash } from "node:crypto"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import sharp from "sharp"

export async function uploadImage(input: Buffer, preview = false) {
  const { MEDIA_S3_ENDPOINT, MEDIA_S3_REGION, MEDIA_S3_BUCKET, MEDIA_S3_ACCESS_KEY_ID, MEDIA_S3_SECRET_ACCESS_KEY, MEDIA_PUBLIC_URL } = process.env
  if (!MEDIA_S3_ENDPOINT || !MEDIA_S3_BUCKET || !MEDIA_S3_ACCESS_KEY_ID || !MEDIA_S3_SECRET_ACCESS_KEY || !MEDIA_PUBLIC_URL) throw new Error("Media storage is not configured")
  const pipeline = sharp(input, { limitInputPixels: 40_000_000, animated: false }).rotate()
  // Decode and re-encode: uploaded markup/metadata never reaches the public bucket.
  const data = preview
    ? await pipeline.resize(1200, 630, { fit: "contain", background: "#100d29" }).jpeg({ quality: 88 }).toBuffer()
    : await pipeline.resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 88 }).toBuffer()
  const key = `images/${createHash("sha256").update(data).digest("hex")}.${preview ? "jpg" : "webp"}`
  const client = new S3Client({ endpoint: MEDIA_S3_ENDPOINT, region: MEDIA_S3_REGION || "nbg1", forcePathStyle: true,
    credentials: { accessKeyId: MEDIA_S3_ACCESS_KEY_ID, secretAccessKey: MEDIA_S3_SECRET_ACCESS_KEY } })
  await client.send(new PutObjectCommand({ Bucket: MEDIA_S3_BUCKET, Key: key, Body: data,
    ContentType: preview ? "image/jpeg" : "image/webp", CacheControl: "public, max-age=31536000, immutable" }))
  return `${MEDIA_PUBLIC_URL.replace(/\/$/, "")}/${key}`
}
