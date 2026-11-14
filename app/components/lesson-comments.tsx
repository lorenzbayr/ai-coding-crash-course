import { useEffect, useRef, useState } from "react";
import { Link, useFetcher } from "react-router";
import { MessageSquare, Pencil, Trash2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { UserAvatar } from "~/components/user-avatar";
import { MAX_COMMENT_LENGTH, formatRelativeTime } from "~/lib/comments";

export type LessonComment = {
  id: number;
  userId: number;
  body: string;
  createdAt: string;
  authorName: string;
  authorAvatarUrl: string | null;
  isInstructor: boolean;
  edited: boolean;
};

type CommentActionData = { ok: boolean; error: string | null };

export function LessonComments({
  lessonId,
  courseSlug,
  comments,
  canComment,
  canModerate,
  currentUserId,
}: {
  lessonId: number;
  courseSlug: string;
  comments: LessonComment[];
  canComment: boolean;
  canModerate: boolean;
  currentUserId: number | null;
}) {
  return (
    <section className="mt-10 border-t pt-6" aria-labelledby="discussion-heading">
      <h2
        id="discussion-heading"
        className="mb-4 flex items-center gap-2 text-lg font-semibold"
      >
        <MessageSquare className="size-5" />
        Discussion
        {canComment && comments.length > 0 && (
          <span className="text-sm font-normal text-muted-foreground">
            ({comments.length})
          </span>
        )}
      </h2>

      {!canComment ? (
        <p className="text-sm text-muted-foreground">
          {currentUserId ? (
            <>
              <Link to={`/courses/${courseSlug}`} className="underline">
                Enroll in this course
              </Link>{" "}
              to join the discussion.
            </>
          ) : (
            <>
              <Link to="/login" className="underline">
                Log in
              </Link>{" "}
              to join the discussion.
            </>
          )}
        </p>
      ) : (
        <>
          <NewCommentForm lessonId={lessonId} />

          {comments.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">
              No comments yet. Start the discussion!
            </p>
          ) : (
            <ul className="mt-6 space-y-6">
              {comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  canEdit={comment.userId === currentUserId}
                  canDelete={comment.userId === currentUserId || canModerate}
                />
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}

function CharacterCount({ length }: { length: number }) {
  const over = length > MAX_COMMENT_LENGTH;
  return (
    <span
      className={
        over ? "text-xs text-destructive" : "text-xs text-muted-foreground"
      }
    >
      {length}/{MAX_COMMENT_LENGTH}
    </span>
  );
}

function NewCommentForm({ lessonId }: { lessonId: number }) {
  const fetcher = useFetcher<CommentActionData>({
    key: `add-comment-${lessonId}`,
  });
  const [body, setBody] = useState("");
  const isSubmitting = fetcher.state !== "idle";
  const trimmedLength = body.trim().length;

  // Clear the box once the comment has been saved
  const wasSubmitting = useRef(false);
  useEffect(() => {
    if (wasSubmitting.current && fetcher.state === "idle" && fetcher.data?.ok) {
      setBody("");
    }
    wasSubmitting.current = fetcher.state !== "idle";
  }, [fetcher.state, fetcher.data]);

  return (
    <fetcher.Form method="post" className="space-y-2">
      <input type="hidden" name="intent" value="add-comment" />
      <Textarea
        name="body"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Ask a question or share a thought…"
        aria-label="New comment"
        rows={3}
      />
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <CharacterCount length={trimmedLength} />
          {fetcher.state === "idle" && fetcher.data?.error && (
            <span className="text-xs text-destructive">
              {fetcher.data.error}
            </span>
          )}
        </div>
        <Button
          type="submit"
          size="sm"
          disabled={
            isSubmitting ||
            trimmedLength === 0 ||
            trimmedLength > MAX_COMMENT_LENGTH
          }
        >
          {isSubmitting ? "Posting…" : "Post comment"}
        </Button>
      </div>
    </fetcher.Form>
  );
}

function CommentItem({
  comment,
  canEdit,
  canDelete,
}: {
  comment: LessonComment;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const editFetcher = useFetcher<CommentActionData>();
  const deleteFetcher = useFetcher<CommentActionData>();
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(comment.body);

  // Leave edit mode once the edit has been saved
  const wasSaving = useRef(false);
  useEffect(() => {
    if (
      wasSaving.current &&
      editFetcher.state === "idle" &&
      editFetcher.data?.ok
    ) {
      setIsEditing(false);
    }
    wasSaving.current = editFetcher.state !== "idle";
  }, [editFetcher.state, editFetcher.data]);

  const isDeleting = deleteFetcher.state !== "idle";
  const isSaving = editFetcher.state !== "idle";
  const draftLength = draft.trim().length;
  const error =
    (editFetcher.state === "idle" && editFetcher.data?.error) ||
    (deleteFetcher.state === "idle" && deleteFetcher.data?.error) ||
    null;

  if (isDeleting) return null;

  return (
    <li className="flex gap-3">
      <UserAvatar
        name={comment.authorName}
        avatarUrl={comment.authorAvatarUrl}
        className="shrink-0"
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <span className="font-medium">{comment.authorName}</span>
          {comment.isInstructor && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
              Instructor
            </span>
          )}
          <time
            dateTime={comment.createdAt}
            title={new Date(comment.createdAt).toLocaleString()}
            className="text-xs text-muted-foreground"
            suppressHydrationWarning
          >
            {formatRelativeTime(comment.createdAt)}
          </time>
          {comment.edited && (
            <span className="text-xs text-muted-foreground">(edited)</span>
          )}
        </div>

        {isEditing ? (
          <editFetcher.Form method="post" className="mt-2 space-y-2">
            <input type="hidden" name="intent" value="edit-comment" />
            <input type="hidden" name="commentId" value={comment.id} />
            <Textarea
              name="body"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              aria-label="Edit comment"
              rows={3}
              autoFocus
            />
            <div className="flex items-center justify-between gap-2">
              <CharacterCount length={draftLength} />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDraft(comment.body);
                    setIsEditing(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={
                    isSaving ||
                    draftLength === 0 ||
                    draftLength > MAX_COMMENT_LENGTH
                  }
                >
                  {isSaving ? "Saving…" : "Save"}
                </Button>
              </div>
            </div>
          </editFetcher.Form>
        ) : (
          <p className="mt-1 whitespace-pre-wrap break-words text-sm">
            {comment.body}
          </p>
        )}

        {error && <p className="mt-1 text-xs text-destructive">{error}</p>}

        {!isEditing && (canEdit || canDelete) && (
          <div className="mt-1 flex gap-1">
            {canEdit && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground"
                onClick={() => {
                  setDraft(comment.body);
                  setIsEditing(true);
                }}
              >
                <Pencil className="mr-1 size-3" />
                Edit
              </Button>
            )}
            {canDelete && (
              <deleteFetcher.Form
                method="post"
                onSubmit={(e) => {
                  if (!window.confirm("Delete this comment?")) {
                    e.preventDefault();
                  }
                }}
              >
                <input type="hidden" name="intent" value="delete-comment" />
                <input type="hidden" name="commentId" value={comment.id} />
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="mr-1 size-3" />
                  Delete
                </Button>
              </deleteFetcher.Form>
            )}
          </div>
        )}
      </div>
    </li>
  );
}
