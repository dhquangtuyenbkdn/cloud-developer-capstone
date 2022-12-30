import { User } from "./User"

export interface Todo {
  todoId: string
  userId: string
  createdAt: string
  name: string
  dueDate: string
  done: boolean
  attachmentUrl?: string
  description: string
  assignTo?: string
  assignUser?: User
}
