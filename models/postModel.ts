export class PostModel {
  private postId: string;
  private organizationId: string;
  private authorId: string;
  private content?: string;
  private privacyLevel?: string;
  private targetMembershipId?: string;
  private createdAt?: string;
  private postPhotos?: string[];

  constructor(
    postId: string,
    organizationId: string,
    authorId: string,
    content?: string,
    privacyLevel?: string,
    targetMembershipId?: string,
    createdAt?: string,
    postPhotos?: string[]
  ) {
    this.postId = postId;
    this.organizationId = organizationId;
    this.authorId = authorId;
    this.content = content;
    this.privacyLevel = privacyLevel;
    this.targetMembershipId = targetMembershipId;
    this.createdAt = createdAt;
    this.postPhotos = postPhotos;
  }

  public getPostId(): string {
    return this.postId;
  }

  public setPostId(postId: string): void {
    this.postId = postId;
  }

  public getOrganizationId(): string {
    return this.organizationId;
  }

  public setOrganizationId(organizationId: string): void {
    this.organizationId = organizationId;
  }

  public getAuthorId(): string {
    return this.authorId;
  }

  public setAuthorId(authorId: string): void {
    this.authorId = authorId;
  }

  public getContent(): string | undefined {
    return this.content;
  }

  public setContent(content?: string): void {
    this.content = content;
  }

  public getPrivacyLevel(): string | undefined {
    return this.privacyLevel;
  }

  public setPrivacyLevel(privacyLevel?: string): void {
    this.privacyLevel = privacyLevel;
  }

  public getTargetMembershipId(): string | undefined {
    return this.targetMembershipId;
  }

  public setTargetMembershipId(targetMembershipId?: string): void {
    this.targetMembershipId = targetMembershipId;
  }

  public getCreatedAt(): string | undefined {
    return this.createdAt;
  }

  public setCreatedAt(createdAt?: string): void {
    this.createdAt = createdAt;
  }

  public getPostPhotos(): string[] | undefined {
    return this.postPhotos;
  }

  public setPostPhotos(postPhotos?: string[]): void {
    this.postPhotos = postPhotos;
  }
}