interface Server{
    host: string;
    port: number;
};

export const server: Server = {
    host: String(process.env.REACT_APP_SERVER_HOST),
    port: Number(process.env.REACT_APP_SERVER_PORT),
};

export const server_url = server.host+":"+server.port;
