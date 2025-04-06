'use client'
import { Avatar, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MoreHorizontal } from "lucide-react";
import type { DashboardMarkets } from "@/lib/types/market";
import { useRouter } from "next/navigation";


export function MarketTable({markets}:{markets: DashboardMarkets}) {
    const router = useRouter();
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Market</TableHead>
          <TableHead>Daily</TableHead>
          <TableHead>Price ↓</TableHead>
          <TableHead>State</TableHead>
          <TableHead>Start date</TableHead>
          <TableHead>Liquidity</TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {markets.map((market) => (
            <TableRow
            onClick={() => router.push(`/trade/${market.symbol}`)}
             className="cursor-pointer" key={market.id}>
            <TableCell className="font-medium">
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                <AvatarImage
                src={`https://avatar.varuncodes.com/${market.symbol}`}
                />
                </Avatar>
                <div>
                  <div className="font-medium">{market.symbol}</div>
                  <div className="text-xs text-muted-foreground">{market.price}</div>
                </div>
              </div>
            </TableCell>
            <TableCell className="text-green-500">{market.volume}</TableCell>
            <TableCell>{market.price}</TableCell>

            <TableCell>
              <span
                className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${
                  market.state === "CLOSED" ? "bg-yellow-500/10 text-yellow-500" : "bg-green-500/10 text-green-500"
                }`}
              >
                {market.state}
              </span>
            </TableCell>
            <TableCell>{market.created_at}</TableCell>
            <TableCell>
              <div className="flex gap-1">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 w-3 rounded-full ${
                      i < (Number.parseFloat(market.volume) >= 10  ? 3 : Number.parseFloat(market.volume) >= 5 ? 2 : 1)
                        ? "bg-primary"
                        : "bg-muted"
                    }`}
                  />
                ))}
              </div>
            </TableCell>
            <TableCell>
              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

