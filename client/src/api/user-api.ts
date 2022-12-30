import { apiEndpoint } from '../config'
import { User } from '../types/User';
import { CreateUserRequest } from '../types/CreateUserRequest';
import { UpdateUserRequest } from '../types/UpdateUserRequest';
import Axios from 'axios'

export async function getUser(idToken: string): Promise<User> {
  console.log('Fetching User')

  const response = await Axios.get(`${apiEndpoint}/user`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    },
  })
  console.log('User:', response.data)
  return response.data.user
}

export async function getAllUsers(idToken: string): Promise<User[]> {
  console.log('Fetching User')

  const response = await Axios.get(`${apiEndpoint}/user/getAll`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    },
  })
  console.log('User:', response.data)
  return response.data.users
}

export async function createUser(
  idToken: string,
  newUser: CreateUserRequest
): Promise<User> {
  const response = await Axios.post(`${apiEndpoint}/user`,  JSON.stringify(newUser), {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    }
  })
  return response.data.user
}

export async function patchUser(
  idToken: string,
  updatedTodo: UpdateUserRequest
): Promise<void> {
  const response =  await Axios.patch(`${apiEndpoint}/user`, JSON.stringify(updatedTodo), {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    }
  })
  
  return response.data.user
}

export async function getAvatarUrl(
  idToken: string
): Promise<string> {
  const response = await Axios.post(`${apiEndpoint}/user/avatar`, '', {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    }
  })
  return response.data.uploadUrl
}
