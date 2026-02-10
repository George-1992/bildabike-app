import PageWrapper from "@/components/pageWrapper";

export default function Page(props) {
    return <PageWrapper {...props} params={{ ...props.params, slug: ['/'] }} />;
}