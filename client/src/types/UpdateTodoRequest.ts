export interface UpdateTodoRequest {
  userId: string
  name: string
  dueDate: string
  done: boolean
  assignTo: string
  description: string
}