import localFont from "next/font/local";
import "../app/globals.scss";
import { isAuthPath, isFilePath } from "@/utils/other";
import pagesMap from "@/components/pages";
import { redirect } from "next/navigation";
import ToasterSonnar from "@/components/sonnar/sonnar";
import { getCookie, getSession } from "@/actions/auth";
import Sidebar from "@/components/navbars/sidebar";
import TopNav from "@/components/navbars/top";
import { saGetItem } from "@/actions";
import AccountMessages from "@/components/other/accountMessages";
import { SignoutEl } from "@/components/auth";
import ExtenSession from "@/components/auth/extenSession";

const NEXT_PUBLIC_PROJECT_NAME = process.env.NEXT_PUBLIC_PROJECT_NAME || 'SuperApp';
const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'aaaa';

const geistSans = localFont({
    src: "../app/fonts/GeistMonoVF.woff",
    variable: "--font-geist-sans",
    weight: "100 900",
});
const geistMono = localFont({
    src: "../app/fonts/GeistMonoVF.woff",
    variable: "--font-geist-mono",
    weight: "100 900",
});

export const metadata = {
    title: NEXT_PUBLIC_PROJECT_NAME || 'SuperApp',
    // description: "My SuperApp Application",
};



export default async function PageWrapper({ children, params, searchParams }) {

    // console.log({ params, searchParams });
    const pathname = params.slug && params.slug.length > 1 ? `/${params.slug.join('/')}` : params.slug[0]
    // console.log('pathname ==> ', pathname);
    console.log('PageWrapper render ==> ', pathname);


    // if its a file path leave for nextjs router to handle
    if (isFilePath(pathname)) {
        return null;
    }

    // get session here if needed
    const session = await getSession();
    console.log('session: ', session);

    let user = null;
    let account = null;
    let workspace = null;
    let workspaces = null;
    // console.log('PageWrapper session ==> ', session);



    // if no session redirect to /auth/signin
    if (session && pathname !== '/auth/verify') {
        if (isAuthPath(pathname)) {
            redirect('/');
        } else {
            try {
                // allow
                const userAndAccount = await saGetItem({
                    collection: 'users',
                    query: {
                        where: { id: session.id },
                        include: {
                            users_and_accounts: {
                                include: {
                                    account: {
                                        include: {
                                            workspaces: true,
                                        }
                                    }
                                }
                            }
                        }
                    }
                })
                if (userAndAccount && userAndAccount.success && userAndAccount.data) {
                    account = userAndAccount.data.users_and_accounts[0].account;
                    user = { ...userAndAccount.data };
                    delete user.users_and_accounts;
                    user.role = userAndAccount.data.users_and_accounts[0].role || 'user';
                    workspaces = account.workspaces || [];

                    // if workspace id exists in cookies then set workspace if not the first workspace
                    const workspaceIdCookie = getCookie('workspace_id');
                    if (workspaceIdCookie) {
                        const workspaceFound = workspaces.find(o => o.id === workspaceIdCookie);
                        if (workspaceFound) {
                            workspace = workspaceFound;
                        } else {
                            workspace = workspaces[0] || null;
                        }
                    }
                }
                // console.log('userAndAccount ==> ', userAndAccount.data);
                // console.log('userAndAccount ==> ', userAndAccount.data.users_and_accounts[0]);
                // console.log('workspaces ==> ', workspaces);

            } catch (error) { console.error('PageWrapper ERROR : ', error); }
        }
    } else {
        if (isAuthPath(pathname)) {
            // allow
        } else {
            redirect('/auth/signin');
        }
    }


    // console.log('PageWrapper user [][][] ', user?.first_name);


    // check if the page is in the pages map
    // accomodate wildecards too eg. /pipeline/{{LEAD_STAGE}}/{{ITEM_ID}}
    const matchWildcardPath = (templatePath, actualPath) => {
        // Convert template path to regex pattern
        // Replace {{SOMETHING}} with (.+) to match any segment
        const regexPattern = templatePath
            .replace(/\{\{[^}]+\}\}/g, '([^/]+)')
            .replace(/\//g, '\\/');

        const regex = new RegExp(`^${regexPattern}$`);
        return regex.test(actualPath);
    };
    const isPageMap = pagesMap.find(page => {
        // Try exact match first
        if (page.pathname === pathname || page.pathname === `/${pathname}`) {
            return true;
        }
        // Try wildcard match
        if (page.pathname.includes('{{')) {
            return matchWildcardPath(page.pathname, pathname);
        }
        return false;
    });
    const PageComp = isPageMap ? isPageMap.Component : null;


    return (
        <html lang="en">
            <head>
                <meta charSet="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>
                    {metadata.title}
                </title>
                <link rel="icon" href="/images/logos/main.png" />
            </head>
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased w-full`}
            >
                <div className="page-wrapper w-full min-h-screen overflow-hidden">
                    <div className="flex w-full h-screen overflow-hidden">
                        {session &&
                            <Sidebar pathname={pathname} searchParams={searchParams} session={session} user={user} account={account} workspaces={workspaces} workspace={workspace} />
                        }
                        <div className={`h-full flex flex-col ${session ? 'w-[calc(100%-var(--sidebar-width))]' : 'w-full'} transition-all duration-300 overflow-hidden`}>
                            {session && <AccountMessages pathname={pathname} searchParams={searchParams} session={session} user={user} account={account} workspaces={workspaces} workspace={workspace} />}
                            {session && <TopNav pathname={pathname} searchParams={searchParams} session={session} user={user} account={account} workspaces={workspaces} workspace={workspace} />}
                            <div className="flex-1 overflow-auto min-h-0">
                                {isPageMap
                                    ? <PageComp
                                        params={params}
                                        pathname={pathname}
                                        searchParams={searchParams}
                                        session={session}
                                        user={user}
                                        account={account}
                                        workspaces={workspaces}
                                        workspace={workspace}
                                    />
                                    : children
                                        ? children
                                        : <div className="container-main">
                                            <h1 className="text-2xl">No Page Found</h1>
                                        </div>
                                }
                            </div>

                            {/* <div className="container-main p-5 bg-blue-200">
                                <div className="w-full h-80 flex">
                                    <div className="w-40 h-20 bg-red-100">
                                    </div>
                                    <div className="w-40 h-20 bg-green-100">
                                    </div>
                                </div>
                            </div> */}
                        </div>
                    </div>
                </div>
                <ToasterSonnar />
                <ExtenSession session={session} pathname={pathname} workspace={workspace} />
            </body>
        </html>
    );
}