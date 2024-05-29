export default interface MarkPriceUpdate {
    stream: string;
    data: {
        e: string;
        E: number;
        s: string;
        p: string;
        P: string;
        r: string;
        T: number;
        i: string;
    }
}