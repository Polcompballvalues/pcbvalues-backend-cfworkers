type WebhookOptions = {
    username?: string;
    avatar?: string;
};

export default class DiscordWBHK {
    private url: string;
    private username?: string;
    private avatar?: string;

    constructor(id: string, token: string, options: WebhookOptions = {}) {
        this.url = `https://discord.com/api/webhooks/${id}/${token}`;
        this.username = options.username;
        this.avatar = options.avatar;
    }

    async ping(): Promise<string> {
        const resp = await fetch(this.url, { method: "HEAD" });

        return `HTTP ${resp.status}:${resp.statusText}`;
    }

    async post(content: string): Promise<Response> {
        const { username, avatar } = this;

        const postBody = {
            content, username,
            avatar_url: avatar
        };

        const options = {
            method: "POST",
            body: JSON.stringify(postBody),
            headers: {
                "Content-Type": "application/json;charset=UTF-8"
            }
        }

        return fetch(this.url, options);
    }
}