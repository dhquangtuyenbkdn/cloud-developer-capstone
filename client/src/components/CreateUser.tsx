import * as React from 'react'
import { Form, Button, Grid, Image, Segment, Input, Label, Icon, Loader } from 'semantic-ui-react'
import Auth from '../auth/Auth'
import { createUser, getAvatarUrl } from '../api/user-api'
import { uploadFile } from '../api/file-api'
import { User } from '../types/User'

enum UserState {
  Create,
  Creating,
  Created,
  FetchingPresignedUrl,
  UploadingFile,
  Finish,
}

interface EditUserProps {
  auth: Auth
  history: any
}

interface EditUserState {
  file: any
  fileUrl: any
  name: string
  email: string
  avatarUrl: string
  createState: UserState
  // uploadState: UploadState
}

const defaultAvatarURL = 'https://react.semantic-ui.com/images/avatar/small/elliot.jpg';

export class CreateUser extends React.PureComponent<EditUserProps, EditUserState> {
  state: EditUserState = {
    file: undefined,
    fileUrl: '',
    name: '',
    email: '',
    avatarUrl: defaultAvatarURL,
    createState: UserState.Create,
    // uploadState: UploadState.NoUpload
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
      if (!this.state.file) {
        alert('File should be selected')
        return
      }

      this.setUserState(UserState.Creating)
      const user = await createUser(this.props.auth.getIdToken(), { name: this.state.name, email: this.state.email })
      this.setUserState(UserState.Created)

      if (this.state.file && user.avatarUrl) {
        this.setUserState(UserState.UploadingFile)
        await uploadFile(user.avatarUrl, this.state.file)

        localStorage.setItem('user', JSON.stringify(user))
        this.setUserState(UserState.Finish)
      }
      this.props.history.push(`/`)
    } catch (e) {
      alert('Could not upload a file: ' + (e as Error).message)
      this.setUserState(UserState.Create)
    } finally {
      // this.setUploadState(UploadState.NoUpload)
    }
  }


  setUserState(createState: UserState) {
    this.setState({
      createState
    })
  }

  render() {
    return (
      <div>
        <h1>Create user</h1>
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

  renderConfirmButton() {
    return (
      <div>
        <Button color='green' type="submit" disabled={this.state.createState != UserState.Create}>
          Save
        </Button>
      </div >
    )
  }

  renderLoading() {
    if (this.state.createState != UserState.Create && this.state.createState != UserState.Finish) {
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
