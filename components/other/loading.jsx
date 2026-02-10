export default function Loading({ loading = false }) {
   
    if (!loading) return null;
    
    return (
        <div className="animate-shimmer"></div>
    );
}