export interface ILoginRequest {
  email: string;
  password: string;
}

export interface ILoginResponse {
  access: string;
  refresh: string;
}

export interface ISignUpRequest {
  name: string;
  email: string;
  phone: string;
  address: string;
  password: string;
}

export interface ISignUpForm extends ISignUpRequest {
  password2: string;
}
