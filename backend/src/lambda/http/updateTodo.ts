import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'

import { updateTodo } from '../../businessLogic/todos'
import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'
import { createLogger } from '../../utils/logger'

const logger = createLogger('auth')
export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const todoId = event.pathParameters.todoId
    // const userId = getUserId(event)
    const updatedTodo: UpdateTodoRequest = JSON.parse(event.body)
    const userId = updatedTodo.userId;

    logger.info('update todo: ' + updatedTodo);
    await updateTodo(todoId, userId, updatedTodo)
    // TODO: Update a TODO item with the provided id using values in the "updatedTodo" object

    return {
      statusCode: 200,
      body: JSON.stringify({
        todoId: todoId,
        updatedTodo: updatedTodo
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
