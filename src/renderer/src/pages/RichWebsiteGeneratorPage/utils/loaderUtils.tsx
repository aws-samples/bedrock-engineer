import { Loader } from '@renderer/components/Loader'
import { LoaderWithReasoning } from '../../WebsiteGeneratorPage/components/LoaderWithReasoning'
import { RagLoader } from '../../WebsiteGeneratorPage/components/RagLoader'
import { WebLoader } from '../../../components/WebLoader'

/**
 * Get the appropriate loader component based on the tool being executed
 * @param tool - The name of the tool being executed
 * @param reasoningText - The reasoning text to display
 * @returns The loader component wrapped with reasoning text
 */
export function getLoaderComponent(tool: string | null, reasoningText: string) {
  let loader

  if (tool === 'tavilySearch') {
    loader = <WebLoader />
  } else if (tool === 'retrieve') {
    loader = <RagLoader />
  } else {
    loader = <Loader />
  }

  return <LoaderWithReasoning reasoningText={reasoningText}>{loader}</LoaderWithReasoning>
}
