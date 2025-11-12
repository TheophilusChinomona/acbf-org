import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FiSearch } from 'react-icons/fi';
import Button from '../common/Button';

/**
 * Search Form Component for Blog
 */
export default function SearchForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register, handleSubmit } = useForm({
    defaultValues: {
      query: searchParams.get('search') || '',
    },
  });

  const onSubmit = (data) => {
    const params = new URLSearchParams();
    if (data.query && data.query.trim()) {
      params.set('search', data.query.trim());
    }
    params.set('page', '1'); // Reset to first page on new search
    navigate(`/blog?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            {...register('query')}
            type="text"
            placeholder="Search posts..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        <Button type="submit" variant="primary">
          Search
        </Button>
      </div>
    </form>
  );
}

