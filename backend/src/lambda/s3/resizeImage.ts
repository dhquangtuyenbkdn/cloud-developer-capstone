import { SNSEvent, SNSHandler } from 'aws-lambda'
import 'source-map-support/register'

import { processImage } from '../../businessLogic/resizeImage'
import { createLogger } from '../../utils/logger'

const logger = createLogger('SNSHandler')

export const handler: SNSHandler = async (event: SNSEvent) => {
    logger.info('Processing SNS event ', JSON.stringify(event))
    for (const snsRecord of event.Records) {
        const s3EventStr = snsRecord.Sns.Message
        logger.info('Processing S3 event', s3EventStr)
        const s3Event = JSON.parse(s3EventStr)

        logger.info('Start loop processImage: ', s3Event.Records)
        for (const record of s3Event.Records) {
            await processImage(record)
        }
    }
}