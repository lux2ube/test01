import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { getPublishedBlogPosts } from '@/app/actions';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';

export default async function BlogPage() {
    const posts = await getPublishedBlogPosts();

    return (
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-12">
            <PageHeader
                title="مدونة رفيق الكاش باك"
                description="أخبار وتحديثات ورؤى تداول من فريقنا."
            />

            {posts.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {posts.map(post => (
                        <Link href={`/blog/${post.slug}`} key={post.id} className="group">
                            <Card className="overflow-hidden h-full flex flex-col">
                                <div className="relative w-full aspect-[16/9] overflow-hidden">
                                    <Image
                                        src={post.imageUrl}
                                        alt={post.title}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                                        data-ai-hint="blog post"
                                    />
                                </div>
                                <CardContent className="p-4 flex-grow flex flex-col">
                                    <h2 className="text-lg font-bold font-headline group-hover:text-primary transition-colors">{post.title}</h2>
                                    <p className="text-sm text-muted-foreground mt-2 flex-grow">{post.excerpt}</p>
                                    <div className="mt-4 flex justify-between items-center text-xs text-muted-foreground">
                                        <span>بواسطة {post.authorName}</span>
                                        <time dateTime={post.createdAt.toISOString()}>
                                            {format(post.createdAt, 'PP')}
                                        </time>
                                    </div>
                                    <div className="mt-2">
                                        {post.tags.map(tag => (
                                            <Badge key={tag} variant="secondary" className="ml-1">{tag}</Badge>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20">
                    <h2 className="text-2xl font-semibold">لا توجد مقالات بعد!</h2>
                    <p className="text-muted-foreground mt-2">تحقق مرة أخرى قريبًا للحصول على الأخبار والتحديثات.</p>
                </div>
            )}
        </div>
    );
}
