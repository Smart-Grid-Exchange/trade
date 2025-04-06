import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table"

export default function Book({bids,asks,price}:{asks:[string,string][],bids: [string,string][],price?: string}){
    let taskq = 0.00;
    let tbidq = 0.00;

    return(
        <Table>
            <TableCaption>A list of your recent orders.</TableCaption>
            <TableHeader>
            <TableRow>
                <TableHead className="w-[100px]">Price(INR)</TableHead>
                <TableHead>Qty(KWh)</TableHead>
                <TableHead className="text-right">Amount</TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
                {asks.map((fill,i) => {
                    taskq += Number.parseFloat(fill[1])
                    return (
                        <TableRow key={i}>
                            <TableCell className="font-medium">{fill[0]}</TableCell>
                            <TableCell>{fill[1]}</TableCell>
                            <TableCell>{taskq.toFixed(2).toString()}</TableCell>
                        </TableRow>
                    )
                })}
                <TableRow><TableCell className="bg-stone-300 w-full">{price ?? "NA"}</TableCell></TableRow>
                {bids.map((fill,i) => {
                    tbidq += Number.parseFloat(fill[1]);
                        taskq += Number.parseFloat(fill[1])
                        return (
                            <TableRow key={i}>
                                <TableCell className="font-medium">{fill[0]}</TableCell>
                                <TableCell>{fill[1]}</TableCell>
                                <TableCell>{tbidq.toFixed(2).toString()}</TableCell>
                            </TableRow>
                        )
                })}
            </TableBody>
      </Table>
    )
}