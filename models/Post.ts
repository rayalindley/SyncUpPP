// @/models/Post.ts

export class Post {
  constructor(
    public postid: string,
    public organizationid: string,
    public authorid: string,
    public content?: string,
    public privacylevel?: string,
    public targetmembershipid?: string,
    public createdat?: string,
    public postphotos?: string[]
  ) {}
}
