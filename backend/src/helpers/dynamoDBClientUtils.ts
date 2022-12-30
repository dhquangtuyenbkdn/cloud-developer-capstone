import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'

const XAWS = AWSXRay.captureAWS(AWS)

const logger = createLogger('createDynamoDBClient')

export function createDynamoDBClient(): DocumentClient {
    if (process.env.IS_OFFLINE) {
        logger.info('Creating a local DynamoDB instance')
        return new XAWS.DynamoDB.DocumentClient({
            region: 'localhost',
            endpoint: 'http://localhost:8000'
        }) as DocumentClient
    }

    return new XAWS.DynamoDB.DocumentClient() as DocumentClient
}
