import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'

import { verify } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
import Axios from 'axios'
// import { Jwt } from '../../auth/Jwt'
import { JwtPayload } from '../../auth/JwtPayload'

const logger = createLogger('auth')

// TODO: Provide a URL that can be used to download a certificate that can be used
// to verify JWT token signature.
// To get this URL you need to go to an Auth0 page -> Show Advanced Settings -> Endpoints -> JSON Web Key Set
const jwksUrl = 'https://tuyendhq.us.auth0.com/.well-known/jwks.json'

export const handler = async (event: CustomAuthorizerEvent): Promise<CustomAuthorizerResult> => {
  logger.info('Authorizing a user', event.authorizationToken)
  logger.info('user request path', event.path)
  try {
    const jwtToken = await verifyToken(event.authorizationToken)
    logger.info('User was authorized', jwtToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function verifyToken(authHeader: string): Promise<JwtPayload> {
  const token = getToken(authHeader)

  if (!token) {
    logger.error('Authorizing a user', token)

    throw new Error('Invalid authentication token')
  }

  // const jwt: Jwt = decode(token, { complete: true }) as Jwt
  const certInfo = await getCertificate();

  logger.info('[verifyToken] try to verify token with cert: ', certInfo)
  const jwtToken = verify(token, certInfo, { algorithms: ['RS256'] }) as JwtPayload;
  logger.info('[verifyToken] jwtToken: ', jwtToken)

  return jwtToken
}

function getToken(authHeader: string): string {
  if (!authHeader) {
    logger.error('No authentication header')
    throw new Error('No authentication header')
  }

  if (!authHeader.toLowerCase().startsWith('bearer ')) {
    logger.error('Invalid authentication header')
    throw new Error('Invalid authentication header')
  }

  const split = authHeader.split(' ')
  const token = split[1];

  logger.info('[getToken] User token', token)
  return token;
}

async function getCertificate(): Promise<string> {
  try {
    const res = await Axios.get(jwksUrl);
    const data = res['data']['keys'][0]['x5c'][0];
    return `-----BEGIN CERTIFICATE-----\n${data}\n-----END CERTIFICATE-----`;
  } catch (err) {
    logger.error('Can\'t fetch Auth certificate. Error: ', err);
    throw new Error('Can\'t fetch Auth certificate')
  }
}