import React from "react";
import "./Sidebar.css";
export default function Sidebar(p) {
    return (
        <div className="Sidebar" style={p.style}>
            {p.children}
        </div>
    );
}