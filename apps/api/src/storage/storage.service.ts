import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly localUploadDir: string;

  constructor(private config: ConfigService) {
    this.localUploadDir = join(process.cwd(), 'uploads');
  }

  async uploadFile(key: string, data: Buffer, contentType: string): Promise<string> {
    const bucket = this.config.get('R2_BUCKET_NAME');
    const accountId = this.config.get('R2_ACCOUNT_ID');
    const accessKeyId = this.config.get('R2_ACCESS_KEY_ID');
    const secretKey = this.config.get('R2_SECRET_ACCESS_KEY');

    if (!bucket || !accountId || !accessKeyId) {
      return this.storeLocally(key, data);
    }

    try {
      // Use AWS SDK for S3-compatible Cloudflare R2
      const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
      const client = new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: { accessKeyId, secretAccessKey: secretKey },
      });

      await client.send(new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: data,
        ContentType: contentType,
      }));

      const publicUrl = this.config.get('R2_PUBLIC_URL');
      return `${publicUrl}/${key}`;
    } catch (error) {
      this.logger.error(`R2 upload failed, falling back to local: ${error.message}`);
      return this.storeLocally(key, data);
    }
  }

  private async storeLocally(key: string, data: Buffer): Promise<string> {
    const filePath = join(this.localUploadDir, key);
    const dir = dirname(filePath);
    await mkdir(dir, { recursive: true });
    await writeFile(filePath, data);
    const baseUrl = this.config.get('BASE_URL', 'http://localhost:3001');
    return `${baseUrl}/uploads/${key}`;
  }
}
