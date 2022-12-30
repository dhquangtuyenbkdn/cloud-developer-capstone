import * as uuid from 'uuid'

import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'

import { TodosAccess } from '../helpers/todosAcess'
import { AttachmentUtils } from '../helpers/attachmentUtils'
import { createLogger } from '../utils/logger'
const logger = createLogger("Todo Business Logic");

const todoAccess = new TodosAccess()
const attachmentUtils = new AttachmentUtils()

const imageBucketName = process.env.FILE_S3_BUCKET;
const thumbnailsBucketName = process.env.THUMBNAILS_S3_BUCKET;

export async function getAllTodos(): Promise<TodoItem[]> {
    return todoAccess.getAllTodos()
}

export async function getTodosForUser(userId: string): Promise<TodoItem[]> {
    return await todoAccess.getTodosForUser(userId)
}


export async function createTodo(
    createTodoRequest: CreateTodoRequest,
    userId: string): Promise<TodoItem> {
    const itemId = uuid.v4();
    logger.info('Create todo for: ', userId)

    let attachmentUrl = attachmentUtils.createAttachmentPresignedUrl(imageBucketName, userId, itemId);

    let todo = await todoAccess.createTodo({
        todoId: itemId,
        userId: userId,
        name: createTodoRequest.name,
        description: createTodoRequest.description ?? '',
        assignTo: createTodoRequest.assignTo ?? userId,
        attachmentUrl: attachmentUrl,
        done: false,
        dueDate: createTodoRequest.dueDate,
        createdAt: new Date().toISOString()
    });

    return todo;
}


export async function updateTodo(
    todoId: string,
    userId: string,
    updateTodoRequest: UpdateTodoRequest
): Promise<TodoUpdate> {
    logger.info('update todo for: ', userId)

    return await todoAccess.updateTodo(todoId, userId, updateTodoRequest);
}

export async function deleteTodo(
    todoId: string,
    userId: string
): Promise<boolean> {
    logger.info('delete todo for: ', userId)

    try {
        const todoExits = await todoAccess.checkTodo(todoId, userId);
        if (todoExits) {
            attachmentUtils.deleteAttachment(imageBucketName, userId, todoId);
            attachmentUtils.deleteAttachment(thumbnailsBucketName, userId, todoId);

            todoAccess.deleteTodo(todoId, userId);

            return true;
        }
        else {
            logger.error('dont exits todoid: ', todoId)
            return false;
        }
    }
    catch (error) {
        logger.error(`delete  todo ${todoId} failed: ${error}`)
        return false;
    }
}

export function createAttachmentPresignedUrl(todoId: string, userId: string): string {
    logger.info('create Attachment PresignedUrl for: ', userId, todoId)
    const attachmentPresignedUrl = attachmentUtils.createAttachmentPresignedUrl(imageBucketName, userId, todoId);
    //const attachmentUrl = attachmentUtils.getAttachmentUrl(imageBucketName, userId, todoId);

    //todoAccess.updateattachmentUrl(todoId, userId, attachmentUrl);

    return attachmentPresignedUrl;
}