import AuthEl from "@/components/auth"
import VerifyAccount from "@/components/auth/verify";
import AiAgentPage from "@/components/pages/aiAgent";
import Home from "@/components/pages/home";
import Notes from "@/components/pages/notes";
import Profile from "@/components/pages/profile"
import Settings from "@/components/pages/settings";
import Test from "@/components/pages/test";
import { BotIcon, HomeIcon, ListChevronsUpDown, NotebookTextIcon } from "lucide-react";

const pagesMap = [
    // AUTH PAGES
    {
        pathname: '/auth/signin',
        Component: (props) => { return <AuthEl type="signin" {...props} /> },
    },
    {
        pathname: '/auth/signup',
        Component: (props) => { return <AuthEl type="signup" {...props} /> },
    },
    {
        pathname: '/auth/reset',
        Component: (props) => { return <AuthEl type="reset" {...props} /> },
    },
    {
        pathname: '/auth/verify',
        Component: (props) => { return <VerifyAccount {...props} /> },
    },
    // MAIN APP PAGES
    {
        pathname: '/',
        Component: (props) => { return <Home {...props} />; },
    },
    {
        pathname: '/profile',
        Component: (props) => { return <Profile {...props} />; },
    },
    {
        pathname: '/settings',
        Component: (props) => { return <Settings {...props} />; },
    },
    {
        pathname: '/not-found',
        Component: (props) => { return <div className="container-main">pagesMap not-found</div> },
    },
    {
        pathname: '/ai-agent',
        Component: (props) => { return <AiAgentPage {...props} />; },
    },
    {
        pathname: '/test',
        Component: (props) => { return <Test {...props} />; },
    },
    {
        pathname: '/test/{{ITEM_ID}}',
        Component: (props) => { return <Test {...props} />; },
    },
    {
        pathname: '/notes',
        Component: (props) => { return <Notes {...props} />; },
    },

]

export const pagesMapSidebar = [
    {
        name: 'Home',
        icon: (props) => <HomeIcon {...props} />,
        href: '/',
        subItems: []
    },
    {
        name: 'AI Agent',
        icon: (props) => <BotIcon {...props} />,
        href: '/ai-agent',
        subItems: []
    },
    {
        name: 'Notes',
        icon: (props) => <NotebookTextIcon {...props} />,
        href: '/notes',
        subItems: []
    },
    {
        name: 'Test',
        icon: (props) => <ListChevronsUpDown {...props} />,
        href: '/test',
        expanded: true,
        subItems: [
            { name: 'sub-test', href: '/test/sub-test', icon: (props) => <div {...props}>test</div> },
        ]
    },
]

export default pagesMap;