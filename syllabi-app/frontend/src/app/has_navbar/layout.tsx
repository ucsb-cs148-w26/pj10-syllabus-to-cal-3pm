import React from "react";
import Navbar from "../components/navbar";

export default function HasNavBarLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <Navbar />
            <main>{children}</main>
        </>
    );
}