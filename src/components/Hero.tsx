import Link from "next/link";
import React from "react";
import WhatsAppTextarea from "./WhatsappText";

interface HeroProps {
  heading: string,
  message: string,
}

const Hero = ({ heading, message }: HeroProps) => {
  return (
    <div className="flex items-center justify-center h-screen bg-fixed bg-center bg-cover custom-img">
      {/* Overlay */}
      <div className="absolute top-0 left-0 right-0 bottom-0 bg-black/70 z-[2]" />
      <div className="p-0 text-white z-[2] mt-[-8rem]">
        <h2 className="hidden sm:block text-5xl font-bold">{heading}</h2>
        <p className="py-5 text-xl">{message}</p>
        <WhatsAppTextarea />
      </div>
    </div>
  )
}

export default Hero;