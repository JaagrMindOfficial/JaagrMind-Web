
'use client';

import { useEffect, useState, useMemo } from 'react';
import { getAllTopics, Topic } from '@/lib/api';
import Link from 'next/link';
import { Search, Compass } from 'lucide-react';

export default function TopicsPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchTopics() {
      try {
        const data = await getAllTopics();
        setTopics(data);
      } catch (error) {
        console.error('Failed to fetch topics:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchTopics();
  }, []);

  // Filter topics based on search
  const filteredTopics = useMemo(() => {
    if (!searchQuery) return topics;
    const lowerQuery = searchQuery.toLowerCase();
    return topics.filter(t => t.name.toLowerCase().includes(lowerQuery));
  }, [topics, searchQuery]);

  // Organize into hierarchy
  const categorizedTopics = useMemo(() => {
    const roots: (Topic & { children: Topic[] })[] = [];
    const childrenMap = new Map<string, Topic[]>();

    // First pass: identify roots and map children
    filteredTopics.forEach(topic => {
      if (!topic.parent_id) {
        roots.push({ ...topic, children: [] });
      } else {
        const existing = childrenMap.get(topic.parent_id) || [];
        existing.push(topic);
        childrenMap.set(topic.parent_id, existing);
      }
    });

    // Second pass: attach children to roots
    roots.forEach(root => {
      root.children = childrenMap.get(root.id) || [];
    });
    
    // Sort roots by name (or custom order if we had one)
    roots.sort((a, b) => a.name.localeCompare(b.name));
    
    // Sort children
    roots.forEach(root => {
        root.children.sort((a, b) => a.name.localeCompare(b.name));
    });

    // If we are searching, we might want to show "Orphaned" results if their parent isn't in the filter?
    // Current logic: If I search "React", and "React" is a child of "Technology", 
    // "Technology" must be in `filteredTopics` for it to show up as a root?
    // No, `filteredTopics` contains "React". "Technology" might NOT be in `filteredTopics` if it doesn't match "React".
    
    // BETTER APPROACH FOR SEARCH:
    // If searching: flatten the list and just show grouping by their "Parent Name" (if exists) or just a list?
    // The design shows "Explore topics" with search.
    // Let's stick to the hierarchy if possible, but if search is active, maybe just show a flat grid or grouped by parent name context.
    
    if (searchQuery) {
        // When searching, we want to match ANY topic.
        // If it's a child, we should probably group it under its parent name for context.
        // But we might only have the child in `filteredTopics`.
        // We need the FULL list to find parents of matched children.
        
        // Let's rely on the simple "roots" logic for now which is robust for empty search.
        // For active search, let's just render matches.
        
        // Actually, if I search "Adoption", it matches. Its parent is "Family".
        // "Family" might not match "Adoption".
        // So "Adoption" goes to `childrenMap` under "Family" ID.
        // But "Family" is NOT in `roots` because it didn't match.
        // So "Adoption" is lost.
        
        // FIX: If search is active, include parents of matched items? 
        // OR: Just flatten the view for search results.
        return null; // Signal to render flat/search view
    }

    return roots;
  }, [filteredTopics, searchQuery, topics]); // Use full `topics` for parent lookup if needed, but here we depend on filtered state.

  if (loading) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 py-12 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-12">
      <div className="text-center mb-16 space-y-6">
         <h1 className="text-5xl font-bold tracking-tight text-primary">Explore topics</h1>
         
         <div className="max-w-xl mx-auto relative">
           <div className="relative">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
             <input 
               type="text" 
               placeholder="Search all topics" 
               className="w-full pl-12 pr-4 py-3 rounded-full bg-muted/50 border-none focus:ring-1 focus:ring-primary/20 transition-all outline-none"
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
             />
           </div>
         </div>
         
         {!searchQuery && topics.length > 0 && (
           <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
             <span>Recommended:</span>
             {topics.slice(0, 5).map(topic => (
               <button 
                 key={topic.id}
                 className="hover:text-primary hover:underline transition-colors"
                 onClick={() => setSearchQuery(topic.name)}
               >
                 {topic.name}
               </button>
             ))}
           </div>
         )}
      </div>

      <div className="space-y-16">
        {searchQuery ? (
           // Search Results View (Flat)
           <div>
              <h2 className="text-xl font-semibold mb-6">Search Results</h2>
              {filteredTopics.length === 0 ? (
                  <p className="text-muted-foreground">No topics found matching "{searchQuery}"</p>
              ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                     {filteredTopics.map(topic => (
                        <Link 
                          key={topic.id} 
                          href={`/topics/${topic.slug}`}
                          className="p-4 rounded-lg bg-card border hover:border-border/80 hover:shadow-sm transition-all text-center"
                        >
                           <span className="font-medium">{topic.name}</span>
                        </Link>
                     ))}
                  </div>
              )}
           </div>
        ) : (
           // Categorized View (Hierarchy)
           <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-16">
              {categorizedTopics?.map(category => (
                <div key={category.id} className="space-y-6">
                  <h2 className="text-xl font-bold border-b pb-2">{category.name}</h2>
                  <div className="space-y-2">
                    {category.children && category.children.length > 0 ? (
                        <div className="flex flex-col gap-2">
                           {category.children.map(child => (
                             <Link 
                               key={child.id}
                               href={`/topics/${child.slug}`}
                               className="text-muted-foreground hover:text-primary transition-colors py-1 block"
                             >
                               {child.name}
                             </Link>
                           ))}
                           <Link 
                             href={`/topics/${category.slug}`} 
                             className="text-sm font-medium text-muted-foreground/60 hover:text-primary mt-2 inline-block border-b border-transparent hover:border-muted-foreground/30"
                           >
                             More {category.name.toLowerCase()}...
                           </Link>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground italic">No sub-topics yet.</p>
                    )}
                  </div>
                </div>
              ))}
           </div>
        )}
      </div>
    </div>
  );
}
