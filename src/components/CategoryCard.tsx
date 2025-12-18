interface CategoryCardProps {
  name: string;
  slug: string;
  imageUrl: string | null;
  onClick: (slug: string) => void;
}

const CategoryCard = ({ name, slug, imageUrl, onClick }: CategoryCardProps) => {
  return (
    <button
      onClick={() => onClick(slug)}
      className="group relative overflow-hidden rounded-2xl aspect-square bg-secondary hover:shadow-hover transition-all duration-300"
    >
      {imageUrl && (
        <img
          src={imageUrl}
          alt={name}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
        <h3 className="text-xl md:text-2xl text-white tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
          {name.toUpperCase()}
        </h3>
        <span className="text-white/70 text-sm group-hover:text-primary transition-colors">
          Shop Now →
        </span>
      </div>
    </button>
  );
};

export default CategoryCard;
