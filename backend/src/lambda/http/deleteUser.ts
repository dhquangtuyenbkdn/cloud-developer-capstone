import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'
import { getUserId } from '../utils'

import { deleteUser } from '../../businessLogic/users'

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const userId = getUserId(event);

    // TODO: Remove a TODO item by id
    const result = await deleteUser(userId)
    if (result) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          userId: userId
        })
      }
    }

    return {
      statusCode: 400,
      body: JSON.stringify({
        error: "Delete user failed!!!"
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
