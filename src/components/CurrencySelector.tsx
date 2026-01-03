import { useCurrency } from '@/contexts/CurrencyContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const CurrencySelector = () => {
  const { currency, currencies, setCurrency } = useCurrency();

  return (
    <Select value={currency.code} onValueChange={setCurrency}>
      <SelectTrigger className="w-[100px] h-8 text-sm">
        <SelectValue>
          {currency.symbol} {currency.code}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {currencies.map((c) => (
          <SelectItem key={c.code} value={c.code}>
            {c.symbol} {c.code} - {c.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default CurrencySelector;