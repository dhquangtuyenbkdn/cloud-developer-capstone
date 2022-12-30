import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createDynamoDBClient } from './dynamoDBClientUtils'
import { createLogger } from '../utils/logger'

import { User } from '../models/User'
import { UserItem } from '../models/UserItem'

const logger = createLogger('UserAccess')

export class UserAccess {

  constructor(
    private readonly docClient: DocumentClient = createDynamoDBClient(),
    private readonly userTable = process.env.USERS_TABLE) {
  }

  async getUser(userId: string): Promise<User> {
    logger.info("getUser: " + userId)

    const result = await this.docClient.query({
      TableName: this.userTable,
      KeyConditionExpression: 'id = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      },
      ScanIndexForward: false
    }).promise()

    const items = result.Items

    if (items && items.length > 0)
      return items[0] as User
  }

  async getUserByEmail(email: string): Promise<User> {
    logger.info("getUser by email: " + email)

    const result = await this.docClient.query({
      TableName: this.userTable,
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email
      },
      ScanIndexForward: false
    }).promise()

    const items = result.Items

    if (items && items.length > 0)
      return items[0] as User
  }

  async getAllUsers(userId?: string): Promise<UserItem[]> {
    logger.info("getAllUser: " + userId)

    const result = await this.docClient.scan({
      TableName: this.userTable
    }).promise()

    const items = result.Items

    return items as UserItem[]
  }

  async createUser(user: User): Promise<User> {
    await this.docClient.put({
      TableName: this.userTable,
      Item: user,
      ConditionExpression: "attribute_not_exists(#name) AND attribute_not_exists(#email)",
      ExpressionAttributeNames: {
        '#name': 'name',
        '#email': 'email'
      }
      // ConditionExpression: "attribute_not_exists(email)",
    }).promise()

    return user
  }

  async updateUser(userId: string, user: User): Promise<User> {
    user.updateAt = new Date().toISOString()

    logger.info("updateUser: " + userId)
    await this.docClient.update({
      TableName: this.userTable,
      Key: {
        id: userId
      },
      UpdateExpression: "set #name = :name, #email = :email, #updateAt = :updateAt",
      ExpressionAttributeNames: {
        '#name': 'name',
        '#email': 'email',
        '#updateAt': 'updateAt'
      },
      ExpressionAttributeValues: {
        ':name': user.name,
        ':email': user.email,
        ':updateAt': user.updateAt
      },
      ConditionExpression: "attribute_not_exists(#name) AND attribute_not_exists(#email)"
      // ConditionExpression: "attribute_not_exists(email)",
    }).promise()

    return await this.getUser(userId);
  }

  async deleteUser(userId: string): Promise<string> {

    logger.info("deleteUser: " + userId)
    await this.docClient.delete({
      TableName: this.userTable,
      Key: {
        id: userId
      },
    }).promise()

    return userId;
  }

  async updateUserAvatar(userId: string, avatarUrl: string): Promise<void> {
    const updateAt = new Date().toISOString()

    logger.info("updateUserAvatar: " + userId)
    await this.docClient.update({
      TableName: this.userTable,
      Key: {
        id: userId
      },
      UpdateExpression: "set #avatarUrl = :avatarUrl, #updateAt = :updateAt",
      ExpressionAttributeNames: {
        '#avatarUrl': 'avatarUrl',
        '#updateAt': 'updateAt'
      },
      ExpressionAttributeValues: {
        ':avatarUrl': avatarUrl,
        ':updateAt': updateAt
      }
    }).promise()
  }

  async checkUser(userId: string): Promise<boolean> {
    logger.info("getUser: " + userId)

    const result = await this.docClient.query({
      TableName: this.userTable,
      KeyConditionExpression: 'id = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      },
      ScanIndexForward: false
    }).promise()

    return !!result.Items
  }
}