/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./components/**/*.{js,ts,jsx,tsx,mdx}",
		"./app/**/*.{js,ts,jsx,tsx,mdx}",
		"./data/pages**/*.{js,ts,jsx,tsx,mdx}",
	],
	theme: {
		extend: {
			colors: {
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				chart: {
					'1': 'hsl(var(--chart-1))',
					'2': 'hsl(var(--chart-2))',
					'3': 'hsl(var(--chart-3))',
					'4': 'hsl(var(--chart-4))',
					'5': 'hsl(var(--chart-5))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
	safelist: [
		'flex', 'flex-col', 'flex-row', 'flex-shrink-0', 'gap-1', 'gap-2', 'gap-3', 'gap-4',
		// // Display utilities
		// 'block', 'inline-block', 'inline', 'flex', 'inline-flex', 'table', 'inline-table', 'table-cell', 'table-row', 'table-column', 'table-column-group', 'table-header-group', 'table-row-group', 'table-footer-group', 'flow-root', 'grid', 'inline-grid', 'contents', 'list-item', 'hidden',

		// // Position utilities
		// 'static', 'fixed', 'absolute', 'relative', 'sticky',

		// // Common spacing classes
		// 'p-0', 'p-1', 'p-2', 'p-3', 'p-4', 'p-5', 'p-6', 'p-8', 'p-10', 'p-12',
		// 'px-0', 'px-1', 'px-2', 'px-3', 'px-4', 'px-5', 'px-6', 'px-8', 'px-10', 'px-12',
		// 'py-0', 'py-1', 'py-2', 'py-3', 'py-4', 'py-5', 'py-6', 'py-8', 'py-10', 'py-12',
		// 'm-0', 'm-1', 'm-2', 'm-3', 'm-4', 'm-5', 'm-6', 'm-8', 'm-10', 'm-12',
		// 'mx-0', 'mx-1', 'mx-2', 'mx-3', 'mx-4', 'mx-5', 'mx-6', 'mx-8', 'mx-10', 'mx-12', 'mx-auto',
		// 'my-0', 'my-1', 'my-2', 'my-3', 'my-4', 'my-5', 'my-6', 'my-8', 'my-10', 'my-12',

		// // Width utilities
		// 'w-auto', 'w-0', 'w-1', 'w-2', 'w-3', 'w-4', 'w-5', 'w-6', 'w-8', 'w-10', 'w-12', 'w-16', 'w-20', 'w-24', 'w-32', 'w-40', 'w-48', 'w-56', 'w-64', 'w-72', 'w-80', 'w-96',
		// 'w-1/2', 'w-1/3', 'w-2/3', 'w-1/4', 'w-2/4', 'w-3/4', 'w-1/5', 'w-2/5', 'w-3/5', 'w-4/5', 'w-1/6', 'w-2/6', 'w-3/6', 'w-4/6', 'w-5/6',
		// 'w-full', 'w-screen', 'w-min', 'w-max', 'w-fit',

		// // Height utilities
		// 'h-auto', 'h-0', 'h-1', 'h-2', 'h-3', 'h-4', 'h-5', 'h-6', 'h-8', 'h-10', 'h-12', 'h-16', 'h-20', 'h-24', 'h-32', 'h-40', 'h-48', 'h-56', 'h-64', 'h-72', 'h-80', 'h-96',
		// 'h-full', 'h-screen', 'h-min', 'h-max', 'h-fit',

		// // Flexbox utilities
		// 'flex-row', 'flex-row-reverse', 'flex-col', 'flex-col-reverse',
		// 'flex-wrap', 'flex-wrap-reverse', 'flex-nowrap',
		// 'items-start', 'items-end', 'items-center', 'items-baseline', 'items-stretch',
		// 'justify-start', 'justify-end', 'justify-center', 'justify-between', 'justify-around', 'justify-evenly',
		// 'content-center', 'content-start', 'content-end', 'content-between', 'content-around', 'content-evenly',
		// 'self-auto', 'self-start', 'self-end', 'self-center', 'self-stretch', 'self-baseline',
		// 'flex-1', 'flex-auto', 'flex-initial', 'flex-none',
		// 'grow', 'grow-0', 'shrink', 'shrink-0',

		// // Grid utilities
		// 'grid-cols-1', 'grid-cols-2', 'grid-cols-3', 'grid-cols-4', 'grid-cols-5', 'grid-cols-6', 'grid-cols-12',
		// 'col-auto', 'col-span-1', 'col-span-2', 'col-span-3', 'col-span-4', 'col-span-5', 'col-span-6', 'col-span-12', 'col-span-full',
		// 'row-auto', 'row-span-1', 'row-span-2', 'row-span-3', 'row-span-4', 'row-span-5', 'row-span-6', 'row-span-full',
		// 'gap-0', 'gap-1', 'gap-2', 'gap-3', 'gap-4', 'gap-5', 'gap-6', 'gap-8', 'gap-10', 'gap-12',

		// // Text utilities
		// 'text-left', 'text-center', 'text-right', 'text-justify',
		// 'text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl', 'text-5xl', 'text-6xl',
		// 'font-thin', 'font-extralight', 'font-light', 'font-normal', 'font-medium', 'font-semibold', 'font-bold', 'font-extrabold', 'font-black',
		// 'leading-3', 'leading-4', 'leading-5', 'leading-6', 'leading-7', 'leading-8', 'leading-9', 'leading-10',
		// 'tracking-tighter', 'tracking-tight', 'tracking-normal', 'tracking-wide', 'tracking-wider', 'tracking-widest',
		// 'text-ellipsis', 'text-clip', 'truncate',
		// 'whitespace-normal', 'whitespace-nowrap', 'whitespace-pre', 'whitespace-pre-line', 'whitespace-pre-wrap',

		// // Common color utilities
		// 'text-black', 'text-white', 'text-gray-50', 'text-gray-100', 'text-gray-200', 'text-gray-300', 'text-gray-400', 'text-gray-500', 'text-gray-600', 'text-gray-700', 'text-gray-800', 'text-gray-900',
		// 'text-red-50', 'text-red-100', 'text-red-200', 'text-red-300', 'text-red-400', 'text-red-500', 'text-red-600', 'text-red-700', 'text-red-800', 'text-red-900',
		// 'text-blue-50', 'text-blue-100', 'text-blue-200', 'text-blue-300', 'text-blue-400', 'text-blue-500', 'text-blue-600', 'text-blue-700', 'text-blue-800', 'text-blue-900',
		// 'text-green-50', 'text-green-100', 'text-green-200', 'text-green-300', 'text-green-400', 'text-green-500', 'text-green-600', 'text-green-700', 'text-green-800', 'text-green-900',
		// 'text-yellow-50', 'text-yellow-100', 'text-yellow-200', 'text-yellow-300', 'text-yellow-400', 'text-yellow-500', 'text-yellow-600', 'text-yellow-700', 'text-yellow-800', 'text-yellow-900',

		// // Background colors
		// 'bg-transparent', 'bg-black', 'bg-white',
		// 'bg-gray-50', 'bg-gray-100', 'bg-gray-200', 'bg-gray-300', 'bg-gray-400', 'bg-gray-500', 'bg-gray-600', 'bg-gray-700', 'bg-gray-800', 'bg-gray-900',
		// 'bg-red-50', 'bg-red-100', 'bg-red-200', 'bg-red-300', 'bg-red-400', 'bg-red-500', 'bg-red-600', 'bg-red-700', 'bg-red-800', 'bg-red-900',
		// 'bg-blue-50', 'bg-blue-100', 'bg-blue-200', 'bg-blue-300', 'bg-blue-400', 'bg-blue-500', 'bg-blue-600', 'bg-blue-700', 'bg-blue-800', 'bg-blue-900',
		// 'bg-green-50', 'bg-green-100', 'bg-green-200', 'bg-green-300', 'bg-green-400', 'bg-green-500', 'bg-green-600', 'bg-green-700', 'bg-green-800', 'bg-green-900',
		// 'bg-yellow-50', 'bg-yellow-100', 'bg-yellow-200', 'bg-yellow-300', 'bg-yellow-400', 'bg-yellow-500', 'bg-yellow-600', 'bg-yellow-700', 'bg-yellow-800', 'bg-yellow-900',

		// // Border utilities
		// 'border', 'border-0', 'border-2', 'border-4', 'border-8',
		// 'border-t', 'border-r', 'border-b', 'border-l',
		// 'border-gray-200', 'border-gray-300', 'border-gray-400', 'border-gray-500', 'border-red-400', 'border-red-500', 'border-blue-400', 'border-blue-500',
		// 'rounded', 'rounded-none', 'rounded-sm', 'rounded-md', 'rounded-lg', 'rounded-xl', 'rounded-2xl', 'rounded-3xl', 'rounded-full',
		// 'rounded-t', 'rounded-r', 'rounded-b', 'rounded-l',

		// // Common interactive states
		// 'hover:bg-gray-100', 'hover:bg-gray-200', 'hover:bg-gray-300', 'hover:bg-blue-100', 'hover:bg-blue-500', 'hover:bg-blue-600',
		// 'hover:text-gray-600', 'hover:text-gray-700', 'hover:text-gray-800', 'hover:text-blue-600', 'hover:text-red-500',
		// 'focus:outline-none', 'focus:ring-1', 'focus:ring-2', 'focus:ring-blue-500', 'focus:border-blue-500',
		// 'active:bg-gray-200', 'active:bg-blue-600',
		// 'disabled:opacity-50', 'disabled:cursor-not-allowed', 'disabled:bg-gray-300',

		// // Common utility classes
		// 'cursor-pointer', 'cursor-not-allowed', 'cursor-default',
		// 'select-none', 'select-text', 'select-all', 'select-auto',
		// 'pointer-events-none', 'pointer-events-auto',
		// 'overflow-hidden', 'overflow-visible', 'overflow-scroll', 'overflow-auto', 'overflow-x-auto', 'overflow-y-auto',
		// 'transition-all', 'transition-colors', 'transition-opacity', 'transition-transform',
		// 'duration-150', 'duration-200', 'duration-300', 'duration-500',
		// 'ease-in', 'ease-out', 'ease-in-out',
		// 'transform', 'scale-100', 'scale-105', 'scale-110', 'rotate-180',
		// 'opacity-0', 'opacity-25', 'opacity-50', 'opacity-75', 'opacity-100',
		// 'shadow', 'shadow-sm', 'shadow-md', 'shadow-lg', 'shadow-xl', 'shadow-2xl', 'shadow-none',
		// 'z-0', 'z-10', 'z-20', 'z-30', 'z-40', 'z-50',
	],
};
