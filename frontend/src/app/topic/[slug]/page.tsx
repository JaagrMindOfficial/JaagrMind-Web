import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Header } from '@/components/Header';
import { LeftSidebar } from '@/components/LeftSidebar';
import { ArticleCard } from '@/components/ArticleCard';
import { Post } from '@/lib/api';

interface Topic {
  id: string;
  name: string;
  slug: string;
  description?: string;
  cover_url?: string;
}

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000/api';

async function getTopic(slug: string): Promise<Topic | null> {
  try {
    const res = await fetch(`${API_URL}/topics/${slug}`, { 
      next: { revalidate: 60 } 
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data;
  } catch (error) {
    console.error('Failed to fetch topic:', error);
    return null;
  }
}

async function getTopicPosts(slug: string): Promise<Post[]> {
  try {
    const res = await fetch(`${API_URL}/posts?topicSlug=${slug}&status=published`, { 
      cache: 'no-store' 
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data;
  } catch (error) {
    console.error('Failed to fetch topic posts:', error);
    return [];
  }
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const topic = await getTopic(slug);
  
  if (!topic) {
    return {
      title: 'Topic Not Found - JaagrMind',
    };
  }

  return {
    title: `${topic.name} - JaagrMind`,
    description: topic.description || `Read stories about ${topic.name} on JaagrMind.`,
  };
}

export default async function TopicPage({ params }: PageProps) {
  const { slug } = await params;
  const topic = await getTopic(slug);
  const posts = await getTopicPosts(slug);

  if (!topic) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Topic not found</h1>
            <p className="text-muted mb-4">The topic you are looking for does not exist.</p>
            <Link href="/" className="text-accent hover:underline">
              Go back home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="flex min-h-[calc(100vh-56px)]">
        {/* Left Sidebar */}
        <div className="hidden lg:block w-56 flex-shrink-0 border-r border-border">
          <LeftSidebar />
        </div>

        {/* Main Content */}
        <main className="flex-1 flex justify-center">
          <div className="w-full max-w-[800px] px-6 py-8">
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
            
            <div className="mb-10 text-center">
              <div className="inline-block px-3 py-1 bg-accent/10 text-accent text-sm font-medium rounded-full mb-3">
                Topic
              </div>
              <h1 className="text-4xl font-bold mb-3">{topic.name}</h1>
              {topic.description && (
                <p className="text-lg text-muted max-w-2xl mx-auto">
                  {topic.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-6 border-b border-border mb-6">
              <button className="text-sm font-medium text-foreground border-b border-foreground pb-3 -mb-px">
                Latest
              </button>
              <button className="text-sm text-muted hover:text-foreground transition-colors pb-3 -mb-px">
                Top
              </button>
            </div>

            {posts.length === 0 ? (
              <div className="text-center py-12 bg-accent/5 rounded-lg">
                <p className="text-muted">No stories yet in {topic.name}.</p>
                <div className="mt-4">
                  <Link href="/new-story" className="text-sm text-accent hover:underline">
                    Write the first story
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {posts.map(post => (
                  <ArticleCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
