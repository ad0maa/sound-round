import { Metadata } from '@cedarjs/web'

import ResultsCell from 'src/components/ResultsCell'

type ResultsPageProps = {
  id: string
  roundId: string
}

const ResultsPage = ({ roundId }: ResultsPageProps) => {
  return (
    <>
      <Metadata title="Results" description="Round results" />
      <ResultsCell roundId={roundId} />
    </>
  )
}

export default ResultsPage
