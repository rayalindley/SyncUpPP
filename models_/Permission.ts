// models/Permission.ts
export class Permission {
  constructor(
    public permId: string,
    public category: string,
    public name: string,
    public description: string,
    public permKey: string
  ) {}
}
