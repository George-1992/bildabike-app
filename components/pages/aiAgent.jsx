import AiAgent from "@/components/aiAgent";
import { MessageCircle } from "lucide-react";

export default function AiAgentPage({ account, user }) {
    return (
        <div className="container-main flex flex-col gap-6">
            <h1 className="text-2xl">AI Agent</h1>



            <div className="flex flex-col h-full gap-2  ">
                <div className="card-1 w-full h-full">
                    {/* <Chat className="w-full h-full p-2 shadow-lg rounded-3xl border border-gray-300 " /> */}
                    <AiAgent className="" account={account} user={user} />
                </div>
            </div>
        </div>
    );
}