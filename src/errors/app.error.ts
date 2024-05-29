export default class AppError extends Error {
    _httpCode?: number;

    constructor(message?: string, httpCode: number = 500) {
        super(message, {});
        this._httpCode = httpCode;
    }
}