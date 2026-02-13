/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'prod-pim.s3.ap-northeast-1.amazonaws.com',
            },
            {
                protocol: 'https',
                hostname: '**.s3.**.amazonaws.com',
            },
            {
                protocol: 'https',
                hostname: 'd3lpewy8i2ri01.cloudfront.net',
            },
        ],
    },
};

export default nextConfig;
