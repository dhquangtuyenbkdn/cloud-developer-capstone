import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { createLogger } from '../utils/logger'
const logger = createLogger("Attachment");
const XAWS = AWSXRay.captureAWS(AWS)
const s3 = new XAWS.S3({
    signatureVersion: 'v4'
});

export class AttachmentUtils {

    constructor(private readonly urlExpiration = process.env.SIGNED_URL_EXPIRATION) {
    }

    createAttachmentPresignedUrl(bucketName: string, userId: string, todoId: string): string {
        return s3.getSignedUrl('putObject', {
            Bucket: bucketName,
            Key: `${userId}/${todoId}/image.png`,
            Expires: this.urlExpiration
        })
    }

    createAvatarPresignedUrl(bucketName: string, userId: string): string {
        logger.info(`Create AvatarPresignedUrl:`, userId)
        return s3.getSignedUrl('putObject', {
            Bucket: bucketName,
            Key: `${userId}/avatar.png`,
            Expires: this.urlExpiration
        })
    }

    getAttachmentUrl(bucketName: string, userId: string, todoId: string): string {
        return `https://${bucketName}.s3.amazonaws.com/${userId}/${todoId}/image.png`
    }

    getAttachmentUrlWithKey(bucketName: string, key: string): string {
        return `https://${bucketName}.s3.amazonaws.com/${key}`
    }

    async getObject(bucketName: string, key: string): Promise<any> {
        return await s3.getObject({
            Bucket: bucketName,
            Key: key
        }).promise()
    }

    async putObjectAttachment(bucketName: string, userId: string, todoId: string, body: any) {
        logger.info(`putObjectAttachmentWithKey(${bucketName}, ${userId}, ${todoId})`);
        
        await s3.putObject({
            Bucket: bucketName,
            Key: `${userId}/${todoId}/image.png`,
            Body: body
        }).promise()
    }

    async putObjectAttachmentWithKey(bucketName: string, key: string, body: any): Promise<string> {
        logger.info(`putObjectAttachmentWithKey(${bucketName}, ${key})`);
        await s3.putObject({
            Bucket: bucketName,
            Key: key,
            Body: body
        }).promise()

        return this.getAttachmentUrlWithKey(bucketName, key)
    }

    async deleteAttachment(bucketName: string, userId: string, todoId: string): Promise<any> {
        try {
            await s3.deleteObject({
                Bucket: bucketName,
                Key: `${userId}/${todoId}/image.png`
            }).promise();
            logger.info("File successfully deleted...!");
        } catch (err) {
            logger.error("Failed to delete: " + JSON.stringify(err));
        }
    }
}