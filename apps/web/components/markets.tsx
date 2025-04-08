"use client";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MoreHorizontal } from "lucide-react";
import type { DashboardTickers } from "@/lib/types/market";
import { useRouter } from "next/navigation";

export function MarketTable({ tickers }: { tickers: DashboardTickers }) {
  const router = useRouter();
  return (
    <Table className="rounded-md bg-slate-100">
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Price</TableHead>
          <TableHead>24H Volume</TableHead>
          <TableHead>Market Cap</TableHead>
          <TableHead>Change</TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tickers.map((ticker) => (
          <TableRow
            onClick={() => router.push(`/trade/${ticker.market}_KWH`)}
            className="cursor-pointer"
            key={ticker.market}
          >
            <TableCell className="font-medium">
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage
                    src={`https://avatar.varuncodes.com/${ticker.market}`}
                  />
                </Avatar>
                <div>
                  <div className="font-medium">{ticker.market}</div>
                </div>
              </div>
            </TableCell>
            <TableCell>{ticker.last_price}</TableCell>
            <TableCell>{ticker.volume}</TableCell>
            <TableCell>
              {ticker.last_price * Number.parseInt(ticker.trades)}
            </TableCell>
            <TableCell className="text-green-500">
              {ticker.price_change_percent.toFixed(2)}%
            </TableCell>
            <TableCell>
              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
