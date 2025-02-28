import LazyVisibleMessage from '../pages/WebsiteGeneratorPage/LazyVisibleMessage'
import LoadingWebsiteLottie from '../pages/WebsiteGeneratorPage/LoadingWebsite.lottie'

export const AWSResearchLoader = () => {
  return (
    <div className="flex flex-col justify-center items-center gap-2">
      <LoadingWebsiteLottie className="w-[8rem]" />
      <span className="text-sm text-gray-400">Searching AWS Resources...</span>
      <span className="text-xs text-gray-400">
        <LazyVisibleMessage message="Searching for related resources" />
      </span>
    </div>
  )
}
