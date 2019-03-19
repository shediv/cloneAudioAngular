class AudioModel {
  constructor(
    public title: string,
    public _id?: string, // _id is present if editing or returning from DB
  ) { }
}

class AuthenticationModel {
  constructor(
    public token: string
  ) { }
}

export { AudioModel, AuthenticationModel };
