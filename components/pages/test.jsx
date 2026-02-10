
export default function Test({ params, pathname, searchParams, session, user, account }) {

    return (
        <div className="container-main flex flex-col gap-4">
            <h1 className="text-2xl">Test</h1>

            <p>
                {pathname}
            </p>
        </div>
    );
}