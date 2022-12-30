import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'

import { createAvatarPresignedUrl } from '../../businessLogic/users'
import { createLogger } from '../../utils/logger'
import { getUserId } from '../utils'

const logger = createLogger('auth')

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const userId = getUserId(event)
    logger.info('createAvatarPresignedUrl for user: ' + userId);

    const uploadUrl = createAvatarPresignedUrl(userId)

    return {
      statusCode: 202,
      body: JSON.stringify({
        uploadUrl
      })
    }
  }
)

handler
  .use(httpErrorHandler())
  .use(
    cors({
      credentials: true
    })
  )
