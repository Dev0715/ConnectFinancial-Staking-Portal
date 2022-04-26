import { formatEther as formatEtherBase } from '@ethersproject/units';
import comma from 'comma-number';
export function formatEther(val) {
  let formatted = formatEtherBase(val)
    .split('.')
    .reduce(
      (r, v, i) =>
        i == 0 ? `${r}${v}` : `${r}.${v.length > 5 ? v.slice(0, 5) : v}`,
      ''
    );
  formatted = comma(formatted);
  return formatted;
}
