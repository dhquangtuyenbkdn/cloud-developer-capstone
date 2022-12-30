export interface CreateTodoRequest {
  name: string
  dueDate: string
  description: string
  assignTo?: string
}
