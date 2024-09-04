// postCommentModel.ts
export class PostCommentModel {
  private commentId: string;
  private createdAt: Date;
  private postId: string;
  private authorId?: string;
  private comment?: string;

  constructor(
    commentId: string,
    createdAt: Date,
    postId: string,
    authorId?: string,
    comment?: string
  ) {
    this.commentId = commentId;
    this.createdAt = createdAt;
    this.postId = postId;
    this.authorId = authorId;
    this.comment = comment;
  }

  // Each attribute has corresponding getters and setters. Use those.

  public getCommentId(): string {
    return this.commentId;
  }

  public setCommentId(commentId: string): void {
    this.commentId = commentId;
  }

  public getCreatedAt(): Date {
    return this.createdAt;
  }

  public setCreatedAt(createdAt: Date): void {
    this.createdAt = createdAt;
  }

  public getPostId(): string {
    return this.postId;
  }

  public setPostId(postId: string): void {
    this.postId = postId;
  }

  public getAuthorId(): string | undefined {
    return this.authorId;
  }

  public setAuthorId(authorId?: string): void {
    this.authorId = authorId;
  }

  public getComment(): string | undefined {
    return this.comment;
  }

  public setComment(comment?: string): void {
    this.comment = comment;
  }
}
