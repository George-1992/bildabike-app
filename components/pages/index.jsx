import AuthEl from "@/components/auth"
import VerifyAccount from "@/components/auth/verify";
import Home from "@/components/pages/home";
import Notes from "@/components/pages/notes";
import Scraps from "@/components/pages/scraps";
import Profile from "@/components/pages/profile"
import Settings from "@/components/pages/settings";
import Test from "@/components/pages/test";
import { ArrowDownUpIcon, BikeIcon, HomeIcon, ListChevronsUpDown, NotebookTextIcon, ScissorsIcon } from "lucide-react";
import Bikes from "@/components/pages/bikes";

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
    {
        pathname: '/scraps',
        Component: (props) => { return <Scraps {...props} />; },
    },
    {
        pathname: '/bikes',
        Component: (props) => { return <Bikes {...props} />; },
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
        name: 'Bikes',
        icon: (props) => <BikeIcon {...props} />,
        href: '/bikes',
        subItems: []
    },
    {
        name: 'Notes',
        icon: (props) => <NotebookTextIcon {...props} />,
        href: '/notes',
        subItems: []
    },
    {
        name: 'Scraps',
        icon: (props) => <ArrowDownUpIcon {...props} />,
        href: '/scraps',
        subItems: []
    },

    // {
    //     name: 'Test',
    //     icon: (props) => <ListChevronsUpDown {...props} />,
    //     href: '/test',
    //     expanded: true,
    //     subItems: [
    //         { name: 'sub-test', href: '/test/sub-test', icon: (props) => <div {...props}>test</div> },
    //     ]
    // },
]

export default pagesMap;