import React from 'react'
import Auth from './auth/Auth'
import { Router, Route } from 'react-router-dom'
import Callback from './components/Callback'
// import createHistory from 'history/createBrowserHistory'
import history from "./history";
import App from './App';
import { User } from './types/User';
// const history = createHistory()

const auth = new Auth(history)
const user: User = {
  name: '',
  email: ''
}

const handleAuthentication = (props: any) => {
  const location = props.location
  if (/access_token|id_token|error/.test(location.hash)) {
    auth.handleAuthentication()
  }
}

export const makeAuthRouting = () => {
  return (
    <Router history={history}>
      <div>
        <Route
          path="/callback"
          render={props => {
            handleAuthentication(props)
            return <Callback />
          }}
        />
        <Route
          render={props => {
            return <App auth={auth} user={user} {...props} />
          }}
        />
      </div>
    </Router>
  )
}
