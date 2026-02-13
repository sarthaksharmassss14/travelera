"use client";

import { useEffect, useState } from "react";

const backgroundImages = [
    "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2070&auto=format&fit=crop", // Swiss Alps
    "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=2073&auto=format&fit=crop", // Kyoto/Nature
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2073&auto=format&fit=crop", // Tropical Beach
    "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?q=80&w=2070&auto=format&fit=crop", // Northern Lights
    "https://images.unsplash.com/photo-1526392060635-9d6019884377?q=80&w=2070&auto=format&fit=crop", // Machu Picchu
    "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=2070&auto=format&fit=crop", // New York City
    "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=2070&auto=format&fit=crop", // Sahara Desert
];

export default function HeroBackground() {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImageIndex((prevIndex) => (prevIndex + 1) % backgroundImages.length);
        }, 2000); // Change image every 2 seconds

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="absolute inset-0 z-0">
            {backgroundImages.map((image, index) => (
                <div
                    key={image}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentImageIndex ? "opacity-100" : "opacity-0"
                        }`}
                >
                    <img
                        src={image}
                        alt="Travel Background"
                        className="w-full h-full object-cover"
                    />
                </div>
            ))}
            <div className="absolute inset-0 bg-black/60" />
        </div>
    );
}
