import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate';
import { createDynamoDBClient } from './dynamoDBClientUtils'

const logger = createLogger('TodosAccess')

// TODO: Implement the dataLayer logic

export class TodosAccess {

    constructor(
        private readonly docClient: DocumentClient = createDynamoDBClient(),
        private readonly todosTable = process.env.TODOS_TABLE) {
    }

    async getAllTodos(): Promise<TodoItem[]> {
        console.log('Getting all todos')
        logger.info('Getting all todos')

        const result = await this.docClient.scan({
            TableName: this.todosTable
        }).promise()

        const items = result.Items
        return items as TodoItem[]
    }

    async getTodosForUser(userId: string): Promise<TodoItem[]> {
        console.log("getTodosForUser for user: " + userId)
        logger.info("getTodosForUser for user: " + userId)

        const result = await this.docClient.query({
            TableName: this.todosTable,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            },
            ScanIndexForward: false
        }).promise()

        const items = result.Items
        return items as TodoItem[]
    }

    async createTodo(todo: TodoItem): Promise<TodoItem> {
        logger.info("createTodo todo: " + todo.userId)

        await this.docClient.put({
            TableName: this.todosTable,
            Item: todo
        }).promise();

        return todo;
    }

    async updateTodo(todoId: string, userId: string, todoUpdate: TodoUpdate): Promise<TodoUpdate> {
        logger.info("updateTodo: " + todoId)
        await this.docClient.update({
            TableName: this.todosTable,
            Key: {
                todoId: todoId,
                userId: userId
            },
            UpdateExpression: "set #name = :name, #dueDate = :dueDate, #done = :done, #assignTo = :assignTo, #description = :description",
            ExpressionAttributeNames: {
                '#name': 'name',
                '#dueDate': 'dueDate',
                '#done': 'done',
                '#assignTo': 'assignTo',
                '#description': 'description'
            },
            ExpressionAttributeValues: {
                ':name': todoUpdate.name,
                ':dueDate': todoUpdate.dueDate,
                ':done': todoUpdate.done,
                ':assignTo': todoUpdate.assignTo,
                ':description': todoUpdate.description,
            }
        }).promise()

        return todoUpdate
    }

    async updateAttachmentUrl(todoId: string, userId: string, attachmentUrl: string): Promise<void> {
        logger.info(`updateAttachmentUrl for: ${userId}, ${todoId}, ${attachmentUrl}`)

        await this.docClient.update({
            TableName: this.todosTable,
            Key: {
                todoId: todoId,
                userId: userId
            },
            UpdateExpression: "set #attachmentUrl = :attachmentUrl",
            ExpressionAttributeNames: {
                '#attachmentUrl': 'attachmentUrl'
            },
            ExpressionAttributeValues: {
                ':attachmentUrl': attachmentUrl
            }
        }).promise()
    }

    async deleteTodo(todoId: string, userId: string): Promise<string> {
        await this.docClient.delete({
            TableName: this.todosTable,
            Key: {
                todoId: todoId,
                userId: userId
            }
        }).promise()

        return todoId
    }

    async checkTodo(todoId: string, userId: string): Promise<boolean> {
        const result =  await this.docClient.query({
            TableName: this.todosTable,
            KeyConditionExpression: 'todoId = :todoId and userId = :userId',
            ExpressionAttributeValues: {
                ':todoId': todoId,
                ':userId': userId
            },
            ScanIndexForward: false
        }).promise()

        return !!result.Items
    }
}