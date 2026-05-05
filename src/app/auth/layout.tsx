import Image from 'next/image'
import Link from 'next/link'
import { Heart } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link href="/" className="flex items-center gap-2 font-semibold hover:opacity-80 transition-opacity">
            <Image src="/b-link.svg" alt="B-Link" width={28} height={28} className="rounded-lg" />
            B-Link
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            {children}
          </div>
        </div>
      </div>
      <div className="relative hidden lg:flex flex-col items-center justify-center bg-primary overflow-hidden">
        {/* Sfondo decorativo */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white/5 blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-white/5 blur-3xl translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10 flex flex-col items-center text-center gap-8 px-12">
          <div className="relative">
            <div className="absolute inset-0 rounded-3xl bg-white/20 blur-xl scale-125" />
            <Image src="/b-link.svg" alt="B-Link" width={96} height={96} className="relative rounded-3xl shadow-2xl" />
          </div>
          <div className="flex flex-col gap-3">
            <h2 className="text-3xl font-black text-white tracking-tight">
              Ogni goccia conta.
              <br />
              Ogni donazione salva.
            </h2>
            <p className="text-primary-foreground/70 text-base leading-relaxed max-w-sm">
              B-Link è la piattaforma digitale che connette donatori, operatori sanitari e medici per rendere le donazioni di sangue più semplici ed efficaci.
            </p>
          </div>
          <div className="flex items-center gap-2 text-primary-foreground/60 text-sm">
            <Heart className="h-4 w-4 fill-current" />
            Sicuro, GDPR compliant, gratuito per i donatori
          </div>
        </div>
      </div>
    </div>
  )
}
