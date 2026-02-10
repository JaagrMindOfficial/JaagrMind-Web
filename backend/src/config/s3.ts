import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.AWS_BUCKET!;
const BASE_URL = process.env.AWS_S3_BASE_URL!;

export interface UploadResult {
  url: string;
  key: string;
}

/**
 * Upload a file to S3
 */
export async function uploadFile(
  buffer: Buffer,
  filename: string,
  contentType: string,
  folder: string = 'uploads'
): Promise<UploadResult> {
  const ext = filename.split('.').pop() || '';
  const key = `${folder}/${uuidv4()}.${ext}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      // ACL: 'public-read', // Removed as bucket likely disables ACLs
    })
  );

  return {
    url: `${BASE_URL}/${key}`,
    key,
  };
}

/**
 * Delete a file from S3
 */
export async function deleteFile(key: string): Promise<void> {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    })
  );
}

/**
 * Get a presigned URL for direct upload
 */
export async function getUploadUrl(
  filename: string,
  contentType: string,
  folder: string = 'uploads'
): Promise<{ uploadUrl: string; publicUrl: string; key: string }> {
  const ext = filename.split('.').pop() || '';
  const key = `${folder}/${uuidv4()}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
    // ACL: 'public-read', // Removed as bucket likely disables ACLs
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

  return {
    uploadUrl,
    publicUrl: `${BASE_URL}/${key}`,
    key,
  };
}

export default s3Client;
