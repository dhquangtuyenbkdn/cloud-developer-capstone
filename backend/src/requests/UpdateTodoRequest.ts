/**
 * Fields in a request to update a single TODO item.
 */
export interface UpdateTodoRequest {
  userId: string
  name: string
  description: string
  dueDate: string
  assignTo: string
  done: boolean
  attachmentUrl?: string
}