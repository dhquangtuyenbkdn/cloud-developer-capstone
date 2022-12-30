import { AttachmentUtils } from '../helpers/attachmentUtils'
import { S3EventRecord } from 'aws-lambda'
import Jimp from 'jimp/es'
import { createLogger } from '../utils/logger'
import { UserAccess } from '../helpers/userAccess'
import { TodosAccess } from '../helpers/todosAcess'

const logger = createLogger("ResizeImage Business Logic");

const todoAccess = new TodosAccess()
const userAccess = new UserAccess()
const attachmentUtils = new AttachmentUtils()

const thumbnailsBucketName = process.env.THUMBNAILS_S3_BUCKET;


export async function processImage(record: S3EventRecord) {
    const bucketName = record.s3.bucket.name;
    const key = record.s3.object.key
    const s3Key = decodeURIComponent(key)
    const params = s3Key.split('/');
    logger.info(`Download image attacment from: ${bucketName}/${s3Key}`)
    const response = await attachmentUtils.getObject(bucketName, s3Key);

    logger.info('Prepare for Resize image')
    const body = response.Body
    const image = await Jimp.read(body)

    logger.info('Resizing image')
    image.resize(150, Jimp.AUTO)
    const convertedBuffer = await image.getBufferAsync(Jimp.AUTO)

    if (convertedBuffer) {
        const attachmentUrl = await attachmentUtils.putObjectAttachmentWithKey(thumbnailsBucketName, s3Key, convertedBuffer);
        const userId = params[0];
        if (params.length == 2) {
            logger.info('Update avatarURL: ', s3Key)
            await userAccess.updateUserAvatar(userId, attachmentUrl);
        }
        else {
            logger.info('Update attachmentURL: ', s3Key)
            const todoId = params[1];
            await todoAccess.updateAttachmentUrl(todoId, userId, attachmentUrl);
        }
    }
    else {
        logger.error('Convert buffer error')
    }
}