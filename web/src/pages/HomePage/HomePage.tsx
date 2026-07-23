import { useEffect } from 'react'

import { navigate, routes } from '@cedarjs/router'
import { Metadata } from '@cedarjs/web'

const HomePage = () => {
  useEffect(() => {
    navigate(routes.leagues(), { replace: true })
  }, [])

  return <Metadata title="Home" description="Music league with friends" />
}

export default HomePage
