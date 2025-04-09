import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as v from "valibot";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { ArrowLeftRight } from "lucide-react";
import { toast } from "sonner";
import { gen_client_id } from "@/util/gen_client_id";

export default function PlaceOrder({
  symbol,
  market_price,
}: {
  symbol: string;
  market_price: string;
}) {
  return (
    <Tabs defaultValue="bid" className="bg-slate-100 rounded-md h-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="bid">Buy</TabsTrigger>
        <TabsTrigger value="ask">Sell</TabsTrigger>
      </TabsList>
      <TabsContent value="bid">
        <OrderTypeTabBox
          side="BUY"
          symbol={symbol}
          market_price={market_price}
        />
      </TabsContent>
      <TabsContent value="ask">
        <OrderTypeTabBox
          side="SELL"
          symbol={symbol}
          market_price={market_price}
        />
      </TabsContent>
    </Tabs>
  );
}

function OrderTypeTabBox({
  side,
  market_price,
  symbol,
}: {
  side: "BUY" | "SELL";
  market_price: string;
  symbol: string;
}) {
  return (
    <Tabs defaultValue="limit" className="my-1">
      <TabsList className="grid grid-cols-2">
        <TabsTrigger value="limit">Limit</TabsTrigger>
        <TabsTrigger value="market">Market</TabsTrigger>
      </TabsList>
      <TabsContent value="limit">
        <LimitOrderBox
          side={side}
          symbol={symbol}
          market_price={market_price}
        />
      </TabsContent>
      <TabsContent value="market">
        <MarketOrderBox
          side={side}
          market_price={market_price}
          symbol={symbol}
        />
      </TabsContent>
    </Tabs>
  );
}

const form_schema = v.object({
  price: v.string(),
  quantity: v.string(),
});

type FormValue = v.InferOutput<typeof form_schema>;

function MarketOrderBox({
  side,
  market_price,
  symbol,
}: {
  side: "BUY" | "SELL";
  market_price: string;
  symbol: string;
}) {
  const market_value = Number.parseFloat(market_price);
  const [choice, setChoice] = useState<"p" | "q">("q");

  const form = useForm<FormValue>({
    resolver: valibotResolver(form_schema),
    defaultValues: {
      price: "0.00",
      quantity: "0.00",
    },
  });

  const {
    control,
    handleSubmit,
    getValues,
    watch,
    setValue,
    formState: { isDirty, isSubmitting, isLoading },
  } = form;
  const [price, quantity] = watch(["price", "quantity"]);

  useEffect(() => {
    const price = Number.parseFloat(getValues("price"));
    const quan = price / market_value;
    setValue("quantity", quan.toFixed(2));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [price, market_value]);

  async function onSubmit(values: FormValue) {
    // TODO: SEND user-Id number here
    const client_id = gen_client_id(0);
    const api_req_body = {
      client_id,
      order_type: "LIMIT",
      price: market_price,
      quantity: values.quantity,
      side: side === "BUY" ? "BID" : "ASK",
      symbol,
      time_in_force: "IOC",
    };

    try {
      const resp = await fetch(`${process.env.API_ORIGIN_PROD}/api/v1/order`, {
        credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(api_req_body),
      });

      const body = await resp.json();
      if (resp.status === 200) {
        console.log(body);
        toast("Order placed");
      }
    } catch (err) {
      console.log(err);
      toast("Could not place order");
    }
  }

  return (
    <Card className="h-full">
      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent>
            {choice === "p" ? (
              <FormField
                control={control}
                name="price"
                render={({ field }) => (
                  <div className="">
                    <Label className="flex justify-between my-1">
                      <div className="flex gap-2">
                        <span>Order Value</span>
                        <ArrowLeftRight
                          size={14}
                          onClick={() => setChoice("q")}
                        />
                      </div>
                      <div>≈{quantity} KWh</div>
                    </Label>
                    <Input type="text" {...field} value={price} />
                  </div>
                )}
              />
            ) : (
              <FormField
                control={control}
                name="quantity"
                render={({ field }) => (
                  <div>
                    <Label className="flex justify-between my-1">
                      <div className="flex gap-2">
                        <span>Quantity</span>
                        <ArrowLeftRight
                          size={14}
                          onClick={() => setChoice("p")}
                        />
                      </div>
                      <div>
                        ≈
                        {(market_value * Number.parseFloat(quantity)).toFixed(
                          2,
                        )}{" "}
                        INR
                      </div>
                    </Label>
                    <Input type="text" {...field} value={quantity} />
                  </div>
                )}
              />
            )}
          </CardContent>
          <CardFooter className="mt-4 w-full">
            <Button
              className="w-full"
              disabled={isLoading || isSubmitting || !isDirty}
            >
              {side}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

function LimitOrderBox({
  side,
  symbol,
  market_price,
}: {
  side: "BUY" | "SELL";
  symbol: string;
  market_price: string;
}) {
  const limit_form_schema = v.object({
    price: v.string(),
    quantity: v.string(),
    value: v.string(),
  });

  type LimitFormValue = v.InferOutput<typeof limit_form_schema>;

  const form = useForm<LimitFormValue>({
    resolver: valibotResolver(limit_form_schema),
    defaultValues: {
      price: market_price,
      quantity: "",
      value: "",
    },
  });

  const {
    control,
    handleSubmit,
    getValues,
    setValue,
    watch,
    formState: { isDirty, isSubmitting, isLoading },
  } = form;

  const [value, price, quantity] = watch(["value", "price", "quantity"]);

  useEffect(() => {
    const value = getValues("value");
    const price = getValues("price");
    let quan = Number.parseFloat(value) / Number.parseFloat(price);
    if (isNaN(quan)) quan = 0;
    setValue("quantity", quan.toFixed(2));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    const price = getValues("price");
    const quan = getValues("quantity");
    const res_value = Number.parseFloat(price) * Number.parseFloat(quan);
    setValue("value", res_value.toFixed(2));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [price, quantity]);

  async function onSubmit(values: LimitFormValue) {
    // SEND USER_ID: NUMBER
    const client_id = gen_client_id(0);
    const api_req_body = {
      client_id,
      order_type: "LIMIT",
      price: values.price,
      quantity: values.quantity,
      side: side === "BUY" ? "BID" : "ASK",
      symbol,
      time_in_force: "IOC",
    };

    try {
      const resp = await fetch(`${process.env.API_ORIGIN_PROD}/api/v1/order`, {
        credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(api_req_body),
      });

      const body = await resp.json();
      if (resp.status === 200) {
        console.log(body);
        toast("Order placed");
      }
    } catch (err) {
      console.log(err);
      toast("Could not place order");
    }
  }

  return (
    <Card className="h-full bg-inherit border-0 rounded-none">
      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="flex flex-col gap-3">
            <FormField
              control={control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder={market_price} {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="0.00" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Order Value</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="0.00" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="w-full mt-4">
            <Button
              disabled={!isDirty || isSubmitting || isLoading}
              className="w-full"
            >
              {side}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
