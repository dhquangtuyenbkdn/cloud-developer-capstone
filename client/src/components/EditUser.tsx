import * as React from 'react'
import { Form, Button, Grid, Image, Segment, Input, Label, Icon, Loader, } from 'semantic-ui-react'
import Auth from '../auth/Auth'
import { getAvatarUrl, patchUser } from '../api/user-api'
import { uploadFile } from '../api/file-api'
import { User } from '../types/User'

enum UserState {
  InValid,
  Loading,
  Edit,
  Editing,
  FetchingPresignedUrl,
  UploadingFile,
  Finish,
}

interface EditUserProps {
  auth: Auth
  history: any
  user: User
}

interface EditUserState {
  file: any
  fileUrl: any
  name: string
  email: string
  avatarUrl: string
  editState: UserState
  // uploadState: UploadState
}

const defaultAvatarURL = 'https://react.semantic-ui.com/images/avatar/small/elliot.jpg';

export class EditUser extends React.PureComponent<EditUserProps, EditUserState> {
  state: EditUserState = {
    file: undefined,
    fileUrl: '',
    name: '',
    email: '',
    avatarUrl: defaultAvatarURL,
    editState: UserState.InValid,
    // uploadState: UploadState.NoUpload
  }

  async componentDidMount() {
    try {
      this.setState({
        editState: UserState.Finish,
        name: this.props.user.name,
        email: this.props.user.email,
        avatarUrl: this.props.user.avatarUrl ?? defaultAvatarURL,
      })
    } catch (e) {
      alert(`Failed to fetch todos: ${(e as Error).message}`)
      localStorage.removeItem('user');
      this.props.history.push(`/`)
    }
  }

  handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    let fileUrl = URL.createObjectURL(files[0]);
    this.setState({
      file: files[0],
      fileUrl: fileUrl
    })
  }

  handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const name = event.target.value
    if (!name) return

    this.setState({
      name: name
    })
  }

  handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const email = event.target.value
    if (!email) return

    this.setState({
      email: email
    })
  }

  handleSubmit = async (event: React.SyntheticEvent) => {
    event.preventDefault()

    try {
      this.setUserState(UserState.Editing)
      const user = await patchUser(this.props.auth.getIdToken(), { name: this.state.name, email: this.state.email })
      this.setUserState(UserState.FetchingPresignedUrl)

      if (this.state.file) {
        const uploadUrl = await getAvatarUrl(this.props.auth.getIdToken())
        this.setUserState(UserState.UploadingFile)
        await uploadFile(uploadUrl, this.state.file)

        localStorage.setItem('user', JSON.stringify(user))
      }
      this.setUserState(UserState.Finish)
    } catch (e) {
      alert('Could not upload a file: ' + (e as Error).message)
    } finally {
      // this.setUploadState(UploadState.NoUpload)
    }
  }


  setUserState(editState: UserState) {
    this.setState({
      editState
    })
  }

  setOnEdit = async (event: React.SyntheticEvent) => {
    event.preventDefault()

    try {
      this.setUserState(UserState.Edit)
    } catch (e) {
    } finally {
      // this.setUploadState(UploadState.NoUpload)
    }
  }

  setOnBack = async (event: React.SyntheticEvent) => {
    event.preventDefault()

    try {
      this.props.history.push(`/`)
    } catch (e) {
    } finally {
      // this.setUploadState(UploadState.NoUpload)
    }
  }

  setCancelEdit = async (event: React.SyntheticEvent) => {
    event.preventDefault()

    try {
      this.setUserState(UserState.Finish)
    } catch (e) {
    } finally {
      // this.setUploadState(UploadState.NoUpload)
    }
  }

  render() {
    if (UserState.Edit <= this.state.editState && this.state.editState < UserState.Finish) {
      return (
        <div>
          <h1>Edit User</h1>
          <Form onSubmit={this.handleSubmit}>
            <Grid columns={2} divided>
              <Grid.Row stretched>
                <Grid.Column width={4}>
                  <Segment>
                    <Form.Field>
                      <Button as="label" htmlFor="file" type="button">
                        Avatar
                        <Image size='medium'
                          src={this.state.fileUrl ? this.state.fileUrl : this.state.avatarUrl} circular
                        />
                      </Button>
                      <Input type="file" id="file" style={{ display: "none" }} onChange={this.handleFileChange} />
                    </Form.Field>
                  </Segment>
                </Grid.Column>

                <Grid.Column width={12}>
                  <Segment>
                    <Form.Field>
                      <Label basic>Name</Label>
                      <Input
                        type="text"
                        placeholder="UserName"
                        required
                        value={this.state.name}
                        onChange={this.handleNameChange}
                      />
                    </Form.Field>
                  </Segment>
                  <Segment>
                    <Form.Field>
                      <Label basic>Email</Label>
                      <Input iconPosition='left'
                        type="text"
                        placeholder="Email"
                        required
                        value={this.state.email}
                        pattern="[^@\s]+@[^@\s]+\.[^@\s]+"
                        onChange={this.handleEmailChange}
                      >
                        <Icon name='at' />
                        <input />
                      </Input>
                    </Form.Field>
                  </Segment>
                  {this.renderConfirmButton()}
                </Grid.Column>
              </Grid.Row>
            </Grid>
          </Form>
          {this.renderLoading()}
        </div >
      )
    }

    return (
      <div>
        <h1>User Info</h1>

        <Grid columns={2} divided>
          <Grid.Row stretched>
            <Grid.Column width={4}>
              <Segment>
                <Button as="label" htmlFor="file" type="button" >
                  Avatar
                  <Image size='medium'
                    src={this.state.avatarUrl} circular />
                </Button>
              </Segment>
            </Grid.Column>

            <Grid.Column width={12}>
              <Segment>
                <Label basic>Name</Label>
                <Input type="text" value={this.state.name} readOnly />
              </Segment>
              <Segment>
                <Label basic>Email</Label>
                <Input iconPosition='left' type="text" readOnly value={this.state.email}                  >
                  <Icon name='at' />
                  <input />
                </Input>
              </Segment>

              <div>
                <Button content='Edit' color='green' onClick={this.setOnEdit} />
                <Button content='Back' color='red' onClick={this.setOnBack} />
              </div>
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </div >
    )
  }

  renderConfirmButton() {
    return (
      <div>
        <Button color='green' type="submit" disabled={UserState.Edit != this.state.editState}>
          Save
        </Button>
        <Button color='red' onClick={this.setCancelEdit} disabled={UserState.Edit != this.state.editState}>
          Cancel
        </Button>
      </div >
    )
  }

  renderLoading() {
    if (UserState.Editing < this.state.editState && this.state.editState < UserState.Finish) {
      return (
        <Grid.Row>
          <Loader indeterminate active inline="centered">
            Uploading
          </Loader>
        </Grid.Row>
      )
    }
  }
}
