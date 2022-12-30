import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import 'source-map-support/register'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'
import { UpdateUserRequest } from '../../requests/UpdateUserRequest'
import { updateUser } from '../../businessLogic/users'
import { getUserId } from '../utils'

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const newUser: UpdateUserRequest = JSON.parse(event.body)
    const userId = getUserId(event);
    const user = await updateUser(userId, newUser)

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