import { ApiErrorCode } from '@server/constants/error'
import { ApiError } from '@server/types/error'
import axios from 'axios'
import crypto from 'crypto'

export interface NavidromeUser {
  username: string
  email: string
  adminRole: boolean
  id: string
}

interface SubsonicResponse {
  'subsonic-response': {
    status: 'ok' | 'failed'
    version: string
    user?: {
      username: string
      email?: string
      adminRole?: boolean
      id?: string
    }
    error?: {
      code: number
      message: string
    }
  }
}

class NavidromeAPI {
  private baseUrl: string

  constructor(baseUrl: string) {
    // Strip trailing slash
    this.baseUrl = baseUrl.replace(/\/$/, '')
  }

  private buildAuthParams(
    username: string,
    password: string
  ): Record<string, string> {
    const salt = crypto.randomBytes(8).toString('hex')
    const token = crypto
      .createHash('md5')
      .update(password + salt)
      .digest('hex')

    return {
      u: username,
      t: token,
      s: salt,
      v: '1.16.1',
      c: 'musicseerr',
      f: 'json',
    }
  }

  public async login(
    username: string,
    password: string
  ): Promise<NavidromeUser> {
    const params = this.buildAuthParams(username, password)

    // Step 1: ping to verify credentials — simpler endpoint, always works
    try {
      const pingResponse = await axios.get<SubsonicResponse>(
        `${this.baseUrl}/rest/ping.view`,
        { params, timeout: 10000 }
      )
      const pingResp = pingResponse.data['subsonic-response']
      if (pingResp.status !== 'ok') {
        const code = pingResp.error?.code ?? 0
        if (code === 40 || code === 41) {
          throw new ApiError(401, ApiErrorCode.InvalidCredentials)
        }
        throw new ApiError(500, ApiErrorCode.Unknown)
      }
    } catch (e) {
      if (e instanceof ApiError) throw e
      if (e.response?.status === 401 || e.response?.status === 403) {
        throw new ApiError(401, ApiErrorCode.InvalidCredentials)
      }
      if (!e.response) {
        throw new ApiError(404, ApiErrorCode.InvalidUrl)
      }
      throw new ApiError(500, ApiErrorCode.Unknown)
    }

    // Step 2: try to get user details and admin status.
    // getUser.view requires admin rights in newer Navidrome versions —
    // if it fails for any reason other than bad credentials, fall back
    // to returning basic user info with adminRole: false (the auth route
    // will then reject non-admins at setup time with a clear error).
    try {
      const response = await axios.get<SubsonicResponse>(
        `${this.baseUrl}/rest/getUser.view`,
        { params: { ...params, username }, timeout: 10000 }
      )
      const subsonicResp = response.data['subsonic-response']
      if (subsonicResp.status === 'ok' && subsonicResp.user) {
        const user = subsonicResp.user
        return {
          username: user.username,
          email: user.email ?? '',
          adminRole: user.adminRole ?? false,
          id: user.id ?? username,
        }
      }
    } catch {
      // getUser.view unavailable — fall through to basic user info
    }

    // Fallback: credentials are valid but we couldn't confirm admin status
    return {
      username,
      email: '',
      adminRole: false,
      id: username,
    }
  }

  public async ping(username: string, password: string): Promise<boolean> {
    const params = this.buildAuthParams(username, password)

    try {
      const response = await axios.get<SubsonicResponse>(
        `${this.baseUrl}/rest/ping.view`,
        {
          params,
          timeout: 10000,
        }
      )

      const subsonicResp = response.data['subsonic-response']
      return subsonicResp.status === 'ok'
    } catch {
      return false
    }
  }
}

export default NavidromeAPI
