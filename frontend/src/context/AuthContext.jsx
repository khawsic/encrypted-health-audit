import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [accessToken, setAccessToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load from sessionStorage on app start
    const storedToken = sessionStorage.getItem('access_token')
    const storedUser = sessionStorage.getItem('user')
    if (storedToken && storedUser) {
      setAccessToken(storedToken)
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  const login = (userData, token, refreshToken) => {
    setAccessToken(token)
    setUser(userData)
    sessionStorage.setItem('access_token', token)
    sessionStorage.setItem('refresh_token', refreshToken)
    sessionStorage.setItem('user', JSON.stringify(userData))
  }

  const logout = () => {
    setAccessToken(null)
    setUser(null)
    sessionStorage.clear()
  }

  const updateToken = (newToken) => {
    setAccessToken(newToken)
    sessionStorage.setItem('access_token', newToken)
  }

  return (
    <AuthContext.Provider value={{
      user,
      accessToken,
      loading,
      login,
      logout,
      updateToken
    }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)