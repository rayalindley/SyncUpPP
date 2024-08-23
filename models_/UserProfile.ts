// models/UserProfile.ts
export class UserProfile {
  constructor(
    public userId: string,
    public firstName: string,
    public lastName: string,
    public gender: string,
    public dateOfBirth: Date,
    public description: string,
    public company: string,
    public profilePicture: string,
    public website: string,
    public updatedAt: Date,
    public id: number
  ) {}
}
