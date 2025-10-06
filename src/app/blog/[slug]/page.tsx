import { notFound } from 'next/navigation';
import Image from 'next/image';
import { format } from 'date-fns';
import { getBlogPostBySlug } from '@/app/actions';
import { Badge } from '@/components/ui/badge';
import Prose from '@/components/shared/Prose';

export default async function PostPage({ params }: { params: { slug: string } }) {
    const post = await getBlogPostBySlug(params.slug);

    if (!post) {
        notFound();
    }

    return (
        <article className="max-w-3xl mx-auto px-4 py-8">
            <header className="mb-8">
                <div className="relative w-full aspect-video rounded-lg overflow-hidden mb-4">
                    <Image
                        src={post.imageUrl}
                        alt={post.title}
                        fill
                        className="object-cover"
                        priority
                        data-ai-hint="blog post"
                    />
                </div>
                <h1 className="text-3xl md:text-4xl font-extrabold font-headline leading-tight mb-2">{post.title}</h1>
                <div className="text-sm text-muted-foreground">
                    <span>نشر في {format(post.createdAt, 'PP')} بواسطة {post.authorName}</span>
                </div>
                 <div className="mt-2">
                    {post.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="ml-1">{tag}</Badge>
                    ))}
                </div>
            </header>

            <Prose content={post.content} />
        </article>
    );
}
