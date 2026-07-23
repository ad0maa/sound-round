import type { ReactNode } from 'react'

import {
  ArrowLeft,
  BarChart3,
  Flame,
  Heart,
  Target,
  TrendingUp,
  Trophy,
} from 'lucide-react'
import type { LeagueStatsQuery, LeagueStatsQueryVariables } from 'types/graphql'

import { Link, routes } from '@cedarjs/router'
import type { TypedDocumentNode } from '@cedarjs/web'

import PageContainer from 'src/components/PageContainer/PageContainer'
import PageHeader from 'src/components/PageHeader/PageHeader'
import { Button } from 'src/components/ui/button'
import { Card } from 'src/components/ui/card'

export const QUERY: TypedDocumentNode<
  LeagueStatsQuery,
  LeagueStatsQueryVariables
> = gql`
  query LeagueStatsQuery($leagueId: String!) {
    leagueStats(leagueId: $leagueId) {
      roundsCompleted
      bestSingleRound {
        displayName
        roundNumber
        theme
        trackName
        points
      }
      bestAverage {
        displayName
        average
        submissionCount
      }
      mostConsistent {
        displayName
        average
        submissionCount
      }
      biggestFan {
        fromName
        toName
        points
      }
      mostControversial {
        trackName
        artistName
        displayName
        upPoints
        downPoints
      }
      averages {
        displayName
        average
        submissionCount
      }
      pointsGiven {
        fromName
        toName
        points
      }
    }
  }
`

export const Loading = () => (
  <PageContainer>
    <p className="text-muted-foreground">Crunching the numbers…</p>
  </PageContainer>
)

export const Failure = ({ error }: { error?: { message: string } }) => (
  <PageContainer>
    <p className="text-destructive">Error: {error?.message}</p>
  </PageContainer>
)

type CellProps = LeagueStatsQuery & LeagueStatsQueryVariables

const StatCard = ({
  icon,
  title,
  children,
}: {
  icon: ReactNode
  title: string
  children: ReactNode
}) => (
  <Card className="gap-2">
    <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
      {icon}
      {title}
    </p>
    {children}
  </Card>
)

export const Success = ({ leagueStats, leagueId }: CellProps) => {
  const {
    roundsCompleted,
    bestSingleRound,
    bestAverage,
    mostConsistent,
    biggestFan,
    mostControversial,
    averages,
    pointsGiven,
  } = leagueStats

  return (
    <PageContainer>
      <Button asChild variant="ghost" className="mb-3.5 -ml-1">
        <Link to={routes.league({ id: leagueId })}>
          <ArrowLeft className="h-4 w-4" />
          Back to league
        </Link>
      </Button>

      <PageHeader
        title="Stats"
        description={
          roundsCompleted === 0
            ? 'Superlatives will appear once a round finishes.'
            : `Superlatives from ${roundsCompleted} completed round${roundsCompleted === 1 ? '' : 's'}.`
        }
      />

      {roundsCompleted === 0 ? (
        <Card className="my-5 items-center py-8 text-center">
          <p className="text-muted-foreground">
            No completed rounds yet — check back after the first results reveal.
          </p>
        </Card>
      ) : (
        <div className="my-5 space-y-5">
          <div className="grid gap-4 nav:grid-cols-2">
            {bestSingleRound && (
              <StatCard
                icon={<Trophy className="h-3.5 w-3.5" />}
                title="Best single round"
              >
                <p className="font-heading text-[28px] leading-tight">
                  {bestSingleRound.displayName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {bestSingleRound.points} points for “
                  {bestSingleRound.trackName}” in round{' '}
                  {bestSingleRound.roundNumber} ({bestSingleRound.theme})
                </p>
              </StatCard>
            )}

            {bestAverage && (
              <StatCard
                icon={<TrendingUp className="h-3.5 w-3.5" />}
                title="Best average"
              >
                <p className="font-heading text-[28px] leading-tight">
                  {bestAverage.displayName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {bestAverage.average} points per song across{' '}
                  {bestAverage.submissionCount} submissions
                </p>
              </StatCard>
            )}

            {mostConsistent && (
              <StatCard
                icon={<Target className="h-3.5 w-3.5" />}
                title="Most consistent"
              >
                <p className="font-heading text-[28px] leading-tight">
                  {mostConsistent.displayName}
                </p>
                <p className="text-sm text-muted-foreground">
                  Steadiest scores round to round (averaging{' '}
                  {mostConsistent.average})
                </p>
              </StatCard>
            )}

            {biggestFan && (
              <StatCard
                icon={<Heart className="h-3.5 w-3.5" />}
                title="Biggest fan"
              >
                <p className="font-heading text-[28px] leading-tight">
                  {biggestFan.fromName} → {biggestFan.toName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {biggestFan.points} points given and counting
                </p>
              </StatCard>
            )}

            {mostControversial && (
              <StatCard
                icon={<Flame className="h-3.5 w-3.5" />}
                title="Most controversial"
              >
                <p className="font-heading text-[28px] leading-tight">
                  “{mostControversial.trackName}”
                </p>
                <p className="text-sm text-muted-foreground">
                  {mostControversial.artistName}, from{' '}
                  {mostControversial.displayName} — +
                  {mostControversial.upPoints} / −{mostControversial.downPoints}
                </p>
              </StatCard>
            )}
          </div>

          <StatCard
            icon={<BarChart3 className="h-3.5 w-3.5" />}
            title="Average points per song"
          >
            <ul className="space-y-2">
              {averages.map((entry) => (
                <li
                  key={entry.displayName}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="font-semibold">{entry.displayName}</span>
                  <span className="text-muted-foreground">
                    {entry.average} avg · {entry.submissionCount} song
                    {entry.submissionCount === 1 ? '' : 's'}
                  </span>
                </li>
              ))}
            </ul>
          </StatCard>

          {pointsGiven.length > 0 && (
            <StatCard
              icon={<Heart className="h-3.5 w-3.5" />}
              title="Who votes for whom"
            >
              <div className="overflow-x-auto">
                <ul className="min-w-[320px] space-y-1.5">
                  {pointsGiven.map((pair) => (
                    <li
                      key={`${pair.fromName}→${pair.toName}`}
                      className="flex items-center justify-between text-sm"
                    >
                      <span>
                        {pair.fromName}{' '}
                        <span className="text-muted-foreground">→</span>{' '}
                        {pair.toName}
                      </span>
                      <span className="font-semibold">
                        {pair.points > 0 ? `+${pair.points}` : pair.points}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </StatCard>
          )}
        </div>
      )}
    </PageContainer>
  )
}
