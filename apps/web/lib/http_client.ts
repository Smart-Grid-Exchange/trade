
export type Depth =  {
    bids: [string, string][];
    asks: [string, string][];
    last_update_id: number;
    timestamp: number;
    market_price: string;
}

export type Trade =  {
    id: string;
    price: number;
    timestamp: number;
    quantity: number;
    marketId: string;
}

type Market = {
    symbol: string;
    id: number;
    price: number;
    state: string;
    createdAt: string;
    updatedAt: Date;
    volume: string;
  }

const BASE_URL = "http://localhost:3001/api/v1";

// export async function getTicker(market: string): Promise<Ticker> {
//     const tickers = await getTickers();
//     const ticker = tickers.find(t => t.symbol === market);
//     if (!ticker) {
//         throw new Error(`No ticker found for ${market}`);
//     }
//     return ticker;
// }

// export async function getTickers(): Promise<Ticker[]> {
//     const response = await fetch(`${BASE_URL}/tickers`);
//     const body = await response.json();
//     return body;
// }


export async function getDepth(market: string): Promise<Depth> {
    const response = await fetch(`${BASE_URL}/depth?symbol=${market}`,{
        credentials: "include"
    });
    const body = await response.json();
    return body;
}
export async function getTrades(market: string): Promise<Trade[]> {
    const response = await fetch(`${BASE_URL}/trades?symbol=${market}`,{
        credentials: "include"
    });
    const body = await response.json();
    return body;
}
export async function get_market(market: string) :Promise<Market | undefined>{
    try{
      const resp = await fetch("http://localhost:3001/api/v1/markets",{
        credentials: "include"
      });
      const body:Market[] = await resp.json();
      const fm = body.find((m) => m.symbol === market)
      return fm;
    }catch(err){
      console.log(err);
    }
  }

// export async function getKlines(market: string, interval: string, startTime: number, endTime: number): Promise<KLine[]> {
//     const response = await fetch(`${BASE_URL}/klines?symbol=${market}&interval=${interval}&startTime=${startTime}&endTime=${endTime}`);
//     const data: KLine[] = response.data;
//     return data.sort((x, y) => (Number(x.end) < Number(y.end) ? -1 : 1));
// }