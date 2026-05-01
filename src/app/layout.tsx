'use client';
import type { Metadata } from 'next';
import { PT_Mono } from 'next/font/google';
import './globals.css';
import '@rainbow-me/rainbowkit/styles.css';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { QueryClientProvider } from '@tanstack/react-query';
import { wagmiConfig } from '@/config/wagmi';
import { ToastContainer } from 'react-toastify';
import { queryClient } from '@/lib/react-query';
import { AuthProvider } from '@/lib/auth-context';
import { FheProvider } from '@/providers/FhevmProvider';
import Script from 'next/script';

const PT_Mono_ = PT_Mono({
    subsets: ['latin'],
    weight: ['400'],
});

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <Script
                    src="https://cdn.zama.org/relayer-sdk-js/0.4.2/relayer-sdk-js.umd.cjs"
                    type="text/javascript" strategy='beforeInteractive' />
            </head>
            <body
                className={`${PT_Mono_.className} antialiased overflow-x-hidden text-sm`}
                suppressHydrationWarning
            >

                <div className="bg-black">
                    <WagmiProvider config={wagmiConfig}>
                        <QueryClientProvider client={queryClient}>
                            <RainbowKitProvider>
                                <FheProvider >
                                    <AuthProvider>
                                        <div className="min-h-screen max-w-8xl  mx-auto space-y-8 px-0 py-14 ">
                                            {children}
                                        </div>
                                        <ToastContainer
                                            position="top-right"
                                            autoClose={3000}
                                            hideProgressBar={false}
                                            newestOnTop={false}
                                            closeOnClick
                                            pauseOnFocusLoss
                                            draggable
                                            pauseOnHover
                                            theme="colored"
                                        />
                                    </AuthProvider>
                                </FheProvider>
                            </RainbowKitProvider>
                        </QueryClientProvider>
                    </WagmiProvider>
                </div>
            </body>
        </html>
    );
}
