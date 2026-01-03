import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Star, Edit, Trash2, Loader2, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  created_at: string;
  profiles?: {
    full_name: string | null;
  };
}

interface ReviewSectionProps {
  productId: string;
}

const StarRating = ({ rating, onRatingChange, readonly = false }: { rating: number; onRatingChange?: (rating: number) => void; readonly?: boolean }) => {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onRatingChange?.(star)}
          onMouseEnter={() => !readonly && setHoverRating(star)}
          onMouseLeave={() => !readonly && setHoverRating(0)}
          className={`${readonly ? 'cursor-default' : 'cursor-pointer'}`}
        >
          <Star
            className={`h-5 w-5 ${
              star <= (hoverRating || rating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-muted-foreground'
            }`}
          />
        </button>
      ))}
    </div>
  );
};

const ReviewSection = ({ productId }: ReviewSectionProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showAll, setShowAll] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  
  // Form state
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['reviews', productId],
    queryFn: async () => {
      // First get reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });
      
      if (reviewsError) throw reviewsError;
      
      // Then get profiles for each unique user
      const userIds = [...new Set(reviewsData.map(r => r.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);
      
      // Map profiles to reviews
      const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);
      
      return reviewsData.map(review => ({
        ...review,
        profiles: profilesMap.get(review.user_id) || { full_name: null }
      })) as Review[];
    },
  });

  const userReview = reviews?.find(r => r.user_id === user?.id);
  const displayedReviews = showAll ? reviews : reviews?.slice(0, 6);
  const averageRating = reviews?.length 
    ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length 
    : 0;

  const submitReview = useMutation({
    mutationFn: async (data: { rating: number; title: string; comment: string }) => {
      if (!user) throw new Error('Must be logged in');
      
      const { error } = await supabase
        .from('reviews')
        .insert({
          product_id: productId,
          user_id: user.id,
          rating: data.rating,
          title: data.title || null,
          comment: data.comment || null,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', productId] });
      toast.success('Review submitted successfully!');
      setRating(5);
      setTitle('');
      setComment('');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to submit review');
    },
  });

  const updateReview = useMutation({
    mutationFn: async (data: { id: string; rating: number; title: string; comment: string }) => {
      const { error } = await supabase
        .from('reviews')
        .update({
          rating: data.rating,
          title: data.title || null,
          comment: data.comment || null,
        })
        .eq('id', data.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', productId] });
      toast.success('Review updated successfully!');
      setIsEditDialogOpen(false);
      setEditingReview(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update review');
    },
  });

  const deleteReview = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', productId] });
      toast.success('Review deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete review');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to submit a review');
      return;
    }
    setIsSubmitting(true);
    await submitReview.mutateAsync({ rating, title, comment });
    setIsSubmitting(false);
  };

  const handleEdit = (review: Review) => {
    setEditingReview(review);
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editingReview) return;
    await updateReview.mutateAsync({
      id: editingReview.id,
      rating: editingReview.rating,
      title: editingReview.title || '',
      comment: editingReview.comment || '',
    });
  };

  return (
    <div className="py-8 border-t border-border">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>CUSTOMER REVIEWS</h2>
          <div className="flex items-center gap-3 mt-2">
            <StarRating rating={Math.round(averageRating)} readonly />
            <span className="text-lg font-semibold">{averageRating.toFixed(1)}</span>
            <span className="text-muted-foreground">({reviews?.length || 0} reviews)</span>
          </div>
        </div>
      </div>

      {/* Review Form */}
      {user && !userReview && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Write a Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Your Rating</Label>
                <StarRating rating={rating} onRatingChange={setRating} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="review-title">Review Title</Label>
                <Input
                  id="review-title"
                  placeholder="Summarize your experience"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="review-comment">Your Review</Label>
                <Textarea
                  id="review-comment"
                  placeholder="Share your thoughts about this product..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  maxLength={1000}
                />
              </div>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Submit Review
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {!user && (
        <Card className="mb-8 p-6 text-center">
          <p className="text-muted-foreground mb-4">Please login to write a review</p>
          <Button variant="outline" onClick={() => window.location.href = '/auth'}>
            Sign In
          </Button>
        </Card>
      )}

      {/* Reviews List */}
      {isLoading ? (
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        </div>
      ) : reviews && reviews.length > 0 ? (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {displayedReviews?.map((review) => (
              <Card key={review.id} className="relative">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <StarRating rating={review.rating} readonly />
                        <span className="font-semibold">{review.rating}/5</span>
                      </div>
                      <p className="font-medium">{review.profiles?.full_name || 'Anonymous'}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(review.created_at), 'PPP')}
                      </p>
                    </div>
                    
                    {user?.id === review.user_id && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(review)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Review</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete your review? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteReview.mutate(review.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </div>
                  
                  {review.title && (
                    <h4 className="font-semibold mb-2">{review.title}</h4>
                  )}
                  {review.comment && (
                    <p className="text-muted-foreground text-sm">{review.comment}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {reviews.length > 6 && (
            <div className="text-center mt-6">
              <Button variant="outline" onClick={() => setShowAll(!showAll)}>
                {showAll ? 'Show Less' : `VIEW MORE REVIEWS (${reviews.length - 6} more)`}
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 bg-secondary/30 rounded-xl">
          <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Your Review</DialogTitle>
          </DialogHeader>
          {editingReview && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Your Rating</Label>
                <StarRating 
                  rating={editingReview.rating} 
                  onRatingChange={(r) => setEditingReview({ ...editingReview, rating: r })} 
                />
              </div>
              <div className="space-y-2">
                <Label>Review Title</Label>
                <Input
                  value={editingReview.title || ''}
                  onChange={(e) => setEditingReview({ ...editingReview, title: e.target.value })}
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label>Your Review</Label>
                <Textarea
                  value={editingReview.comment || ''}
                  onChange={(e) => setEditingReview({ ...editingReview, comment: e.target.value })}
                  rows={4}
                  maxLength={1000}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleEditSubmit} disabled={updateReview.isPending}>
                  {updateReview.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReviewSection;