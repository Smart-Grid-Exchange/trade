import Image from "next/image";
import Link from "next/link";
import lightning from "@/public/lightning.jpg";
import { Button } from "./ui/button";

export default function Navbar(){
    return (
        <div className="sticky top-0 z-full w-full backdrop-blur">
            <div className="container flex justify-between h-14 max-w-screen-2xl items-center mt-1">
                <div className="mr-4 flex">
                    <Link 
                    className="mx-4 flex items-center space-x-1 lg:mr-6"
                    href="/">
                        <Image src={lightning} height={24} width={24} alt="lightning"/>
                        <span className="text-sm font-bold">ShortIt</span>
                    </Link>
                </div>
                <div>
                    <Link href={"/login"}>
                        <Button variant="secondary">LogIn</Button>
                    </Link>
                    <Link href={"/signup"}>
                    <Button className="px-2 mx-6" variant={"secondary"}>
                        Signup
                    </Button>
                    </Link>
                </div>
            </div>
        </div>
    )
}