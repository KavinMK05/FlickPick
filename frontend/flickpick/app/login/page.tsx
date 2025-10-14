"use client"
import { Input } from "@/components/ui/input"

export default function Login(){
    
    return (
        <div className="flex flex-col bg-black h-screen w-screen ">
            <div className="self-center font-bold text-xl text-white">
                FlickPick
            </div>
            <div className="my-auto flex flex-col items-center w-1/3 self-center ">
                <div className="text-white font-bold text-2xl self-start">Login</div>
                <form>
                    <input className="border-none text-black placeholder:text-gray-200"/>
                </form>
            </div>
        </div>
    )
}