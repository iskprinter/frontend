export class NoValidCredentialsError extends Error {
    constructor() {
        super('No valid credentials were present.');
    }
};
