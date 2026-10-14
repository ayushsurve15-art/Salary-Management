import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { meta } from '../../testing/fixtures';
import { EmployeeFilters } from './EmployeeFilters';
import { DEFAULT_LIST_PARAMS, type ListParams } from './listParams';

function renderFilters(params: Partial<ListParams> = {}) {
  const onChange = vi.fn();
  render(
    <EmployeeFilters
      params={{ ...DEFAULT_LIST_PARAMS, ...params }}
      meta={meta}
      onChange={onChange}
    />,
  );
  return { onChange, user: userEvent.setup() };
}

describe('EmployeeFilters', () => {
  it('keeps the salary range disabled until a currency is chosen', () => {
    renderFilters();

    expect(screen.getByLabelText('Min salary')).toBeDisabled();
    expect(screen.getByLabelText('Max salary')).toBeDisabled();
    expect(screen.getAllByText('Pick a currency first')).toHaveLength(2);
  });

  it('enables the salary range and names its currency once one is chosen', () => {
    renderFilters({ currency: 'EUR' });

    expect(screen.getByLabelText('Min salary')).toBeEnabled();
    expect(screen.getAllByText('In EUR')).toHaveLength(2);
  });

  it('reports the chosen country by its code', async () => {
    const { user, onChange } = renderFilters();

    await user.click(screen.getByRole('combobox', { name: 'Country' }));
    await user.click(within(screen.getByRole('listbox')).getByText('Germany'));

    expect(onChange).toHaveBeenCalledWith({ country: 'DE' });
  });

  it('clears the salary range together with the currency', async () => {
    const { user, onChange } = renderFilters({ currency: 'EUR', minSalary: '50000' });

    await user.click(screen.getByRole('combobox', { name: 'Currency' }));
    await user.click(within(screen.getByRole('listbox')).getByText('All'));

    expect(onChange).toHaveBeenCalledWith({ currency: '', minSalary: '', maxSalary: '' });
  });

  it('only enables "Clear filters" when something is filtered, and clears everything', async () => {
    const { user, onChange } = renderFilters({ department: 'Sales', search: 'ada' });

    await user.click(screen.getByRole('button', { name: /clear filters/i }));

    expect(onChange).toHaveBeenCalledWith({
      search: '',
      country: '',
      department: '',
      jobTitle: '',
      currency: '',
      minSalary: '',
      maxSalary: '',
    });
  });

  it('disables "Clear filters" when nothing is filtered', () => {
    renderFilters({ page: 3, sort: 'salary' });

    expect(screen.getByRole('button', { name: /clear filters/i })).toBeDisabled();
  });
});
