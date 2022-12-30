import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import 'source-map-support/register'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'
import { CreateUserRequest } from '../../requests/CreateUserRequest'
import { createUser } from '../../businessLogic/users'
import { getUserId } from '../utils'

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const newUser: CreateUserRequest = JSON.parse(event.body)
    const userId = getUserId(event);
    const user = await createUser(userId, newUser)

    return {
      statusCode: 201,
      body: JSON.stringify({
        user: user
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