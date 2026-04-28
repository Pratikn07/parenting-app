import { useCallback, useState } from 'react';
import { buildIngredientPromptText } from '../utils';

interface UseIngredientChipsParams {
  setInputText: (text: string) => void;
}

export function useIngredientChips({ setInputText }: UseIngredientChipsParams) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = useCallback(
    (ingredient: string) => {
      setSelected((prev) => {
        const isSelected = prev.includes(ingredient);
        const updated = isSelected
          ? prev.filter((i) => i !== ingredient)
          : [...prev, ingredient];
        setInputText(buildIngredientPromptText(updated));
        return updated;
      });
    },
    [setInputText]
  );

  const reset = useCallback(() => {
    setSelected([]);
  }, []);

  return { selected, toggle, reset };
}
