import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { config } from '../config.js';

function client() {
  const { endpoint, region, bucket, accessKeyId, secretAccessKey } = config.s3;
  if (!bucket || !accessKeyId || !secretAccessKey) throw new Error('S3 storage is not configured');
  return { s3: new S3Client({ endpoint, region, forcePathStyle: Boolean(endpoint), credentials: { accessKeyId, secretAccessKey } }), bucket };
}

export async function uploadPdf(postId: string, file: { buffer: Buffer; mimetype: string; size: number }) {
  if (file.mimetype !== 'application/pdf') throw new Error('Only PDF attachments are allowed');
  if (file.size > 10 * 1024 * 1024) throw new Error('PDFs must be 10 MB or smaller');
  const { s3, bucket } = client();
  const key = `posts/${postId}/${Date.now()}.pdf`;
  await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: file.buffer, ContentType: 'application/pdf', ServerSideEncryption: 'AES256' }));
  const base = config.s3.publicBaseUrl ?? (config.s3.endpoint ? `${config.s3.endpoint}/${bucket}` : `https://${bucket}.s3.${config.s3.region}.amazonaws.com`);
  return `${base.replace(/\/$/, '')}/${key}`;
}
