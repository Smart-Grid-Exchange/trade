import Book from "@/components/book"
import { TradeTable } from "@/components/trades"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function Orderbook(
    {   
        trades,
        bids,
        asks,
        price,
    }:{
        trades: {p: string, q: string, t: string, id: number}[],
        bids: [string,string][],
        asks: [string,string][],
        price: string,
}){
    return (
        <Tabs defaultValue="book" className="w-[500px] bg-slate-100">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="book">Book</TabsTrigger>
                <TabsTrigger value="trades">Trades</TabsTrigger>
            </TabsList>
            <TabsContent value="book">
                <ScrollArea className="h-[600px]">
                <Book bids={bids} asks={asks} price={price} />
                </ScrollArea>
            </TabsContent>
            <TabsContent value="trades"><TradeTable trades={trades}/></TabsContent>
            </Tabs>
    )
}

