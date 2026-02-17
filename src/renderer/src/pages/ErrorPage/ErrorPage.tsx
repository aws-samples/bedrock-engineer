import { Button } from 'flowbite-react'
import toast from 'react-hot-toast'
import { useRouteError, Link } from 'react-router-dom'

const ErrorPage = () => {
  const error = useRouteError()
  console.error({ error })
  toast.error('Oops! Something went wrong.')

  return (
    <div className="flex-1 p-4 bg-gray-100 overflow-x-auto dark:bg-gray-900 h-screen gap-2 flex flex-col justify-center content-center items-center">
      <h1 className="text-xl">Oops!</h1>
      <div>Error: {JSON.stringify(error)}</div>
      <Link to={'/'}>
        <Button color={'gray'}>Return to HomePage</Button>
      </Link>
    </div>
  )
}
export default ErrorPage
