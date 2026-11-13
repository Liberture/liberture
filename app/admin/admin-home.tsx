"use client";

import Link from "next/link";
import { useTranslations } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MarketplaceAdmin from "./marketplace-admin";
import SocialAdmin from "./social-admin";
import CommentsAdmin from "./comments-admin";
import DirectoryAdmin from "./directory-admin";
import EnrichmentHistory from "./enrichment-history";

export default function AdminPanel({ managed }: { managed: boolean }) {
  const t = useTranslations().habits.app
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-4xl font-bold mb-2">Liberture Admin Panel</h1>
          <p className="text-sm md:text-base text-slate-400">Manage all database entries</p>
        </div>

        <Button asChild variant="secondary" className="mb-4"><Link href="/admin/subscribers">{t.newsletter.subscribers}</Link></Button>
        {managed && <Button asChild variant="secondary" className="mb-4 ml-2"><Link href="/admin/users">{t.adminUsers.users}</Link></Button>}
        <Tabs defaultValue="directory" className="w-full">
          <TabsList aria-label="Admin">
            <TabsTrigger value="directory" className="text-xs md:text-sm">Directory</TabsTrigger>
            <TabsTrigger value="enrichment" className="text-xs md:text-sm">Enrichment</TabsTrigger>
            <TabsTrigger value="marketplace" className="text-xs md:text-sm">Marketplace</TabsTrigger>
            <TabsTrigger value="social" className="text-xs md:text-sm">Social</TabsTrigger>
            <TabsTrigger value="comments" className="text-xs md:text-sm">Comments</TabsTrigger>
          </TabsList>

          <TabsContent value="directory">
            <DirectoryAdmin />
          </TabsContent>

          <TabsContent value="enrichment">
            <EnrichmentHistory />
          </TabsContent>

          <TabsContent value="marketplace">
            <MarketplaceAdmin />
          </TabsContent>

          <TabsContent value="social">
            <SocialAdmin />
          </TabsContent>

          <TabsContent value="comments">
            <CommentsAdmin />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
