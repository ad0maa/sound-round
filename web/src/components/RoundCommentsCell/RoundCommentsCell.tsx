import { useState } from 'react'

import { MessageCircle, Trash2 } from 'lucide-react'
import type {
  RoundCommentsQuery,
  RoundCommentsQueryVariables,
} from 'types/graphql'

import type { TypedDocumentNode } from '@cedarjs/web'
import { useMutation } from '@cedarjs/web'
import { toast } from '@cedarjs/web/toast'

import { useAuth } from 'src/auth'
import { Button } from 'src/components/ui/button'
import { Card, CardContent } from 'src/components/ui/card'
import { Textarea } from 'src/components/ui/textarea'

export const QUERY: TypedDocumentNode<
  RoundCommentsQuery,
  RoundCommentsQueryVariables
> = gql`
  query RoundCommentsQuery($roundId: String!) {
    comments(roundId: $roundId) {
      id
      body
      createdAt
      user {
        displayName
      }
    }
  }
`

const CREATE_COMMENT = gql`
  mutation CreateCommentMutation($input: CreateCommentInput!) {
    createComment(input: $input) {
      id
    }
  }
`

const DELETE_COMMENT = gql`
  mutation DeleteCommentMutation($id: String!) {
    deleteComment(id: $id)
  }
`

export const Loading = () => (
  <p className="text-sm text-muted-foreground">Loading comments…</p>
)

export const Failure = ({ error }: { error?: { message: string } }) => (
  <p className="text-sm text-destructive">Error: {error?.message}</p>
)

type CellProps = RoundCommentsQuery & RoundCommentsQueryVariables

const CommentComposer = ({ roundId }: { roundId: string }) => {
  const [body, setBody] = useState('')

  const [createComment, { loading }] = useMutation(CREATE_COMMENT, {
    onCompleted: () => setBody(''),
    onError: (error) => toast.error(error.message),
    refetchQueries: [{ query: QUERY, variables: { roundId } }],
  })

  const onPost = (e: React.FormEvent) => {
    e.preventDefault()
    if (!body.trim()) return
    createComment({
      variables: { input: { roundId, body: body.trim() } },
    })
  }

  return (
    <form onSubmit={onPost} className="space-y-2">
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={1000}
        placeholder="Hot takes welcome — the votes are in."
        aria-label="Add a comment"
      />
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={loading || !body.trim()}>
          {loading ? 'Posting…' : 'Post comment'}
        </Button>
      </div>
    </form>
  )
}

const CommentsList = ({
  comments,
  roundId,
}: {
  comments: RoundCommentsQuery['comments']
  roundId: string
}) => {
  const { currentUser } = useAuth()

  const [deleteComment] = useMutation(DELETE_COMMENT, {
    onError: (error) => toast.error(error.message),
    refetchQueries: [{ query: QUERY, variables: { roundId } }],
  })

  if (comments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No comments yet — be the first to weigh in.
      </p>
    )
  }

  return (
    <ul className="space-y-3">
      {comments.map((comment) => {
        const isMine = comment.user.displayName === currentUser?.displayName
        return (
          <li key={comment.id} className="group flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm">
                <span className="font-semibold">
                  {comment.user.displayName}
                </span>
                <span className="ml-2 text-xs text-muted-foreground">
                  {new Date(comment.createdAt).toLocaleString()}
                </span>
              </p>
              <p className="whitespace-pre-wrap text-sm text-foreground/90">
                {comment.body}
              </p>
            </div>
            {isMine && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="opacity-0 transition-opacity group-hover:opacity-100"
                aria-label="Delete comment"
                onClick={() => deleteComment({ variables: { id: comment.id } })}
              >
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            )}
          </li>
        )
      })}
    </ul>
  )
}

export const Empty = ({ roundId }: RoundCommentsQueryVariables) => (
  <Card>
    <CardContent className="space-y-4 py-4">
      <p className="flex items-center gap-2 text-sm font-medium">
        <MessageCircle className="h-4 w-4" />
        Comments
      </p>
      <CommentsList comments={[]} roundId={roundId} />
      <CommentComposer roundId={roundId} />
    </CardContent>
  </Card>
)

export const Success = ({ comments, roundId }: CellProps) => {
  return (
    <Card>
      <CardContent className="space-y-4 py-4">
        <p className="flex items-center gap-2 text-sm font-medium">
          <MessageCircle className="h-4 w-4" />
          Comments
        </p>
        <CommentsList comments={comments} roundId={roundId} />
        <CommentComposer roundId={roundId} />
      </CardContent>
    </Card>
  )
}
