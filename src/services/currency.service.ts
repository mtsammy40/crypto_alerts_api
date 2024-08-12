import Ajv from "ajv";
import create_alert_dto_schema from "../schemas/create-alert-dto.schema";
import CurrencyRepository, {Currency} from "../repository/currency-repository";
import axios from 'axios';

export default class CurrencyService {
    _currencyRepository = new CurrencyRepository();

    _validator = new Ajv().compile(create_alert_dto_schema);

    list() {
        return this.refreshCurrencies();
    }

    async refreshCurrencies(): Promise<Currency[]> {
        try {
            console.log('Refreshing currencies...');
            const result = await axios.get('https://api.binance.com/api/v3/exchangeInfo');
            if (!result.data?.symbols) {
                console.error('Error fetching currencies from Binance', result.data);
                return [];
            }
            return result.data.symbols
                .filter((symbol: { quoteAsset: string; }) => symbol.quoteAsset === 'USDT')
                .map((symbol: { symbol: string; baseAsset: string; }) => {
                    return {
                        pair: symbol.symbol,
                        displayName: symbol.baseAsset,
                    };
                });
        } catch (e) {
            console.error('Error refreshing currencies', e);
            throw new Error('Error refreshing currencies');
        }
    }
}
