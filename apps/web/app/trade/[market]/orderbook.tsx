import Book from "@/components/book";
import { TradeTable } from "@/components/trades";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function Orderbook({
  trades,
  bids,
  asks,
  price,
}: {
  trades: { p: string; q: string; t: string; id: number }[];
  bids: [string, string][];
  asks: [string, string][];
  price: string;
}) {
  let total_bid = 0;
  let total_ask = 0;

  const bids_with_total: [string, string, number][] = bids.map((b) => [
    b[0],
    b[1],
    (total_bid += Number.parseInt(b[1])),
  ]);
  const asks_with_total: [string, string, number][] = asks
    .map((a) => a)
    .sort((a, b) => Number.parseFloat(a[0]) - Number.parseFloat(b[0]))
    .map(
      (a) =>
        [a[0], a[1], (total_ask += Number.parseInt(a[1]))] as [
          string,
          string,
          number,
        ],
    )
    .reverse();
  const total_bid_max = bids.reduce(
    (acm, b) => acm + Number.parseFloat(b[1]),
    0,
  );
  const total_ask_max = asks.reduce(
    (acm, a) => acm + Number.parseFloat(a[1]),
    0,
  );
  console.log(asks_with_total);
  return (
    <Tabs defaultValue="book" className="w-[340px] rounded-md bg-slate-100 p-1">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="book">Book</TabsTrigger>
        <TabsTrigger value="trades">Trades</TabsTrigger>
      </TabsList>
      <ScrollArea className="h-[480px] w-[340px] px-1">
        <TabsContent value="book">
          <Book
            bids={bids_with_total}
            asks={asks_with_total}
            price={price}
            total_bid_max={total_bid_max}
            total_ask_max={total_ask_max}
          />
        </TabsContent>
        <TabsContent value="trades">
          <TradeTable trades={trades} />
        </TabsContent>
      </ScrollArea>
    </Tabs>
  );
}
