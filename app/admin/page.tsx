"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import KnowledgeAdmin from "./knowledge-admin";
import MarketplaceAdmin from "./marketplace-admin";
import ContentAdmin from "./content-admin";
import SocialAdmin from "./social-admin";
import CommentsAdmin from "./comments-admin";
import UsersAdmin from "./users-admin";

export default function AdminPanel() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Liberture Admin Panel</h1>
          <p className="text-slate-400">Manage all database entries</p>
        </div>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="bg-slate-800/50 border border-slate-700">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="knowledge">Knowledge</TabsTrigger>
            <TabsTrigger value="social">Social Posts</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <UsersAdmin />
          </TabsContent>

          <TabsContent value="marketplace">
            <MarketplaceAdmin />
          </TabsContent>

          <TabsContent value="content">
            <ContentAdmin />
          </TabsContent>

          <TabsContent value="knowledge">
            <KnowledgeAdmin />
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
