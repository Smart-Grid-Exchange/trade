import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function TradeTable({
  trades,
}: {
  trades: { id: number; p: string; q: string; t: string }[];
}) {
  return (
    <Table>
      <TableCaption>A list of your recent trades.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Price(INR)</TableHead>
          <TableHead>Qty(KWh)</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {trades.map((trade) => (
          <TableRow key={trade.id}>
            <TableCell className="font-medium">{trade.p}</TableCell>
            <TableCell>{trade.q}</TableCell>
            <TableCell>{trade.t}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
