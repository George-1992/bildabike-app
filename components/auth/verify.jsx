import { verifySession } from "@/actions/auth";
import { updateUser } from "@/actions/auth";
import AlertBox from "@/components/other/alertBox";
import { notify } from "@/components/sonnar/sonnar";
import { LogIn } from "lucide-react";
import Link from "next/link";

export default async function VerifyAccount({ searchParams }) {
    // console.log('VerifyAccount searchParams ==> ', searchParams);

    let verifiedData = true;
    const token = searchParams && searchParams.token ? searchParams.token : null;
    if (token) {
        verifiedData = await verifySession(token);
        // console.log('verifiedData ==> ', verifiedData);
        if (verifiedData) {
            // if verification successful, you can update user status to active 
            const updateUserRes = await updateUser({ data: verifiedData })
        }
    }

    const type = verifiedData ? 'success' : 'error';


    return (
        <div>
            <AlertBox type={type}   >
                {
                    verifiedData
                        ? <div className="flex flex-col gap-2 items-center">
                            Thank you for verifying your email. You can now sign in to your account. &nbsp;
                            <Link href="/auth/signin" className="shadow-sm p-2 border  border-green-200 rounded hover:bg-green-100 transition-colors">
                                <LogIn className="w-6 h-6 inline-block" />
                            </Link>
                        </div>
                        : <span>
                            Invalid or missing token. Please check your verification link.
                        </span>
                }
            </AlertBox>
        </div>
    );
}