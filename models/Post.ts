// models/Post.ts
export class Post {
  constructor(
    public postId: string,
    public organizationId: string,
    public authorId: string,
    public content: string,
    public privacyLevel: string,
    public targetMembershipId: string,
    public createdAt: Date,
    public postPhotos: string[]
  ) {}
}
