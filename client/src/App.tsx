import React, { Component } from 'react'
import { Link, Route, Router, Switch } from 'react-router-dom'
import { Grid, Menu, Segment, Loader, Label, Image } from 'semantic-ui-react'

import Auth from './auth/Auth'
import { EditTodo } from './components/EditTodo'
import { LogIn } from './components/LogIn'
import { NotFound } from './components/NotFound'
import { Todos } from './components/Todos'
import { User } from './types/User'
import { getUser } from './api/user-api'
import { CreateUser } from './components/CreateUser'
import { EditUser } from './components/EditUser'

export interface AppProps { }

export interface AppProps {
  auth: Auth
  user: User
  history: any
}

enum LoadState {
  Start,
  Loading,
  Create,
  Loaded,
}

export interface AppState {
  user: User[]
  users: User[]
  loadUserState: LoadState
}

export default class App extends Component<AppProps, AppState> {
  state: AppState = {
    user: [],
    users: [],
    loadUserState: LoadState.Start
  }

  constructor(props: AppProps) {
    super(props)

    this.handleLogin = this.handleLogin.bind(this)
    this.handleLogout = this.handleLogout.bind(this)
  }

  async handleLogin() {
    this.props.auth.login()
  }

  handleLogout() {
    this.props.auth.logout()
  }

  async componentDidMount() {
    try {
      await new Promise(res => setTimeout(res, 1000));
      if (this.props.auth.isAuthenticated()) {
        this.setState({ loadUserState: LoadState.Loading });
        await this.getLoginUser();
      }
      else {
      }
    } catch (e) {
      alert(`Failed to fetch user: ${(e as Error).message}`)
      localStorage.removeItem('user');
      if (this.props.auth.isAuthenticated()) {
        this.setState({ loadUserState: LoadState.Start });
      }
      else {
        this.setState({ loadUserState: LoadState.Loaded });
      }
    }
  }


  render() {
    return (
      <div>
        <Segment style={{ padding: '8em 0em' }} vertical>
          <Grid container stackable verticalAlign="middle">
            <Grid.Row>
              <Grid.Column width={16}>
                <Router history={this.props.history}>
                  {this.generateMenu()}

                  {this.generateCurrentPage()}
                </Router>
              </Grid.Column>
            </Grid.Row>
          </Grid>
        </Segment>
      </div>
    )
  }

  generateMenu() {
    if (this.props.auth.isAuthenticated() && this.state.loadUserState == LoadState.Start) {
      // setTimeout(() => {
      // this.getLoginUser();
      this.renderLoading();
      // }, 0)

      return (
        <Menu>
          <Menu.Item name="home">
            <Link to="/">Home</Link>
          </Menu.Item>
        </Menu>
      )
    }

    if (this.props.auth.isAuthenticated() && this.state.loadUserState == LoadState.Loaded) {
      return (
        <Menu>
          <Menu.Item name="home">
            <Link to="/">Home</Link>
          </Menu.Item>

          <Menu.Menu position="right">{this.logInLogOutButton()}</Menu.Menu>
          {this.generateUser()}
        </Menu>
      )
    }
  }

  logInLogOutButton() {
    if (this.props.auth.isAuthenticated() && this.state.loadUserState == LoadState.Loaded) {
      return (
        <Menu.Item name="logout" onClick={this.handleLogout}>
          Log Out
        </Menu.Item>
      )
    } else {
      return (
        <Menu.Item name="login" onClick={this.handleLogin}>
          Log In
        </Menu.Item>
      )
    }
  }

  generateUser() {
    if (this.state.user.length > 0) {
      let userItem = this.state.user[0];
      return (
        <Menu.Item>
          <Link to="/user/update">
            <Label>
              <Image avatar spaced='right' src={userItem.avatarUrl ? userItem.avatarUrl : 'https://react.semantic-ui.com/images/avatar/small/elliot.jpg'} />
              {userItem.name}
            </Label>
          </Link>
        </Menu.Item>
      )
    }
  }


  generateCurrentPage() {
    if (!this.props.auth.isAuthenticated()) {
      return <LogIn auth={this.props.auth} />
    }

    return (
      <Switch>
        <Route
          path="/"
          exact
          render={props => {
            return <Todos {...props} auth={this.props.auth} user={this.state.user[0]} />
          }}
        />

        <Route
          path="/user/create"
          exact
          render={props => {
            return <CreateUser {...props} auth={this.props.auth} />
          }}
        />

        <Route
          path="/todos/:todoId/edit"
          exact
          render={props => {
            return <EditTodo {...props} auth={this.props.auth} />
          }}
        />

        <Route
          path="/user/update"
          exact
          render={props => {
            return <EditUser {...props} auth={this.props.auth} user={this.state.user[0]} />
          }}
        />
        <Route component={NotFound} />
      </Switch>
    )
  }

  async getLoginUser() {
    try {
      let user: User[] = [];
      let oldUser = localStorage.getItem('user');
      if (oldUser) {
        let userItem = JSON.parse(oldUser) as User;
        user.push(userItem)
        this.setState({
          user: user,
          loadUserState: LoadState.Loaded
        })
      } else {
        const userItem = await getUser(this.props.auth.getIdToken())

        if (userItem) {
          localStorage.setItem('user', JSON.stringify(userItem));
          user.push(userItem)
          this.setState({
            user: user,
            loadUserState: LoadState.Loaded
          })
        }
        else {
          this.props.history.push(`/user/create`)
          this.setState({
            loadUserState: LoadState.Create
          })
        }
      }
    } catch (error) {
      // alert('Get user failed: ' + error)

      this.props.history.push(`/user/create`)

      this.setState({
        loadUserState: LoadState.Create
      })
    }
  }

  renderLoading() {
    return (
      <Grid.Row>
        <Loader indeterminate active inline="centered">
          Loading
        </Loader>
      </Grid.Row>
    )
  }
}
