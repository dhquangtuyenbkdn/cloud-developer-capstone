import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'
import { getAllUsers } from '../../businessLogic/users'
import { getUserId } from '../utils'

// TODO: Get all TODO items for a current user
export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    getUserId(event);
    
    // Write your code here
    const users = await getAllUsers()

    return {
      statusCode: 200,
      body: JSON.stringify({
        users: users
      })
    }
  })

handler
  .use(httpErrorHandler())
  .use(
    cors({
      credentials: true
    })
  )
