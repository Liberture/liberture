import { exec } from 'child_process';
import { promisify } from 'util';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { readFile, unlink } from 'fs/promises';
import { createReadStream } from 'fs';

const execAsync = promisify(exec);

// Hetzner S3 Configuration
const s3Client = new S3Client({
  endpoint: 'https://nbg1.your-objectstorage.com',
  region: 'nbg1',
  credentials: {
    accessKeyId: '***REMOVED_S3_ACCESS_KEY***',
    secretAccessKey: '***REMOVED_S3_SECRET_KEY***',
  },
  forcePathStyle: true,
});

async function backupDatabase() {
  const date = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const backupFile = `/tmp/liberture_backup_${date}.sql.gz`;

  try {
    console.log('🗄️  Starting PostgreSQL backup...');

    // Set password environment variable
    process.env.PGPASSWORD = '***REMOVED_DB_PASSWORD***';

    // Create backup
    await execAsync(`pg_dump -U liberture_user -h localhost liberture | gzip > ${backupFile}`);

    console.log(`✅ Database backed up to ${backupFile}`);

    // Upload to Hetzner S3
    console.log('☁️  Uploading to Hetzner Object Storage...');

    const fileContent = await readFile(backupFile);

    await s3Client.send(
      new PutObjectCommand({
        Bucket: 'robert-claw',
        Key: `backups/liberture/liberture_backup_${date}.sql.gz`,
        Body: fileContent,
        ContentType: 'application/gzip',
      })
    );

    console.log(`✅ Backup uploaded to S3`);

    // Clean up local file
    await unlink(backupFile);
    console.log('🧹 Cleaned up local backup file');

    console.log('✅ Backup completed successfully!');
  } catch (error) {
    console.error('❌ Backup failed:', error);
    throw error;
  } finally {
    // Unset password
    delete process.env.PGPASSWORD;
  }
}

backupDatabase();
