import { User } from '../models/User'
import { UserItem } from '../models/UserItem'
import { CreateUserRequest } from '../requests/CreateUserRequest'
import { UpdateUserRequest } from '../requests/UpdateUserRequest'

import { AttachmentUtils } from '../helpers/attachmentUtils'
import { createLogger } from '../utils/logger'
import { UserAccess } from '../helpers/userAccess'
const logger = createLogger("User Business Logic");

const userAccess = new UserAccess()
const attachmentUtils = new AttachmentUtils()

const avatarBucketName = process.env.FILE_S3_BUCKET;
const thumbnailsBucketName = process.env.THUMBNAILS_S3_BUCKET;

export async function getAllUsers(): Promise<UserItem[]> {
    logger.info('get all user:')
    return await userAccess.getAllUsers()
}


export async function getUser(userId: string): Promise<User> {
    logger.info('get all user:')
    return await userAccess.getUser(userId)
}


export async function createUser(
    userId: string,
    createUserRequest: CreateUserRequest): Promise<User> {
    logger.info('Create user: ', userId)

    let user = await userAccess.getUser(userId);
    
    if (!user) {
        let avatarUrl = attachmentUtils.getAvatarUrl(avatarBucketName, userId);
        user = await userAccess.createUser({
            id: userId,
            name: createUserRequest.name,
            email: createUserRequest.email,
            avatarUrl: avatarUrl,
            createdAt: new Date().toISOString()
        });
    };

    return user;
}


export async function updateUser(
    userId: string,
    updateUserRequest: UpdateUserRequest
): Promise<User> {
    logger.info('update user: ', userId)

    return await userAccess.updateUser(userId, {
        id: userId,
        name: updateUserRequest.name,
        email: updateUserRequest.email
    });
}


export async function deleteUser(
    userId: string,
): Promise<string> {
    logger.info('deleteUser: ', userId)

    let deletdUserId = await userAccess.deleteUser(userId);
    
    attachmentUtils.deleteAvatar(avatarBucketName, userId);
    attachmentUtils.deleteAvatar(thumbnailsBucketName, userId);

    return deletdUserId;
}

export function createAvatarPresignedUrl(userId: string): string {
    logger.info('create Attachment PresignedUrl for: ', userId)
    const avatarPresignedUrl = attachmentUtils.createAvatarPresignedUrl(avatarBucketName, userId);

    return avatarPresignedUrl;
}
