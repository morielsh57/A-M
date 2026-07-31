
export interface IUser {
  user_id: string;
  name: string;
  email: string;
  role: "supplier" | "admin" | "customer";
  phone: string;
  address: string;
  avatar?: string;
  isValidEmail?: boolean;
  date_created: Date;
}

export interface IGetUserByIdResponse {
  data: IUser;
  msg: string;
}