import { useEffect } from 'react'
import { Button } from 'flowbite-react'
import toast from 'react-hot-toast'
import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom'

const ErrorPage = () => {
  const error = useRouteError()

  useEffect(() => {
    console.error({ error })
    toast.error('Oops! Something went wrong.')
  }, [error])

  const getErrorMessage = () => {
    if (isRouteErrorResponse(error)) {
      return `${error.status} ${error.statusText}`
    }
    if (error instanceof Error) {
      return error.message
    }
    return JSON.stringify(error)
  }

  return (
    <div className="flex-1 p-4 bg-gray-100 overflow-x-auto dark:bg-gray-900 h-screen gap-2 flex flex-col justify-center content-center items-center">
      <h1 className="text-xl">Oops!</h1>
      <div>Error: {getErrorMessage()}</div>
      <Link to={'/'}>
        <Button color={'gray'}>Return to HomePage</Button>
      </Link>
    </div>
  )
}
export default ErrorPage
