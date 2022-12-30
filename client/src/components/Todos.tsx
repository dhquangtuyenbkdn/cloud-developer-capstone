import dateFormat from 'dateformat'
import { History } from 'history'
import update from 'immutability-helper'
import * as React from 'react'
import { Button, Checkbox, Divider, Grid, Header, Icon, Input, Image, Loader, Card, Feed, Label, Modal, Form, DropdownProps, CheckboxProps } from 'semantic-ui-react'

import { createTodo, deleteTodo, getAllTodos, getTodos, patchTodo, getUploadUrl } from '../api/todos-api'
import { getAllUsers } from '../api/user-api'
import { uploadFile } from '../api/file-api'
import Auth from '../auth/Auth'
import { Todo } from '../types/Todo'
import { User } from '../types/User'

const defaultAvatarURL = 'https://react.semantic-ui.com/images/avatar/small/elliot.jpg';
const isViewAll = false;

interface TodosProps {
  auth: Auth
  history: History
  user: User
}

enum EditState {
  None,
  Edit,
  Create
}

enum SubmitState {
  None,
  Submting,
  Fininsh,
}

interface TodosState {
  todos: Todo[]
  users: User[]
  selectUsers: any[]
  currentUser?: User
  loadingTodos: boolean
  loadingUsers: boolean
  showNewTask: boolean
  currentUserId: string
  currentTodoId: string
  currentName: string
  currentDescription: string
  currentAssignTo: string
  currentDueDate: string
  currentDone: boolean
  currentFile: any
  currentAttachmentUrl: any
  editState: EditState
  submitState: SubmitState
}

export class Todos extends React.PureComponent<TodosProps, TodosState> {
  state: TodosState = {
    todos: [],
    users: [],
    selectUsers: [],
    loadingTodos: true,
    loadingUsers: isViewAll,
    showNewTask: false,
    currentTodoId: '',
    currentUserId: '',
    currentName: '',
    currentDescription: '',
    currentAssignTo: '',
    currentFile: undefined,
    currentAttachmentUrl: '',
    currentDueDate: '',
    currentDone: false,
    editState: EditState.None,
    submitState: SubmitState.None
  }

  handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ currentName: event.target.value })
  }

  // onEditButtonClick = (todoId: string) => {
  //   this.props.history.push(`/todos/${todoId}/edit`)
  // }

  onEditButtonClick = (todoId: string) => {
    let todo = this.state.todos.find(d => d.todoId == todoId) as Todo;

    this.setState({
      currentUserId: todo.userId,
      currentTodoId: todoId,
      currentName: todo.name,
      currentAssignTo: todo.assignTo ?? '',
      currentDescription: todo.description,
      currentAttachmentUrl: todo.attachmentUrl,
      currentDueDate: todo.dueDate,
      currentDone: todo.done,
      editState: EditState.Edit
    })

    this.setState({
      showNewTask: true
    })
    // this.props.history.push(`/todos/${todoId}/edit`)
  }


  onTodoCreate = async (event: React.ChangeEvent<HTMLButtonElement>) => {
    try {
      this.setState({
        showNewTask: true,
        editState: EditState.Create
      })
    } catch {
      alert('Todo creation failed')
    }
  }

  async onCreateTodo() {
    try {
      if (!this.state.currentFile) {
        alert('File should be selected')
        return
      }

      this.setState({
        submitState: SubmitState.Submting
      })

      const dueDate = this.calculateDueDate()
      const newTodo = await createTodo(this.props.auth.getIdToken(), {
        name: this.state.currentName,
        assignTo: this.state.currentAssignTo,
        description: this.state.currentDescription,
        dueDate,
      })

      if (this.state.currentFile != undefined) {
        const uploadUrl = await getUploadUrl(this.props.auth.getIdToken(), newTodo.todoId, newTodo.userId)
        console.log(`Upload URL: ${uploadUrl}`);
        await uploadFile(uploadUrl, this.state.currentFile)
      }

      this.setState({
        todos: [...this.state.todos, newTodo],
        currentName: '',
        currentAssignTo: this.props.user.id ?? '',
        currentDescription: '',
        currentFile: undefined,
        currentAttachmentUrl: '',
        submitState: SubmitState.Fininsh,
        showNewTask: false
      })
    } catch (error) {
      this.setState({
        submitState: SubmitState.None
      })
      alert(`Todo Create failed: ${error}`)
    }
  }


  async onUpdateTodo() {
    try {
      this.setState({
        submitState: SubmitState.Submting
      })

      // const dueDate = this.calculateDueDate()

      let currentTodo = this.state.todos.find(d => d.todoId == this.state.currentTodoId) as Todo;
      currentTodo.name = this.state.currentName
      currentTodo.assignTo = this.state.currentAssignTo
      currentTodo.description = this.state.currentDescription
      currentTodo.dueDate = this.state.currentDueDate
      currentTodo.done = this.state.currentDone

      const editTodo = await patchTodo(this.props.auth.getIdToken(), this.state.currentTodoId, {
        userId: this.state.currentUserId,
        name: this.state.currentName,
        assignTo: this.state.currentAssignTo,
        description: this.state.currentDescription,
        dueDate: this.state.currentDueDate,
        done: this.state.currentDone
      })

      if (this.state.currentFile) {
        const uploadUrl = await getUploadUrl(this.props.auth.getIdToken(), this.state.currentTodoId, this.state.currentUserId)
        await uploadFile(uploadUrl, this.state.currentFile)
      }

      this.setState({
        currentTodoId: '',
        currentName: '',
        currentAssignTo: this.props.user.id ?? '',
        currentDescription: '',
        currentFile: undefined,
        currentAttachmentUrl: '',
        submitState: SubmitState.Fininsh,
        showNewTask: false,
        todos: this.state.todos
      })
    } catch (error) {
      this.setState({
        submitState: SubmitState.None
      })
      alert(`Todo update failed: ${error}`)
    }
  }

  onTodoDelete = async (todoId: string) => {
    try {
      let currentTodo = this.state.todos.find(todo => todo.todoId == todoId) as Todo

      await deleteTodo(this.props.auth.getIdToken(), currentTodo.userId, todoId)

      this.setState({
        todos: this.state.todos.filter(todo => todo.todoId !== todoId)
      })
    } catch {
      alert('Todo deletion failed')
    }
  }

  onTodoCheck = async (pos: number) => {
    try {

      let userItem = localStorage.getItem('user');
      if (userItem != null && userItem != undefined && userItem.length > 0) {
        let user = JSON.parse(userItem) as User;
        if (user.email && user.email) {
          this.setState({
            currentUser: user
          })
        }
      }

      const todo = this.state.todos[pos]
      await patchTodo(this.props.auth.getIdToken(), todo.todoId, {
        userId: todo.userId,
        name: todo.name,
        dueDate: todo.dueDate,
        done: !todo.done,
        assignTo: todo.dueDate,
        description: todo.dueDate,
      })
      this.setState({
        todos: update(this.state.todos, {
          [pos]: { done: { $set: !todo.done } }
        })
      })
    } catch {
      alert('Todo deletion failed')
    }
  }

  async componentDidMount() {
    try {
      const todos = await (isViewAll ? getAllTodos(this.props.auth.getIdToken()) : getTodos(this.props.auth.getIdToken()))
      this.setState({
        todos,
        loadingTodos: false
      })

      if (isViewAll) {
        const users = await getAllUsers(this.props.auth.getIdToken())

        const selectUsers: any = []
        users.forEach(user => selectUsers.push({ key: user.id, text: `${user.name} (${user.email})`, value: user.id }))
        this.setState({
          users,
          selectUsers,
          loadingUsers: false
        })
      }
    } catch (e) {
      alert(`Failed to fetch todos: ${(e as Error).message}`)
    }
  }

  render() {
    if (this.state.submitState == SubmitState.Submting) {
      return this.renderWaiting()
    }

    return (
      <div>
        <Header as="h1">TODOs</Header>

        {this.renderCreateTodoInput()}

        {this.renderTodos()}

        {this.renderTodoTaskModal()}
      </div >
    )
  }

  renderCreateTodoInput() {
    return (
      <Grid.Row>
        <Grid.Column width={16}>
          <Input
            action={{
              color: 'teal',
              labelPosition: 'left',
              icon: 'add',
              content: 'New task',
              onClick: this.onTodoCreate
            }}
            fluid
            actionPosition="left"
            placeholder="To change the world..."
            onChange={this.handleNameChange}
          />
        </Grid.Column>
        <Grid.Column width={16}>
          <Divider />
        </Grid.Column>
      </Grid.Row>
    )
  }

  renderTodos() {
    if (this.state.loadingTodos || this.state.loadingUsers) {
      return this.renderLoading()
    }

    // return this.renderTodosList()
    return this.renderTodosListCards()
  }

  renderLoading() {
    return (
      <Grid.Row>
        <Loader indeterminate active inline="centered">
          Loading TODOs
        </Loader>
      </Grid.Row>
    )
  }

  renderWaiting() {
    return (
      <div>
        <Grid.Row>
          <Loader indeterminate active inline="centered">
            Waiting for submit data
          </Loader>
        </Grid.Row>
      </div>
    )
  }

  renderTodosList() {
    return (
      <Grid padded>
        {this.state.todos.map((todo, pos) => {
          let assignUser = null;
          if (todo.assignTo && todo.assignTo.length > 0)
            assignUser = this.state.users.find(u => u.id == todo.assignTo)
          return (
            <Grid.Row key={todo.todoId}>
              <Grid.Column width={1} verticalAlign="middle">
                <Checkbox
                  onChange={() => this.onTodoCheck(pos)}
                  checked={todo.done}
                />
              </Grid.Column>
              <Grid.Column width={10} verticalAlign="middle">
                {todo.name}
              </Grid.Column>
              <Grid.Column width={3} floated="right">
                {todo.dueDate}
              </Grid.Column>
              <Grid.Column width={1} floated="right">
                <Button
                  icon
                  color="blue"
                  onClick={() => this.onEditButtonClick(todo.todoId)}
                >
                  <Icon name="pencil" />
                </Button>
              </Grid.Column>
              <Grid.Column width={1} floated="right">
                <Button
                  icon
                  color="red"
                  onClick={() => this.onTodoDelete(todo.todoId)}
                >
                  <Icon name="delete" />
                </Button>
              </Grid.Column>
              {todo.attachmentUrl && (
                <Image src={todo.attachmentUrl} size="small" wrapped />
              )}
              <Grid.Column width={16}>
                <Divider />
              </Grid.Column>
            </Grid.Row>
          )
        })}
      </Grid>
    )
  }


  renderTodosListCards() {
    return (
      <Card.Group>
        {this.state.todos.map((todo, pos) => {
          return this.renderTodosListCard(todo);
        })}
      </Card.Group>
    )
  }


  renderTodosListCard(todo: Todo) {
    let assignUser = this.state.currentUser;
    if (todo.assignTo && todo.assignTo.length > 0 && isViewAll)
      assignUser = this.state.users.find(u => u.id == todo.assignTo)
    let userAvatar = assignUser?.avatarUrl ?? defaultAvatarURL;
    let userName = assignUser?.name ?? this.state.currentUser?.name ?? '';
    return (
      <Card key={todo.todoId}>
        <Card.Content width={1}>
          <Image
            floated='right'
            size='mini'
            src={userAvatar}
          />
          <Card.Header>{todo.name}</Card.Header>
          <Card.Meta>{userName}</Card.Meta>
          <Card.Description>{todo.description}</Card.Description>
        </Card.Content>
        <Card.Content>
          <Feed.Event>
            {todo.attachmentUrl && (
              <Feed.Label>
                <Image size='medium' src={todo.attachmentUrl} />
              </Feed.Label>
            )}
            <Feed.Content>
              <Feed.Date content={todo.dueDate} />
              <Feed.Summary>
                {todo.done && (
                  <Label color='blue' horizontal>
                    Done
                  </Label>
                )}
                {!todo.done && (
                  <Label color='red' horizontal>
                    Not Done
                  </Label>
                )}
              </Feed.Summary>
            </Feed.Content>
          </Feed.Event>
        </Card.Content>
        <Card.Content extra>
          <div className='ui two buttons'>
            <Button icon color="blue"
              onClick={() => this.onEditButtonClick(todo.todoId)}                  >
              <Icon name="pencil" />
            </Button>

            <Button icon color="red"
              onClick={() => this.onTodoDelete(todo.todoId)}                  >
              <Icon name="delete" />
            </Button>
          </div>
        </Card.Content>
        <Card.Content width={3} floated="right">
          {todo.dueDate}
        </Card.Content>
      </Card>
    )
  }

  calculateDueDate(): string {
    const date = new Date()
    date.setDate(date.getDate() + 7)

    return dateFormat(date, 'yyyy-mm-dd') as string
  }

  renderTodoTaskModal() {
    if (this.state.editState == EditState.Edit) {
      return (
        <Modal
          onClose={() => this.handleOpenModal(true)}
          onOpen={() => this.handleOpenModal(false)}
          open={this.state.showNewTask}
        >
          <Modal.Header>Edit Task</Modal.Header>
          <Modal.Content image>
            <Button as="label" htmlFor="file" type="button">
              <Image size='medium'
                src={this.state.currentAttachmentUrl ? this.state.currentAttachmentUrl : defaultAvatarURL} wrapped
              />
            </Button>
            <Input type="file" id="file" style={{ display: "none" }} onChange={this.handleFileChange} />

            <Modal.Description>
              <Form>
                <Form.Input label='Task name'
                  placeholder='Task name...'
                  minLength='10'
                  maxLength='255'
                  value={this.state.currentName}
                  onChange={this.handleTaskChange}
                />
                <Form.TextArea label='Description'
                  placeholder='Description...'
                  minLength='10'
                  maxLength='1000'
                  value={this.state.currentDescription}
                  onChange={this.handleDescriptionChange}
                />
                {isViewAll && (
                  <Form.Select
                    options={this.state.selectUsers}
                    value={this.state.currentAssignTo}
                    onChange={this.handleAssignChange}
                    placeholder='Assign To' />
                )}

                <Form.Checkbox
                  label=''
                  checked={this.state.currentDone}
                  onChange={this.handleDoneChange}
                  placeholder='Is Done' />

                <Form.Input
                  value={this.state.currentDueDate}
                  disabled
                  placeholder='Due Date' />
              </Form>
            </Modal.Description>
          </Modal.Content>
          <Modal.Actions>
            <Button content="Close"
              color='red'
              icon='remove'
              onClick={() => this.handleOpenModal(false)}>
            </Button>
            <Button
              content="Save"
              labelPosition='right'
              icon='checkmark'
              onClick={() => this.onUpdateTodo()}
              positive
            />
          </Modal.Actions>
        </Modal>
      )
    }
    return (
      <Modal
        onClose={() => this.handleOpenModal(true)}
        onOpen={() => this.handleOpenModal(false)}
        open={this.state.showNewTask}
      >
        <Modal.Header>Add New Task</Modal.Header>
        <Modal.Content image>
          <Button as="label" htmlFor="file" type="button">
            <Image size='medium'
              src={this.state.currentAttachmentUrl ? this.state.currentAttachmentUrl : defaultAvatarURL} wrapped
            />
          </Button>
          <Input type="file" id="file" style={{ display: "none" }} onChange={this.handleFileChange} />

          <Modal.Description>
            <Form>
              <Form.Input label='Task name'
                placeholder='Task name...'
                value={this.state.currentName}
                onChange={this.handleTaskChange}
              />
              <Form.TextArea label='Description'
                placeholder='Description...'
                value={this.state.currentDescription}
                onChange={this.handleDescriptionChange}
              />

              {isViewAll && (
                <Form.Select
                  options={this.state.selectUsers}
                  value={this.state.currentAssignTo}
                  onChange={this.handleAssignChange}
                  placeholder='Assign To' />
              )}
            </Form>
          </Modal.Description>
        </Modal.Content>
        <Modal.Actions>
          <Button content="Close"
            color='red'
            icon='remove'
            onClick={() => this.handleOpenModal(false)}>
          </Button>
          <Button
            content="Save"
            labelPosition='right'
            icon='checkmark'
            onClick={() => this.onCreateTodo()}
            positive
          />
        </Modal.Actions>
      </Modal>
    )
  }

  handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    let fileUrl = URL.createObjectURL(files[0]);

    this.setState({
      currentFile: files[0],
      currentAttachmentUrl: fileUrl
    })
  }

  handleTaskChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({
      currentName: event.target.value
    })
  }

  handleDescriptionChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    this.setState({
      currentDescription: event.target.value
    })
  }

  handleAssignChange = (event: React.SyntheticEvent<HTMLElement, Event>, data: DropdownProps) => {
    if (isViewAll) {
      this.setState({
        currentAssignTo: (data.value ?? '').toString()
      })
    }
  }

  handleDoneChange = (event: React.FormEvent<HTMLInputElement>, data: CheckboxProps) => {
    this.setState({
      currentDone: data.checked ?? false
    })
  }

  handleDueDateChange = (event: React.FormEvent<HTMLInputElement>, data: CheckboxProps) => {
    this.setState({
      currentDone: data.checked ?? false
    })
  }

  async handleOpenModal(isShow: boolean) {
    if (!isShow) {
      this.setState({
        currentUserId: '',
        currentTodoId: '',
        currentName: '',
        currentAssignTo: '',
        currentDescription: '',
        currentAttachmentUrl: '',
        currentDueDate: '',
        currentDone: false,
        showNewTask: isShow,
        editState: EditState.None
      })
    }
    else {
      this.setState({
        showNewTask: isShow
      })
    }
  }
}

