import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { employeesApi } from '../../api/employees';
import { employee, meta } from '../../testing/fixtures';
import { renderWithProviders } from '../../testing/render';
import { EmployeesPage } from './EmployeesPage';

vi.mock('../../api/employees', () => ({
  employeesApi: { list: vi.fn(), meta: vi.fn() },
}));

const list = vi.mocked(employeesApi.list);

describe('EmployeesPage', () => {
  beforeEach(() => {
    vi.mocked(employeesApi.meta).mockResolvedValue(meta);
    list.mockResolvedValue({
      items: [employee(), employee({ id: 8, firstName: 'Grace', lastName: 'Hopper' })],
      page: 2,
      pageSize: 25,
      total: 27,
      totalPages: 2,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('loads the page described by the URL', async () => {
    renderWithProviders(<EmployeesPage />, {
      route: '/employees?page=2&country=DE&sort=salary&order=desc',
    });

    expect(await screen.findByText('Grace Hopper')).toBeInTheDocument();
    expect(list).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2, country: 'DE', sort: 'salary', order: 'desc' }),
    );
    expect(screen.getByText('27 found')).toBeInTheDocument();
  });

  it('sorts by a column and goes back to the first page', async () => {
    const user = userEvent.setup();
    renderWithProviders(<EmployeesPage />, { route: '/employees?page=2' });
    await screen.findByText('Grace Hopper');

    await user.click(screen.getByRole('button', { name: 'Salary' }));

    expect(list).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 1, sort: 'salary', order: 'asc' }),
    );
  });

  it('links each employee to their detail page', async () => {
    renderWithProviders(<EmployeesPage />, { route: '/employees' });

    const link = await screen.findByRole('link', { name: 'Ada Lovelace' });

    expect(link).toHaveAttribute('href', '/employees/7');
  });

  it('says so when nothing matches', async () => {
    list.mockResolvedValue({ items: [], page: 1, pageSize: 25, total: 0, totalPages: 0 });

    renderWithProviders(<EmployeesPage />, { route: '/employees?search=zzz' });

    expect(await screen.findByText('No employees match these filters.')).toBeInTheDocument();
  });

  it('offers a retry when loading fails', async () => {
    list.mockRejectedValue(new Error('Network down'));

    renderWithProviders(<EmployeesPage />, { route: '/employees' });

    expect(await screen.findByText(/could not load employees/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });
});
