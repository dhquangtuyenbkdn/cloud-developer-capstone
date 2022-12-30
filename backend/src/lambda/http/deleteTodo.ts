import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'
import { DefaultTodoRequest } from '../../requests/DefaultTodoRequest'

import { deleteTodo } from '../../businessLogic/todos'

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const todoId = event.pathParameters.todoId
    const deleteRequest: DefaultTodoRequest = JSON.parse(event.body)

    // TODO: Remove a TODO item by id
    const result = await deleteTodo(todoId, deleteRequest.userId)
    if (result) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          todoId: todoId
        })
      }
    }
    
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: "Delete todo failed!!!"
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
