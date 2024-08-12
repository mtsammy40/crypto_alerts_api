import RedisConfig from "../config/redis.config";
import {NextFunction, Request, Response} from "express";

export default function withCaching(
    key: string,
    options = {EX: 21600}) {
    return async (req: Request, res: Response, next: NextFunction) => {
        const redis = await RedisConfig.getInstance().getPublisher();
        if (redis) {
            const cached = await redis.get(key);
            if (cached) {
                res.json(JSON.parse(cached));
                return;
            } else {
                let oldJson = res.json;
                // @ts-ignore
                res.json = (body: any) => {
                    res.json = oldJson;
                    redis.set(key, JSON.stringify(body), options);
                    res.json(body);
                };
                next();
            }
        } else {
            console.error('Redis not available');
            next();
        }
    };
}