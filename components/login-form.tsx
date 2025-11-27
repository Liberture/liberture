"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Mail, Phone, Chrome, Apple } from "lucide-react"

export function LoginForm() {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [name, setName] = useState("")

  const handleSocialLogin = (provider: "google" | "apple") => {
    // Demo: simulate social login
    login({
      name: provider === "google" ? "Google User" : "Apple User",
      email: `demo@${provider}.com`,
      provider,
      avatar: undefined,
    })
    router.push("/dashboard")
  }

  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !name) return
    login({
      name,
      email,
      provider: "email",
    })
    router.push("/dashboard")
  }

  const handlePhoneLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone || !name) return
    login({
      name,
      phone,
      provider: "phone",
    })
    router.push("/dashboard")
  }

  return (
    <Card className="w-full max-w-md bg-card/80 backdrop-blur-xl border-border/50">
      <CardHeader className="text-center">
        <div className="mx-auto h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-cyan-400 flex items-center justify-center mb-4">
          <span className="text-white font-bold text-xl">L</span>
        </div>
        <CardTitle className="text-2xl">Welcome to Liberture</CardTitle>
        <CardDescription>Sign in to access your Biological Operating System</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Social Login Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="gap-2 bg-transparent" onClick={() => handleSocialLogin("google")}>
            <Chrome className="h-4 w-4" />
            Google
          </Button>
          <Button variant="outline" className="gap-2 bg-transparent" onClick={() => handleSocialLogin("apple")}>
            <Apple className="h-4 w-4" />
            Apple
          </Button>
        </div>

        <div className="relative">
          <Separator />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
            or continue with
          </span>
        </div>

        {/* Email/Phone Tabs */}
        <Tabs defaultValue="email" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email" className="gap-2">
              <Mail className="h-4 w-4" />
              Email
            </TabsTrigger>
            <TabsTrigger value="phone" className="gap-2">
              <Phone className="h-4 w-4" />
              Phone
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="space-y-4 mt-4">
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name-email">Name</Label>
                <Input
                  id="name-email"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="operator@liberture.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                Continue with Email
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="phone" className="space-y-4 mt-4">
            <form onSubmit={handlePhoneLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name-phone">Name</Label>
                <Input
                  id="name-phone"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                Continue with Phone
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <p className="text-xs text-center text-muted-foreground">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </CardContent>
    </Card>
  )
}
