import { Avatar,AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MoreHorizontal } from "lucide-react"
import { useRouter } from "next/navigation";

type Vault = {
    symbol: string;
    id: number;
    price: number;
    state: string;
    createdAt: string;
    updatedAt: Date;
    volume: string;
}

export function VaultTable({vaults}:{vaults: Vault[]}) {
    const router = useRouter();
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Vault</TableHead>
          <TableHead>Price</TableHead>
          <TableHead>Balance ↓</TableHead>
          <TableHead>State</TableHead>
          <TableHead>Start date</TableHead>
          <TableHead>Liquidity</TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {vaults.map((vault) => (
          <TableRow
            onClick={() => {
                router.push(`/trade/${vault.symbol}`)
            }}
            className="cursor-pointer" key={vault.symbol}>
            <TableCell className="font-medium">
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                <AvatarImage
                    loading="lazy"
                    src={`${`https://avatar.varuncodes.com/${vault.symbol}`}`}
                />
                </Avatar>
                <div>
                  <div className="font-medium">{vault.symbol}</div>
                  <div className="text-xs text-muted-foreground">{vault.price}</div>
                </div>
              </div>
            </TableCell>
            <TableCell className="text-green-500">{vault.price}</TableCell>
            <TableCell>{vault.volume}</TableCell>
            <TableCell>
              <span
                className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${
                  vault.state === "Fixed" ? "bg-yellow-500/10 text-yellow-500" : "bg-green-500/10 text-green-500"
                }`}
              >
                {vault.state}
              </span>
            </TableCell>
            <TableCell>{new Date(vault.createdAt).toUTCString()}</TableCell>
            <TableCell>
              <div className="flex gap-1">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 w-3 rounded-full ${
                      i < (Number.parseFloat(vault.volume) > 10 ? 3 : Number.parseFloat(vault.volume) > 5 ? 2 : 1)
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

