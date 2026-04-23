'use client';
import type { Metadata } from 'next';
import { PT_Mono } from 'next/font/google';
import './globals.css';
import '@rainbow-me/rainbowkit/styles.css';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { QueryClientProvider } from '@tanstack/react-query';
import { FhevmProvider } from '@/providers/FhevmProvider';
import { wagmiConfig } from '@/config/wagmi';
import { ToastContainer } from 'react-toastify';
import { queryClient } from '@/lib/react-query';
import { AuthProvider } from '@/lib/auth-context';


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
        <html lang="en">
            <body
                className={`${PT_Mono_.className} antialiased overflow-x-hidden text-sm`}
            >

                <div className="bg-black">
                    <WagmiProvider config={wagmiConfig}>
                        <QueryClientProvider client={queryClient}>
                            <RainbowKitProvider>
                                <FhevmProvider>
                                    <AuthProvider>
                                        <div className="min-h-screen max-w-7xl mx-auto space-y-8 px-5 py-14 lg:px-10">
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
                                </FhevmProvider>
                            </RainbowKitProvider>
                        </QueryClientProvider>
                    </WagmiProvider>
                </div>
            </body>
        </html>
    );
}
