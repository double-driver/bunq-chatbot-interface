export interface IBunqUser {
    user_id:Number;
    user_public_key: string;
    user_private_key: string;
    server_public_key: string;
    token: string;
}

export class bunqUser implements IBunqUser {
    user_id:Number = 0;
    user_public_key: string = "";
    user_private_key: string = "";
    server_public_key: string = "";
    token: string = "";
}