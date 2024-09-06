// models/CombinedUserData.ts
export class CombinedUserData {
  constructor(
    public id: string,
    public email: string,
    public role: string,
    public createdAt: Date,
    public updatedAt: Date,
    public firstName: string,
    public lastName: string,
    public gender: string,
    public dateOfBirth: Date,
    public description: string,
    public company: string,
    public website: string,
    public updatedat: Date
  ) {}
}
