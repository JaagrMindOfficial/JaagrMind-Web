-- Create a view to efficiently fetch users with their aggregated stats
CREATE OR REPLACE VIEW users_with_stats AS
WITH user_posts AS (
    SELECT 
        author_id, 
        COUNT(*) as post_count, 
        COALESCE(SUM(view_count), 0) as total_views, 
        COALESCE(SUM(claps_count), 0) as total_claps
    FROM posts
    WHERE deleted_at IS NULL
    GROUP BY author_id
),
user_followers AS (
    SELECT 
        following_id, 
        COUNT(*) as follower_count
    FROM follows
    GROUP BY following_id
)
SELECT
    u.id,
    u.email,
    u.role,
    u.created_at,
    p.username,
    p.display_name,
    p.avatar_url,
    COALESCE(up.post_count, 0) as post_count,
    COALESCE(up.total_views, 0) as total_views,
    COALESCE(up.total_claps, 0) as total_claps,
    COALESCE(uf.follower_count, 0) as follower_count
FROM users u
LEFT JOIN profiles p ON u.id = p.user_id
LEFT JOIN user_posts up ON u.id = up.author_id
LEFT JOIN user_followers uf ON u.id = uf.following_id;
