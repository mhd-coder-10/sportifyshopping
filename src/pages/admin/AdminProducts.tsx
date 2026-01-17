import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Loader2, Filter, Upload, X, Image as ImageIcon } from 'lucide-react';

interface ProductForm {
  name: string;
  description: string;
  price: string;
  original_price: string;
  category_id: string;
  stock_quantity: string;
  image_url: string;
  is_featured: boolean;
}

interface ProductImage {
  id?: string;
  image_url: string;
  display_order: number;
  file?: File;
  isNew?: boolean;
}

const initialForm: ProductForm = {
  name: '',
  description: '',
  price: '',
  original_price: '',
  category_id: '',
  stock_quantity: '0',
  image_url: '',
  is_featured: false,
};

const AdminProducts = () => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(initialForm);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-products', selectedCategoryId],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('*, categories(name)')
        .order('created_at', { ascending: false });
      
      if (selectedCategoryId && selectedCategoryId !== 'all') {
        query = query.eq('category_id', selectedCategoryId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await supabase.from('categories').select('*');
      return data || [];
    },
  });

  const fetchProductImages = async (productId: string): Promise<ProductImage[]> => {
    const { data } = await supabase
      .from('product_images')
      .select('*')
      .eq('product_id', productId)
      .order('display_order');
    return (data || []).map(img => ({
      id: img.id,
      image_url: img.image_url,
      display_order: img.display_order,
    }));
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const { error } = await supabase.storage
      .from('product-images')
      .upload(fileName, file);
    
    if (error) throw error;
    
    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName);
    
    return urlData.publicUrl;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newImages: ProductImage[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const previewUrl = URL.createObjectURL(file);
      newImages.push({
        image_url: previewUrl,
        display_order: productImages.length + i,
        file,
        isNew: true,
      });
    }
    setProductImages([...productImages, ...newImages]);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    const updated = productImages.filter((_, i) => i !== index);
    // Update display orders
    updated.forEach((img, i) => {
      img.display_order = i;
    });
    setProductImages(updated);
  };

  const saveMutation = useMutation({
    mutationFn: async (data: ProductForm) => {
      setIsUploading(true);
      
      // Upload new images first
      const uploadedImages: { url: string; order: number }[] = [];
      for (const img of productImages) {
        if (img.isNew && img.file) {
          const url = await uploadImage(img.file);
          uploadedImages.push({ url, order: img.display_order });
        } else if (!img.isNew) {
          uploadedImages.push({ url: img.image_url, order: img.display_order });
        }
      }

      // Use first image as main image_url if available
      const mainImageUrl = uploadedImages.length > 0 
        ? uploadedImages.sort((a, b) => a.order - b.order)[0].url 
        : data.image_url || null;

      const productData = {
        name: data.name,
        description: data.description || null,
        price: parseFloat(data.price),
        original_price: data.original_price ? parseFloat(data.original_price) : null,
        category_id: data.category_id || null,
        stock_quantity: parseInt(data.stock_quantity),
        image_url: mainImageUrl,
        is_featured: data.is_featured,
      };

      let productId = editingId;

      if (editingId) {
        const { error } = await supabase.from('products').update(productData).eq('id', editingId);
        if (error) throw error;
        
        // Delete existing images for this product
        await supabase.from('product_images').delete().eq('product_id', editingId);
      } else {
        const { data: newProduct, error } = await supabase.from('products').insert(productData).select().single();
        if (error) throw error;
        productId = newProduct.id;
      }

      // Insert all product images
      if (productId && uploadedImages.length > 0) {
        const imageRecords = uploadedImages.map((img, index) => ({
          product_id: productId,
          image_url: img.url,
          display_order: index,
        }));
        
        const { error: imgError } = await supabase.from('product_images').insert(imageRecords);
        if (imgError) throw imgError;
      }

      setIsUploading(false);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success(editingId ? 'Product updated!' : 'Product created!');
      setIsOpen(false);
      setEditingId(null);
      setForm(initialForm);
      setProductImages([]);
    },
    onError: (error) => {
      setIsUploading(false);
      toast.error('Error saving product: ' + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Product deleted!');
    },
    onError: (error) => {
      toast.error('Error deleting product: ' + error.message);
    },
  });

  const handleEdit = async (product: any) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      original_price: product.original_price?.toString() || '',
      category_id: product.category_id || '',
      stock_quantity: product.stock_quantity.toString(),
      image_url: product.image_url || '',
      is_featured: product.is_featured || false,
    });
    
    // Fetch existing product images
    const existingImages = await fetchProductImages(product.id);
    setProductImages(existingImages);
    
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price) {
      toast.error('Name and price are required');
      return;
    }
    saveMutation.mutate(form);
  };

  const handleDialogClose = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setEditingId(null);
      setForm(initialForm);
      setProductImages([]);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Products</h1>
            <p className="text-slate-400">Manage your product catalog</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                <SelectTrigger className="w-[200px] bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all" className="text-white hover:bg-slate-700">All Categories</SelectItem>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id} className="text-white hover:bg-slate-700">
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Dialog open={isOpen} onOpenChange={handleDialogClose}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingId ? 'Edit Product' : 'Add New Product'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Name *</Label>
                      <Input
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="bg-slate-700 border-slate-600"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                        <SelectTrigger className="bg-slate-700 border-slate-600">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories?.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className="bg-slate-700 border-slate-600"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Price (₹) *</Label>
                      <Input
                        type="number"
                        value={form.price}
                        onChange={(e) => setForm({ ...form, price: e.target.value })}
                        className="bg-slate-700 border-slate-600"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Original Price (₹)</Label>
                      <Input
                        type="number"
                        value={form.original_price}
                        onChange={(e) => setForm({ ...form, original_price: e.target.value })}
                        className="bg-slate-700 border-slate-600"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Stock</Label>
                      <Input
                        type="number"
                        value={form.stock_quantity}
                        onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })}
                        className="bg-slate-700 border-slate-600"
                      />
                    </div>
                  </div>

                  {/* Product Images Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Product Images</Label>
                      <span className="text-xs text-slate-400">
                        {productImages.length} image(s) - First image will be the main display
                      </span>
                    </div>
                    
                    {/* Image Grid */}
                    <div className="grid grid-cols-4 gap-3">
                      {productImages.map((img, index) => (
                        <div 
                          key={index} 
                          className={`relative aspect-square rounded-lg overflow-hidden border-2 ${
                            index === 0 ? 'border-primary' : 'border-slate-600'
                          }`}
                        >
                          <img 
                            src={img.image_url} 
                            alt={`Product ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {index === 0 && (
                            <span className="absolute top-1 left-1 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded">
                              Main
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      
                      {/* Upload Button */}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-square rounded-lg border-2 border-dashed border-slate-600 hover:border-primary flex flex-col items-center justify-center gap-2 transition-colors text-slate-400 hover:text-primary"
                      >
                        <Upload className="h-6 w-6" />
                        <span className="text-xs">Add Images</span>
                      </button>
                    </div>
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    
                    <p className="text-xs text-slate-400">
                      Upload multiple images. Drag to reorder (coming soon). Supports JPG, PNG, WEBP.
                    </p>
                  </div>

                  {/* Fallback Image URL */}
                  {productImages.length === 0 && (
                    <div className="space-y-2">
                      <Label>Or enter Image URL</Label>
                      <Input
                        value={form.image_url}
                        onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                        className="bg-slate-700 border-slate-600"
                        placeholder="https://..."
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_featured"
                      checked={form.is_featured}
                      onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor="is_featured">Featured Product</Label>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={() => handleDialogClose(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={saveMutation.isPending || isUploading}>
                      {(saveMutation.isPending || isUploading) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      {isUploading ? 'Uploading...' : editingId ? 'Update' : 'Create'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700 hover:bg-slate-700/50">
                    <TableHead className="text-slate-300">Product</TableHead>
                    <TableHead className="text-slate-300">Category</TableHead>
                    <TableHead className="text-slate-300">Price</TableHead>
                    <TableHead className="text-slate-300">Stock</TableHead>
                    <TableHead className="text-slate-300">Featured</TableHead>
                    <TableHead className="text-slate-300 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products?.map((product) => (
                    <TableRow key={product.id} className="border-slate-700 hover:bg-slate-700/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="w-10 h-10 rounded object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded bg-slate-700 flex items-center justify-center">
                              <ImageIcon className="h-5 w-5 text-slate-500" />
                            </div>
                          )}
                          <span className="text-white font-medium">{product.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-300">{product.categories?.name || '-'}</TableCell>
                      <TableCell className="text-white">₹{product.price}</TableCell>
                      <TableCell className="text-slate-300">{product.stock_quantity}</TableCell>
                      <TableCell>
                        {product.is_featured ? (
                          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">Yes</span>
                        ) : (
                          <span className="text-xs bg-slate-600 text-slate-400 px-2 py-1 rounded">No</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(product)}>
                          <Pencil className="h-4 w-4 text-slate-400" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this product?')) {
                              deleteMutation.mutate(product.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminProducts;