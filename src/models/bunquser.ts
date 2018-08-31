export interface IBunqUser {
    username: string;
    token: string
}

export class bunqUser implements IBunqUser {
    
    constructor(username:string, token:string) {
        this.username = username;
        this.token = token;
    }
    
    username: string;
    token: string;

    
}