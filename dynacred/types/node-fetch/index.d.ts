declare module 'node-fetch';

interface Repsonse {
    text: () => Promise<string>;
    ok: boolean;
}

declare function fetch(url: string): Promise<Response>;
